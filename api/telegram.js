// api/telegram.js — 텔레그램 채널 발송
// 환경변수: APP_PASSWORD, TG_BOT_TOKEN, TG_CHANNEL_ID

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // 토큰 검증 — auth.js와 동일한 방식으로 비교
  const auth = req.headers.authorization || ''
  const expectedToken = Buffer.from(process.env.APP_PASSWORD || '').toString('base64')
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== expectedToken) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const { html, title } = req.body ?? {}
  if (!html) return res.status(400).json({ ok: false, error: 'HTML required' })

  const botToken   = process.env.TG_BOT_TOKEN
  const channelId  = process.env.TG_CHANNEL_ID

  if (!botToken || !channelId) {
    return res.status(500).json({ ok: false, error: 'Telegram env vars not set' })
  }

  try {
    const text = htmlToTelegram(html, title)
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

    const tgRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true }
      })
    })

    const data = await tgRes.json()
    return res.status(200).json({ ok: data.ok, detail: data })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}

function htmlToTelegram(html, title) {
  // HTML 파싱해서 텔레그램 텍스트로 변환
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short'
  })

  // 간단한 정규식 파싱 (서버 환경 - DOMParser 없음)
  const stripTags = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const lines = [`<b>🗞 ${escapeHtml(title)}</b>\n${today}\n`]

  // card-title 추출
  const titleMatches = html.matchAll(/class="card-title"[^>]*>([\s\S]*?)<\/div>/g)
  for (const m of titleMatches) {
    const t = escapeHtml(stripTags(m[1]).trim())
    if (t) lines.push(`\n<b>${t}</b>`)
  }

  // card-body 추출
  const bodyMatches = html.matchAll(/class="card-body"[^>]*>([\s\S]*?)<\/div>/g)
  for (const m of bodyMatches) {
    const t = escapeHtml(stripTags(m[1]).trim())
    if (t && t.length > 20) lines.push(t)
  }

  return lines.join('\n').substring(0, 4000)
}
