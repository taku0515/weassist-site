// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

import partytown from '@astrojs/partytown';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://weassist.jp/',

  integrations: [tailwind(), sitemap(), partytown(), icon()],

  image: {
    domains: [
      "images.unsplash.com",       // Unsplashの画像ドメイン
      "plus.unsplash.com"          // Unsplashの別ドメイン
    ],
  },
});