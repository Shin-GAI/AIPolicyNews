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

  const { html, title, postUrl } = req.body ?? {}
  if (!html) return res.status(400).json({ ok: false, error: 'HTML required' })

  const botToken   = process.env.TG_BOT_TOKEN
  const channelId  = process.env.TG_CHANNEL_ID

  if (!botToken || !channelId) {
    return res.status(500).json({ ok: false, error: 'Telegram env vars not set' })
  }

  try {
    const text = htmlToTelegram(html, title, postUrl)
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

function htmlToTelegram(html, title, postUrl) {
  // HTML 파싱해서 텔레그램 텍스트로 변환
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short'
  })

  const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const stripTags = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const lines = [`<b>🗞 ${escapeHtml(title)}</b>\n${today}`]

  // 헤드라인 추출: card-title (복합 클래스 대응, h1~h6·div·p 닫힘 태그 모두 대응)
  for (const m of html.matchAll(/class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/\w+>/g)) {
    const t = escapeHtml(stripTags(m[1]).trim())
    if (t) lines.push(`\n<b>${t}</b>`)
  }

  // 외부 링크 수집 (중복 제거, 텍스트 있는 것만)
  const seen = new Set()
  const sourceLinks = []
  for (const m of html.matchAll(/<a\s[^>]*href="(https?:\/\/[^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = m[1]
    const text = stripTags(m[2]).trim()
    if (text.length > 1 && !seen.has(url)) {
      seen.add(url)
      sourceLinks.push(`<a href="${url}">${escapeHtml(text)}</a>`)
    }
  }
  if (sourceLinks.length > 0) {
    lines.push(`\n🔗 ${sourceLinks.slice(0, 15).join(' · ')}`)
  }

  if (postUrl) {
    lines.push(`\n📖 <a href="${postUrl}">전체 카드뉴스 보기</a>`)
  }

  return lines.join('\n').substring(0, 4000)
}
