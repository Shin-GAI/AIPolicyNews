// api/tistory.js — 티스토리 발행
// 환경변수: APP_PASSWORD, TISTORY_ACCESS_TOKEN, TISTORY_BLOG_NAME

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const expectedToken = Buffer.from(process.env.APP_PASSWORD || '').toString('base64')
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== expectedToken) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const { html, title } = req.body ?? {}
  if (!html) return res.status(400).json({ ok: false, error: 'HTML required' })

  const accessToken = process.env.TISTORY_ACCESS_TOKEN
  const blogName    = process.env.TISTORY_BLOG_NAME

  if (!accessToken || !blogName) {
    return res.status(500).json({ ok: false, error: 'Tistory env vars not set' })
  }

  try {
    const params = new URLSearchParams({
      access_token: accessToken,
      output:       'json',
      blogName,
      title,
      content:      html,
      visibility:   '3',   // 0=비공개 1=보호 3=공개
      category:     '0'
    })

    const tistoryRes = await fetch('https://www.tistory.com/apis/post/write', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params.toString()
    })

    const data = await tistoryRes.json().catch(() => null)
    const ok      = data?.tistory?.status === '200'
    const postUrl = data?.tistory?.url || null

    return res.status(200).json({ ok, url: postUrl, detail: data })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}
