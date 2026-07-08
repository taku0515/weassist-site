// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

import partytown from '@astrojs/partytown';

// https://astro.build/config
export default defineConfig({
  site: 'https://weassist-end.pages.dev/',

  integrations: [tailwind(), sitemap(), partytown()],

  image: {
    domains: [
      "images.unsplash.com",       // Unsplashの画像ドメイン
      "plus.unsplash.com"          // Unsplashの別ドメイン
    ],
  },
});