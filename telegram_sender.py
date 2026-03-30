"""
텔레그램 채널 발송 모듈
텔레그램 Bot API를 사용해 채널에 브리핑을 포스팅합니다.
"""

import os
import requests
import datetime

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHANNEL_ID = os.environ["TELEGRAM_CHANNEL_ID"]  # 예: @my_ai_channel

TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

# 카테고리별 이모지
CATEGORY_EMOJI = {
    "policy": "📋",
    "tech":   "🤖",
    "infra":  "🏗️",
    "safety": "🛡️",
}


def render_telegram_message(category_id: str, category_name: str, content: str) -> str:
    """텔레그램 MarkdownV2 포맷으로 카테고리 메시지를 렌더링합니다."""
    emoji = CATEGORY_EMOJI.get(category_id, "📌")

    # Claude가 생성한 **굵게** → 텔레그램 *굵게* 변환
    # 텔레그램 MarkdownV2 이스케이프 필요 문자 처리
    def escape_md(text: str) -> str:
        """MarkdownV2 특수문자 이스케이프 (굵게 마커 제외)"""
        # 먼저 **text** → §text§ 로 임시 치환
        import re
        text = re.sub(r"\*\*(.*?)\*\*", r"§\1§", text)
        # 특수문자 이스케이프
        for ch in r"_[]()~`>#+-=|{}.!":
            text = text.replace(ch, f"\\{ch}")
        # §text§ → *text* 로 복원 (굵게)
        text = re.sub(r"§(.*?)§", r"*\1*", text)
        return text

    content_escaped = escape_md(content)
    header = f"*{emoji} {category_name}*"

    return f"{header}\n\n{content_escaped}"


def send_to_channel(text: str, parse_mode: str = "MarkdownV2") -> dict:
    """텔레그램 채널에 메시지를 전송합니다."""
    url = f"{TELEGRAM_API}/sendMessage"
    payload = {
        "chat_id":    TELEGRAM_CHANNEL_ID,
        "text":       text,
        "parse_mode": parse_mode,
        # 링크 미리보기 비활성화 (브리핑이 깔끔하게 보임)
        "link_preview_options": {"is_disabled": True},
    }
    resp = requests.post(url, json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()


def send_daily_briefing(briefings: dict) -> None:
    """
    하루 브리핑 전체를 텔레그램 채널에 발송합니다.
    구조: 헤더 메시지 1개 + 카테고리별 메시지 N개
    """
    today = datetime.date.today().strftime("%Y년 %m월 %d일")
    weekday = ["월", "화", "수", "목", "금", "토", "일"][datetime.date.today().weekday()]

    # ── 헤더 메시지 ──────────────────────────────────────
    header_text = (
        f"*🗞 AI 브리핑 \\| {today} \\({weekday}요일\\)*\n\n"
        "오늘의 AI 주요 뉴스를 카테고리별로 전달드립니다\\.\n\n"
        + "\n".join(
            f"{CATEGORY_EMOJI.get(cid, '📌')} {data['name']}"
            for cid, data in briefings.items()
        )
    )
    print("  헤더 메시지 발송 중...")
    send_to_channel(header_text)

    # ── 카테고리별 메시지 ──────────────────────────────────
    for cat_id, data in briefings.items():
        print(f"  [{data['name']}] 발송 중...")
        message = render_telegram_message(cat_id, data["name"], data["content"])
        try:
            send_to_channel(message)
        except requests.HTTPError as e:
            # MarkdownV2 파싱 실패 시 plain text로 재시도
            print(f"  ⚠️ MarkdownV2 실패, plain text로 재시도: {e}")
            plain = f"{CATEGORY_EMOJI.get(cat_id, '📌')} {data['name']}\n\n{data['content']}"
            send_to_channel(plain, parse_mode="")

    # ── 푸터 메시지 ──────────────────────────────────────
    footer_text = (
        "━━━━━━━━━━━━━━━━━━━━\n"
        "📢 채널 구독 후 매일 아침 AI 브리핑을 받아보세요\\!\n"
        f"👉 {TELEGRAM_CHANNEL_ID}"
    )
    send_to_channel(footer_text)
    print("  ✅ 텔레그램 발송 완료!")
