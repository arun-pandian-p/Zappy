import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Immediate production redirection to enforce HTTPS and www subdomain
if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
  let redirected = false;
  let targetUrl = window.location.href;

  // 1. Enforce HTTPS Protocol
  if (window.location.protocol === "http:") {
    targetUrl = targetUrl.replace("http:", "https:");
    redirected = true;
  }

  // 2. Resolve Apex Domain to www Subdomain
  if (window.location.hostname === "zappy.ind.in") {
    targetUrl = targetUrl.replace("zappy.ind.in", "www.zappy.ind.in");
    redirected = true;
  }

  if (redirected) {
    window.location.replace(targetUrl);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
