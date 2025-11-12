// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import sitemap from "@astrojs/sitemap";

import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://madridfortech.com",
  integrations: [
    sitemap(),
    robotsTxt({
      sitemap: "/sitemap-index.xml",
    }),
  ],
});
