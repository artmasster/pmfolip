# หลักฐานรายชื่อนายกรัฐมนตรีและภาพบุคคล

สถานะ: reference / ข้อมูลที่เผยแพร่ใน PMfolio  
ตรวจข้อมูล: 3 ตุลาคม 2569 (2026-10-03, Asia/Bangkok)  
เจ้าของข้อมูล: [leaders.json](../src/data/leaders.json)

## ขอบเขตรายชื่อ

มีนายกรัฐมนตรี 32 คนตามลำดับบุคคลในทำเนียบรัฐบาล เริ่มพระยามโนปกรณ์นิติธาดา และสิ้นสุดที่ผู้ดำรงตำแหน่งปัจจุบัน อนุทิน ชาญวีรกูล ณ วันตรวจข้อมูล ไม่สร้างลำดับคนใหม่ให้ผู้รักษาการหรือผู้นำคณะรัฐประหารที่ยังไม่ได้รับแต่งตั้งเป็นนายกรัฐมนตรี

ตรวจลำดับและช่วงเวลาจาก [สำนักเลขาธิการคณะรัฐมนตรี](https://www.soc.go.th/?page_id=8567), [ทะเบียนคณะรัฐมนตรี](https://www.soc.go.th/?page_id=182), [E-Museum รัฐบาลไทย](https://archives.thaigov.go.th/th/history/prime-minister) และตรวจเทียบช่วงผู้ดำรงตำแหน่งกับ [Wikipedia](https://en.wikipedia.org/wiki/List_of_prime_ministers_of_Thailand) ซึ่งใช้เป็นแหล่งตรวจเทียบ ไม่ใช่หลักฐานประเมินผลงานหลัก

แหล่งรัฐบาลบางหน้าให้ผล 403/timeout เมื่อดึงตรงด้วยสคริปต์ แต่ข้อมูลของหน้าเดียวกันอ่านได้จากผลค้นเว็บที่จัดทำดัชนีไว้ในวันที่ตรวจ หน้าใดอ้างจากผลค้นมีข้อจำกัดด้านการดึงเนื้อหาซ้ำ จึงคง URL ต้นทางไว้ให้ตรวจต่อ และไม่อ้างว่าได้เก็บเอกสารฉบับเต็มทุกหน้า

## ความหมายของช่วงเวลา

- `terms` คือช่วงต่อเนื่องของการดำรงตำแหน่งนายกรัฐมนตรี ไม่ใช่หมายเลขคณะรัฐมนตรีหรือจำนวนครั้งชนะเลือกตั้ง การแต่งตั้งซ้ำของบุคคลเดิมต่อเนื่องกันรวมเป็นช่วงเดียว
- `start` นับรวมวันเริ่ม ส่วน `end` เป็นขอบเขตวันสิ้นสุดแบบไม่นับวันนั้น (end exclusive) สำหรับการคำนวณ วันแต่งตั้งผู้รับตำแหน่งใหม่เป็นของผู้รับ ไม่ให้สองคนครองวันเดียวกัน
- ใช้วันประกาศแต่งตั้ง/วันที่เหตุการณ์ทำให้พ้นตำแหน่งเป็นขอบเขต ไม่ใช่วันถวายสัตย์ของคณะรัฐมนตรีหรือวันแถลงนโยบาย วันสิ้นสุดที่เก็บจึงเป็นวันเปลี่ยนผ่าน ไม่ใช่วันสุดท้ายที่นับเต็มวัน
- ถ้าแหล่งใดระบุเป็นวันสุดท้ายแบบนับรวมวัน ให้เลื่อนขอบเขตไปวันถัดไปก่อนนำเข้า เช่น ตาราง สลค. บางชุดระบุอานันท์ถึง 22 กันยายน 2535 และชวนถึง 8 กุมภาพันธ์ 2544; ข้อมูลนี้ใช้ 23 กันยายน 2535 และ 9 กุมภาพันธ์ 2544 ซึ่งเป็นวันแต่งตั้งผู้รับตำแหน่ง
- ความละเอียดระดับวันเป็นข้อตกลงเพื่อป้องกันวันซ้อน ไม่ใช่คำวินิจฉัยว่าสถานะทางกฎหมายเปลี่ยนเวลาใดในวันนั้น ห้ามใช้คำนวณอำนาจรายชั่วโมง
- `end: null` ใช้กับผู้ดำรงตำแหน่งปัจจุบัน และการคำนวณต้องตัด ณ `asOf`
- วันสั้นที่ไม่มีผู้ดำรงตำแหน่งตามขอบเขตนี้ปล่อยเป็นช่องว่าง ห้ามเติมให้คนข้างเคียงโดยอัตโนมัติ

แยกช่วงที่ไม่ต่อเนื่องของ ป. พิบูลสงคราม, ควง, เสนีย์, ถนอม, อานันท์ และชวน โดยถนอมแยกช่วง 17 พฤศจิกายน 2514 ถึง 18 ธันวาคม 2515 ซึ่งเป็นหัวหน้าคณะปฏิวัติออกจากตำแหน่งนายกรัฐมนตรี เช่นเดียวกับสฤษดิ์ก่อน 9 กุมภาพันธ์ 2502 และประยุทธ์ก่อน 24 สิงหาคม 2557

ช่วงที่ผู้ดำรงตำแหน่งหยุดปฏิบัติหน้าที่ชั่วคราว แต่ยังไม่พ้นจากตำแหน่ง ไม่ถูกตัดออกจาก `terms` เช่น ประยุทธ์ 24 สิงหาคมถึง 30 กันยายน 2565 และแพทองธารตั้งแต่ 1 กรกฎาคม 2568 จนพ้นตำแหน่ง 29 สิงหาคม 2568 ดังนั้นกราฟตามวาระไม่ควรสื่อว่าบุคคลนั้นปฏิบัติหน้าที่เองทุกวัน

จุดต่างของหลักฐานที่ตรวจแล้ว:

| กรณี | การใช้ในข้อมูล |
|---|---|
| พระยามโนปกรณ์ | ใช้วันรัฐประหาร 20 มิถุนายน 2476 เป็นขอบเขตสิ้นสุด แม้ตาราง สลค. บางหน้าใช้ 21 มิถุนายนซึ่งเป็นวันแต่งตั้งผู้รับตำแหน่ง |
| สุจินดา | ใช้วันลาออก 24 พฤษภาคม 2535 ไม่ลากถึง 10 มิถุนายนซึ่งมีผู้รักษาการระหว่างนั้น |
| สมชาย | เริ่ม 18 กันยายน 2551 ตามการแต่งตั้งนายกรัฐมนตรี ไม่รวมช่วงรักษาการ 9–18 กันยายน |
| แพทองธาร | ประกาศแต่งตั้งลงวันที่ 16 สิงหาคม 2567 แม้พิธีรับพระบรมราชโองการวันที่ 18 สิงหาคม |
| อนุทิน | เริ่ม 7 กันยายน 2568; การแต่งตั้งซ้ำประกาศลงวันที่ 19 มีนาคม 2569 และพิธีรับวันที่ 20 มีนาคม ไม่สร้างบุคคลหรือช่วงไม่ต่อเนื่องใหม่ |

`era` เป็นหมวดนำทางเชิงบรรณาธิการตามยุคที่เริ่มดำรงตำแหน่ง ไม่ใช่ข้อสรุปเรื่องประชาธิปไตยหรือคะแนนความสำเร็จ และไม่บังคับให้ปีที่บุคคลกลับมาดำรงตำแหน่งอยู่ในหมวดเดิมตามประวัติศาสตร์ทุกกรณี

## ขอบเขตประวัติและเหตุการณ์

`summary` และ `highlights` เป็นประวัติย่อ/ตัวอย่างนโยบายและบริบท ไม่ใช่บัญชีผลงานทั้งหมด ไม่ใช่หลักฐานเชิงสาเหตุ และไม่นำจำนวนรายการไปสร้างคะแนน ณ 2026-10-03 ทุกคนมีอย่างน้อยหนึ่งรายการที่เกินกว่าวันเข้ารับตำแหน่ง โดยบางรัฐบาลยุคเก่าหรือวาระสั้นใช้คำแถลงนโยบายและข้อจำกัดของภารกิจแทนการอ้างผลสำเร็จที่ยังไม่มีหลักฐานเพียงพอ

สถานะการวิจัยยังเป็นแฟ้มเริ่มต้นที่มีหลักฐาน ไม่ใช่งานประเมินผลทุกนโยบายครบทุกด้าน ตัวอย่างทวีมีหลักฐานภารกิจเปลี่ยนจากสงครามสู่สันติภาพ แต่ระยะ 17 วันไม่พอจะนำผลลัพธ์รายปีทั้งปีไปผูกกับรัฐบาลนั้น ส่วนธานินทร์มีคำแถลงเป้าหมายระยะ 4 ปี แต่พ้นตำแหน่งก่อน จึงห้ามแสดงเป้าหมายดังกล่าวเป็นผลสำเร็จจริง

แยกสามชนิดของข้อความเมื่อใช้ต่อ: (1) คำแถลงหรือเป้าหมาย เช่น นโยบายของทวี เสนีย์ พจน์ ธานินทร์ และอนุทิน (2) เหตุการณ์หรือการเปลี่ยนสถาบันที่เกิดแล้ว เช่น ธปท. สมาชิกภาพสหประชาชาติ ระบบสองสภา และกฎหมายนิรโทษกรรม และ (3) ผลลัพธ์เชิงปริมาณที่ต้องมีข้อมูลวัดต่างหาก ห้ามเปลี่ยนชนิด (1) หรือ (2) เป็นคะแนนประสิทธิผลโดยอัตโนมัติ

นโยบายที่ระบุว่าเริ่มหรือมีผลในวาระใดอาจมีผู้ริเริ่มจากรัฐบาลก่อนหน้า รัฐสภา หน่วยงานรัฐ และภาคประชาชนร่วมด้วย ตัวอย่างกฎหมายสมรสเท่าเทียมแยกวันที่มีผลในรัฐบาลแพทองธารออกจากการผลักดันกฎหมายหลายฝ่าย ส่วน AFTA ใช้บันทึกอาเซียนที่ระบุบทบาทข้อเสนอของอานันท์โดยตรง

หลักฐานด้านนโยบายและบริบทมาจาก WHO, กระทรวงศึกษาธิการ, กระทรวงแรงงาน, กระทรวงการต่างประเทศ, สำนักงานเศรษฐกิจการคลัง, สภาพัฒน์, ธนาคารแห่งประเทศไทย, อาเซียน, สหประชาชาติ, มหาวิทยาลัยธรรมศาสตร์, พิพิธภัณฑ์/หอสมุดรัฐสภา และเอกสารศาล/กกต. ใช้บทความประวัติศาสตร์ที่ระบุผู้เรียบเรียงและผู้ทรงคุณวุฒิจากสถาบันพระปกเกล้าเป็นแหล่งวิชาการประกอบสำหรับสัญญา เกรียงศักดิ์ ชาติชาย และบรรหาร URL ของแต่ละข้ออยู่ใน `highlights[].sourceUrl` ควรเปิดอ่านในหน้าบุคคลได้

คำแถลงรัฐบาลเป็นหลักฐานว่ารัฐบาลกล่าวอะไร แต่ยังไม่ใช่การประเมินอิสระว่าทำได้จริง ข้อเขียนสถาบันอาจมีน้ำหนักการตีความต่างกัน จึงย่อเฉพาะข้อเท็จจริงที่ต้องการอ้าง ไม่รับถ้อยคำชื่นชมหรือกล่าวโทษมาเป็นคะแนนของเว็บไซต์ โดยเพิ่มบริบทอำนาจพิเศษมาตรา 17 ในแฟ้มสฤษดิ์ และการยึดอำนาจในแฟ้มเสนีย์/ชาติชาย เพื่อไม่ให้การอ่านนโยบายตัดขาดจากระบบการเมืองและสิทธิเสรีภาพ

ในคำแถลงหลังสงครามโลกครั้งที่สอง คำว่า “สหประชาชาติ” อาจหมายถึงฝ่ายสัมพันธมิตรในบริบทขณะนั้น จึงไม่ตีความคำแถลงทวีหรือเสนีย์ใน พ.ศ. 2488 ว่าไทยเข้าเป็นสมาชิกองค์การสหประชาชาติแล้ว วันที่สมาชิกภาพไทยจริงคือ 16 ธันวาคม 2489 ตามหลักฐาน United Nations Treaty Collection

การประเมินผลเชิงปริมาณและข้อจำกัดของการเทียบวาระอยู่ใน [วิธีการประเมิน](methodology.md) ภาพสวยหรือประวัติครบไม่ทำให้คะแนนในด้านที่ข้อมูลขาดกลายเป็นข้อมูลที่ตรวจสอบแล้ว

## ภาพและสิทธิการใช้งาน

ภาพทั้ง 32 ภาพเป็นภาพบุคคลจริงจาก Wikimedia Commons ไม่ใช่ภาพ AI ดาวน์โหลด thumbnail ความกว้างเป้าหมาย 500 px พร้อมอ่าน `imageinfo.extmetadata` ของแต่ละไฟล์เมื่อ 2026-10-03 เก็บไฟล์จริงไว้ใน `public/portraits` รวมประมาณ 2.60 MB และตรวจทุกไฟล์ด้วยตัวอ่านภาพแล้ว

เครดิตหลักใน `portraitCredit` ประกอบด้วยผู้สร้าง, ชื่อ license และ URL หน้าไฟล์ Commons ซึ่งมีแหล่งต้นฉบับ/เงื่อนไขฉบับเต็ม ผู้ใช้หน้าเว็บต้องเข้าถึงเครดิตเหล่านี้ได้ และต้องไม่สื่อว่าช่างภาพหรือหน่วยงานเจ้าของภาพรับรองเว็บไซต์

ภาพถูกย่อขนาดโดย Wikimedia และอาจถูกตัดกรอบหรือปรับโทนสีด้วย CSS เพื่อจัดหน้าเว็บไซต์ ไม่มีการสร้างใบหน้าขึ้นใหม่หรือเปลี่ยนบริบทให้เป็นเหตุการณ์ที่ไม่ได้เกิดขึ้น การปรับแสดงภาพไม่ใช่การโอนลิขสิทธิ์ภาพมาเป็นลิขสิทธิ์โค้ดเว็บ

License ที่ใช้: [CC0](https://creativecommons.org/publicdomain/zero/1.0/), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), [GODL-India](https://data.gov.in/government-open-data-license-india) และ Public domain ตามรายละเอียดหน้าไฟล์ การเผยแพร่ภาพดัดแปลงที่อยู่ใต้ CC BY-SA ต้องใช้ license ที่เข้ากันได้กับต้นฉบับ

ไฟล์อานันท์ไม่มี Artist ใน API แต่หน้าไฟล์กำหนด attribution ไว้ชัดเจนเป็น Universitätsarchiv St.Gallen / Regina Kühne / HSGN 028/01026 จึงบันทึกเครดิตนี้โดยตรง ไม่ถือว่าไม่มีเจ้าของ

| คนที่ | บุคคล | ไฟล์ | เครดิต | License | หลักฐาน |
|---|---|---|---|---|---|
| 1 | พระยามโนปกรณ์นิติธาดา | [manopakorn.jpg](../public/portraits/manopakorn.jpg) | Unknown author | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Kon_Hutasing.jpg) |
| 2 | พระยาพหลพลพยุหเสนา | [phahon.jpg](../public/portraits/phahon.jpg) | Unknown author | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Phraya_Pahol.jpg) |
| 3 | จอมพล ป. พิบูลสงคราม | [plaek.jpg](../public/portraits/plaek.jpg) | Ministry of Defence of Thailand | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Plaek_Phibunsongkhram_(cropped).jpg) |
| 4 | ควง อภัยวงศ์ | [khuang.jpg](../public/portraits/khuang.jpg) | Unknown photographer | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:%E0%B8%84%E0%B8%A7%E0%B8%87_%E0%B8%AD%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B8%A7%E0%B8%87%E0%B8%A8%E0%B9%8C_%E0%B8%AD%E0%B8%AA%E0%B8%8A_(cropped).jpg) |
| 5 | ทวี บุณยเกตุ | [thawi.jpg](../public/portraits/thawi.jpg) | Unknown author | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Tawee_Boonyaket.jpg) |
| 6 | ม.ร.ว. เสนีย์ ปราโมช | [seni.jpg](../public/portraits/seni.jpg) | Joop van Bilsen for Anefo | CC0 | [Commons](https://commons.wikimedia.org/wiki/File:Seni_Pramot_1961_cropped.jpg) |
| 7 | ปรีดี พนมยงค์ | [pridi.png](../public/portraits/pridi.png) | Thai government (รัฐบาลไทย) | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Pridi_Banomyong_in_1946_(cropped).png) |
| 8 | ถวัลย์ ธำรงนาวาสวัสดิ์ | [thawan.jpg](../public/portraits/thawan.jpg) | Unknown author | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Thawal_Thamrong_Navaswadhi_(cropped).jpg) |
| 9 | พจน์ สารสิน | [pote.jpg](../public/portraits/pote.jpg) | The creator compiled or maintained the parent series, Historic Photograph File of National Archives Events and Personnel, between 1935–1975. | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Pote_Sarasin,_Ambassador_of_Thailand.jpg) |
| 10 | จอมพล ถนอม กิตติขจร | [thanom.jpg](../public/portraits/thanom.jpg) | Joost Evers for Anefo | CC0 | [Commons](https://commons.wikimedia.org/wiki/File:Prime_Minister_Thanom_Kittikachorn_(cropped).jpg) |
| 11 | จอมพล สฤษดิ์ ธนะรัชต์ | [sarit.jpg](../public/portraits/sarit.jpg) | Unknown author | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Sarit_Thanarat_portrait.jpg) |
| 12 | สัญญา ธรรมศักดิ์ | [sanya.jpg](../public/portraits/sanya.jpg) | Norman Peagam | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Sanya_Dharmasakti_1974_(cropped).jpg) |
| 13 | ม.ร.ว. คึกฤทธิ์ ปราโมช | [kukrit.jpg](../public/portraits/kukrit.jpg) | Norman Peagam | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Kukrit_Pramoj_1974_(cropped-1).jpg) |
| 14 | ธานินทร์ กรัยวิเชียร | [thanin.jpg](../public/portraits/thanin.jpg) | Norman Peagam | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Thanin_and_Whitehouse_(cropped).jpg) |
| 15 | พลเอก เกรียงศักดิ์ ชมะนันทน์ | [kriangsak.jpg](../public/portraits/kriangsak.jpg) | Norman Peagam | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Kriangsak_Chomanan_1976_(cropped2).jpg) |
| 16 | พลเอก เปรม ติณสูลานนท์ | [prem.jpg](../public/portraits/prem.jpg) | Series: Reagan White House Photographs, 1/20/1981 - 1/20/1989 Collection: White House Photographic Collection, 1/20/1981 - 1/20/1989 | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Prem_Tinsulanonda_1984.jpg) |
| 17 | พลเอก ชาติชาย ชุณหะวัณ | [chatichai.jpg](../public/portraits/chatichai.jpg) | European Communities | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Chatichai_Choonhavan_1990.jpg) |
| 18 | อานันท์ ปันยารชุน | [anand.jpg](../public/portraits/anand.jpg) | Universitätsarchiv St.Gallen  /  Regina Kühne  /  HSGN 028/01026 | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Anan_Panyarachun_1995_cropped.jpg) |
| 19 | พลเอก สุจินดา คราประยูร | [suchinda.jpg](../public/portraits/suchinda.jpg) | DarKFuReXZ | CC BY-SA 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Suchinda_Kraprayoon_in_1992_(cropped).jpg) |
| 20 | ชวน หลีกภัย | [chuan.jpg](../public/portraits/chuan.jpg) | Ralph Alswang | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Chuan_Likphai_1993_cropped.jpg) |
| 21 | บรรหาร ศิลปอาชา | [banharn.jpg](../public/portraits/banharn.jpg) | Christian Lambiotte, European Union | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Banharn_Silpa-Archa_1996.jpg) |
| 22 | พลเอก ชวลิต ยงใจยุทธ | [chavalit.jpg](../public/portraits/chavalit.jpg) | Thairath Online | CC BY 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:Chavalit_Yongchaiyudh.jpg) |
| 23 | ทักษิณ ชินวัตร | [thaksin.jpg](../public/portraits/thaksin.jpg) | DoD photo by Helene C. Stikkel | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Thaksin_DOD_20050915_(crop).jpg) |
| 24 | พลเอก สุรยุทธ์ จุลานนท์ | [surayud.jpg](../public/portraits/surayud.jpg) | Ministry of External Affairs | GODL-India | [Commons](https://commons.wikimedia.org/wiki/File:The_Union_Minister_of_External_Affairs,_Shri_Pranab_Mukherjee_meeting_with_the_Prime_Minister_of_the_Kingdom_of_Thailand,_Mr._General_Surayud_Chulanont,_in_New_Delhi_on_June_26,_2007_(cropped2).jpg) |
| 25 | สมัคร สุนทรเวช | [samak.jpg](../public/portraits/samak.jpg) | White House photo by Chris Greenberg | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:President_George_W._Bush_with_Prime_Minister_Samak_Sundaravej_(cropped).jpg) |
| 26 | สมชาย วงศ์สวัสดิ์ | [somchai.jpg](../public/portraits/somchai.jpg) | Prime Minister's Office | GODL-India | [Commons](https://commons.wikimedia.org/wiki/File:The_Prime_Minister_of_Thailand,_Mr._Somchai_Wangsawat_meeting_the_Prime_Minister,_Dr._Manmohan_Singh,_in_New_Delhi_on_November_13,_2008_(cropped)_(cropped).jpg) |
| 27 | อภิสิทธิ์ เวชชาชีวะ | [abhisit.jpg](../public/portraits/abhisit.jpg) | Government of Thailand | CC BY 2.0 | [Commons](https://commons.wikimedia.org/wiki/File:Abhisit_Vejjajiva_2009_official.jpg) |
| 28 | ยิ่งลักษณ์ ชินวัตร | [yingluck.jpg](../public/portraits/yingluck.jpg) | Gerd Seidel ( Rob Irgendwer ) | CC BY-SA 3.0 | [Commons](https://commons.wikimedia.org/wiki/File:9153ri-Yingluck_Shinawatra.jpg) |
| 29 | พลเอก ประยุทธ์ จันทร์โอชา | [prayut.jpg](../public/portraits/prayut.jpg) | 内閣官房内閣広報室 | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:Fumio_Kishida_and_Prayut_Chan-o-cha_at_the_Prime_Minister%27s_Office_2022_(1)_(cropped).jpg) |
| 30 | เศรษฐา ทวีสิน | [srettha.jpg](../public/portraits/srettha.jpg) | 首相官邸ホームページ | CC BY 4.0 | [Commons](https://commons.wikimedia.org/wiki/File:PM_Srettha_Thavisin_2023_(cropped).jpg) |
| 31 | แพทองธาร ชินวัตร | [paetongtarn.jpg](../public/portraits/paetongtarn.jpg) | U.S. Embassy, Bangkok | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Paetongtarn_Shinawatra_June_2025.jpg) |
| 32 | อนุทิน ชาญวีรกูล | [anutin.jpg](../public/portraits/anutin.jpg) | Daniel Torok / The White House | Public domain | [Commons](https://commons.wikimedia.org/wiki/File:Anutin_Charnvirakul_in_2025.jpg) |

## การนำเข้าภาพซ้ำ

ใช้ [fetch-portraits.py](../scripts/fetch-portraits.py) จากโฟลเดอร์โครงการ:

```bash
python3 scripts/fetch-portraits.py --download
```

สคริปต์ดาวน์โหลดเฉพาะไฟล์ภาพที่ยังไม่มีและไม่เขียนทับไฟล์เดิม ส่วนการเปลี่ยน JSON แสดงเป็น patch ให้ตรวจแล้วใช้ apply_patch ภาพที่มีอยู่แล้วจะยึด URL Commons เดิมจากเครดิต เพื่อไม่ให้ Wikipedia เปลี่ยนภาพภายหลังแล้วเอาเครดิตใหม่มาใส่ภาพเก่า หากจำนวนคนเปลี่ยนหรือพบ license ที่ยังไม่ได้ตรวจ สคริปต์หยุดให้ตรวจข้อมูลก่อน

สคริปต์นี้ใช้ requests และ beautifulsoup4 ที่ต้องติดตั้งแยกสำหรับงานข้อมูล ไม่อยู่ใน runtime ของหน้าเว็บ ไม่ดึงข้อมูลสดตอนผู้ใช้เปิดหน้า และไม่เขียนเนื้อหา JSON โดยตรง
