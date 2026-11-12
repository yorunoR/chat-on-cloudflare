import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// API サーバーは CORS に対応していないため、開発サーバーから同一オリジンで中継する
const apiUrl = process.env.API_URL ?? "http://localhost:3000";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": apiUrl,
      "/ws": { target: apiUrl, ws: true },
    },
  },
});
