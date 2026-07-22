// Cloudflare Pages Function: フォーム送信の検証役
// ハニーポット確認 → Turnstileサーバー側検証 を行い、合格したブラウザにだけ
// Formspreeの送信先URLを返す（実送信はブラウザが自分のIPで直接行う）。
//
// 背景: FormspreeはCloudflare Worker経由（データセンターIP）の送信をスパム判定して
// 黙って破棄するため、サーバー側からの転送では通知が届かない。送信元をユーザーの
// ブラウザに戻しつつ、送信先URLはTurnstile合格後にしか開示しないことで保護を維持する。
//
// JS無効ブラウザ向けフォールバック: 通常のフォームPOST（Accept: application/json 無し）
// の場合は従来どおりサーバー側からFormspreeへ転送する（スパム判定で届かない可能性は
// あるが、素通しよりよい）。
//
// 必要な環境変数（Cloudflare Pages > Settings > Environment variables）:
//   TURNSTILE_SECRET_KEY … Turnstileのシークレットキー
// 未設定の間は公式テストキー（常に合格）で動くため、本番では必ず設定すること。

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mlgegwwy';
const TEST_SECRET_ALWAYS_PASS = '1x0000000000000000000000000000000AA';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const origin = new URL(request.url).origin;
  // サイトのJS（FormSpamGuard）からのfetchは Accept: application/json を付けてくる
  const wantsJson = (request.headers.get('Accept') || '').includes('application/json');

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return wantsJson ? json({ ok: false }, 400) : new Response('Bad Request', { status: 400 });
  }

  // JS無効時の戻し先: フォームのあったページ（Refererが同一オリジンの場合のみ採用）
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
    return wantsJson
      ? json({ ok: true }) // endpoint無し = ブラウザ側はそのまま/thanksへ
      : Response.redirect(new URL('/thanks', origin).toString(), 303);
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
    return wantsJson ? json({ ok: false }) : Response.redirect(backTo.toString(), 303);
  }

  // 3) 合格
  if (wantsJson) {
    // 送信先を開示し、実送信はブラウザ（本人のIP）に任せる
    return json({ ok: true, endpoint: FORMSPREE_ENDPOINT });
  }

  // JS無効フォールバック: サーバー側から転送（内部フィールドは除外）
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
