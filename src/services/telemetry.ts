import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { trace, type Tracer } from "@opentelemetry/api";

const provider = new WebTracerProvider();

// Export traces to Arize Phoenix OTLP receiver
const exporter = new OTLPTraceExporter({
  url: "http://localhost:6006/v1/traces",
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

provider.register();

export const tracer: Tracer = trace.getTracer("ocr-pipeline");
