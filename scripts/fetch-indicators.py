#!/usr/bin/env python3
"""Fetch the exact public World Bank series used by PMfolio.

No credentials, dependencies, interpolation, cached fallback, or file writes.
Print JSON by default; --patch prints an apply_patch-compatible patch for review.
Run from any directory. API failures abort the whole snapshot.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime
import json
import math
from pathlib import Path
import sys
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


CATEGORIES = {
    "economy": "เศรษฐกิจและรายได้",
    "fiscal": "การคลัง",
    "trade": "การค้า",
    "education": "การศึกษา",
    "health": "สุขภาพ",
    "equity": "ความเหลื่อมล้ำ",
    "infrastructure": "โครงสร้างพื้นฐาน",
    "environment": "สิ่งแวดล้อม",
    "governance": "ธรรมาภิบาลและสิทธิ",
}


def spec(id, category, code, name, description, unit, unit_label, direction, notes,
         *, scorable=True, world=False, source_id=2, uncertainty=False):
    return {
        "id": id, "category": category, "code": code, "name": name,
        "description": description, "unit": unit, "unitLabel": unit_label,
        "direction": direction, "notes": notes, "scorable": scorable,
        "world": world, "source_id": source_id, "uncertainty": uncertainty,
    }


SPECS = [
    spec("gdp-growth", "economy", "NY.GDP.MKTP.KD.ZG", "GDP เติบโตจริง",
         "การเปลี่ยนแปลงมูลค่าผลผลิตสินค้าและบริการทั้งประเทศหลังปรับราคา",
         "%", "% ต่อปี", "higher",
         "เป็น real growth ไม่ใช่มูลค่าเงินบาทหรือรายได้ของทุกครัวเรือน การฟื้นจากฐานต่ำและวิกฤตโลกส่งผลต่ออัตราเติบโต ใช้ราคาคงที่ตามบัญชีประชาชาติ; benchmark คืออัตราเติบโตของโลกในปีเดียวกัน ไม่ใช่กลุ่มควบคุมเชิงเหตุและผล.", world=True),
    spec("gdp-per-capita-growth", "economy", "NY.GDP.PCAP.KD.ZG", "GDP ต่อคนเติบโตจริง",
         "การเปลี่ยนแปลงผลผลิตจริงต่อประชากรหนึ่งคน",
         "%", "% ต่อปี", "higher",
         "ไม่ใช่ค่าจ้างเฉลี่ยหรือรายได้ครัวเรือน และไม่ได้บอกการกระจายรายได้ ใช้ควบคู่กับ Gini และความยากจน; GDP และ GDP ต่อคนสัมพันธ์กันสูง จึงไม่ควรนับเป็นหลักฐานอิสระสองชิ้น.", world=True),
    spec("government-debt", "fiscal", "GC.DOD.TOTL.GD.ZS", "หนี้รัฐบาลกลางต่อ GDP",
         "ยอดหนี้คงค้างของรัฐบาลกลางเทียบขนาดเศรษฐกิจ",
         "%", "% ของ GDP", "context",
         "ขอบเขต central government ไม่เท่ากับหนี้สาธารณะทั้งหมดของไทย เป็น stock ณ วันอ้างอิงซึ่งมักเป็นสิ้นปีงบประมาณ การเพิ่มหนี้อาจรองรับวิกฤตหรือลงทุนระยะยาว จึงไม่ให้คะแนนว่าต่ำดีสูงแย่; การจับกับปีปฏิทินเป็นเพียงการจัดหมวดปีอ้างอิง.", scorable=False),
    spec("tax-revenue", "fiscal", "GC.TAX.TOTL.GD.ZS", "รายได้ภาษีต่อ GDP",
         "ภาษีที่รัฐบาลจัดเก็บเทียบกับผลผลิตของประเทศ",
         "%", "% ของ GDP", "context",
         "รายได้ภาษีไม่รวมเงินสมทบประกันสังคมส่วนใหญ่ ขอบเขตบัญชีรัฐบาลและปีงบประมาณต้องอ่านร่วมกับแหล่งข้อมูล ค่าสูงอาจสะท้อนทั้งศักยภาพจัดเก็บและภาระภาษี จึงใช้เป็นบริบทไม่ให้คะแนน.", scorable=False),
    spec("exports-growth", "trade", "NE.EXP.GNFS.KD.ZG", "ส่งออกเติบโตจริง",
         "การเติบโตของการส่งออกสินค้าและบริการหลังปรับราคา",
         "%", "% ต่อปี", "higher",
         "รวมบริการ เช่น การท่องเที่ยว ไม่ใช่เฉพาะยอดศุลกากร เงินเฟ้อถูกปรับด้วยราคาคงที่ แต่เศรษฐกิจคู่ค้า อัตราแลกเปลี่ยน และฐานปีวิกฤตยังมีผล; benchmark โลกมีไว้ให้เห็นบริบท.", world=True),
    spec("lower-secondary-completion", "education", "SE.SEC.CMPT.LO.ZS", "จบมัธยมต้น (ตัวชี้วัดแทน)",
         "อัตราผู้เข้าเรียนชั้นปีสุดท้ายของมัธยมต้นเทียบประชากรวัยอ้างอิง",
         "%", "% ของประชากรวัยอ้างอิง", "context",
         "ชื่อ official คือ lower secondary completion แต่คำนวณจากผู้เข้าเรียนปีสุดท้ายครั้งแรก ไม่ใช่จำนวนผู้สอบจบจริง อาจเกิน 100% เพราะผู้เรียนต่างวัย ไม่วัดคุณภาพการเรียนรู้ ปีอ้างอิงเป็นปีการศึกษาที่สิ้นสุด และข้อมูลไทยขาดหลายปี. แสดงเป็นบริบทไม่ให้คะแนน เพราะอัตรา gross ที่สูงเกิน 100% ไม่ได้หมายถึงผลลัพธ์ดีกว่าเสมอ.", scorable=False, world=True),
    spec("secondary-enrollment", "education", "SE.SEC.ENRR", "เข้าเรียนมัธยม (อัตรารวม)",
         "ผู้เรียนมัธยมทุกวัยเทียบจำนวนประชากรในวัยมัธยม",
         "%", "% อัตรารวม", "context",
         "อัตรา gross รวมผู้เรียนอายุต่ำหรือเกินเกณฑ์ จึงอาจเกิน 100% และไม่บอกการมาเรียนจริง การเรียนจบ หรือคุณภาพการเรียนรู้ ค่าสูงมากอาจเกี่ยวกับการเรียนซ้ำ จึงไม่แปลงเป็นคะแนน.", scorable=False, world=True),
    spec("secondary-net-enrollment", "education", "SE.SEC.NENR", "เข้าเรียนมัธยมตรงวัย (อัตราสุทธิ)",
         "ผู้เรียนมัธยมที่มีอายุตามเกณฑ์เทียบประชากรในวัยมัธยมทั้งหมด",
         "%", "% ของประชากรวัยมัธยม", "higher",
         "อัตรา net ไม่นับผู้เรียนต่ำหรือเกินวัย จึงใช้เป็นดัชนีการเข้าถึงตามวัย ไม่ใช่คุณภาพการเรียนรู้ การมาเรียนจริง หรือโอกาสเรียนจบ. ชุดไทยมีข้อมูลเพียง 11 ปีและสิ้นสุดในปี 2015 ตาม snapshot นี้ ไม่ใช้ข้อมูลเก่าต่อคะแนนให้วาระที่ใหม่กว่า และไม่ใช้ gross enrollment หรือ completion proxy มาเติมปีที่หายไป. ปีอ้างอิงเป็นปีการศึกษาตามนิยาม UNESCO UIS.", world=True),
    spec("life-expectancy", "health", "SP.DYN.LE00.IN", "อายุคาดเฉลี่ยเมื่อแรกเกิด",
         "อายุที่ทารกแรกเกิดคาดว่าจะมีชีวิตตามแบบแผนการตายในปีอ้างอิง",
         "years", "ปี", "higher",
         "เป็นค่าประมาณทางประชากรศาสตร์ ไม่ใช่อายุเฉลี่ยของผู้เสียชีวิตในปีนั้น ได้รับผลจากระบบสุขภาพสะสม รายได้ พฤติกรรม และโรคระบาด ไม่สามารถยกผลให้นายกฯ ในปีนั้นเพียงคนเดียว และมีแนวโน้มระยะยาวที่เอื้อต่อยุคใหม่.", world=True),
    spec("infant-mortality", "health", "SP.DYN.IMRT.IN", "การเสียชีวิตทารก",
         "การเสียชีวิตก่อนอายุหนึ่งปีต่อการเกิดมีชีพหนึ่งพันคน",
         "per1000", "ต่อการเกิดมีชีพ 1,000 คน", "lower",
         "เป็นค่าประมาณที่รวมทะเบียนราษฎรและแบบจำลองจาก UN IGME ไม่ใช่การนับดิบเท่านั้น ผลของสุขภาพแม่และเด็กสะสมหลายรัฐบาล และมีการปรับข้อมูลย้อนหลัง.", world=True),
    spec("gini", "equity", "SI.POV.GINI", "ความเหลื่อมล้ำ Gini",
         "ดัชนีการกระจายรายได้หรือการบริโภคของประชากรตามชุดสำรวจ",
         "index", "ดัชนี 0–100", "lower",
         "0 หมายถึงเท่ากันทั้งหมด 100 หมายถึงกระจุกตัวสูงสุด เป็นข้อมูลสำรวจซึ่งไม่ได้มีทุกปี หากมีเพียงปีสำรวจเดียวจะแสดงป้ายข้อมูลปีเดียวและไม่ใช้สรุปแนวโน้ม ไม่ interpolate. วิธีสำรวจและฐานรายได้/การบริโภคอาจต่างกัน จึงไม่ใช่ความเหลื่อมล้ำของทรัพย์สินและไม่ใช่การประเมินการกระจายอำนาจ."),
    spec("national-poverty", "equity", "SI.POV.NAHC", "ประชากรใต้เส้นความยากจนไทย",
         "สัดส่วนประชากรที่อยู่ใต้เส้นความยากจนของประเทศ",
         "%", "% ของประชากร", "context",
         "ใช้เส้นความยากจนแห่งชาติ ไม่ใช่เกณฑ์ดอลลาร์ต่อวันและไม่สามารถเทียบตรงกับประเทศอื่น WDI แยกชุดที่เทียบกันได้ภายในประเทศจากชุดไม่เทียบกัน; PMfolio แสดงเป็นบริบทเพราะยังไม่ได้ตรวจสอบการเปลี่ยนฐานสำรวจรายวาระกับต้นทางไทยครบทุกปี.", scorable=False),
    spec("internet-use", "infrastructure", "IT.NET.USER.ZS", "ประชากรใช้อินเทอร์เน็ต",
         "สัดส่วนประชากรที่ใช้อินเทอร์เน็ตจากสถานที่ใดก็ได้",
         "%", "% ของประชากร", "higher",
         "โดยหลักนิยามคือใช้ในช่วงสามเดือนก่อนการสำรวจ ไม่ใช่จำนวนสมาชิกบรอดแบนด์หรือความเร็ว ความพร้อมของเทคโนโลยีเปลี่ยนตามยุคอย่างมาก และภาคเอกชนมีบทบาทสูง คะแนนระดับนี้จึงไม่ใช่ความสามารถส่วนตัวของนายกฯ.", world=True),
    spec("electricity-access", "infrastructure", "EG.ELC.ACCS.ZS", "ประชากรเข้าถึงไฟฟ้า",
         "สัดส่วนประชากรที่มีไฟฟ้าใช้ตามข้อมูลสำรวจและค่าประมาณของแหล่งข้อมูล",
         "%", "% ของประชากร", "higher",
         "ไม่บอกความต่อเนื่อง คุณภาพ หรือค่าไฟ เมื่อถึง 100% จะเกิดเพดานซึ่งไม่สะท้อนคุณภาพที่ดีขึ้นอีก ผลมาจากการลงทุนสะสมหลายทศวรรษ มีทั้งการสำรวจและการประมาณของแหล่งข้อมูล.", world=True),
    spec("pm25-exposure", "environment", "EN.ATM.PM25.MC.M3", "การสัมผัส PM2.5 เฉลี่ย",
         "ความเข้มข้นฝุ่น PM2.5 รายปีที่ถ่วงน้ำหนักตามจำนวนประชากร",
         "ug/m3", "µg/m³", "lower",
         "เป็นแบบจำลอง exposure จากดาวเทียม แบบจำลองบรรยากาศ และสถานีตรวจ ไม่ใช่ค่าเฉลี่ยสถานีไทยทั้งหมดหรือค่ารายวัน สภาพอากาศ ฝุ่นข้ามแดน และตำแหน่งประชากรมีผล ใช้ GBD รุ่นปัจจุบันตาม WDI ซึ่งปรับย้อนหลังได้.", world=True),
    spec("co2-per-capita", "environment", "EN.GHG.CO2.PC.CE.AR5", "CO₂ ต่อประชากร",
         "การปล่อยคาร์บอนไดออกไซด์ต่อคน ไม่รวมการใช้ที่ดินและป่าไม้",
         "t/person", "ตัน CO₂e ต่อคน", "lower",
         "ไม่รวม LULUCF และไม่ใช่ก๊าซเรือนกระจกทุกชนิด การปล่อยต่ำอาจเกิดจากเศรษฐกิจหดตัวหรือโครงสร้างการผลิต ไม่ใช่นโยบายสิ่งแวดล้อมที่ดีเสมอ ต้องอ่านคู่ GDP และไม่ใช้เป็นข้อสรุปว่ารัฐบาลหนึ่งแก้โลกร้อนได้.", world=True),
    spec("voice-accountability", "governance", "GOV_WGI_VA.SC", "สิทธิและการตรวจสอบอำนาจ",
         "WGI Voice and Accountability: การมีส่วนร่วมทางการเมือง เสรีภาพการแสดงออก การรวมกลุ่ม และสื่อ",
         "index", "คะแนน WGI 0–100", "higher",
         "WGI 2026 update ใช้มาตรา absolute 0–100 และคำนวณประวัติย้อนหลังใหม่ เป็นค่าประมาณจากการรับรู้ของประชาชน ธุรกิจ และผู้เชี่ยวชาญ มีช่วงความเชื่อมั่น 90% ซึ่งเก็บใน uncertainty. ความต่างเล็กน้อยไม่ยืนยันนัยสำคัญทางสถิติ; ดัชนี 0–100 ที่ PMfolio คำนวณจาก percentile เป็นคนละค่ากับคะแนน WGI ดิบ.", source_id=3, uncertainty=True),
    spec("control-corruption", "governance", "GOV_WGI_CC.SC", "การควบคุมคอร์รัปชัน",
         "WGI Control of Corruption: การรับรู้เรื่องการใช้อำนาจรัฐเพื่อประโยชน์ส่วนตัว",
         "index", "คะแนน WGI 0–100", "higher",
         "WGI เป็นค่าประมาณจากหลายแหล่ง ไม่ใช่จำนวนคดีหรือข้อพิสูจน์ความผิดของบุคคล ใช้รุ่น 2026 update ทั้งอนุกรมโดยไม่ผสมรุ่นเก่า มีช่วงความเชื่อมั่น 90% ใน uncertainty; การเปลี่ยนคะแนนอาจมาจากข้อมูลแหล่งใหม่และการรับรู้ที่ช้ากว่านโยบาย.", source_id=3, uncertainty=True),
]


def api_url(country, code, source_id):
    query = urlencode({"format": "json", "per_page": 20000, "source": source_id})
    return f"https://api.worldbank.org/v2/country/{country}/indicator/{code}?{query}"


def fetch(country, code, source_id, as_of):
    url = api_url(country, code, source_id)
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "PMfolio/1.0 research data snapshot"})
            with urlopen(request, timeout=40) as response:
                payload = json.load(response)
            if not isinstance(payload, list) or len(payload) != 2:
                raise ValueError(f"Unexpected World Bank payload: {payload!r}")
            metadata, rows = payload
            if int(metadata.get("pages", 0)) > 1:
                raise ValueError("Pagination is not complete; refusing partial dataset")
            if metadata.get("sourceid") != str(source_id):
                raise ValueError("World Bank source mismatch")
            if metadata.get("lastupdated", "") > as_of.isoformat():
                raise ValueError("Source update is after the requested as-of date; historical vintage unavailable")
            values = []
            for row in rows or []:
                if row["indicator"]["id"] != code or row["countryiso3code"] != country:
                    raise ValueError("World Bank country/indicator mismatch")
                value = row["value"]
                year = int(row["date"])
                if value is None or year >= as_of.year:
                    continue
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
                    raise ValueError("Non-finite or nonnumeric observation")
                values.append({"year": year, "value": value})
            values.sort(key=lambda row: row["year"])
            if len({row["year"] for row in values}) != len(values):
                raise ValueError("Duplicate observation years")
            return values, metadata
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    raise AssertionError("unreachable")


def build_indicator(definition, as_of):
    code = definition["code"]
    source_id = definition["source_id"]
    values, metadata = fetch("THA", code, source_id, as_of)
    if not values:
        raise ValueError(f"No Thailand observations for {code}; do not silently publish an empty dataset")
    title = "World Bank · Worldwide Governance Indicators" if source_id == 3 else "World Bank · World Development Indicators"
    url = "https://www.worldbank.org/en/publication/worldwide-governance-indicators" if source_id == 3 else f"https://data.worldbank.org/indicator/{code}?locations=TH"
    item = {key: definition[key] for key in ("id", "category", "name", "description", "unit", "unitLabel", "direction", "scorable")}
    item["categoryLabel"] = CATEGORIES[definition["category"]]
    item["source"] = {"title": title, "url": url, "code": code,
                      "apiUrl": api_url("THA", code, source_id),
                      "lastUpdated": metadata.get("lastupdated")}
    item["values"] = values
    item["notes"] = f"ข้อมูลไทย {len(values)} ปีที่มีค่า ระหว่าง {values[0]['year']}–{values[-1]['year']}; ปีที่ไม่มีค่าไม่ได้เติมข้อมูล. " + definition["notes"]
    if definition["world"]:
        benchmark, _ = fetch("WLD", code, source_id, as_of)
        if benchmark:
            item["benchmark"] = benchmark
            item["notes"] += " benchmark คือค่ารวม World (WLD) ของ World Bank ในหน่วยเดียวกัน ไม่ใช่ค่าเฉลี่ยแบบให้น้ำหนักทุกประเทศเท่ากัน."
    if definition["uncertainty"]:
        lower, _ = fetch("THA", code + "_LB", source_id, as_of)
        upper, _ = fetch("THA", code + "_UB", source_id, as_of)
        lower_map = {point["year"]: point["value"] for point in lower}
        upper_map = {point["year"]: point["value"] for point in upper}
        if set(lower_map) != {point["year"] for point in values} or set(upper_map) != set(lower_map):
            raise ValueError("WGI confidence bounds have incomplete years")
        item["uncertainty"] = []
        for point in values:
            year = point["year"]
            low, high = lower_map[year], upper_map[year]
            if not low <= point["value"] <= high:
                raise ValueError("WGI estimate is outside source confidence bounds")
            item["uncertainty"].append({"year": year, "lower": low, "upper": high})
    print(f"{item['id']}: {len(values)} years, {values[0]['year']}–{values[-1]['year']}", file=sys.stderr)
    return item


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", default=datetime.now(ZoneInfo("Asia/Bangkok")).date().isoformat(), help="Snapshot date (default Asia/Bangkok); cannot reconstruct an old data vintage")
    parser.add_argument("--patch", action="store_true", help="Emit apply_patch text instead of JSON")
    args = parser.parse_args()
    as_of = date.fromisoformat(args.as_of)
    with ThreadPoolExecutor(max_workers=5) as executor:
        indicators = list(executor.map(lambda definition: build_indicator(definition, as_of), SPECS))
    snapshot = {"asOf": as_of.isoformat(), "indicators": indicators}
    content = json.dumps(snapshot, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    if not args.patch:
        print(content, end="")
        return
    target = Path(__file__).resolve().parents[1] / "src/data/indicators.json"
    print("*** Begin Patch")
    if target.exists():
        old = target.read_text(encoding="utf-8")
        if old == content:
            print("*** End Patch")
            return
        print(f"*** Update File: {target}")
        print("@@")
        for line in old.splitlines():
            print("-" + line)
    else:
        print(f"*** Add File: {target}")
    for line in content.splitlines():
        print("+" + line)
    print("*** End Patch")


if __name__ == "__main__":
    main()
