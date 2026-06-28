import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
      "/chef": "http://localhost:3000",
      "/waiter": "http://localhost:3000",
      "/restaurant_owner": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
