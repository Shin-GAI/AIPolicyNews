# 📬 AI 브리핑 텔레그램 자동 발송

Claude API + 텔레그램 Bot + GitHub Actions으로 매일 오전 7시 AI 브리핑을 텔레그램 채널에 자동 발송합니다.

## 📁 파일 구조

```
ai-newsletter-telegram/
├── main.py              # 메인 실행 스크립트
├── prompts.py           # 카테고리 정의 & 프롬프트 템플릿
├── telegram_sender.py   # 텔레그램 Bot API 발송 모듈
├── requirements.txt
├── .env.example
└── .github/workflows/newsletter.yml
```

## ⚡ 세팅 순서

### 1단계 — 텔레그램 봇 & 채널 설정

**봇 만들기:**
1. 텔레그램 → `@BotFather` 검색 → `/newbot`
2. 이름/username 설정 → **Bot Token** 저장

**채널 만들기:**
1. 텔레그램 → 새 채널 생성
2. 채널 설정 → 관리자 → 봇 추가 (메시지 게시 권한 체크)

### 2단계 — GitHub Secrets 3개 추가

Settings → Secrets and variables → Actions:

| Secret | 값 |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `TELEGRAM_BOT_TOKEN` | BotFather 토큰 |
| `TELEGRAM_CHANNEL_ID` | `@채널username` |

### 3단계 — 로컬 테스트

```bash
pip install -r requirements.txt
cp .env.example .env   # 실제 값으로 수정
SEND_MESSAGE=false python main.py
cat output_preview.txt
```

### 4단계 — GitHub Actions 수동 실행

Actions → Run workflow → `send_message: true` 로 실제 발송 확인

## 💰 비용

| 항목 | 비용 |
|---|---|
| GitHub Actions | 무료 |
| Claude API | 월 $3~5 |
| 텔레그램 | **완전 무료, 구독자 무제한** |

## 🗂️ 카테고리 추가

`prompts.py` 의 `CATEGORIES` 에 한 줄 추가 후
`telegram_sender.py` 의 `CATEGORY_EMOJI` 에 이모지 추가.

## 🕐 발송 시간 변경

`newsletter.yml` cron 수정:
- 오전 7시 KST: `"0 22 * * *"`
- 오전 8시 KST: `"0 23 * * *"`
- 평일만: `"0 22 * * 1-5"`
