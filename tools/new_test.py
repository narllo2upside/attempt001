#!/usr/bin/env python3
"""새 MBTI형 테스트 추가 스크립트

사용법 (사이트 루트에서):
    python3 tools/new_test.py cat-mbti "고양이 MBTI 테스트" --emoji 🐱 --desc "나와 닮은 고양이는?"

하는 일:
  1) test/chiikawa-mbti 폴더를 test/<slug> 로 복사 (images 폴더는 비운 채로)
  2) HTML/data.js 안의 slug·제목을 새 값으로 치환
  3) data/tests.json 에 목록 항목 추가 (홈·관련 테스트에 자동 노출)
  4) sitemap.xml 에 URL 추가
이후 test/<slug>/data.js 의 질문·결과, index.html 의 설명·FAQ 문구만 고치면 됩니다.
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE_SLUG = "chiikawa-mbti"
TEMPLATE_TITLE = "치이카와 MBTI 테스트"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", help="URL에 쓰일 영문 소문자-하이픈 (예: cat-mbti)")
    ap.add_argument("title", help="테스트 제목")
    ap.add_argument("--desc", default="12개 질문으로 나와 닮은 캐릭터를 찾아요.")
    ap.add_argument("--category", default="mbti")
    ap.add_argument("--emoji", default="✨")
    ap.add_argument("--tint", default="#FFE07A")
    ap.add_argument("--meta", default="12문항, 약 2분")
    ap.add_argument("--rank", type=int, default=50)
    a = ap.parse_args()

    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", a.slug):
        sys.exit("slug는 영문 소문자, 숫자, 하이픈만 쓸 수 있어요.")

    src = ROOT / "test" / TEMPLATE_SLUG
    dst = ROOT / "test" / a.slug
    if dst.exists():
        sys.exit(f"이미 있는 폴더예요: {dst}")

    shutil.copytree(src, dst, ignore=shutil.ignore_patterns("*.png", "*.webp", "*.jpg"))
    for f in [dst / "index.html", dst / "result" / "index.html", dst / "data.js"]:
        s = f.read_text(encoding="utf-8")
        s = s.replace(TEMPLATE_SLUG, a.slug).replace(TEMPLATE_TITLE, a.title)
        f.write_text(s, encoding="utf-8")

    reg = ROOT / "data" / "tests.json"
    items = json.loads(reg.read_text(encoding="utf-8"))
    items.append({
        "slug": a.slug, "title": a.title, "desc": a.desc, "category": a.category,
        "emoji": a.emoji, "tint": a.tint, "thumb": f"test/{a.slug}/thumb.png",
        "meta": a.meta, "isNew": True, "rank": a.rank,
    })
    reg.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    sm = ROOT / "sitemap.xml"
    s = sm.read_text(encoding="utf-8")
    line = f"  <url><loc>https://YOUR-DOMAIN.com/test/{a.slug}/</loc></url>\n"
    if line not in s:
        sm.write_text(s.replace("</urlset>", line + "</urlset>"), encoding="utf-8")

    print(f"생성 완료: test/{a.slug}/")
    print(" - data.js 에서 질문(questions)과 결과(results)를 수정하세요")
    print(" - index.html 의 소개 문구·FAQ·원작 표기를 수정하세요")
    print(" - 썸네일: test/%s/thumb.png, 결과 이미지: test/%s/images/{TYPE}.png" % (a.slug, a.slug))


if __name__ == "__main__":
    main()
