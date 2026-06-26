---
name: MangaZen
description: แพลตฟอร์มสำหรับอ่านการ์ตูนที่ใช้งานง่าย รวดเร็ว และลื่นไหล
colors:
  bg: "#0d0d12"
  bg2: "#13131c"
  bg3: "#1a1a27"
  surface: "#1e1e2e"
  surface2: "#252538"
  border: "#2a2a40"
  accent: "#e8935a"
  accent2: "#a78bfa"
  accent3: "#34d399"
  text: "#e2e8f0"
  text2: "#94a3b8"
  text3: "#64748b"
  danger: "#f87171"
typography:
  display:
    fontFamily: "Cinzel Decorative, serif"
  body:
    fontFamily: "Noto Sans Thai, sans-serif"
rounded:
  base: "12px"
  sm: "8px"
spacing:
  base: "28px"
  md: "14px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#ffffff"
    rounded: "20px"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "7px 14px"
---

# Design System: MangaZen

## 1. Overview

**Creative North Star: "The Night Reader (เพื่อนยามดึก เน้นสีเข้มสบายตา และลึกลับ)"**

MangaZen คือระบบดีไซน์ที่เน้นความเป็นมิตรต่อนักอ่านยามดึก (The Night Reader) โดยมีโทนสีที่ให้ความรู้สึกมืด ลึกลับ แต่นุ่มนวลต่อสายตา ผสมผสานกับลูกเล่นการเคลื่อนไหว (Playful & Bouncy) ที่ช่วยให้แอปพลิเคชันไม่ดูแข็งกระด้างหรือตึงเครียดจนเกินไป ความทันสมัยถูกถ่ายทอดผ่านการใช้ Glassmorphism บางๆ และสี Accent ที่สดใสมีพลัง (Energetic & Pop) โดยเราตั้งใจหลีกเลี่ยงดีไซน์ที่ใช้สีฉูดฉาดจนกวนสายตาหรือรูปภาพที่โหลดช้า 

**Key Characteristics:**
- มืดและนุ่มนวล (Dark & Gentle) สบายตาสำหรับอ่านการ์ตูน
- กระฉับกระเฉงและสนุกสนาน (Energetic & Playful) ผ่านแอนิเมชันปุ่มและการ์ด
- โปร่งแสง (Glassmorphism) ในพื้นที่นำทาง (Navigation)

## 2. Colors

โทนสีหลักเน้นสีเข้มแบบอวกาศ (Space Dark) ตัดกับสีส้มและม่วงที่ให้ความรู้สึกมีพลัง (Energetic & Pop)

### Primary
- **Accent Orange** (`#e8935a`): ใช้สำหรับปุ่มหลัก สถานะ "กำลังทำงาน" หรือจุดสำคัญที่ต้องการให้ผู้ใช้ออกแรงคลิก
- **Accent Purple** (`#a78bfa`): สีรองที่ใช้เสริมความลึกลับ พรีเมียม และทันสมัย (เช่น โลโก้, ปุ่มในโหมด AI)

### Tertiary
- **Accent Green** (`#34d399`): ใช้บ่งบอกถึงสถานะสำเร็จ (Success) เช่น การเชื่อมต่อ Database

### Neutral
- **Background** (`#0d0d12`): สีพื้นหลังหลัก มืดสนิทแต่เจือสีน้ำเงินอมม่วงเล็กน้อยให้ดูมีมิติ
- **Surface** (`#1e1e2e`): สีพื้นผิวของการ์ดและปุ่มรอง
- **Border** (`#2a2a40`): เส้นขอบที่กลืนไปกับพื้นหลัง ไม่แย่งความสนใจ
- **Text Primary** (`#e2e8f0`): สีข้อความหลักที่สว่างแต่นุ่มนวล ไม่ใช่สีขาวล้วน 100%
- **Text Muted** (`#64748b`): สีข้อความรอง สำหรับ Metadata หรือรายละเอียดที่ไม่สำคัญ

**The Gentle Contrast Rule:**
ไม่อนุญาตให้ใช้สีขาวล้วน (`#ffffff`) บนพื้นหลังสีดำสนิท (`#000000`) สำหรับข้อความยาวๆ เพื่อลดอาการปวดตา (Eye-strain)

## 3. Typography

**Display Font:** Cinzel Decorative, serif (with fallback)
**Body Font:** Noto Sans Thai, sans-serif (with fallback)

**Character:** การผสมผสานระหว่างฟอนต์หัวเรื่องแนวแฟนตาซี-คลาสสิก (Cinzel Decorative) เพื่อให้กลิ่นอายของหนังสือมังงะคลาสสิก และฟอนต์เนื้อหา (Noto Sans Thai) ที่อ่านง่ายสะอาดตา

