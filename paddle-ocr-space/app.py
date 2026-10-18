import os
import sys
import gradio_client.utils

# Monkey-patch gradio_client bug where boolean schema (e.g. additionalProperties: False) causes TypeError: argument of type 'bool' is not iterable
_orig_get_type = getattr(gradio_client.utils, "get_type", None)
if _orig_get_type:
    def _patched_get_type(schema):
        if isinstance(schema, bool):
            return "bool"
        return _orig_get_type(schema)
    gradio_client.utils.get_type = _patched_get_type

_orig_json_schema = getattr(gradio_client.utils, "_json_schema_to_python_type", None)
if _orig_json_schema:
    def _patched_json_schema(schema, defs=None):
        if isinstance(schema, bool):
            return "bool"
        return _orig_json_schema(schema, defs)
    gradio_client.utils._json_schema_to_python_type = _patched_json_schema

# --- Pre-patch PaddleOCRVisionConfig for transformers >= 5.x compatibility ---
# Transformers 5.x PaddleOCRVisionRotaryEmbedding expects config.rope_parameters["rope_type"].
# PaddleOCRVisionConfig in PaddleOCR-VL-1.6 config.json does not define rope_parameters.
DEFAULT_ROPE_PARAMS = {"rope_type": "axial", "rope_theta": 10000.0}

def patch_all_configs():
    try:
        from transformers.models.paddleocr_vl.configuration_paddleocr_vl import PaddleOCRVLConfig, PaddleOCRVisionConfig
        PaddleOCRVisionConfig.rope_parameters = DEFAULT_ROPE_PARAMS
        PaddleOCRVisionConfig.rope_theta = 10000.0
        PaddleOCRVLConfig.text_config = property(lambda self: self)
        
        _orig = PaddleOCRVisionConfig.__init__
        def _wrapped_init(self, *args, **kwargs):
            _orig(self, *args, **kwargs)
            self.rope_parameters = DEFAULT_ROPE_PARAMS
            self.rope_theta = 10000.0
        PaddleOCRVisionConfig.__init__ = _wrapped_init
    except Exception as e:
        print("Note: transformers.models.paddleocr_vl import deferred:", e)

    # Patch any loaded or future modules
    for mod in list(sys.modules.values()):
        if mod:
            if hasattr(mod, "PaddleOCRVisionConfig"):
                c = getattr(mod, "PaddleOCRVisionConfig")
                c.rope_parameters = DEFAULT_ROPE_PARAMS
                c.rope_theta = 10000.0
            if hasattr(mod, "PaddleOCRVLConfig"):
                c = getattr(mod, "PaddleOCRVLConfig")
                c.text_config = property(lambda self: self)

patch_all_configs()

import gradio as gr
import torch
from PIL import Image

# Global model state
processor = None
model = None
model_id = "PaddlePaddle/PaddleOCR-VL-1.6"

PROMPTS = {
    "Full OCR (Layout & Text)": "OCR:",
    "Table Recognition": "Table Recognition:",
    "Formula Recognition": "Formula Recognition:",
    "Chart Recognition": "Chart Recognition:",
    "Text Spotting": "Spotting:",
    "Seal Recognition": "Seal Recognition:",
}

def load_model():
    global processor, model
    if processor is None or model is None:
        patch_all_configs()
        from transformers import AutoConfig, AutoModelForImageTextToText, AutoProcessor
        
        print(f"Loading {model_id} config...")
        config = AutoConfig.from_pretrained(model_id, trust_remote_code=True)
        config.text_config = config
        
        # Patch configuration instance and class
        if hasattr(config, "vision_config"):
            vc = config.vision_config
            vc.__class__.rope_parameters = DEFAULT_ROPE_PARAMS
            vc.__class__.rope_theta = 10000.0
            vc.rope_parameters = DEFAULT_ROPE_PARAMS
            vc.rope_theta = 10000.0
            
        patch_all_configs()

        print(f"Loading {model_id} processor...")
        processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

        print(f"Loading {model_id} weights (device={device}, dtype={dtype})...")
        model = AutoModelForImageTextToText.from_pretrained(
            model_id,
            config=config,
            trust_remote_code=True,
            dtype=dtype,
            low_cpu_mem_usage=True
        )

        model = model.to(device).eval()
        print("Model loaded successfully and ready for inference.")
    return processor, model

def predict_ocr(image, task="Full OCR (Layout & Text)"):
    if image is None:
        return "Please upload an image to extract text."
    try:
        proc, mod = load_model()
        task_prompt = PROMPTS.get(task, "OCR:")
        
        image = image.convert("RGB")
        orig_w, orig_h = image.size
        spotting_upscale_threshold = 1500

        if task == "Text Spotting" and orig_w < spotting_upscale_threshold and orig_h < spotting_upscale_threshold:
            process_w, process_h = orig_w * 2, orig_h * 2
            try:
                resample_filter = Image.Resampling.LANCZOS
            except AttributeError:
                resample_filter = Image.LANCZOS
            image = image.resize((process_w, process_h), resample_filter)

        longest_edge = 2048 * 28 * 28 if task == "Text Spotting" else 1280 * 28 * 28
        min_pixels = getattr(proc.image_processor, "min_pixels", 28)

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": task_prompt},
                ]
            }
        ]

        # Use processor_kwargs for modern Transformers compatibility
        try:
            inputs = proc.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
                processor_kwargs={
                    "images_kwargs": {"size": {"shortest_edge": min_pixels, "longest_edge": longest_edge}}
                },
            )
        except TypeError as te:
            print(f"[OCR] Note: apply_chat_template does not support processor_kwargs ({te}). Falling back to images_kwargs.")
            inputs = proc.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
                images_kwargs={"size": {"shortest_edge": min_pixels, "longest_edge": longest_edge}},
            )
        except Exception as e:
            print(f"[OCR] Note: apply_chat_template image sizing failed ({e}). Falling back to default template.")
            inputs = proc.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
            )

        device = next(mod.parameters()).device
        inputs = {k: v.to(device) if hasattr(v, "to") else v for k, v in inputs.items()}

        with torch.no_grad():
            outputs = mod.generate(**inputs, max_new_tokens=1024)

        input_token_len = inputs["input_ids"].shape[-1]
        generated_tokens = outputs[0][input_token_len:]
        result = proc.decode(generated_tokens, skip_special_tokens=True)
        print(f"[OCR] Generated output for task '{task}': {len(result)} characters.")
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"Error during OCR processing: {str(e)}\n\n```\n{traceback.format_exc()}\n```"

demo = gr.Interface(
    fn=predict_ocr,
    inputs=[
        gr.Image(type="pil", label="Upload Document/Image"),
        gr.Image(type="pil", label="Upload Document/Image"),
        gr.Dropdown(
            choices=list(PROMPTS.keys()),
            value="Full OCR (Layout & Text)",
            label="Recognition Task"
        )
    ],
    outputs=gr.Markdown(label="Extracted Structured Text"),
    title="PaddleOCR-VL-1.6 Cloud Demo",
    description="High-precision document layout parsing, OCR text conversion, formula recognition, and table extraction powered by PaddlePaddle/PaddleOCR-VL-1.6."
)

if __name__ == "__main__":
    # Preload model at container startup so requests don't block
    try:
        print("Preloading model at startup...")
        load_model()
    except Exception as e:
        print("Startup preload notice:", e)
    # Enable queue explicitly and set ssr=False to prevent SvelteKit SSR Node proxy from throwing 405 Method Not Allowed on POST
    demo.queue().launch(server_name="0.0.0.0", server_port=7860, ssr=False)

