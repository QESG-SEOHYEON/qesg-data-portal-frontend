import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 프로젝트 사이트 경로(레포명) — 자산이 /qesg-data-portal-frontend/ 하위에서 로드됨
  base: "/qesg-data-portal-frontend/",
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