### Hierarchy
- **Display** (Cinzel Decorative): ใช้เฉพาะกับโลโก้หรือหัวเรื่องที่ใหญ่เป็นพิเศษ
- **Headline / Title** (Noto Sans Thai, 700, 24px-26px): หัวข้อมังงะ หรือ หัวข้อ Section
- **Body** (Noto Sans Thai, 400, 14px): เนื้อหาทั่วไปในแอปพลิเคชัน
- **Label / Meta** (Noto Sans Thai, 400/600, 10px-12px): ป้ายกำกับ (Tags), วันที่, หรือข้อมูลย่อย

**The Content Readability Rule:**
ให้ความสำคัญกับการอ่านเป็นหลัก (Content First) ขนาดตัวอักษรบนมือถือต้องไม่เล็กกว่า 14px สำหรับข้อความอ่านปกติ

## 4. Elevation

ปรัชญาของระบบนี้คือ **"ผสมผสาน (Hybrid)"** 

พื้นผิวส่วนใหญ่แบนราบ (Flat) ไปกับสีพื้นหลังโดยอาศัยเส้นขอบ (Borders) หรือโทนสี (Tonal layering) เพื่อแยกสัดส่วน แต่จะใช้ Layer แบบโปร่งใส (Glassmorphism: Background blur) กับองค์ประกอบที่ต้องลอยอยู่เหนือหน้าต่างหลัก เช่น Navigation bar หรือ Reader overlay เพื่อรักษาบริบทของการอ่านมังงะไว้เสมอ

### Shadow Vocabulary
- **Card Hover:** `0 8px 28px rgba(232,147,90,.18)` - เงาสีส้มฟุ้งๆ เพื่อแสดงการโต้ตอบเมื่อเมาส์ชี้ (Playful interaction)
- **Modal Shadow:** `0 4px 24px rgba(0,0,0,.5)` - เงาดำลึก เพื่อให้กล่อง Modal ลอยเด่นออกมาจากพื้นหลังอย่างชัดเจน

## 5. Components

**Component Philosophy:** "Playful & Bouncy (สนุกสนาน มีลูกเล่นเวลาชี้หรือกด)"

### Buttons
- **Shape:** โค้งมนแบบ Pill (20px) สำหรับปุ่มหลัก, และโค้งแบบมนปกติ (8px) สำหรับปุ่มรอง
- **Primary:** ปุ่มอัปโหลดหรือยืนยัน ใช้พื้นสี Accent (`#e8935a`) เมื่อ Hover จะเปลี่ยนสีเล็กน้อยและเด้งขึ้น (`transform: translateY(-1px)`)
- **Ghost:** ปุ่มการกระทำทั่วไป ใช้ขอบบางๆ ไปกับสีพื้นผิว (`#1e1e2e`) เมื่อ Hover จะกลายเป็นสี Accent

### Cards (Manga Card)
- **Shape:** สี่เหลี่ยมมุมมนเล็กน้อย (8px) ขอบบาง
- **Behavior:** เมื่อ Hover จะเด้งขึ้น (`translateY(-4px)`) โชว์ขอบสีส้ม พร้อมกับเงาตกกระทบแบบ Glow สีส้ม และภาพปกมังงะจะซูมเข้าเล็กน้อย (`scale(1.04)`)

### Navigation (Glass Header)
- **Behavior:** ลอยติดขอบจอบน (Fixed) พื้นหลังใสปนเบลอ (`backdrop-filter: blur(16px)`) ช่วยให้ภาพมังงะที่เลื่อนผ่านด้านล่างยังคงส่งผ่านสีสันขึ้นมาได้

## 6. Do's and Don'ts

- **Do:** ใช้ Glassmorphism อย่างตั้งใจเฉพาะจุดที่ซ้อนทับ Content หลัก (เช่น Navbar หรือ Overlay อ่านการ์ตูน)
- **Don't:** ใช้เงา (Drop shadow) สีดำเข้มกับส่วนประกอบแบนราบบนพื้นหลังที่มืดอยู่แล้ว (มองไม่เห็นและสกปรก) ให้ใช้ Border แทน
- **Do:** สังเกตและรักษาคอนทราสต์ข้อความเสมอ
- **Don't:** อัดเนื้อหาเข้าการ์ด (Cards) จนแน่นเกินไป ปล่อยให้มังงะและรูปภาพมีพื้นที่หายใจ (Whitespace)
