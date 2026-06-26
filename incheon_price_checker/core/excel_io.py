"""
인천e몰 파트너시스템 엑셀(21컬럼, MyData 시트) 읽기 / 결과 쓰기.
"""
from __future__ import annotations
from typing import Any


def load_products(filepath: str) -> list[dict[str, Any]]:
    """
    MyData 시트에서 21컬럼을 읽어 상품 dict 리스트로 반환.

    Args:
        filepath: 입력 엑셀 파일 경로.

    Returns:
        각 행이 dict인 리스트.
        키: 상품코드, 상품명, 시중가격, 공급가, 판매가, 배송비,
            옵션, 담당MD명, 마진율, 최저가, 할인율, 상태 등 21컬럼 전체.
    """
    raise NotImplementedError


def save_results(
    products: list[dict[str, Any]],
    results: list[dict[str, Any]],
    output_path: str,
    split_by_md: bool = False,
) -> None:
    """
    원본 21컬럼 보존 + 검증 컬럼(AI최저가·AI단위최저가·AI판정·AI신뢰도·AI근거·
    재계산_할인율·재계산_마진율·동일후보1~3)을 우측에 추가해 저장.

    Args:
        products: load_products() 반환값.
        results: judge.py 출력 리스트(상품코드 기준 매핑).
        output_path: 저장할 엑셀 경로.
        split_by_md: True이면 담당MD명별로 시트 분리.
    """
    raise NotImplementedError
