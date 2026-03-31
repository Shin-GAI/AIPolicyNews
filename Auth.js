// api/auth.js — 비밀번호 검증 엔드포인트
// 환경변수: APP_PASSWORD, TG_CHANNEL_ID, GHOST_URL

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { password } = req.body

  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ ok: false })
  }

  // 간단한 세션 토큰 (비밀번호 해시 기반)
  const token = Buffer.from(`${password}:${Date.now()}`).toString('base64')

  return res.status(200).json({
    ok: true,
    token,
    // 채널 정보만 프론트에 전달 (API 키는 절대 노출 안 함)
    tgChannel: process.env.TG_CHANNEL_ID || '',
    ghostUrl:  process.env.GHOST_URL || '',
  })
}
