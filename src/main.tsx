import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./services/telemetry";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA / Web Push support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}

