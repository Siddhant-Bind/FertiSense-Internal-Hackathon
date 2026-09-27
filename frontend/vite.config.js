import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` -> normal multi-file build for hosting.
// `npm run build:single` -> one self-contained index.html (used for the live demo).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  server: { port: 5173 },
}));
