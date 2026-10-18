import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

if (typeof (globalThis as any).DOMMatrix === "undefined") {
  class FakeDOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m21 = 0; m22 = 1; m41 = 0; m42 = 0;
  }
  (globalThis as any).DOMMatrix = FakeDOMMatrix;
  if (typeof window !== "undefined") {
    (window as any).DOMMatrix = FakeDOMMatrix;
  }
}
