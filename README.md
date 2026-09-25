# 🛞 Vee Rubber G Procurement Tracker — B2G Command Center V2.0

ระบบค้นหา วิเคราะห์ และติดตามประกาศงานจัดซื้อจัดจ้างยางและอุปกรณ์ล้อยานพาหนะภาครัฐ (e-GP) อัตโนมัติสำหรับ **บริษัท วีรับเบอร์ คอร์ปอเรชั่น จำกัด (Vee Rubber Corporation Ltd.)** (เลขประจำตัวผู้เสียภาษี: `0105552000071`) พัฒนาขึ้นเพื่อช่วยทีมขายประมูลงานภาครัฐ ผู้บริหาร และฝ่ายการตลาดในการตรวจจับโอกาสทางธุรกิจ ติดตามคู่แข่ง วิเคราะห์ราคากลาง มุดตรวจ BOQ/ปร.4 และรับการแจ้งเตือนงานโครงการใหม่ๆ ทุกวันทางอีเมล

---

## 📑 สารบัญ

- [ภาพรวมโครงการ](#-ภาพรวมโครงการ)
- [กลุ่มสินค้าเป้าหมาย (6 กลุ่มหลักของวีรับเบอร์)](#-กลุ่มสินค้าเป้าหมาย-6-กลุ่มหลักของวีรับเบอร์)
- [ฟังก์ชันการจัดการสมาชิกสำหรับ Admin (Member Control Dashboard)](#-ฟังก์ชันการจัดการสมาชิกสำหรับ-admin-member-control-dashboard)
- [ประเภทประกาศที่ติดตาม (RSS Feed Types)](#-ประเภทประกาศที่ติดตาม-rss-feed-types)
- [สถาปัตยกรรมระบบ (Architecture)](#-สถาปัตยกรรมระบบ-architecture)
- [เทคโนโลยีที่ใช้ (Tech Stack)](#-เทคโนโลยีที่ใช้-tech-stack)
- [โครงสร้างโฟลเดอร์ (Folder Structure)](#-โครงสร้างโฟลเดอร์-folder-structure)
- [ขั้นตอนการติดตั้งและตั้งค่าระบบ (Setup Instructions)](#-ขั้นตอนการติดตั้งและตั้งค่าระบบ-setup-instructions)
  - [1. ติดตั้ง Dependencies](#1-ติดตั้ง-dependencies)
  - [2. ตั้งค่า Cloudflare Worker & D1 Database](#2-ตั้งค่า-cloudflare-worker--d1-database)
  - [3. ตั้งค่า GitHub Actions Secrets](#3-ตั้งค่า-github-actions-secrets)
- [ระบบความปลอดภัยตามกฎเหล็ก (Security & Safety Guardrails)](#-ระบบความปลอดภัยตามกฎเหล็ก-security--safety-guardrails)

---

## 🎯 ภาพรวมโครงการ

ระบบนี้จะทำงานอัตโนมัติวันละ 2 รอบเวลา **07:15 น.** และ **13:15 น. (เวลาไทย)** ผ่าน **GitHub Actions** เพื่อดึงข้อมูลประกาศจากระบบจัดซื้อจัดจ้างภาครัฐ (gprocurement.go.th) กรองเฉพาะหน่วยงานและคำสำคัญ (Keywords) ที่เกี่ยวข้องกับผลิตภัณฑ์ยางของวีรับเบอร์ จากนั้นจะบันทึกข้อมูลลงฐานข้อมูล **Cloudflare D1** ผ่าน REST API ของ **Cloudflare Worker** พร้อมจัดส่งรายงานสรุปโครงการใหม่ประจำวันเข้าสู่กล่องข้อความอีเมลของทีมงานทันที

นอกจากนี้ยังมีระบบเว็บแอปพลิเคชัน (Frontend SPA) เพื่อให้ทีมงานสามารถค้นหา คัดกรอง บุ๊กมาร์กโครงการ วิเคราะห์ข้อมูลผลการชนะการประมูล (ราคากลาง vs ราคาที่ชนะ และคู่แข่ง) ตลอดจนจำลองการเสนอราคาผ่าน **Smart Bidding Simulator**

---

## 🛞 กลุ่มสินค้าเป้าหมาย (6 กลุ่มหลักของวีรับเบอร์)

ระบบจัดหมวดหมู่งานอัตโนมัติตามคีย์เวิร์ดของ วีรับเบอร์ ออกเป็น 6 กลุ่มผลิตภัณฑ์หลัก:

1. 🚗 **passenger_car_tires (ยางรถยนต์นั่ง ยางรถกระบะ และรถตู้ราชการ)**
   - ยางรถยนต์นั่ง, ยางรถเก๋ง, ยางรถกระบะ, ยางรถปิกอัพ, ยางรถตู้ส่วนกลาง, ยางรถประจำตำแหน่ง, ยางรถยนต์ราชการ
   - ยางรถ SUV, ยางรถตรวจการณ์, ยางรถพยาบาล, ยางรถกู้ชีพ, ยางรถฉุกเฉิน, ยางรถสายตรวจ, ยางรถตำรวจ
   - ขนาดยางยอดนิยม: `195/65R15`, `205/55R16`, `215/55R17`, `265/65R17`, `265/60R18`, `Vee Rubber Vitron`, `City Cross`

2. 🚛 **truck_bus_tires (ยางรถบรรทุก รถบัส และรถเชิงพาณิชย์)**
   - ยางรถบรรทุก 6 ล้อ, 10 ล้อ, ยางรถพ่วง, รถเทรลเลอร์, ยางรถบัส, รถโดยสารปรับอากาศ, รถสองแถว
   - ยางรถบรรทุกน้ำ, ยางรถขยะ, ยางรถดับเพลิง, รถกู้ภัย, ยางรถดัมพ์, ยางรถดูดสิ่งปฏิกูล, รถเครน
   - ขนาดยางเรเดียลและผ้าใบ: `11R22.5`, `12R22.5`, `295/80R22.5`, `315/80R22.5`, `9.00R20`, `10.00R20`, `8.25R16`, `7.50-16`

3. 🏍️ **motorcycle_tires (ยางรถจักรยานยนต์ราชการและสายตรวจ)**
   - ยางรถจักรยานยนต์สายตรวจ, ยางรถจักรยานยนต์ตรวจการณ์, ยางรถตำรวจ, ยางรถกู้ชีพ, รถส่งเอกสารราชการ
   - ยางสตรีท, ยางสกู๊ตเตอร์, ยางวิบาก, ยางโมโตครอส, ยาง Enduro, ยางบิ๊กไบค์, Vee Rubber VRM Series
   - ขนาดยาง: `70/90-17`, `80/90-17`, `80/90-14`, `90/90-14`, `110/70-12`, `120/70-12`, `120/70-17`

4. 🚜 **otr_heavy_machinery (ยาง OTR เครื่องจักรกลหนัก รถแทรกเตอร์ & รถเกษตร)**
   - ยาง OTR (Off-The-Road), ยางเครื่องจักรกลหนัก, ยางเครื่องจักรกลก่อสร้าง, ยางเครื่องจักรกลงานทาง
   - ยางรถแทรกเตอร์, ยางรถไถ, ยางรถเพื่อการเกษตร, ยางรถเกลี่ยดิน (Motor Grader), ยางรถตัก (Wheel Loader)
   - ยางรถบดถนน (Road Roller), ยางรถขุด, ยางรถยกฟอร์คลิฟท์ (Forklift Tires ทั้งแบบยางลมและยางตัน)
   - ขนาดยาง: `17.5-25`, `20.5-25`, `23.5-25`, `14.00-24`, `16.9-28`, `18.4-30`, `6.00-9`, `7.00-12`

5. 🚲 **bicycle_specialty_tires (ยางรถจักรยาน วีลแชร์ & ยานพาหนะเฉพาะทาง)**
   - ยางรถจักรยานเสือภูเขา, จักรยานซิตี้ไบค์, จักรยานสายตรวจ, โครงการจักรยานยืมเรียน / ท่องเที่ยวชุมชน
   - ยางรถเข็นคนพิการ (Wheelchair Tires), ยางรถเข็นผู้ป่วยโรงพยาบาลรัฐ, ยางรถกอล์ฟ, รถตัดหญ้า, รถ ATV / UTV

6. 🔘 **tube_accessories (ยางใน ยางรองคอด & อุปกรณ์ล้อยาง)**
   - ยางในรถยนต์, ยางในรถบรรทุก, ยางในมอเตอร์ไซค์, ยางในแทรกเตอร์, ยางในบิวทิล (Butyl Tube), ยางในธรรมชาติ
   - ยางรองคอด (Rim Flap), ยางรองกะทะล้อ, จุ๊บลม, วาล์วยางรถยนต์ (Tire Valves) และอุปกรณ์ล้อยาง

---

## 👥 ฟังก์ชันการจัดการสมาชิกสำหรับ Admin (Member Control Dashboard)

ผู้ดูแลระบบ (Admin) มีหน้า Dashboard ควบคุมสมาชิกแบบครบวงจรที่ `admin.html`:

- **อนุมัติ / ปฏิเสธสมาชิกใหม่ (Approve / Reject):** รองรับระบบลงทะเบียนที่ต้องผ่านการตรวจสอบจาก Admin ก่อนเข้าสู่ระบบได้
- **เปลี่ยนบทบาท (Role Promotion/Demotion):** สลับสิทธิ์ระหว่าง `admin` และ `viewer` ได้แบบ Realtime
- **รีเซ็ตรหัสผ่าน (Reset Password):** เข้ารหัสความปลอดภัยสูงด้วย PBKDF2 + Salt 16 bytes พร้อมสร้างรหัสผ่านสุ่มอัตโนมัติ
- **เปิด/ปิดการรับอีเมลแจ้งเตือน (Email Notification Toggle):** กำหนดรายบุคคลว่าต้องการให้รับอีเมลสรุปงานประจำวันหรือไม่
- **ลบสมาชิก (Delete Member):** ลบบัญชีผู้ใช้งานที่ไม่เกี่ยวข้องออกจากระบบ (พร้อมระบบป้องกัน Admin ลบตัวเอง)
- **Session & Status Tracking:** แสดงสถานะ Online/Offline, เวลาเข้าใช้งานล่าสุด, และระยะเวลาของ Session

---

## 📢 ประเภทประกาศที่ติดตาม (RSS Feed Types)

ระบบดึงข้อมูล RSS Feed จาก `process3.gprocurement.go.th` ครอบคลุม 5 สเตจสำคัญ:

| รหัสประเภท | ชื่อประเภทประกาศ | ความสำคัญ |
|:---:|:---|:---|
| **P0** | **แผนการจัดซื้อจัดจ้าง** | ทราบแผนงานจัดซื้อยางล่วงหน้าของกองทัพ ตำรวจ โรงพยาบาล หรือ อปท. |
| **B0** | **ร่างประกาศและร่างเอกสาร (ร่าง TOR)** | ตรวจสอบสเปกยาง ขนาดยาง มาตรฐาน มอก. ก่อนเปิดประกวดราคา |
| **15** | **ประกาศราคากลาง** | วิเคราะห์งบประมาณและราคาอ้างอิงต่อเส้น เพื่อคำนวณต้นทุนเสนอราคา |
| **D0** | **ประกาศเชิญชวน (e-Bidding)** | โครงการเปิดรับยื่นซองข้อเสนอจริง พร้อมกำหนดยื่นเอกสาร |
| **W0** | **ประกาศผู้ชนะการเสนอราคา** | ติดตามข้อมูลคู่แข่ง ราคาที่เคาะชนะ และสถิติส่วนลดในแต่ละหมวด |

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture)

```
[ กรมบัญชีกลาง e-GP RSS Feeds ]
               │
               ▼ (วันละ 2 รอบ 07:15 & 13:15 น.)
      [ GitHub Actions Scraper ]
               │
               ├─► [ In-Memory PDF Scanner ] (สแกน ปร.4 / สเปกยาง / มอก.)
               │
               ├─► [ REST API (X-API-Key) ]
               │             │
               │             ▼
               │   [ Cloudflare Worker Backend ]
               │             │
               │             ▼
               │   [ Cloudflare D1 Database ]
               │
               ▼
   [ Gmail SMTP Notification ] ────► [ ทีมงานและผู้บริหาร วีรับเบอร์ ]
               │
               ▼
   [ Cloudflare Pages Frontend ] ◄─── [ เว็บแอป SPA (v2.html / dashboard.html) ]
```

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend:** HTML5, Modern CSS (Design Tokens, WCAG AA Contrast >= 4.5:1), Vanilla JavaScript (Zero bloated frameworks)
- **Backend:** Cloudflare Workers (Hono framework)
- **Database:** Cloudflare D1 (Serverless SQLite)
- **Scraper:** Node.js, RSS-Parser, PDF-Parse, Axios, Cheerio
- **Authentication:** PBKDF2 (SHA-256, 100,000 iterations, Salt 16 bytes), JWT (JSON Web Tokens)
- **CI/CD & Cron:** GitHub Actions

---

## 📁 โครงสร้างโฟลเดอร์ (Folder Structure)

```
GProcurement-VeeRubber/
├── .github/
│   └── workflows/
│       └── daily-fetch.yml          # GitHub Actions Cron Job
├── frontend/
│   ├── css/
│   │   ├── style.css               # สไตล์มาตรฐานและโทนสีกรมท่า-น้ำเงิน
│   │   └── v2.css                  # B2G Command Center Design System
│   ├── js/
│   │   ├── admin.js                # ระบบจัดการสมาชิกฝั่ง Admin
│   │   ├── api.js                  # API Client เชื่อมต่อ Cloudflare Worker
│   │   ├── auth.js                 # Authentication & Token Manager
│   │   ├── common.js               # หมวดหมู่ 6 กลุ่มยางและ Utility Functions
│   │   ├── simulator.js            # Smart Bidding Simulator
│   │   ├── winners.js              # ประวัติและสถิติผู้ชนะประมูล
│   │   └── v2.js                   # Logic หลักของ V2 Command Center
│   ├── admin.html                  # หน้าแดชบอร์ดจัดการผู้ใช้สำหรับ Admin
│   ├── dashboard.html              # หน้าหลัก (Twin-File Mirror ของ v2.html)
│   ├── v2.html                     # หน้าหลัก B2G Command Center
│   ├── detail.html                 # หน้ารายละเอียดโครงการ
│   ├── login.html                  # หน้าเข้าสู่ระบบ
│   ├── register.html               # หน้าสมัครสมาชิกใหม่
│   ├── pending.html                # หน้ารอการอนุมัติจาก Admin
│   └── privacy.html                # นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)
├── scraper/
│   ├── src/
│   │   ├── email/
│   │   │   ├── daily-digest.js     # สร้าง HTML รายงานส่งอีเมลประจำวัน
│   │   │   └── sender.js           # ส่งอีเมลผ่าน Nodemailer
│   │   ├── d1-uploader.js          # อัปโหลดข้อมูลประกาศขึ้น Cloudflare D1
│   │   ├── in-memory-pdf-parser.js # สแกนไฟล์ PDF หาขนาดและสเปกยาง
│   │   ├── keywords.js             # 6 กลุ่มสินค้ายางวีรับเบอร์และคำคัดกรอง
│   │   ├── rss-fetcher.js          # ดึงข้อมูล RSS Feed จาก e-GP
│   │   └── index.js                # Entry point ของ Scraper
│   └── package.json
├── worker/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin.js            # Endpoint จัดการสมาชิกและระบบสิทธิ์
│   │   │   ├── announcements.js    # ค้นหาและคัดกรองโครงการ
│   │   │   ├── auth.js             # ระบบล็อกอิน สมัครสมาชิก และรีเซ็ตรหัส
│   │   │   ├── bookmarks.js        # งานที่ติดตาม (Watchlist)
│   │   │   ├── feedback.js         # AI Feedback Loop (ใช่งาน/ไม่ใช่งาน)
│   │   │   └── winners.js          # ข้อมูลผู้ชนะประมูล
│   │   ├── utils/
│   │   │   └── mailer.js           # แจ้งเตือน Admin เมื่อมีสมาชิกใหม่
│   │   └── index.js                # Worker Application Entry
│   ├── schema.sql                  # โครงสร้างฐานข้อมูล D1
│   └── wrangler.toml               # การตั้งค่า Cloudflare Worker
├── .env.example                    # ตัวอย่างตัวแปรสภาพแวดล้อม
└── README.md                       # เอกสารแนะนำระบบ
```

---

## ⚙️ ขั้นตอนการติดตั้งและตั้งค่าระบบ (Setup Instructions)

### 1. ติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies ฝั่ง scraper
cd scraper
npm install

# ติดตั้ง dependencies ฝั่ง worker
cd ../worker
npm install
```

### 2. ตั้งค่า Cloudflare Worker & D1 Database

1. ล็อกอินเข้า Cloudflare CLI:
   ```bash
   npx wrangler login
   ```
2. สร้างฐานข้อมูล D1:
   ```bash
   npx wrangler d1 create gprocurement-veerubber-db
   ```
   นำ `database_id` ที่ได้ไปใส่ในไฟล์ `worker/wrangler.toml`

3. นำ Schema เข้าสู่ D1 Database:
   ```bash
   npx wrangler d1 execute gprocurement-veerubber-db --file=./schema.sql --remote
   ```

4. ตั้งค่า Secrets สำหรับ Worker:
   ```bash
   npx wrangler secret put JWT_SECRET
   npx wrangler secret put API_KEY
   npx wrangler secret put RECOVERY_KEY
   ```

5. Deploy Worker ขึ้น Cloudflare:
   ```bash
   npx wrangler deploy
   ```

### 3. ตั้งค่า GitHub Actions Secrets

ใน GitHub Repository (`Settings` > `Secrets and variables` > `Actions`):

- `D1_API_URL`: URL ของ Cloudflare Worker (เช่น `https://gprocurement-veerubber.<account>.workers.dev`)
- `D1_API_KEY`: API Key ภายในสำหรับให้ Scraper ยิงข้อมูลเข้า Worker
- `GMAIL_USER`: บัญชี Gmail ที่ใช้ส่งแจ้งเตือน
- `GMAIL_APP_PASSWORD`: รหัสผ่านแอป 16 หลักจาก Google Account
- `GMAIL_RECIPIENTS`: อีเมลผู้รับสรุปงานประจำวัน (เช่น `admin@veerubber.co.th,sales@veerubber.co.th`)

---

## 🛡️ ระบบความปลอดภัยตามกฎเหล็ก (Security & Safety Guardrails)

1. **Credentials Safety Rule:** ไม่มีการบันทึกหรือขอรหัสผ่าน/Secret Keys ผ่านข้อความสนทนา ข้อมูลสำคัญทั้งหมดถูกจัดการผ่านไฟล์ `.env` ที่อยู่ใน `.gitignore` หรือ GitHub Secrets
2. **PBKDF2 Password Hashing:** รหัสผ่านสมาชิกทุกรายได้รับการ Salt 16 bytes และแฮชด้วย PBKDF2 SHA-256 วนซ้ำ 100,000 รอบ ไม่มีการเก็บ Plain-text Password
3. **Role-Based Access Control:** สิทธิ์ Admin และ Viewer ถูกแยกและตรวจสอบในทุก Request ผ่าน JWT และ Middleware ของ Worker Backend
