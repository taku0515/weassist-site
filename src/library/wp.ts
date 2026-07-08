// web.weassist.jp（WordPressブログ「KENGO's MEMO」）の最新記事をビルド時に取得する
// 注意: 記事一覧はビルド時点のスナップショット。新記事を反映するには再ビルド（再デプロイ）が必要

export type BlogPost = {
  /** HTMLエンティティ（&#8221; 等）を含むため、描画側では set:html を使う */
  title: string;
  link: string;
  date: Date;
};

const API_URL =
  'https://web.weassist.jp/wp-json/wp/v2/posts?per_page=3&_fields=title,link,date';

export async function getLatestBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = (await res.json()) as any[];
    return posts.map((p) => ({
      title: p.title.rendered as string,
      link: p.link as string,
      date: new Date(p.date),
    }));
  } catch (e) {
    // ブログ側が落ちていても本体サイトのビルドは止めない（セクションごと非表示になる）
    console.warn('[wp.ts] ブログ記事の取得に失敗:', e);
    return [];
  }
}
