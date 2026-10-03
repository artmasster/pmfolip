#!/usr/bin/env python3
"""Extract Thailand's historical GDP from the official, pinned MPD 2023 workbook.

Standard-library only. No credentials, interpolation, or file writes.
Print JSON, or --patch for review and application through apply_patch.
The workbook's original country sources are retained in the published notes.
"""

from __future__ import annotations

import argparse
from datetime import date, datetime
import hashlib
import io
import json
import math
from pathlib import Path, PurePosixPath
import sys
import time
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from zipfile import ZipFile
from zoneinfo import ZoneInfo


WORKBOOK_URL = "https://dataverse.nl/api/access/datafile/421302"
DATASET_URL = "https://doi.org/10.34894/INZBF2"
METADATA_URL = "https://dataverse.nl/api/datasets/:persistentId/?persistentId=doi:10.34894/INZBF2"
RELEASE_DATE = "2024-04-26"
WORKBOOK_SHA1 = "1480521f602fbd5df64e108867ac971caa00ed1a"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RELATIONSHIP_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_NS = "http://schemas.openxmlformats.org/package/2006/relationships"


def download(url):
    for attempt in range(3):
        try:
            request = Request(url, headers={"User-Agent": "PMfolio/1.0 historical research snapshot"})
            with urlopen(request, timeout=60) as response:
                return response.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    raise AssertionError("unreachable")


def worksheet_rows(archive, path, strings):
    """Read cached values, without executing workbook formulas or extracting files."""
    root = ET.fromstring(archive.read(path))
    for row in root.findall(".//s:row", NS):
        result = {}
        for cell in row.findall("s:c", NS):
            value = cell.find("s:v", NS)
            if value is None or value.text is None:
                continue
            column = "".join(char for char in cell.attrib["r"] if char.isalpha())
            result[column] = strings[int(value.text)] if cell.get("t") == "s" else value.text
        yield result


def extract_gdp(workbook):
    if hashlib.sha1(workbook).hexdigest() != WORKBOOK_SHA1:
        raise ValueError("MPD workbook checksum changed; review the source revision before publication")
    with ZipFile(io.BytesIO(workbook)) as archive:
        strings = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        relations = {
            element.attrib["Id"]: element.attrib["Target"]
            for element in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
            if element.tag == f"{{{PACKAGE_NS}}}Relationship"
        }
        sheets = {}
        for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", NS):
            target = relations[sheet.attrib[f"{{{RELATIONSHIP_NS}}}id"]]
            sheets[sheet.attrib["name"]] = str(PurePosixPath("xl") / target)
        rows = list(worksheet_rows(archive, sheets["GDPpc"], strings))
        if rows[0].get("A") != "GDP pc 2011 prices":
            raise ValueError("Unexpected MPD GDP unit/header")
        columns = [key for key, value in rows[2].items() if value == "THA"]
        if len(columns) != 1 or rows[0].get(columns[0]) != "Thailand":
            raise ValueError("Expected exactly one Thailand GDP column")
        thai_column = columns[0]
        values = []
        for row in rows[3:]:
            if thai_column not in row:
                continue
            year, value = int(row["A"]), float(row[thai_column])
            if not math.isfinite(value) or value <= 0:
                raise ValueError("GDP level must be positive and finite")
            if year >= 1913:
                values.append({"year": year, "value": value})
        values.sort(key=lambda point: point["year"])
        expected_years = [1913, 1929, 1938, *range(1950, 2023)]
        if [point["year"] for point in values] != expected_years:
            raise ValueError("Unexpected Thailand coverage; do not fill sparse historical years")
        original_sources = list(worksheet_rows(archive, sheets["Maddison original sources"], strings))
        thai_start = next(index for index, row in enumerate(original_sources) if row.get("A") == "THA")
        thai_references = original_sources[thai_start:thai_start + 3]
        if not any("Sompop Manarungsan" in row.get("C", "") and "1900-50" == row.get("B") for row in thai_references):
            raise ValueError("Missing original Thailand source attribution")
        return values


