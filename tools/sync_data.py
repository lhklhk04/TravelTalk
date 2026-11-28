"""
data/*.json → data/*.js 사본 생성 + 데이터 검사

JSON 파일이 원본입니다. JSON을 고친 뒤 이 스크립트를 실행하면
index.html을 더블클릭(file://)으로 열 때 쓰는 JS 사본이 같은 내용으로 다시 만들어집니다.

실행:  python tools/sync_data.py
"""
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

LANGS = {"fr", "ja", "es", "ko", "en"}
PLACES = {"restaurant", "cafe", "shop", "transport", "hotel", "sight"}
PHRASE_FIELDS = ["id", "language", "placeType", "basic", "keywords", "phrase",
                 "meaning_ko", "meaning_en", "pronunciation_ko", "pronunciation_en",
                 "situation", "situation_en", "dialogue", "fallback_english"]
DIALOGUE_FIELDS = ["speaker", "text", "meaning_ko", "meaning_en"]
CITY_FIELDS = ["id", "name_ko", "name_en", "name_local", "country", "country_ko",
               "country_en", "language", "lat", "lng"]

# JSON 파일 이름 → window.TRAVELTALK_DATA 아래 키
FILES = {
    "phrases.json": "phrases", "cities.json": "cities", "countries-110m.json": "world",
    "tag-map.json": "tagMap", "spots.json": "spots",
}
# 세계지도(world-atlas TopoJSON)는 크기가 커서 사본을 한 줄로 압축해 저장
COMPACT = {"countries-110m.json"}


def check_phrases(items):
    errors = []
    seen = set()
    for i, p in enumerate(items):
        tag = p.get("id", f"#{i}")
        for f in PHRASE_FIELDS:
            if f not in p:
                errors.append(f"{tag}: '{f}' 항목이 없어요")
        if p.get("id") in seen:
            errors.append(f"{tag}: id가 중복돼요")
        seen.add(p.get("id"))
        if p.get("language") not in LANGS:
            errors.append(f"{tag}: language '{p.get('language')}'는 fr/ja/es/ko/en 중 하나여야 해요")
        if p.get("placeType") not in PLACES:
            errors.append(f"{tag}: placeType '{p.get('placeType')}'가 올바르지 않아요")
        for d in p.get("dialogue", []):
            if d.get("speaker") not in ("나", "직원"):
                errors.append(f"{tag}: dialogue speaker는 '나' 또는 '직원'이어야 해요")
            for f in DIALOGUE_FIELDS:
                if not d.get(f):
                    errors.append(f"{tag}: dialogue 줄에 '{f}'가 없어요")
        for f in ("meaning_en", "pronunciation_en", "situation_en"):
            if f in p and not str(p[f]).strip():
                errors.append(f"{tag}: '{f}'가 비어 있어요")

    # 언어 × 장소마다 표현 수와 기본 표현 수 확인
    count = Counter((p.get("language"), p.get("placeType")) for p in items)
    basic = Counter((p.get("language"), p.get("placeType")) for p in items if p.get("basic"))
    for lang in sorted(LANGS):
        for place in sorted(PLACES):
            n, b = count[(lang, place)], basic[(lang, place)]
            if n < 6:
                errors.append(f"{lang}/{place}: 표현이 {n}개뿐이에요 (6개 이상 필요)")
            if b < 1:
                errors.append(f"{lang}/{place}: basic 표현이 없어요 (맞는 표현이 없을 때 보여 줄 기본 표현)")
    return errors, count


def check_cities(items):
    errors = []
    for i, c in enumerate(items):
        tag = c.get("id", f"#{i}")
        for f in CITY_FIELDS:
            if f not in c:
                errors.append(f"{tag}: '{f}' 항목이 없어요")
        if c.get("language") not in LANGS:
            errors.append(f"{tag}: language가 올바르지 않아요")
    return errors


def _tag_matches(tags, rule_tag):
    key, _, want = rule_tag.partition("=")
    if key not in tags:
        return False
    if want == "*":
        return True
    values = [v.strip() for v in str(tags[key]).split(";")]
    return any(v in want.split("|") for v in values)


def check_tag_map(tag_map):
    errors = []
    for section, need_type in (("placeTypes", True), ("modifiers", False)):
        for i, r in enumerate(tag_map.get(section, [])):
            tag = r.get("tag", "")
            if "=" not in tag:
                errors.append(f"tag-map {section}[{i}]: tag는 'key=value' 형식이어야 해요 ({tag!r})")
            for f in ("ko", "en", "keywords"):
                if f not in r:
                    errors.append(f"tag-map {section}[{i}] ({tag}): '{f}'가 없어요")
            if need_type and r.get("placeType") not in PLACES:
                errors.append(f"tag-map {section}[{i}] ({tag}): placeType이 올바르지 않아요")
    return errors


def check_spots(spots, tag_map):
    errors = []
    for i, s in enumerate(spots):
        tag = s.get("id", f"#{i}")
        for f in ("id", "name", "name_ko", "name_en", "lat", "lng", "tags"):
            if f not in s:
                errors.append(f"spots {tag}: '{f}'가 없어요")
        if not any(_tag_matches(s.get("tags", {}), r["tag"]) for r in tag_map.get("placeTypes", [])):
            errors.append(f"spots {tag}: tags가 tag-map의 어떤 장소 유형에도 맞지 않아요")
    return errors


def main():
    all_errors = []
    loaded = {}
    for name in FILES:
        path = DATA / name
        try:
            loaded[name] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"[오류] {name} JSON 문법 오류: {e}")
            return 1

    p_err, count = check_phrases(loaded["phrases.json"])
    all_errors += p_err
    all_errors += check_cities(loaded["cities.json"])
    all_errors += check_tag_map(loaded["tag-map.json"])
    all_errors += check_spots(loaded["spots.json"], loaded["tag-map.json"])
    world = loaded["countries-110m.json"]
    if world.get("type") != "Topology" or "land" not in world.get("objects", {}):
        all_errors.append("countries-110m.json: world-atlas TopoJSON 형식이 아니에요 (objects.land 필요)")

    if all_errors:
        print("[오류] 데이터 문제를 먼저 고쳐 주세요:")
        for e in all_errors:
            print("  -", e)
        return 1

    for name, key in FILES.items():
        js_path = DATA / name.replace(".json", ".js")
        if name in COMPACT:
            body = json.dumps(loaded[name], ensure_ascii=False, separators=(",", ":"))
        else:
            body = json.dumps(loaded[name], ensure_ascii=False, indent=2)
        js_path.write_text(
            f"// 자동 생성 파일입니다. 직접 고치지 말고 data/{name}을 고친 뒤\n"
            f"// python tools/sync_data.py 를 실행하세요.\n"
            f"window.TRAVELTALK_DATA = window.TRAVELTALK_DATA || {{}};\n"
            f"window.TRAVELTALK_DATA.{key} = {body};\n",
            encoding="utf-8",
        )
        print(f"[완료] {js_path.relative_to(ROOT)} 생성")

    print(f"\n표현 {len(loaded['phrases.json'])}개, 도시 {len(loaded['cities.json'])}개")
    for (lang, place), n in sorted(count.items()):
        print(f"  {lang}/{place}: {n}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
