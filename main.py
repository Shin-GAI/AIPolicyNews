"""
AI 뉴스레터 자동 발행 스크립트 — 텔레그램 채널 버전
매일 오전 7시 GitHub Actions에서 실행됩니다.
"""

import os
import datetime
import google.generativeai as genai
from prompts import CATEGORIES, build_system_prompt, build_user_prompt
from telegram_sender import send_daily_briefing

# ── 환경변수 ───────────────────────────────────────────────
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SEND_MESSAGE   = os.environ.get("SEND_MESSAGE", "true").lower() == "true"

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    system_instruction=build_system_prompt(),
)


# ── 1. Gemini로 뉴스 브리핑 생성 ──────────────────────────
def generate_briefing() -> dict:
    """카테고리별 뉴스 브리핑을 Gemini로 생성합니다."""
    today = datetime.date.today().strftime("%Y년 %m월 %d일")
    briefings = {}

    for category_id, category_name in CATEGORIES.items():
        print(f"  [{category_name}] 브리핑 생성 중...")
        response = model.generate_content(
            build_user_prompt(category_name, today),
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=1500,
            ),
        )
        briefings[category_id] = {
            "name":    category_name,
            "content": response.text,
        }

    return briefings


# ── 2. 텍스트 미리보기 저장 (디버그용) ────────────────────
def save_preview(briefings: dict) -> None:
    today = datetime.date.today().strftime("%Y-%m-%d")
    lines = [f"=== AI 브리핑 미리보기 {today} ===\n"]
    for cat_id, data in briefings.items():
        lines.append(f"\n{'='*40}")
        lines.append(f"[{data['name']}]")
        lines.append(f"{'='*40}")
        lines.append(data["content"])
    preview = "\n".join(lines)

    with open("output_preview.txt", "w", encoding="utf-8") as f:
        f.write(preview)
    print("  → output_preview.txt 저장 완료")
    print("\n" + preview[:500] + "...\n")


# ── 메인 ──────────────────────────────────────────────────
def main():
    today = datetime.date.today().strftime("%Y년 %m월 %d일")
    print(f"\n=== AI 텔레그램 브리핑 시작: {today} ===\n")

    # 1. 브리핑 생성
    print("[1/3] Gemini로 카테고리별 브리핑 생성 중...")
    briefings = generate_briefing()

    # 2. 미리보기 저장
    print("\n[2/3] 미리보기 저장 중...")
    save_preview(briefings)

    # 3. 텔레그램 발송
    if SEND_MESSAGE:
        print("[3/3] 텔레그램 채널에 발송 중...")
        send_daily_briefing(briefings)
        print("\n✅ 발송 완료!")
    else:
        print("[3/3] SEND_MESSAGE=false — 발송 건너뜀 (로컬 테스트 모드)")

    print("\n=== 완료 ===\n")


if __name__ == "__main__":
    main()
