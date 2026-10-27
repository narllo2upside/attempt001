#!/usr/bin/env python3
"""사이트 빌드 스크립트 — 테스트를 추가·수정한 뒤 매번 실행하세요.

    python3 tools/build.py

test/<slug>/page.json (목록 카드 정보 + 페이지 소개·설명·FAQ) 를 읽어서
  1) test/<slug>/index.html          테스트 페이지
  2) test/<slug>/result/index.html   결과 페이지
  3) data/tests.json                 홈 목록·인기 테스트·관련 테스트의 원본
  4) sitemap.xml
을 만듭니다. HTML은 자동 생성물이므로 직접 고치지 말고 page.json을 고치세요.
레이아웃(사이드바·광고 위치)을 바꾸려면 아래 TEST_TPL / RESULT_TPL 을 고치면 전 페이지에 반영됩니다.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

ENGINES = {
    "mbti": "mbti-engine.js",
    "quiz": "quiz-engine.js",
    "tarot": "tarot-engine.js",
    "reflex": "reflex-engine.js",
    "oracle": "oracle-engine.js",
}
CARD_FIELDS = ["slug", "title", "desc", "category", "emoji", "tint", "thumb", "meta", "isNew", "rank"]
REQUIRED = ["slug", "title", "desc", "category", "engine", "headline", "description"]

# Geist(영문·숫자) + Pretendard(한글). 타로·답의 책은 카드 문구용 명조(Gowun Batang) 추가
FONTS_BASE = "family=Geist:wght@400..800"
FONTS_SERIF = "family=Geist:wght@400..800&family=Gowun+Batang:wght@400;700"
PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"


def e(s):
    return html.escape(str(s), quote=True)


def read_config():
    cfg = (ROOT / "assets/js/config.js").read_text(encoding="utf-8")
    cats = dict(re.findall(r"\{\s*key:\s*'([^']+)',\s*label:\s*'([^']+)'\s*\}", cfg))
    name = re.search(r"siteName:\s*'([^']+)'", cfg).group(1)
    url = re.search(r"siteUrl:\s*'([^']+)'", cfg).group(1).rstrip("/")
    return cats, name, url


HEAD = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0a0a0a">
<title>{title}</title>
<meta name="description" content="{description}">
{extra_meta}<meta property="og:type" content="website">
<meta property="og:title" content="{og_title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{site_url}/test/{slug}/thumb.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?{fonts}&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{pretendard}">
<link rel="stylesheet" href="{p}assets/css/style.css">
<script src="{p}assets/js/config.js"></script>
</head>
<body{body_class}>
<!-- 자동 생성 파일입니다. test/{slug}/page.json 을 고친 뒤 tools/build.py 를 실행하세요. -->
<div id="site-header"></div>
<div class="layout">
<main id="main-content" class="layout__main">
"""

SIDE_AND_FOOT = """</main>

<aside class="layout__side" aria-label="인기 테스트">
  <section class="popular">
    <h2>인기 테스트</h2>
    <ol id="popular"></ol>
  </section>
  <div class="side-ad" data-ad="side" data-ad-media="desktop"></div>
</aside>
</div>

<div id="site-footer"></div>

<script src="{p}assets/js/ads.js"></script>
<script src="{p}assets/js/common.js"></script>
<script src="{data_src}"></script>
<script src="{p}assets/js/{engine_js}"></script>
<script>
  TestEngine.{mount}();
  Site.renderRelated('{slug}');
  Site.renderPopular('{slug}');
</script>
</body>
</html>
"""

TEST_BODY = """  <p class="crumb"><a href="{p}">홈</a> / <a href="{p}?cat={category}">{category_label}</a></p>

  <div data-ad="test_top"></div>

  <section class="test-head">
    <h1>{title}</h1>
    <div class="test-thumb" style="--tint:{tint}"><span aria-hidden="true">{emoji}</span><img src="thumb.png" alt="" onerror="this.remove()"></div>
    <h2 class="test-headline">{headline}</h2>
    <div class="test-intro">{intro}</div>
  </section>

  <section class="app" id="app" aria-live="polite"></section>

  <div data-ad="test_mid"></div>

  <article class="article">
{sections}
    <h2>자주 묻는 질문</h2>
    <div class="faq">
{faq}
    </div>
{note}
  </article>

  <h2 class="section-title">같이 해보면 좋은 테스트</h2>
  <div class="card-grid" id="related"></div>

  <div data-ad="test_bottom"></div>
"""

RESULT_BODY = """  <p class="crumb"><a href="{p}">홈</a> / <a href="../">{title}</a> / 결과</p>

  <div data-ad="result_top"></div>

  <section id="result-head"></section>

  <div data-ad="result_mid"></div>

  <section id="result-detail"></section>

  <h2 class="section-title">다른 테스트도 해보세요</h2>
  <div class="card-grid" id="related"></div>

  <div data-ad="result_bottom"></div>
"""


