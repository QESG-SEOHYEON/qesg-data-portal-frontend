import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Glide Data Grid는 lodash 서브경로/marked/carousel을 import → 사전번들에 명시
  optimizeDeps: {
    include: [
      "@glideapps/glide-data-grid",
      "lodash",
      "marked",
      "react-responsive-carousel",
    ],
  },
  server: {
    port: 5174,
  },
});
