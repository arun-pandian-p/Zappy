import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Immediate redirect from root to www subdomain to avoid DNS/Hostinger conflicts
if (typeof window !== "undefined" && window.location.hostname === "zappy.ind.in") {
  window.location.replace("https://www.zappy.ind.in" + window.location.pathname + window.location.search);
}

createRoot(document.getElementById("root")!).render(<App />);