def build_indicators(values):
    source = {
        "title": "Groningen Growth and Development Centre · Maddison Project Database 2023",
        "url": DATASET_URL,
        "code": "MPD2023.THA.gdppc",
        "apiUrl": WORKBOOK_URL,
        "lastUpdated": RELEASE_DATE,
    }
    attribution = (
        "ที่มา: Bolt และ van Zanden (2024), Maddison Project Database 2023, doi:10.34894/INZBF2; "
        "บทความวิธีวิจัย doi:10.1111/joes.12618. ข้อมูลไทยช่วง 1900–1950 อ้าง "
        "Sompop Manarungsan (1989), Economic Development of Thailand, 1850–1950, "
        "วิทยานิพนธ์ University of Groningen ตามแผ่น Maddison original sources; "
        "ช่วงล่าสุดของ MPD ใช้ Total Economy Database และ UN National Accounts ตามแผ่น Sources. "
        "ใช้ภายใต้ CC BY 4.0; PMfolio คัดเฉพาะไทยและคำนวณ growth เองตามสูตรที่เปิดเผย."
    )
    common = {
        "category": "economy", "categoryLabel": "เศรษฐกิจและรายได้",
    }
    level = {
        **common,
        "id": "historical-gdp-per-capita",
        "name": "GDP ต่อคน PPP (ประมาณการย้อนหลัง)",
        "description": "ระดับผลผลิตจริงต่อประชากรในดอลลาร์สากลราคาปี 2011 จาก Maddison Project แยกจาก GDP growth ของ World Bank",
        "unit": "int$/person", "unitLabel": "ดอลลาร์สากลปี 2011 ต่อคน",
        "direction": "context", "scorable": False,
        "source": source, "values": values,
        "notes": (
            "มีข้อมูล 1913, 1929, 1938 และทุกปี 1950–2022 เท่านั้น; 1913/1929 เป็นบริบทก่อนมีนายกรัฐมนตรี "
            "ไม่เติมปีระหว่างจุดประเมินและไม่ลากค่าไปยังวาระอื่น. เป็น historical reconstruction "
            "ที่อาศัยบัญชีประชาชาติและการประมาณ PPP ของนักวิจัย ไม่ใช่การสำรวจรายได้ครัวเรือนทุกปี "
            "ไม่ใช่ค่าจ้างหรือรายได้ที่นายกฯ สร้างขึ้น. ระดับ GDP นี้ไม่ใช่อัตราเติบโต และใช้เป็นบริบทไม่ให้คะแนน. "
            + attribution
        ),
    }
    by_year = {point["year"]: point["value"] for point in values}
    growth_values = [
        {"year": year, "value": (value / by_year[year - 1] - 1) * 100}
        for year, value in sorted(by_year.items()) if year - 1 in by_year
    ]
    growth = {
        **common,
        "id": "historical-gdp-per-capita-growth",
        "name": "GDP ต่อคนเติบโตจริง (Maddison)",
        "description": "อัตราเปลี่ยนแปลงรายปีที่คำนวณจากระดับ GDP ต่อคน PPP สองปีติดกันใน Maddison Project 2023",
        "unit": "%", "unitLabel": "% ต่อปี", "direction": "higher", "scorable": True,
        "scoreFamily": "gdp-per-capita-growth", "scorePriority": 10,
        "source": {**source, "code": "MPD2023.THA.gdppc.annual_growth"},
        "values": growth_values,
        "notes": (
            "PMfolio คำนวณ (GDP ต่อคนปี t / GDP ต่อคนปี t−1 − 1) × 100 จากค่าต้นทางสองปีที่ติดกันจริงเท่านั้น "
            "ได้ปี 1951–2022 ไม่คำนวณ growth ข้ามช่องว่าง 1929→1938 หรือ 1938→1950. "
            "GDP ต้นทางเป็นค่าประมาณย้อนหลัง มีข้อจำกัดจากการสร้างบัญชีประวัติศาสตร์และการเชื่อม PPP benchmark "
            "จึงไม่ใช่การวัดภาคสนามครบทุกปีและอาจต่างจากบัญชีประชาชาติ WDI. "
            "แยกอนุกรมจาก WDI; เมื่อวาระมี WDI GDP ต่อคน growth เข้าเกณฑ์ ใช้ WDI ในคะแนนแทน "
            "เพื่อไม่นับผลผลิตต่อคนซ้ำสองแหล่ง. ไม่ใช่รายได้ทุกครัวเรือนและไม่พิสูจน์ผลของนโยบาย. "
            + attribution
        ),
    }
    return [level, growth]


def emit(content, patch):
    if not patch:
        print(content, end="")
        return
    target = Path(__file__).resolve().parents[1] / "src/data/historical-indicators.json"
    print("*** Begin Patch")
    if target.exists():
        old = target.read_text(encoding="utf-8")
        if old == content:
            print("*** End Patch")
            return
        print(f"*** Update File: {target}\n@@")
        for line in old.splitlines():
            print("-" + line)
    else:
        print(f"*** Add File: {target}")
    for line in content.splitlines():
        print("+" + line)
    print("*** End Patch")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", default=datetime.now(ZoneInfo("Asia/Bangkok")).date().isoformat())
    parser.add_argument("--patch", action="store_true")
    args = parser.parse_args()
    as_of = date.fromisoformat(args.as_of)
    if as_of < date.fromisoformat(RELEASE_DATE):
        raise ValueError("MPD 2023 was not published by the requested snapshot date")
    metadata = json.loads(download(METADATA_URL))["data"]["latestVersion"]
    if metadata.get("versionState") != "RELEASED":
        raise ValueError("Expected a released MPD dataset")
    file = next(item["dataFile"] for item in metadata["files"] if item["dataFile"]["id"] == 421302)
    if file.get("checksum") != {"type": "SHA-1", "value": WORKBOOK_SHA1}:
        raise ValueError("Dataverse checksum no longer matches the reviewed MPD release")
    indicators = build_indicators(extract_gdp(download(WORKBOOK_URL)))
    for indicator in indicators:
        indicator["values"] = [point for point in indicator["values"] if point["year"] < as_of.year]
        print(f"{indicator['id']}: {len(indicator['values'])} observations", file=sys.stderr)
    snapshot = {"asOf": as_of.isoformat(), "indicators": indicators}
    emit(json.dumps(snapshot, ensure_ascii=False, indent=2, allow_nan=False) + "\n", args.patch)


if __name__ == "__main__":
    main()
