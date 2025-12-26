// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://weassist.jp',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap(), partytown()]
  ,

  image: {
    domains: ["images.unsplash.com"], // これを追加
  },
});