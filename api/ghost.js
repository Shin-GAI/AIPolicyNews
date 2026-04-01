// api/ghost.js — Ghost 블로그 발행
// 환경변수: APP_PASSWORD, GHOST_URL, GHOST_ADMIN_KEY

import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // 토큰 검증 — auth.js와 동일한 방식으로 비교
  const auth = req.headers.authorization || ''
  const expectedToken = Buffer.from(process.env.APP_PASSWORD || '').toString('base64')
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== expectedToken) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const { html, title } = req.body
  if (!html) return res.status(400).json({ ok: false, error: 'HTML required' })

  const ghostUrl  = process.env.GHOST_URL?.replace(/\/$/, '')
  const adminKey  = process.env.GHOST_ADMIN_KEY

  if (!ghostUrl || !adminKey) {
    return res.status(500).json({ ok: false, error: 'Ghost env vars not set' })
  }

  try {
    const token = createGhostJWT(adminKey)
    const ghostRes = await fetch(`${ghostUrl}/ghost/api/admin/posts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Ghost ${token}`
      },
      body: JSON.stringify({
        posts: [{
          title,
          html,
          status: 'published',
          tags: [{ name: 'AI 브리핑' }]
        }]
      })
    })

    const ghostData = await ghostRes.json().catch(() => null)
    return res.status(200).json({ ok: ghostRes.ok, status: ghostRes.status, detail: ghostData })
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}

function createGhostJWT(adminKey) {
  const [id, secret] = adminKey.split(':')
  const now = Math.floor(Date.now() / 1000)

  const header  = b64url(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' }))
  const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const data    = `${header}.${payload}`

  const sig = crypto
    .createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(data)
    .digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${data}.${sig}`
}

function b64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
