import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default ({ mode }) => {
  // Load .env file correctly
  const env = loadEnv(mode, process.cwd(), "");

  console.log("VITE_API_BASE_URL =", env.VITE_API_BASE_URL);

  if (!env.VITE_API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not defined in .env file");
  }

  return defineConfig({
    plugins: [react(), tailwind()],
    server: {
      host: "localhost",
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  });
};
