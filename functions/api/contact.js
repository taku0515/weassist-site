// Cloudflare Pages Function: フォーム送信の受け口
// ハニーポット確認 → Turnstileサーバー側検証 → Formspreeへ転送 の順に処理する。
// ボットがFormspreeへ直接POSTするのを防ぐため、HTML側の送信先はここ（/api/contact）に統一。
//
// 必要な環境変数（Cloudflare Pages > Settings > Environment variables）:
//   TURNSTILE_SECRET_KEY … Turnstileのシークレットキー（Functions実行時に参照）
// 未設定の間は公式テストキー（常に合格）で動くため、本番では必ず設定すること。

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mlgegwwy';
const TEST_SECRET_ALWAYS_PASS = '1x0000000000000000000000000000000AA';

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  // 戻し先: 基本はフォームのあったページ（Refererが同一オリジンの場合のみ採用）
  let backTo = new URL('/contact', origin);
  const referer = request.headers.get('Referer');
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.origin === origin) backTo = refUrl;
    } catch {
      /* Refererが不正な形式なら既定値のまま */
    }
  }
  backTo.searchParams.set('form', 'error');

  // 1) ハニーポット: 埋まっていたらボット確定。成功したふりをして捨てる
  if (formData.get('_gotcha')) {
    return Response.redirect(new URL('/thanks', origin).toString(), 303);
  }

  // 2) Turnstile検証
  const token = formData.get('cf-turnstile-response');
  const secret = env.TURNSTILE_SECRET_KEY || TEST_SECRET_ALWAYS_PASS;
  let verified = false;
  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret,
        response: typeof token === 'string' ? token : '',
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });
    const verify = await verifyRes.json();
    verified = verify.success === true;
  } catch {
    verified = false;
  }
  if (!verified) {
    return Response.redirect(backTo.toString(), 303);
  }

  // 3) Formspreeへ転送（スパム対策用の内部フィールドは除外）
  const forward = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key === 'cf-turnstile-response' || key === '_gotcha') continue;
    forward.append(key, value);
  }
  try {
    const fsRes = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: forward,
    });
    if (!fsRes.ok) {
      return Response.redirect(backTo.toString(), 303);
    }
  } catch {
    return Response.redirect(backTo.toString(), 303);
  }

  return Response.redirect(new URL('/thanks', origin).toString(), 303);
}
