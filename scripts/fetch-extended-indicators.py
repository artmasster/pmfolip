#!/usr/bin/env python3
"""Fetch documented historical/education series from OWID; stdout only, or --patch."""

import argparse
import csv
import io
import json
import math
import runpy
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


BASE = "https://ourworldindata.org/grapher/"
SPECS = [
    {
        "slug": "electoral-democracy-index",
        "column": ("Electoral democracy index", "Electoral democracy index (central estimate)"),
        "short_name": "electdem_vdem__estimate_best",
        "expected_citation": "V-Dem (2026)",
        "minimum": 0, "maximum": 1,
        "id": "vdem-electoral-democracy",
        "category": "governance", "categoryLabel": "ธรรมาภิบาลและสิทธิ",
        "name": "ประชาธิปไตยด้านการเลือกตั้ง (V-Dem)",
        "description": "ค่าประมาณสถาบันการเมืองจากสิทธิเลือกตั้ง การเลือกตั้ง เสรีภาพการแสดงออกและการรวมกลุ่ม ไม่ใช่คะแนนความสามารถนายกฯ",
        "unit": "index", "unitLabel": "ดัชนี 0–1", "direction": "higher", "scorable": True,
        "scoreFamily": "civic-rights", "scorePriority": 10,
        "source_title": "V-Dem v16 (2026) · Our World in Data",
        "source_code": "v2x_polyarchy · V-Dem v16",
        "notes": "เป็นค่าประมาณโดยผู้เชี่ยวชาญและแบบจำลองของ V-Dem ไม่ใช่การนับข้อเท็จจริงโดยตรงหรือทักษะบุคคล ค่าสูงขึ้นหมายถึงองค์ประกอบประชาธิปไตยด้านการเลือกตั้งตามนิยามแหล่งข้อมูลมากขึ้น ไม่ครอบคลุมธรรมาภิบาลทุกมิติ เก็บค่ากลางและไม่ได้เก็บช่วงความไม่แน่นอน จึงไม่ควรตีความความต่างเล็กน้อยเป็นข้อสรุปเด็ดขาด ใช้ v16 ทั้งอนุกรม ห้ามผสมรุ่นอื่น ต้นฉบับ Coppedge et al. (2026), V-Dem Dataset v16, https://doi.org/10.23696/vdemds26; ข้อมูลและค่าดัชนีที่คำนวณจากชุดนี้เผยแพร่ภายใต้ CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/ .",
    },
    {
        "slug": "life-expectancy",
        "column": ("Life expectancy", "Period life expectancy at birth"),
        "short_name": "life_expectancy_0",
        "expected_citation": "UN WPP (2024)",
        "minimum": 0, "maximum": 130, "last_year": 2023,
        "id": "life-expectancy-longrun",
        "category": "health", "categoryLabel": "สุขภาพ",
        "name": "อายุคาดเฉลี่ยแรกเกิด (ชุดประวัติศาสตร์)",
        "description": "จำนวนปีคาดหมายหากอัตราตายแต่ละวัยของปีอ้างอิงคงเดิม เป็นค่าประมาณของประชากรในปีนั้น",
        "unit": "years", "unitLabel": "ปี", "direction": "higher", "scorable": True,
        "scoreFamily": "life-expectancy", "scorePriority": 10,
        "source_title": "Zijdeman et al. (2015) / UN WPP (2024) · Our World in Data",
        "source_code": "OWID life_expectancy_0 · historical + UN WPP 2024",
        "notes": "OWID รวมงานประวัติศาสตร์ก่อนปี 1950 กับ UN World Population Prospects 2024 ตั้งแต่ปี 1950 เป็นค่าประมาณจากแหล่งข้อมูลและวิธีต่างกัน จึงอาจมีรอยต่อของอนุกรม ไม่ใช่สถิติทะเบียนครบทุกปี ข้อมูลไทยก่อนปี 1950 มีเฉพาะ 1937, 1941, 1947, 1948; PMfolio ไม่แทรกปีที่หาย แยกชุดนี้จาก World Bank WDI และใช้เป็นชุดสำรองในกลุ่มอายุคาดเฉลี่ย ไม่ให้น้ำหนักซ้ำเมื่อ WDI มีข้อมูลเพียงพอ แหล่งต้นฉบับ: https://clio-infra.eu/Indicators/LifeExpectancyatBirthTotal.html และ https://population.un.org/wpp/downloads/ . ไม่รวมค่าคาดการณ์หลังช่วงประมาณการย้อนหลังที่ OWID เผยแพร่.",
    },
    {
        "slug": "mean-years-of-schooling-long-run",
        "column": ("Average years of schooling", "Combined - average years of education for 15-64 years male and female youth and adults"),
        "short_name": "mf_youth_and_adults__15_64_years__average_years_of_education",
        "expected_citation": "Lee and Lee (2016)",
        "minimum": 0, "maximum": 30, "last_year": 2010,
        "id": "schooling-years-longrun",
        "category": "education", "categoryLabel": "การศึกษา",
        "name": "ปีการศึกษาเฉลี่ย อายุ 15–64 (ประวัติศาสตร์)",
        "description": "ค่าประมาณจำนวนปีการศึกษาในระบบที่ประชากรอายุ 15–64 ปีสะสมมา ตามชุดประวัติศาสตร์ Lee และ Lee",
        "unit": "years", "unitLabel": "ปีการศึกษา", "direction": "higher", "scorable": True,
        "scoreFamily": "education-attainment", "scorePriority": 10,
        "source_title": "Lee and Lee (2016) · Our World in Data",
        "source_code": "Lee-Lee · mean schooling ages 15–64 · historical to 2010",
        "notes": "แหล่งข้อมูลประมาณย้อนหลังเป็นช่วง 5 ปี ไม่ใช่การสำรวจใหม่ทุกปี PMfolio เก็บเฉพาะปีที่ต้นทางมีค่า และตัดค่าคาดการณ์ Barro-Lee ตั้งแต่ 2015 ออกทั้งหมด ไม่ทำ interpolation หรือเอาค่าปีใกล้เคียงไปใส่ให้วาระที่ขาด วัดจำนวนปีเรียนสะสม ไม่ใช่คุณภาพการเรียนหรือผลของรัฐบาลเดียว กลุ่มอายุต่างจาก UNDP อายุ 25 ปีขึ้นไป จึงแยกชื่อและอนุกรม ไม่ต่อค่าเข้าด้วยกัน ต้นฉบับ Lee, Jong-Wha and Hanol Lee (2016), Human Capital in the Long Run, Journal of Development Economics 122, 147–169; https://barrolee.github.io/BarroLeeDataSet/DataLeeLee.html .",
    },
    {
        "slug": "average-schooling-vs-expected-schooling",
        "column": ("Both genders", "Average years of schooling"),
        "short_name": "mys__sex_total",
        "expected_citation": "UNDP, Human Development Report (2025)",
        "minimum": 0, "maximum": 30,
        "id": "schooling-years-undp",
        "category": "education", "categoryLabel": "การศึกษา",
        "name": "ปีการศึกษาเฉลี่ย อายุ 25 ปีขึ้นไป (UNDP)",
        "description": "จำนวนปีเรียนในระบบเฉลี่ยที่ผู้ใหญ่อายุ 25 ปีขึ้นไปสะสม ไม่รวมปีซ้ำชั้น ใช้อ่านการศึกษาที่ได้รับในอดีต",
        "unit": "years", "unitLabel": "ปีการศึกษา", "direction": "higher", "scorable": True,
        "scoreFamily": "education-attainment", "scorePriority": 20,
        "source_title": "UNDP Human Development Report 2025 · Our World in Data",
        "source_code": "UNDP HDR 2025 · mys__sex_total",
        "notes": "UNDP คำนวณจากสำมะโน/แบบสำรวจและชุดการศึกษาหลายแหล่ง ค่ารายปีอาจผ่านการประมาณหรือ interpolation โดยต้นทาง ไม่ใช่การสำรวจอิสระใหม่ทุกปี PMfolio ไม่เติมค่าเอง ค่าสูงขึ้นหมายถึงจำนวนปีการศึกษาสะสมสูงขึ้น ไม่ได้ยืนยันคุณภาพหรือผลนโยบายในวาระเดียว จะแยกจากชุด Lee-Lee ซึ่งใช้ประชากรอายุ 15–64 ปี และใช้เพียงหนึ่งชุดในกลุ่มการศึกษาสะสมเมื่อสรุปดัชนี ต้นฉบับ UNDP (2025), Human Development Report 2025; https://hdr.undp.org/data-center/documentation-and-downloads .",
    },
    {
        "slug": "average-schooling-vs-expected-schooling",
        "column": ("Expected years of schooling",),
        "short_name": "eys__sex_total",
        "expected_citation": "UNDP, Human Development Report (2025)",
        "minimum": 0, "maximum": 40,
        "id": "expected-schooling-years-undp",
        "category": "education", "categoryLabel": "การศึกษา",
        "name": "ปีการศึกษาที่คาดหมาย (UNDP)",
        "description": "จำนวนปีที่เด็กเริ่มเรียนคาดว่าจะอยู่ในระบบ หากอัตราเข้าเรียนแต่ละวัยของปีอ้างอิงคงเดิม รวมปีซ้ำชั้น",
        "unit": "years", "unitLabel": "ปีการศึกษา", "direction": "context", "scorable": False,
        "source_title": "UNDP Human Development Report 2025 · Our World in Data",
        "source_code": "UNDP HDR 2025 · eys__sex_total",
        "notes": "เป็นค่าคาดหมายตามรูปแบบการเข้าเรียนในปีอ้างอิง ไม่ใช่จำนวนปีที่เด็กรุ่นนั้นเรียนจบจริง และไม่ใช่การพยากรณ์ปีอนาคตที่นำมาเติมช่องว่าง ค่าสูงอาจมาจากโครงสร้างหลักสูตรหรือการซ้ำชั้น จึงใช้เป็นบริบทโดยไม่แปลงเป็นคะแนน ข้อมูลรายปีอาจมีค่าประมาณจากต้นทาง PMfolio ไม่เติมข้อมูลเอง ต้นฉบับ UNDP (2025), Human Development Report 2025; https://hdr.undp.org/data-center/documentation-and-downloads .",
    },
]


