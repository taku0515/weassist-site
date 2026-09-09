// public/ に置いた画像の縦横をビルド時に読む小さなヘルパー。
//
// なぜ必要か: public/ の画像は Astro の <Image> を通らないため、<img> に width/height を
// 自分で書かないとブラウザが表示領域を確保できず、読み込み完了時にレイアウトがずれる（CLS）。
// 手で数値を書くと画像を差し替えたときに古くなるので、ファイルから実寸を読む。
//
// 依存を増やさないため、必要な2形式（PNG / WebP）だけを自前で解析する。
// 解析できない場合は例外を投げる（黙って未指定に戻すとCLSが再発するため）。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export type ImageSize = { width: number; height: number };

/** publicルート起点のパス（例: '/works/scribe.webp'）から実寸を読む */
export function getPublicImageSize(publicPath: string): ImageSize {
  const rel = publicPath.replace(/^\//, '');
  const file = fileURLToPath(new URL(`../../public/${rel}`, import.meta.url));
  const buf = readFileSync(file);

  // PNG: シグネチャの直後がIHDRチャンクで、幅・高さが4バイトのビッグエンディアン
  if (buf.length >= 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // WebP: RIFFコンテナ。12バイト目からのチャンク名で3種類に分かれる
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);

    // 非可逆（VP8 ）: 同期コード 9D 01 2A の直後に14ビットの幅・高さ
    if (chunk === 'VP8 ' && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }

    // 可逆（VP8L）: 1バイトのシグネチャ 0x2F の後に14ビットずつ詰め込まれている
    if (chunk === 'VP8L' && buf[20] === 0x2f) {
      const bits = buf.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }

    // 拡張（VP8X）: キャンバスサイズが3バイトのリトルエンディアンで「実寸-1」
    if (chunk === 'VP8X') {
      return {
        width: buf.readUIntLE(24, 3) + 1,
        height: buf.readUIntLE(27, 3) + 1,
      };
    }
  }

  throw new Error(
    `[imageSize] ${publicPath} の縦横を判定できませんでした。` +
      'PNG・WebP以外を使う場合は src/library/imageSize.ts に解析を追加してください。'
  );
}
