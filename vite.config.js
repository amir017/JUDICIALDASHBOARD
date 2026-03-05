import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (!env.VITE_API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is not defined in .env file");
  }

  return defineConfig({
    plugins: [react(), tailwind()],
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
  });
};
