// api/auth.js — 비밀번호 검증 엔드포인트
// 환경변수: APP_PASSWORD, TG_CHANNEL_ID, GHOST_URL

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body
  const appPassword = process.env.APP_PASSWORD

  if (!password || !appPassword || password !== appPassword) {
    return res.status(401).json({ ok: false })
  }

  // 토큰 = 비밀번호를 base64로 인코딩 (고정값 → 서버에서 검증 가능)
  const token = Buffer.from(appPassword).toString('base64')

  return res.status(200).json({
    ok: true,
    token,
    tgChannel: process.env.TG_CHANNEL_ID || '',
    ghostUrl:  process.env.GHOST_URL     || '',
  })
}
