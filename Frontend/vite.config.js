import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // In development the browser talks only to the Vite server. Vite forwards
  // API, uploads and WebSocket traffic to the backend. Because of this, the
  // app also works from another device on the same network.
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_DEV_API_TARGET || "http://localhost:5000";

  const proxy = {
    "/api": { target: apiTarget, changeOrigin: true },
    "/uploads": { target: apiTarget, changeOrigin: true },
    "/socket.io": { target: apiTarget, changeOrigin: true, ws: true },
  };

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy,
      // Dev-only convenience so the server accepts requests addressed by LAN IP or hostname.
      allowedHosts: true,
    },
    preview: {
      host: true,
      port: 4173,
      proxy,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