def paras(items, indent="    "):
    return "\n".join(f"{indent}<p>{e(x)}</p>" for x in items)


def build_page(meta, cats, site_name, site_url):
    slug = meta["slug"]
    fonts = FONTS_SERIF if meta.get("serif") or meta.get("theme") == "night" else FONTS_BASE
    body_class = ' class="theme-night"' if meta.get("theme") == "night" else ""
    common = dict(slug=slug, site_url=site_url, fonts=fonts, body_class=body_class, pretendard=PRETENDARD,
                  engine_js=ENGINES[meta["engine"]], description=e(meta["description"]))

    sections = "\n".join(
        f"    <h2>{e(s['h'])}</h2>\n" + paras(s["p"]) for s in meta.get("sections", []))
    faq = "\n".join(
        f"      <details><summary>{e(f['q'])}</summary><p>{e(f['a'])}</p></details>" for f in meta.get("faq", []))
    note = f'    <p class="note">{e(meta["note"])}</p>' if meta.get("note") else ""

    # 테스트 페이지 (test/<slug>/)
    p = "../../"
    test_html = HEAD.format(
        p=p, title=e(f"{meta.get('seoTitle', meta['title'])} | {site_name}"),
        og_title=e(f"{meta['title']} | {site_name}"),
        extra_meta=f'<link rel="canonical" href="{site_url}/test/{slug}/">\n', **common
    ) + TEST_BODY.format(
        p=p, title=e(meta["title"]), category=e(meta["category"]),
        category_label=e(cats.get(meta["category"], meta["category"])),
        tint=e(meta.get("tint", "#FFE07A")), emoji=e(meta.get("emoji", "✨")),
        headline=e(meta["headline"]), intro=paras(meta.get("intro", []), ""),
        sections=sections, faq=faq, note=note
    ) + SIDE_AND_FOOT.format(p=p, data_src="data.js", mount="mountTest", **common)

    # 결과 페이지 (test/<slug>/result/)
    p = "../../../"
    result_html = HEAD.format(
        p=p, title=e(f"{meta['title']} 결과 | {site_name}"),
        og_title=e(meta.get("shareTitle", f"{meta['title']} | {site_name}")),
        extra_meta='<meta name="robots" content="noindex, follow">\n', **common
    ) + RESULT_BODY.format(p=p, title=e(meta["title"])) + SIDE_AND_FOOT.format(
        p=p, data_src="../data.js", mount="mountResult", **common)

    d = ROOT / "test" / slug
    (d / "result").mkdir(parents=True, exist_ok=True)
    (d / "index.html").write_text(test_html, encoding="utf-8")
    (d / "result" / "index.html").write_text(result_html, encoding="utf-8")


def main():
    cats, site_name, site_url = read_config()
    metas, errors = [], []
    for pj in sorted((ROOT / "test").glob("*/page.json")):
        try:
            m = json.loads(pj.read_text(encoding="utf-8"))
        except json.JSONDecodeError as ex:
            errors.append(f"{pj.relative_to(ROOT)}: JSON 문법 오류 ({ex})")
            continue
        missing = [k for k in REQUIRED if not m.get(k)]
        if missing:
            errors.append(f"{pj.relative_to(ROOT)}: 빠진 항목 {missing}")
            continue
        if m["slug"] != pj.parent.name:
            errors.append(f"{pj.relative_to(ROOT)}: slug('{m['slug']}')가 폴더 이름과 달라요")
            continue
        if m["engine"] not in ENGINES:
            errors.append(f"{pj.relative_to(ROOT)}: engine은 {list(ENGINES)} 중 하나여야 해요")
            continue
        if m["category"] not in cats:
            errors.append(f"{pj.relative_to(ROOT)}: category '{m['category']}'가 config.js에 없어요")
            continue
        if not (pj.parent / "data.js").exists():
            errors.append(f"{pj.relative_to(ROOT)}: 같은 폴더에 data.js가 없어요")
            continue
        metas.append(m)

    if errors:
        print("빌드 중단 — 아래 문제를 고쳐 주세요:")
        for x in errors:
            print("  -", x)
        sys.exit(1)

    for m in metas:
        m.setdefault("thumb", f"test/{m['slug']}/thumb.png")
        build_page(m, cats, site_name, site_url)

    metas.sort(key=lambda m: m.get("rank", 999))
    registry = [{k: m[k] for k in CARD_FIELDS if k in m} for m in metas]
    (ROOT / "data" / "tests.json").write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    urls = [f"{site_url}/"] + [f"{site_url}/test/{m['slug']}/" for m in metas] + [f"{site_url}/privacy/"]
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")

    print(f"빌드 완료: 테스트 {len(metas)}개")
    for m in metas:
        print(f"  {m.get('rank', '-'):>3}  {m['slug']:<26} {m['engine']:<7} {m['title']}")


if __name__ == "__main__":
    main()
