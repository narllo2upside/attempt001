#!/usr/bin/env python3
"""새 테스트 만들기 — 비슷한 기존 테스트를 복사해서 시작합니다.

    python3 tools/new_test.py cat-test "고양이 성격 테스트" --from inner-child
    python3 tools/new_test.py ghost-mbti "유령 MBTI" --from mbti-test --category mbti --emoji 👻

--from 으로 고를 수 있는 대표 원본
  inner-child      결과 유형 고르기(가장 많이 고른 유형)  — 대부분의 심리 테스트
  mental-age-test  점수 합산 → 구간별 결과              — 정신연령, 확률, 지수
  mbti-test        MBTI 16유형                           — 캐릭터 MBTI 등
  reflex-test / book-of-answers / today-tarot           — 미니게임·답의 책·타로

복사 후 할 일
  1) test/<slug>/data.js     질문과 결과 수정
  2) test/<slug>/page.json   목록 문구, 소개, 설명, FAQ 수정
  3) node tools/check.js     데이터 실수 검사
  4) python3 tools/build.py  페이지 생성
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", help="URL에 쓰일 영문 소문자-하이픈 (예: cat-test)")
    ap.add_argument("title", help="테스트 제목")
    ap.add_argument("--from", dest="src", default="inner-child", help="복사할 기존 테스트 slug")
    ap.add_argument("--category")
    ap.add_argument("--emoji")
    ap.add_argument("--rank", type=int, default=99)
    a = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.slug):
        sys.exit("slug는 영문 소문자, 숫자, 하이픈만 쓸 수 있어요.")
    src = ROOT / "test" / a.src
    dst = ROOT / "test" / a.slug
    if not (src / "page.json").exists():
        sys.exit(f"원본 테스트가 없어요: test/{a.src}")
    if dst.exists():
        sys.exit(f"이미 있는 폴더예요: test/{a.slug}")
    dst.mkdir(parents=True)

    page = json.loads((src / "page.json").read_text(encoding="utf-8"))
    old_title = page["title"]
    page.update({"slug": a.slug, "title": a.title, "seoTitle": a.title, "rank": a.rank, "isNew": True})
    page.pop("thumb", None)
    if a.category:
        page["category"] = a.category
    if a.emoji:
        page["emoji"] = a.emoji
    (dst / "page.json").write_text(json.dumps(page, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    data = (src / "data.js").read_text(encoding="utf-8")
    data = data.replace(f"'{a.src}'", f"'{a.slug}'").replace(old_title, a.title).replace(f"test/{a.src}/", f"test/{a.slug}/")
    (dst / "data.js").write_text(data, encoding="utf-8")

    print(f"생성 완료: test/{a.slug}/ ({a.src} 복사)")
    print("  1) data.js 질문·결과 수정  2) page.json 문구 수정")
    print("  3) node tools/check.js     4) python3 tools/build.py")


if __name__ == "__main__":
    main()
