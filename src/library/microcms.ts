// src/library/microcms.ts
import { createClient, type MicroCMSQueries } from "microcms-js-sdk";

const client = createClient({
  serviceDomain: import.meta.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

// ニュースの型定義（MicroCMSのAPI設定に合わせてください）
export type News = {
  id: string;
  createdAt: string;
  publishedAt: string;
  revisedAt: string;
  title: string;
  content: string;
  category?: {    // カテゴリ機能を使っている場合
    id: string;
    name: string;
  };
};

export type NewsResponse = {
  totalCount: number;
  offset: number;
  limit: number;
  contents: News[];
};

// ニュースを取得する関数
export const getNews = async (queries?: MicroCMSQueries) => {
  return await client.get<NewsResponse>({ endpoint: "news", queries });
};