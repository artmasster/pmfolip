# PMfolio: ข้อมูลสังคมและประวัติศาสตร์เพิ่มเติม

สถานะ: active · เจ้าของที่มาและขั้นตอนของ `extended-indicators.json` · ตรวจ snapshot วันที่ 3 ตุลาคม 2026

## ขอบเขตและข้อจำกัด

ข้อมูลเพิ่มเติมนี้ช่วยให้ยุคก่อน World Bank WDI และด้านการศึกษามีหลักฐานมากขึ้น แต่ไม่เปลี่ยนปีที่ไม่มีข้อมูลให้เป็นศูนย์ และไม่สร้างคะแนนบุคคลจากคำบรรยายทางประวัติศาสตร์ กฎปีที่ใช้และวิธีแปลงค่าระดับประเทศเป็นดัชนีอยู่ใน [methodology.md](methodology.md) ค่าที่ได้เป็นผลลัพธ์ระดับประเทศ/สถาบันในช่วงปีอ้างอิง ไม่ใช่หลักฐานเชิงเหตุและผลของนายกรัฐมนตรี

ข้อมูลก่อนปี 1932 ไม่ได้ใส่ใน snapshot เพื่อให้ช่วงอ้างอิงเริ่มตั้งแต่มีตำแหน่งนายกรัฐมนตรีไทย ทุกชุดแยก `id`, หน่วย และแหล่งข้อมูล ไม่มีการนำตัวเลขของคนละชุดมาต่อท้ายอนุกรม World Bank เดิม

`scoreFamily` รวมอนุกรมที่ใช้แทนกันในมิติเดียว ส่วน `scorePriority` เลือกชุดที่เหมาะกว่าเมื่อมีข้อมูลพอหลายชุด การเทียบ VS ต้องใช้ตัวชี้วัดเดียวกันที่ทั้งสองคนมีข้อมูลจริง ห้ามเอาค่า UNDP ของคนหนึ่งไปเทียบตรงกับ Lee–Lee ของอีกคนเพียงเพราะหน่วยเป็นปีเหมือนกัน

## Coverage ที่ตรวจแล้ว

| ตัวชี้วัด | ปีไทยใน snapshot | จำนวนค่า | ลักษณะข้อมูล |
|---|---|---:|---|
| V-Dem ประชาธิปไตยด้านการเลือกตั้ง | 1932–2025 ทุกปี | 94 | ค่าประมาณจากผู้เชี่ยวชาญและแบบจำลอง |
| อายุคาดเฉลี่ย ชุดประวัติศาสตร์ | 1937, 1941, 1947, 1948 และ 1950–2023 ทุกปี | 78 | ค่าประมาณประวัติศาสตร์ / UN WPP |
| ปีการศึกษาเฉลี่ย อายุ 15–64 Lee–Lee | 1935–2010 ทุก 5 ปี | 16 | ค่าประมาณประวัติศาสตร์ ไม่ใช่สำรวจรายปี |
| ปีการศึกษาเฉลี่ย อายุ 25 ปีขึ้นไป UNDP | 1990–2023 ทุกปี | 34 | ชุดคำนวณจากข้อมูลสำมะโน/สำรวจ รวมค่าประมาณต้นทาง |
| ปีการศึกษาที่คาดหมาย UNDP | 1990–2023 ทุกปี | 34 | ค่าคาดหมายตามอัตราเข้าเรียนในปีนั้น ใช้เป็นบริบท |
| จบอย่างน้อยมัธยมปลาย อายุ 25 ปีขึ้นไป UIS/WDI | 1970, 1980, 2000, 2004, 2006, 2007, 2010 และ 2013–2024 | 19 | สัดส่วนผู้ใหญ่ที่จบถึงระดับนี้จากสำมะโน/สำรวจ |

จำนวน “ปีที่มีค่า” ไม่ใช่จำนวนการสำรวจอิสระ การประมาณในแหล่งต้นทางอาจใช้ข้อมูลหลายปีร่วมกัน PMfolio คัดตามป้ายปีที่ผู้ผลิตเผยแพร่และไม่ได้สร้างค่าเอง

## แหล่งข้อมูลและความหมาย

### ประชาธิปไตยด้านการเลือกตั้ง

