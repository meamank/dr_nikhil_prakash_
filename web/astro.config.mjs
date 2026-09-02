import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // TODO: set to the real production domain before launch
  site: "https://drnikhilprakash.com",
  // bind to all interfaces so the dev server is reachable from other devices on the LAN
  server: {
    host: true,
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
