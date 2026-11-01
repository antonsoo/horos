import { defineConfig } from "vite";

export default defineConfig({
  base: "/horos/",
  build: {
    target: "es2022",
    rollupOptions: { input: ["index.html", "conditionals.html"] },
  },
});