ใช้ [V-Dem Country-Year v16 (2026)](https://www.v-dem.net/data/the-v-dem-dataset/) รหัส `v2x_polyarchy` ผ่าน [OWID Electoral democracy index](https://ourworldindata.org/grapher/electoral-democracy-index) ค่าจริงอยู่ระหว่าง 0–1 ค่าสูงสื่อถึงองค์ประกอบด้านสิทธิเลือกตั้งและการแข่งขันทางการเมืองตามนิยามของผู้ผลิต ไม่ครอบคลุมธรรมาภิบาลทุกมิติ

ชุดนี้อาศัยการประเมินผู้เชี่ยวชาญและแบบจำลอง มีความไม่แน่นอน ไม่ใช่การนับเหตุการณ์โดยตรง Snapshot นี้เก็บค่ากลางเท่านั้น จึงไม่รายงานว่าความต่างเล็กน้อยมีนัยสำคัญ ใช้ v16 ทั้งอนุกรม ไม่ผสมค่าจากรุ่นอื่น เพราะผู้ผลิตปรับทั้งวิธีและค่าประวัติศาสตร์ได้

ให้เครดิต **Coppedge et al. (2026), V-Dem Dataset v16, [doi:10.23696/vdemds26](https://doi.org/10.23696/vdemds26)** และ OWID ข้อมูล V-Dem ที่นำมาใช้ รวมถึงค่าดัชนีที่คำนวณจากชุดนี้ เผยแพร่ตาม [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) ตาม [เงื่อนไขผู้ผลิต](https://www.v-dem.net/data/the-v-dem-dataset/) ใส่เครดิตและเงื่อนไขใน `source`/`notes` ซึ่งหน้าเว็บต้องแสดง

`scoreFamily=civic-rights`, priority 10 ใช้เป็นทางเลือกย้อนหลังของการมีส่วนร่วมและสิทธิ ส่วน WGI Voice and Accountability ใช้คำนิยามต่างกันและแยกอนุกรมเสมอ

### อายุคาดเฉลี่ยประวัติศาสตร์

[OWID Life expectancy](https://ourworldindata.org/grapher/life-expectancy) รวมชุดประวัติศาสตร์ก่อนปี 1950 กับ [UN World Population Prospects 2024](https://population.un.org/wpp/downloads/) ตั้งแต่ปี 1950 เป็นต้นมา ดูที่มารายจุดใน [ตารางแหล่งข้อมูลที่ OWID ระบุ](https://docs.google.com/spreadsheets/d/1LnrU1V3p2wq7sAPY4AHRdH1urol3cKev7prEvlLfSU4/edit?gid=0#gid=0) และ [Zijdeman et al., Clio Infra](https://clio-infra.eu/Indicators/LifeExpectancyatBirthTotal.html)

ตรวจตารางที่มารายจุดแล้ว: ไทย 1937, 1941, 1947 และ 1948 มาจาก Zijdeman et al. ทั้งสี่ค่า ตรงกับ CSV ของ OWID ส่วนปี 1950 ขึ้นไปมาจาก UN WPP; เก็บความละเอียดค่าจาก CSV ไม่ใช้ค่าปัดเศษในตารางแหล่งข้อมูล

ช่วงต้นของไทยมีข้อมูลห่างกันและมีการเปลี่ยนวิธีประมาณ การเปลี่ยนค่าข้ามปีห่างหรือรอยต่อแหล่งข้อมูลจึงไม่ใช่ผลของนโยบายที่ยืนยันแล้ว ไม่เติม 1932–1936, 1938–1940, 1942–1946 หรือ 1949 ข้อมูลหลัง 2023 ที่เป็นค่าคาดการณ์ไม่ได้ใช้

`scoreFamily=life-expectancy`, priority 10 ชุด WDI เดิมมี priority สูงกว่าเพื่อไม่ให้อายุขัยนับน้ำหนักสองครั้งเมื่อทั้งสองชุดใช้ได้ ตัวเลขเดิมยังเปิดดูได้ตามชื่ออนุกรม

### จำนวนปีการศึกษาสะสม

[OWID ชุดประวัติศาสตร์](https://ourworldindata.org/grapher/mean-years-of-schooling-long-run) ใช้ **Lee, Jong-Wha and Hanol Lee (2016), Human Capital in the Long Run, Journal of Development Economics 122, 147–169** ข้อมูลต้นฉบับและช่วงอายุอยู่ที่ [Lee–Lee Long-Run Education Dataset](https://barrolee.github.io/BarroLeeDataSet/DataLeeLee.html)

ใช้เฉพาะค่าประมาณย้อนหลังถึง 2010 ชุดดาวน์โหลดของ OWID มีค่าคาดการณ์ Barro–Lee ตั้งแต่ 2015 ด้วย สคริปต์ตัดส่วนนี้ออก ไม่ถือเป็นผลงานที่เกิดขึ้นจริงของรัฐบาลหลังปี 2015 ข้อมูลมีทุก 5 ปี จึงยังมีหลายวาระที่ไม่ตรงกับปีข้อมูล

[UNDP Human Development Report 2025](https://hdr.undp.org/data-center/documentation-and-downloads) มี mean years of schooling ของอายุ 25 ปีขึ้นไป ใช้ผ่าน [OWID schooling dataset](https://ourworldindata.org/grapher/average-schooling-vs-expected-schooling) เพื่อเพิ่มช่วงหลัง 2015 ค่ารายปีบางช่วงผ่านการประมาณของแหล่งต้นทาง จึงไม่เรียกว่ามีการสำรวจใหม่ทุกปี

ทั้งสองชุดวัดการศึกษาสะสมและมีผลจากหลายรัฐบาลก่อนหน้า กลุ่มอายุต่างกันจึงไม่ต่อเป็นอนุกรมเดียว `scoreFamily=education-attainment`; Lee–Lee priority 10, UNDP priority 20 ค่าสูงแปลว่าเรียนสะสมหลายปีขึ้น ไม่ใช่คะแนนคุณภาพหรือผลสัมฤทธิ์การเรียน

UNDP expected years of schooling เป็นอีกตัวชี้วัด แสดงเป็นบริบทเท่านั้น เพราะรวมปีซ้ำชั้นและโครงสร้างหลักสูตร จำนวนปีคาดหมายสูงกว่าไม่ได้ดีขึ้นทุกกรณี

### การจบมัธยมปลายของผู้ใหญ่

[World Bank WDI `SE.SEC.CUAT.UP.ZS`](https://data.worldbank.org/indicator/SE.SEC.CUAT.UP.ZS?locations=TH) รับข้อมูลจาก UNESCO Institute for Statistics วัดประชากรอายุ 25 ปีขึ้นไปที่จบอย่างน้อยมัธยมปลายตาม [นิยามและวิธีเก็บข้อมูล](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SE.SEC.CUAT.UP.ZS)

เป็นสัดส่วนการศึกษาที่ผู้ใหญ่สะสมมา ไม่ใช่อัตราจบของเด็กรุ่นปัจจุบันและไม่ใช่ gross enrollment ค่าสูงหมายถึงผู้ใหญ่จบถึงระดับนั้นมากขึ้น แต่ไม่ยืนยันคุณภาพการเรียนรู้ ชุดนี้แยก `scoreFamily=education-completion` จากจำนวนปีเรียนเพราะหน่วยและความหมายต่างกัน

## ดาวน์โหลดซ้ำและตรวจสอบ

เจ้าของข้อมูลคือ [extended-indicators.json](../src/data/extended-indicators.json) ดึงด้วย [fetch-extended-indicators.py](../scripts/fetch-extended-indicators.py) ผ่าน [OWID Chart API](https://docs.owid.io/projects/etl/api/chart-api/) และ World Bank API ตัว script ใช้ checked WDI client ของ `fetch-indicators.py` ซ้ำ

```bash
python3 scripts/fetch-extended-indicators.py --as-of 2026-10-03
python3 scripts/fetch-extended-indicators.py --as-of 2026-10-03 --patch
```

ทั้งสองคำสั่งพิมพ์ stdout โดยไม่เขียนไฟล์ คำสั่งหลังใช้ส่งเข้า apply_patch หลังตรวจเนื้อหา สคริปต์ตรวจประเทศ ชื่อชุด รหัส metadata รุ่นแหล่งข้อมูล ปีซ้ำ ขอบเขตค่าที่เป็นไปได้ และวันอัปเดต หลังใช้แพตช์ให้ทำ release checks ตาม [development.md](development.md)

ไม่เปลี่ยน `--as-of` เพื่อแสร้งว่าได้ data vintage เก่า สคริปต์ปฏิเสธ source update ที่ใหม่กว่าวันร้องขอ แต่บริการต้นทางอาจปรับข้อมูลย้อนหลังอยู่เสมอ จึงต้องเก็บ snapshot ที่ใช้เผยแพร่จริงพร้อมวันที่
