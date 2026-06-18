import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./services/telemetry";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${Math.floor(Date.now() / 86400000)}`)
      .then((reg) => {
        console.log("Service Worker registered:", reg.scope);
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (installing) {
            installing.addEventListener("statechange", () => {
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                console.log("SW update available — reloading");
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => console.error("SW registration failed:", err));
  });
}