def download(url):
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "Our World In Data data fetch/1.0"})
            with urlopen(request, timeout=45) as response:
                return response.read().decode("utf-8-sig")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    raise AssertionError("unreachable")


def fetch_chart(slug):
    base = BASE + slug
    with ThreadPoolExecutor(max_workers=2) as pool:
        payloads = list(pool.map(download, [base + ".csv", base + ".metadata.json"]))
    reader = csv.DictReader(io.StringIO(payloads[0]))
    if not {"Entity", "Code", "Year"}.issubset(reader.fieldnames or []):
        raise ValueError(f"Unexpected CSV header for {slug}")
    rows = [row for row in reader if row["Code"] == "THA"]
    if not rows or any(row["Entity"] != "Thailand" for row in rows):
        raise ValueError(f"Missing or mismatched Thailand records: {slug}")
    metadata = json.loads(payloads[1])
    if metadata["chart"]["originalChartUrl"] != base:
        raise ValueError(f"Chart identity mismatch: {slug}")
    return rows, metadata


def build_indicator(spec, chart, as_of):
    rows, metadata = chart
    candidates = [column for column in spec["column"] if column in rows[0]]
    if len(candidates) != 1:
        raise ValueError(f"Missing/ambiguous data column: {spec['id']}")
    column = candidates[0]
    matching = [value for value in metadata["columns"].values()
                if value.get("shortName") == spec["short_name"]]
    if len(matching) != 1 or spec["expected_citation"] not in matching[0]["citationShort"]:
        raise ValueError(f"Source version/indicator mismatch: {spec['id']}")
    meta = matching[0]
    updated = date.fromisoformat(meta["lastUpdated"])
    if updated > as_of:
        raise ValueError("Source update exceeds requested snapshot; cannot reconstruct old vintage")
    last_year = min(spec.get("last_year", as_of.year - 1), as_of.year - 1)
    seen = set()
    values = []
    for row in rows:
        year = int(row["Year"])
        if year in seen:
            raise ValueError(f"Duplicate Thailand year: {spec['id']} {year}")
        seen.add(year)
        if not 1932 <= year <= last_year or row[column] == "":
            continue
        value = float(row[column])
        if not math.isfinite(value) or not spec["minimum"] <= value <= spec["maximum"]:
            raise ValueError(f"Invalid observation: {spec['id']} {year}")
        values.append({"year": year, "value": value})
    values.sort(key=lambda item: item["year"])
    if not values:
        raise ValueError(f"No eligible observations: {spec['id']}")
    keys = ("id", "category", "categoryLabel", "name", "description", "unit", "unitLabel", "direction", "scorable", "scoreFamily", "scorePriority")
    result = {key: spec[key] for key in keys if key in spec}
    result["source"] = {
        "title": spec["source_title"], "url": BASE + spec["slug"],
        "code": spec["source_code"], "apiUrl": BASE + spec["slug"] + ".csv",
        "lastUpdated": updated.isoformat(),
    }
    result["values"] = values
    result["notes"] = (
        f"ข้อมูลไทย {len(values)} ปีที่มีค่า ระหว่าง {values[0]['year']}–{values[-1]['year']}; "
        "เก็บเฉพาะปีตั้งแต่ 1932 ที่ต้นทางเผยแพร่จริง ไม่เติมช่องว่าง. " + spec["notes"]
    )
    return result


