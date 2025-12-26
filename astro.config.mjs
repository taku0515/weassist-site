// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://weassist.jp',

  integrations: [tailwind(), sitemap(), partytown()],

  image: {
    domains: ["images.unsplash.com"], // これを追加
  },
});