// web.weassist.jp（WordPressブログ「KENGO's MEMO」）の最新記事をビルド時に取得する
// 注意: 記事一覧はビルド時点のスナップショット。新記事を反映するには再ビルド（再デプロイ）が必要
//
// 取得は二段構え:
//   1. REST API（/wp-json/）… ローカルビルドで動くが、XserverのREST API海外アクセス制限により
//      Cloudflare Pagesのビルドサーバー（海外IP）からはブロックされることがある
//   2. RSSフィード（/feed/）… 通常コンテンツなので制限対象外。REST失敗時のフォールバック

export type BlogPost = {
  /** タグ除去済みのプレーンテキスト。描画側は通常の式出力（自動エスケープ）でよい */
  title: string;
  /** BLOG_ORIGIN 配下であることを検証済みのURL */
  link: string;
  date: Date;
};

const BLOG_ORIGIN = 'https://web.weassist.jp/';

/** HTMLエンティティの最小デコード表（WordPressのタイトルで実際に出るもの） */
const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  hellip: '…', mdash: '—', ndash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

/**
 * タイトルをプレーンテキスト化する。
 * ブログ側が万一汚染されてもコーポレートサイトへHTMLが流れ込まないよう、
 * タグを除去したうえでエンティティのみ復元する（描画側の set:html を不要にする）。
 */
function toPlainTitle(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, ent: string) => {
      if (ent[0] === '#') {
        const code = ent[1] === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
        return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole;
      }
      return ENTITIES[ent] ?? whole;
    })
    .trim();
}

/** javascript: 等のスキームを弾くため、自ブログ配下のURLのみ通す */
function isSafeBlogLink(link: string): boolean {
  return link.startsWith(BLOG_ORIGIN);
}

const REST_URL =
  'https://web.weassist.jp/wp-json/wp/v2/posts?per_page=3&_fields=title,link,date';
const FEED_URL = 'https://web.weassist.jp/feed/';

async function fromRestApi(): Promise<BlogPost[]> {
  const res = await fetch(REST_URL);
  if (!res.ok) throw new Error(`REST HTTP ${res.status}`);
  const posts = (await res.json()) as any[];
  return posts
    .map((p) => ({
      title: toPlainTitle(String(p.title?.rendered ?? '')),
      link: String(p.link ?? ''),
      date: new Date(p.date),
    }))
    .filter((p) => p.title && isSafeBlogLink(p.link) && !isNaN(p.date.valueOf()));
}

/** RSS(XML)を依存ライブラリなしで軽量にパースする */
async function fromRssFeed(): Promise<BlogPost[]> {
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text();

  const pick = (block: string, tag: string): string => {
    const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
    if (!m) return '';
    // CDATAを剥がして前後空白を除去
    return m[1].replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1').trim();
  };

  return xml
    .split('<item>')
    .slice(1, 4) // 最新3件
    .map((block) => ({
      title: toPlainTitle(pick(block, 'title')),
      link: pick(block, 'link'),
      date: new Date(pick(block, 'pubDate')),
    }))
    .filter((p) => p.title && isSafeBlogLink(p.link) && !isNaN(p.date.valueOf()));
}

export async function getLatestBlogPosts(): Promise<BlogPost[]> {
  try {
    return await fromRestApi();
  } catch (e) {
    console.warn('[wp.ts] REST APIでの取得に失敗、RSSにフォールバック:', e);
  }
  try {
    return await fromRssFeed();
  } catch (e) {
    // ブログ側が完全に落ちていても本体サイトのビルドは止めない（セクションごと非表示になる）
    console.warn('[wp.ts] RSSでの取得にも失敗:', e);
    return [];
  }
}
