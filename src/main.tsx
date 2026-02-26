import { installFetchRetry } from "./lib/fetchWithRetry";

// Install resilient fetch BEFORE anything else
installFetchRetry();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
