import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // dev me backend alag port pe hai — /api requests forward ho jayengi
      "/api": "http://localhost:8000",
    },
  },
});
