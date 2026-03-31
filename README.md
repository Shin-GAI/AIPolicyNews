# AI 브리핑 발행 웹앱 (Vercel 버전)

비밀번호로 보호된 AI 브리핑 발행 도구.
어떤 기기에서도 비밀번호 하나로 접속 가능.

## 파일 구조

```
ai-publisher-vercel/
├── index.html        ← 프론트엔드 (로그인 + 발행 UI)
├── api/
│   ├── auth.js       ← 비밀번호 검증
│   ├── telegram.js   ← 텔레그램 발송
│   └── ghost.js      ← Ghost 발행
├── vercel.json       ← Vercel 설정
└── README.md
```

## Vercel 배포 순서

### 1단계 — Vercel 가입 & 배포

1. vercel.com 접속 → GitHub으로 로그인
2. "Add New Project" → 이 폴더를 GitHub에 올린 저장소 선택
3. "Deploy" 클릭 → 배포 완료

### 2단계 — 환경변수 설정

Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**

| 변수명 | 값 | 설명 |
|---|---|---|
| `APP_PASSWORD` | 원하는 비밀번호 | 웹앱 로그인 비밀번호 |
| `TG_BOT_TOKEN` | 1234567890:ABC... | 텔레그램 봇 토큰 |
| `TG_CHANNEL_ID` | @my_channel | 텔레그램 채널 ID |
| `GHOST_URL` | https://myblog.ghost.io | Ghost 블로그 URL |
| `GHOST_ADMIN_KEY` | id:secret | Ghost Admin API Key |

> Ghost를 사용하지 않으면 GHOST_URL, GHOST_ADMIN_KEY는 생략 가능

### 3단계 — 재배포

환경변수 저장 후 Vercel에서 **Redeploy** 클릭

### 4단계 — 사용

배포된 URL로 접속 → 비밀번호 입력 → 발행 시작!

## 사용법

1. Claude에서 "오늘 AI 핫뉴스 카드뉴스 HTML로 만들어줘" 요청
2. Claude가 생성한 HTML 복사
3. 발행 웹앱 접속 → HTML 붙여넣기
4. 미리보기 확인
5. 발행하기 버튼 → 텔레그램 + Ghost 동시 배포

## 보안

- API 키는 Vercel 서버에만 저장 (브라우저에 노출 없음)
- 비밀번호는 세션 동안만 유지 (브라우저 닫으면 자동 로그아웃)
- 모든 API 요청은 서버를 통해 처리
