import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import Sitemap from "vite-plugin-sitemap";

const dynamicRoutes = [
  "/", "/features", "/pricing", "/menu-ocr", "/ai-food-images", "/contact", "/blog",
  "/restaurant-menu-management", "/digital-menu-software", "/restaurant-ocr", "/qr-menu-generator"
];

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    Sitemap({
      hostname: 'https://zappy.ind.in',
      dynamicRoutes,
      exclude: ['/admin', '/super-admin', '/kitchen', '/waiter', '/billing']
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
