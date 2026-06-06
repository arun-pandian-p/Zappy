import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { trace, type Tracer } from "@opentelemetry/api";

// Export traces to Arize Phoenix OTLP receiver
const exporter = new OTLPTraceExporter({
  url: "http://localhost:6006/v1/traces",
});

// Configure provider with span processors passed into constructor for SDK v2.x
const provider = new WebTracerProvider({
  spanProcessors: [new SimpleSpanProcessor(exporter)]
});

provider.register();

export const tracer: Tracer = trace.getTracer("ocr-pipeline");
