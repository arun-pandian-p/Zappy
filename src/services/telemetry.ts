import { trace, type Tracer } from "@opentelemetry/api";

let tracer: Tracer;

try {
  // Only initialize OTLP exporter if endpoint is configured and we're in dev
  const otlpEndpoint = import.meta.env.VITE_OTLP_ENDPOINT;
  const isDev = import.meta.env.DEV;

  if (otlpEndpoint || isDev) {
    // Lazy dynamic import to avoid crashing in production if modules mismatch
    const { WebTracerProvider } = await import("@opentelemetry/sdk-trace-web");
    const { SimpleSpanProcessor } = await import("@opentelemetry/sdk-trace-base");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");

    const exporter = new OTLPTraceExporter({
      url: otlpEndpoint || "http://localhost:6006/v1/traces",
    });

    const provider = new WebTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });

    provider.register();
    tracer = trace.getTracer("zappy-platform");
  } else {
    // No-op tracer in production without OTLP endpoint
    tracer = trace.getTracer("zappy-platform");
  }
} catch (err) {
  console.warn("[Telemetry] Failed to initialize OpenTelemetry, using no-op tracer:", err);
  tracer = trace.getTracer("zappy-platform");
}

export { tracer };
