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

// 実績（works）。記事は src/content/works/*.md に置く
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(), // 一覧カードに表示する1〜2文
    category: z.string(), // 例: 自社プロダクト / 社内システム / 自動化基盤
    tech: z.array(z.string()), // 技術タグ
    date: z.coerce.date(), // 並び順用（新しい順）
    accent: z.enum(['blue', 'purple', 'emerald', 'cyan', 'amber', 'rose']).default('blue'), // カードの色
    image: z.string().optional(), // 実物スクリーンショット（public/works/ 配下、機密はダミー化済みのもののみ）
    featured: z.boolean().default(false), // トップページに掲載するか
    draft: z.boolean().default(false),
  }),
});

export const collections = { news, works };
