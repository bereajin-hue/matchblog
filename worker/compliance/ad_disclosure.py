"""
광고 표시 문구 검증 모듈 (3중 방어 중 2차 — 발행 직전)
공정위 표시광고법 준수. 비활성화/우회 절대 금지.
"""

REQUIRED_KEYWORDS = ["#광고", "#협찬", "매치블로그", "원고료"]


def verify_disclosure(content: str) -> bool:
    """발행 직전 광고 문구 포함 여부 최종 확인"""
    return all(kw in content for kw in REQUIRED_KEYWORDS)


def inject_disclosure(content: str, business_name: str) -> str:
    """광고 문구가 없으면 본문 앞에 강제 삽입"""
    if verify_disclosure(content):
        return content
    disclosure = (
        f"본 포스팅은 [매치블로그]를 통해 {business_name}으로부터 "
        f"소정의 원고료를 지원받아 작성되었습니다. #광고 #협찬"
    )
    return f"{disclosure}\n\n{content}"