def build_attainment(as_of):
    """Reuse the project's checked WDI client, keeping this distinct definition."""
    client = runpy.run_path(str(Path(__file__).with_name("fetch-indicators.py")))
    code = "SE.SEC.CUAT.UP.ZS"
    values, metadata = client["fetch"]("THA", code, 2, as_of)
    if not values or any(not 0 <= point["value"] <= 100 for point in values):
        raise ValueError("Missing/out-of-range adult education attainment")
    return {
        "id": "upper-secondary-attainment",
        "category": "education", "categoryLabel": "การศึกษา",
        "name": "จบอย่างน้อยมัธยมปลาย อายุ 25 ปีขึ้นไป",
        "description": "สัดส่วนผู้ใหญ่อายุ 25 ปีขึ้นไปที่จบอย่างน้อยมัธยมศึกษาตอนปลาย รวมผู้ที่จบสูงกว่าระดับนี้",
        "unit": "%", "unitLabel": "% ของประชากรอายุ 25 ปีขึ้นไป",
        "direction": "higher", "scorable": True,
        "scoreFamily": "education-completion", "scorePriority": 20,
        "source": {
            "title": "UNESCO UIS · World Bank World Development Indicators",
            "url": f"https://data.worldbank.org/indicator/{code}?locations=TH",
            "code": code,
            "apiUrl": client["api_url"]("THA", code, 2),
            "lastUpdated": metadata["lastupdated"],
        },
        "values": values,
        "notes": (
            f"ข้อมูลไทย {len(values)} ปีที่มีค่า ระหว่าง {values[0]['year']}–{values[-1]['year']}; "
            "ใช้เฉพาะปีที่ต้นทางมีค่า ไม่เติมช่องว่าง. วัดการศึกษาที่ผู้ใหญ่สะสมมาแล้วจากสำมะโนและแบบสำรวจที่ UNESCO UIS รวบรวม "
            "ไม่ใช่อัตราจบของนักเรียนในปีนั้น ไม่ใช่ enrollment แบบ gross และไม่ใช่หลักฐานว่านโยบายรัฐบาลเดียวทำให้จบมากขึ้น "
            "ค่าสูงหมายถึงสัดส่วนผู้ใหญ่ที่จบถึงระดับดังกล่าวสูงขึ้น ไม่ยืนยันคุณภาพการเรียนรู้ การจัดระดับวุฒิและระบบสำรวจอาจเปลี่ยนตามเวลา "
            "นิยามและที่มา: https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SE.SEC.CUAT.UP.ZS ."
        ),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", default=datetime.now(ZoneInfo("Asia/Bangkok")).date().isoformat())
    parser.add_argument("--patch", action="store_true", help="Emit patch for apply_patch; never writes files")
    args = parser.parse_args()
    as_of = date.fromisoformat(args.as_of)
    slugs = list(dict.fromkeys(spec["slug"] for spec in SPECS))
    with ThreadPoolExecutor(max_workers=4) as pool:
        charts = dict(zip(slugs, pool.map(fetch_chart, slugs)))
    indicators = [build_indicator(spec, charts[spec["slug"]], as_of) for spec in SPECS]
    indicators.append(build_attainment(as_of))
    data = {"asOf": as_of.isoformat(), "indicators": indicators}
    content = json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if not args.patch:
        print(content, end="")
        return
    path = Path(__file__).resolve().parents[1] / "src/data/extended-indicators.json"
    print("*** Begin Patch")
    if path.exists():
        old = path.read_text(encoding="utf-8")
        if old == content:
            print("*** End Patch")
            return
        print(f"*** Update File: {path}\n@@")
        for line in old.splitlines():
            print("-" + line)
    else:
        print(f"*** Add File: {path}")
    for line in content.splitlines():
        print("+" + line)
    print("*** End Patch")


if __name__ == "__main__":
    main()
