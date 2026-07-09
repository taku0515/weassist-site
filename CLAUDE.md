# weassist（企業サイト weassist.jp・Astro静的サイト）

Astro v5 + TypeScript の静的サイト。サーバーAPIは持たず、ビルドで `dist/` にHTMLを出力する。

## 動作確認・検証

コード変更後は必ず以下で動作確認し、エラーがあれば修正してから完了報告すること。

### 依存インストール
```bash
npm install
```

### 開発サーバー起動
```bash
npm run dev
# デフォルトで http://localhost:4321 で起動（astro.config.mjs にポート指定なし）
```

### 起動確認（別ターミナルで）
```bash
# トップページ
curl -I http://localhost:4321/
# 主要ページ
curl -I http://localhost:4321/services
curl -I http://localhost:4321/works
# いずれも HTTP 200 が返れば正常
```

### 本番ビルドの検証
```bash
npm run build      # dist/ に静的HTMLを出力。ビルドが通ることが最重要の検証
npm run preview    # ビルド結果を http://localhost:4321 でローカル確認
```

### テスト
自動テストは未整備（tests/ ディレクトリ・test スクリプトなし）。上記の起動 / ビルド確認が動作検証の中心。

### 注意
- トップページは `src/library/wp.ts` でビルド時に外部WordPress（web.weassist.jp）から記事を取得する。取得失敗時もビルドは止まらず該当セクションが非表示になる設計。
