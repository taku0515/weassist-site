// @ts-check
import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

import sitemap from '@astrojs/sitemap';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://weassist.jp/',

  integrations: [
    tailwind(),
    // /thanks はフォーム送信後の着地ページなのでサイトマップから除外（noindexとも整合）
    sitemap({ filter: (page) => !page.includes('/thanks') }),
    icon(),
  ],
  // 画像はすべて自サイト内（public/）に置くため、リモート画像の許可設定は持たない
});