import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        phaser: "phaser.html",
      },
    },
  },
  server: {
    host: "0.0.0.0",
  },
});
