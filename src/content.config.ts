// お知らせ（news）をMarkdownで管理するContent Collections定義
// 記事は src/content/news/*.md に置く。ファイル名がURLになる（ASCIIのみ）
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string().optional(),
    // trueにするとビルドから除外される（下書き）
    draft: z.boolean().default(false),
  }),
});

export const collections = { news };
