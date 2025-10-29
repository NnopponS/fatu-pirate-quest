# 🏴‍☠️ FATU Treasure Quest - Pirates of The FATUnian

<div align="center">
  <img src="public/compass-logo.svg" alt="FATU Treasure Quest Logo" width="200"/>
  
  <h3>การผจญภัยล่าสมบัติในงาน Open House 2025</h3>
  <p>คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์</p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18.3-blue?logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Vite-5.4-purple?logo=vite" alt="Vite"/>
    <img src="https://img.shields.io/badge/Firebase-Realtime_DB-orange?logo=firebase" alt="Firebase"/>
  </p>
</div>

---

## 📖 เกี่ยวกับโปรเจค

**FATU Treasure Quest** เป็นเว็บแอปพลิเคชันสำหรับงาน Open House 2025 ของคณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ในรูปแบบเกมล่าสมบัติแบบโจรสลัด ผู้เข้าร่วมจะได้สำรวจสถานที่ต่างๆ ภายในคณะ ร่วมกิจกรรม สะสมคะแนน และลุ้นรับรางวัล

**วันที่จัดงาน:** 7-8 พฤศจิกายน 2568  
**สถานที่:** คณะศิลปกรรมศาสตร์ มธ. ศูนย์รังสิต

---

## ✨ Features หลัก

### 👥 **สำหรับผู้เข้าร่วม (Participants)**

- 🎭 **Opening Animation** - แอนิเมชันต้อนรับแบบโจรสลัดสุดอลังการ
- 📝 **ระบบลงทะเบียน** - ลงทะเบียนง่ายๆ พร้อมตรวจสอบเบอร์โทรซ้ำ
- 🗺️ **แผนที่สมบัติ** - ดูสถานที่ทั้งหมดพร้อม Google Maps integration
- 📱 **QR Code Scanner** - เช็กอินสถานที่และกิจกรรมผ่าน QR code
- 🎯 **กิจกรรมย่อย** - ร่วมกิจกรรมต่างๆ เพื่อรับคะแนนเพิ่ม (+100 คะแนน/กิจกรรม)
- 💯 **ระบบคะแนน** - ติดตามคะแนนแบบ real-time
- 🎰 **หมุนวงล้อรางวัล** - เมื่อครบ 300 คะแนน (Animation แบบเขย่าขวด 5 ครั้ง)
- 🎁 **รหัสรับรางวัล** - รหัส 6 หลักสำหรับรับรางวัล
- 📊 **Dashboard** - ติดตามความคืบหน้าและประวัติการเข้าร่วม
- 🤖 **AI Chatbot โจรสลัด** - กัปตันฟาตู ตอบคำถามด้วย Google Gemini AI
- 👤 **โปรไฟล์** - ดูข้อมูลส่วนตัวและสถิติ

### 🛠️ **สำหรับ Admin**

- 🎮 **Admin Dashboard** - ศูนย์ควบคุมกลาง
- 👥 **จัดการผู้เข้าร่วม** - ดู แก้ไข ลบข้อมูลผู้เข้าร่วม
- 📍 **จัดการสถานที่** - เพิ่ม/แก้ไข สถานที่และกิจกรรมย่อย
- 🎁 **จัดการรางวัล** - ตั้งค่ารางวัล น้ำหนัก stock
- 🎰 **ตั้งค่าคะแนนหมุนวงล้อ** - กำหนดคะแนนที่ต้องการ
- ✅ **ยืนยันรางวัล** - สแกน QR เพื่อมอบรางวัล
- 🃏 **Hero Cards** - จัดการการ์ดแนะนำคณะ
- 📊 **Excel Export** - ส่งออกข้อมูลทั้งหมดเป็น Excel ครบถ้วน
  - 8 Sheets: สถิติ, ผู้เข้าร่วม, สถานที่, กิจกรรม, รางวัล, การแจก, เช็กอิน, การเข้าร่วม
  - วันที่แบบภาษาไทย
  - จัดคอลัมน์อัตโนมัติ
  - ไฟล์มี timestamp
- 🤖 **ตั้งค่า AI** - จัดการ Google Gemini API Keys + Knowledge Base

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI Framework
- **TypeScript 5.8** - Type Safety
- **Vite 5.4** - Build Tool & Dev Server
- **React Router 6.30** - Client-side Routing
- **TailwindCSS 3.4** - Utility-first CSS
- **shadcn/ui** - Component Library
- **Framer Motion 12.23** - Animations
- **Lucide React** - Icons

### Backend & Services
- **Firebase Realtime Database** - Primary Database
- **Supabase** - Authentication & Additional Storage
- **Google Gemini AI 2.0** - AI Chatbot (gemini-2.0-flash-exp)
- **Excel.js (XLSX)** - Excel Export

### Additional Libraries
- **React Query (TanStack Query)** - Data Fetching & Caching
- **React Hook Form** - Form Management
- **Zod** - Schema Validation
- **jsQR** - QR Code Scanning
- **qrcode** - QR Code Generation
- **Recharts** - Data Visualization

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0 (แนะนำ v20 LTS)
- **npm** >= 9.0.0 หรือ **bun**
- **Git**
- **Firebase Project** (Realtime Database)
- **Supabase Project** (สำหรับ Auth)

### Installation

```bash
# Clone repository
git clone https://github.com/NnopponS/fatu-pirate-quest.git

# เข้าไปในโฟลเดอร์โปรเจค
cd fatu-pirate-quest

# ติดตั้ง dependencies
npm install
# หรือ
bun install

# Copy environment variables
cp .env.example .env

# แก้ไขไฟล์ .env ให้ถูกต้อง (ดูด้านล่าง)

# รัน development server
npm run dev
```

เว็บจะเปิดที่ `http://localhost:5173`

---

## ⚙️ Configuration

### Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
# Firebase Realtime Database
VITE_FIREBASE_DB_URL=https://your-project.firebasedatabase.app

# QR Code Secret (ใช้สำหรับ sign/verify QR codes)
VITE_CHECKIN_SECRET=your-secure-secret-key-here

# Supabase (สำหรับ Authentication - ถ้าใช้)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Firebase Setup

1. สร้าง Firebase Project ที่ [Firebase Console](https://console.firebase.google.com)
2. เปิดใช้งาน **Realtime Database**
3. ตั้งค่า Security Rules:

```json
{
  "rules": {
    ".read": "auth != null || true",
    ".write": "auth != null || true"
  }
}
```

4. คัดลอก Database URL มาใส่ใน `.env`

### Google Gemini AI Setup (สำหรับ Chatbot)

1. ไปที่ [Google AI Studio](https://aistudio.google.com/app/apikey)
2. สร้าง API Key (ฟรี!)
3. ใน Admin Dashboard → แท็บ "ตั้งค่า AI Chatbot"
4. ใส่ API Key (สามารถใส่หลาย keys สำหรับ fallback)

---

## 📁 โครงสร้างโปรเจค

```
fatu-pirate-quest/
├── public/              # Static assets
│   ├── compass-logo.svg # Logo เข็มทิศ
│   └── favicon.ico      
├── src/
│   ├── components/      # React Components
│   │   ├── ui/         # shadcn/ui components
│   │   ├── OpeningAnimation.tsx
│   │   ├── PirateCharacter.tsx
│   │   ├── PirateChatbot.tsx
│   │   ├── BottleQuestModal.tsx
│   │   ├── SpinWheel.tsx
│   │   ├── QRScannerModal.tsx
│   │   └── ...
│   ├── pages/          # Page Components
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Map.tsx
│   │   ├── Rewards.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── ...
│   ├── services/       # API Services
│   │   ├── firebase.ts     # Firebase operations
│   │   ├── gemini.ts       # Google Gemini AI
│   │   └── excelExport.ts  # Excel export
│   ├── contexts/       # React Contexts
│   │   └── AuthContext.tsx
│   ├── hooks/          # Custom Hooks
│   ├── lib/            # Utilities
│   │   ├── constants.ts
│   │   ├── crypto.ts   # QR signing/verification
│   │   └── utils.ts
│   ├── integrations/   # External integrations
│   │   ├── firebase/
│   │   └── supabase/
│   └── index.css       # Global styles + Pirate theme
├── supabase/           # Supabase migrations
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🎮 กติกาการเล่น

### สำหรับผู้เข้าร่วม:

1. **ลงทะเบียน** - กรอกข้อมูล (ชื่อ, โรงเรียน, ชั้น, เบอร์โทร)
2. **สำรวจสถานที่** - มี 4 สถานที่ ต้องเช็กอินอย่างน้อย 3 แห่ง:
   - 🏋️ Gymnasium 4
   - 🏫 ตึกโดม คณะศิลป์
   - 🎨 หอศิลป์
   - 🎭 ห้องแสดง
3. **เช็กอินสถานที่** - สแกน QR code ที่สถานที่จริง (0 คะแนน)
4. **ทำกิจกรรมย่อย** - ร่วมกิจกรรมในแต่ละสถานที่ (+100 คะแนน/กิจกรรม)
5. **สะสมคะแนน** - รวมให้ครบ 300 คะแนน
6. **หมุนวงล้อ** - เขย่าขวดสมบัติ 5 ครั้ง ลุ้นรางวัล (หมุนได้ 1 ครั้ง/คน)
7. **รับรางวัล** - แสดงรหัส 6 หลักกับเจ้าหน้าที่

### ระบบคะแนน:
- เช็กอินสถานที่: **0 คะแนน** (แค่บันทึก)
- ทำกิจกรรมย่อย: **+100 คะแนน** ต่อกิจกรรม
- ตัวอย่าง: เช็กอิน 3 สถานที่ + ทำ 3 กิจกรรม = **300 คะแนน** ✅

---

## 🔧 การตั้งค่าโปรเจค

### 1. ตั้งค่า Firebase

```javascript
// Firebase Realtime Database Structure
{
  "participants": {
    "user-id": {
      "username": "string",
      "first_name": "string",
      "last_name": "string",
      "points": 0,
      "age": 17,
      "grade_level": "ม.6",
      "school": "โรงเรียนXXX",
      "program": "สายวิทย์",
      "phone_number": "0812345678",
      "created_at": "2024-11-01T..."
    }
  },
  "locations": {
    "1": {
      "name": "Gymnasium 4",
      "lat": 14.0661446,
      "lng": 100.6033427,
      "points": 100,
      "sub_events": [...]
    }
  },
  "checkins": {
    "user-id": {
      "1": { "created_at": "...", "method": "qr" }
    }
  },
  "sub_event_checkins": {
    "user-id": {
      "sub-event-id": {
        "created_at": "...",
        "points_awarded": 100
      }
    }
  },
  "spins": {
    "user-id": {
      "prize": "รางวัลที่ได้",
      "claim_code": "ABC123",
      "claimed": false,
      "created_at": "..."
    }
  },
  "settings": {
    "pointsRequiredForWheel": 300,
    "ai": {
      "geminiApiKeys": ["key1", "key2"],
      "knowledgeBase": "ข้อมูลเพิ่มเติม..."
    }
  }
}
```

### 2. ตั้งค่า Admin

**Default Admin Login:**
- Username: `admin`
- Password: `admin123`

⚠️ **ควรเปลี่ยนรหัสผ่านทันที!**

### 3. การสร้าง QR Code

QR Codes ถูก sign ด้วย `VITE_CHECKIN_SECRET` เพื่อป้องกันการปลอม:

**สำหรับเช็กอินสถานที่:**
```
checkin:{location_id}:{signature}:{version}
ตัวอย่าง: checkin:1:a1b2c3...:1
```

**สำหรับกิจกรรมย่อย:**
```
subevent:{sub_event_id}:{location_id}:{signature}:{version}
ตัวอย่าง: subevent:1-workshop-am:1:x9y8z7...:1
```

---

## 📊 Excel Export System

ระบบ Export ข้อมูลที่ครบถ้วนและละเอียด:

### ฟีเจอร์:
- ✅ **8 Sheets แยกตามประเภท**
  1. 📊 สถิติรวม - สรุปทั้งหมด + กราฟ
  2. 👥 ผู้เข้าร่วม - ข้อมูลครบถ้วน
  3. 📍 สถานที่ - ทุกสถานที่
  4. 🎯 กิจกรรมย่อย - รายละเอียดกิจกรรม
  5. 🎁 รางวัล - ข้อมูลรางวัล
  6. 🎰 รางวัลที่แจก - รายการแจก
  7. ✅ เช็กอิน - บันทึกเช็กอิน
  8. 🎪 การเข้าร่วมกิจกรรม - บันทึกกิจกรรม

- ✅ วันที่เป็นภาษาไทย
- ✅ จัดขนาดคอลัมน์อัตโนมัติ
- ✅ ชื่อไฟล์มี timestamp
- ✅ Export แบบเลือกส่วนได้

### การใช้งาน:
```typescript
import { exportToExcel, exportParticipantsOnly } from '@/services/excelExport';

// Export ทั้งหมด
exportToExcel(dashboardData);

// Export เฉพาะส่วน
exportParticipantsOnly(dashboardData);
exportStatisticsOnly(dashboardData);
exportPrizesOnly(dashboardData);
```

---

## 🤖 AI Chatbot - กัปตันฟาตู

### ความสามารถ:
- ตอบคำถามเกี่ยวกับงาน FATU
- ให้ข้อมูลสถานที่ กิจกรรม คะแนน
- ให้ข้อมูลเกี่ยวกับคณะศิลป์ หลักสูตร
- ตอบคำถามทั่วไป พร้อมระบุแหล่งที่มา
- พูดแบบโจรสลัด (ใช้ "ข้า" "เจ้า")

### ระบบ Source Citation:
- 📊 **(ข้อมูลจากระบบของข้า)** - ข้อมูลที่แน่นอน
- 💭 **(ข้าคิดเอง อาจไม่ถูก100%)** - ความเห็นส่วนตัว
- ❌ **ไม่แน่ใจ** - แนะนำให้ถามเจ้าหน้าที่

### Multiple API Keys:
- รองรับหลาย Gemini API Keys
- Auto-fallback ถ้า key แรกหมด quota
- Free tier: 60 requests/min

---

## 🎨 Design System

### สีหลัก (Pirate Theme):
```css
--pirate-parchment: #f4e4c1  /* กระดาษเก่า */
--pirate-gold: #fbbf24       /* ทอง */
--pirate-treasure: #f59e0b   /* สมบัติ */
--pirate-wood: #78350f       /* ไม้ */
--pirate-rope: #92400e       /* เชือก */
```

### Fonts:
- **Headings**: Pirata One (Google Fonts)
- **Body**: Inter

### Components:
- `.pirate-page` - พื้นหลังกระดาษ + grid pattern
- `.pirate-card` - Card แบบโจรสลัด
- `.pirate-heading` - หัวข้อใหญ่
- `.pirate-button` - ปุ่มแบบโจรสลัด

---

## 🏗️ Build & Deployment

### Build for Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

ไฟล์ที่ build จะอยู่ใน `dist/`

### Deploy

โปรเจคนี้รองรับ:
- ✅ **Vercel** (แนะนำ)
- ✅ **Netlify**
- ✅ **Firebase Hosting**
- ✅ **Static Hosting** ใดก็ได้

**Vercel Deployment:**
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

**Environment Variables ใน Vercel:**
- ไปที่ Project Settings → Environment Variables
- เพิ่ม `VITE_FIREBASE_DB_URL`, `VITE_CHECKIN_SECRET` ฯลฯ
- Redeploy

---

## 📱 Mobile Support

- ✅ **Responsive Design** - รองรับทุกขนาดหน้าจอ
- ✅ **PWA Ready** - สามารถทำเป็น Progressive Web App
- ✅ **Touch Optimized** - ปุ่มและ UI เหมาะกับมือถือ
- ✅ **QR Scanner** - ใช้กล้องมือถือสแกน QR

---

## 🔒 Security Features

- ✅ **QR Code Signing** - ป้องกัน QR ปลอมด้วย HMAC-SHA256
- ✅ **Admin Session** - Session มีอายุ 12 ชม.
- ✅ **Phone Verification** - ป้องกันลงทะเบียนซ้ำ
- ✅ **Protected Routes** - ป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต
- ✅ **Input Validation** - ตรวจสอบข้อมูลด้วย Zod

---

## 🐛 Troubleshooting

### ปัญหาที่พบบ่อย:

**1. QR Scanner ไม่ทำงาน**
- ตรวจสอบว่าเปิดกล้องใน Browser
- ใช้ HTTPS (camera API ต้องการ secure context)

**2. AI Chatbot ไม่ตอบ**
- ตรวจสอบว่าตั้งค่า Gemini API Key แล้ว
- ดู Console เพื่อดู error details
- ตรวจสอบ quota ของ API key

**3. Firebase connection error**
- ตรวจสอบ `VITE_FIREBASE_DB_URL` ถูกต้อง
- ตรวจสอบ Firebase Rules อนุญาต read/write

**4. Admin login ไม่ได้**
- Default: `admin` / `admin123`
- ตรวจสอบใน Firebase: `admin_credentials/admin`

---

## 📈 Performance Optimizations

- ✅ **Lazy Loading** - Components โหลดตามต้องการ
- ✅ **React Query Caching** - Cache 30s, GC 5min
- ✅ **Code Splitting** - แยก chunks ตาม routes
- ✅ **Image Optimization** - รูปโหลดแบบ lazy
- ✅ **No Page Transition Animations** - Navigation ทันที

---

## 🤝 Contributing

### Development Workflow:

1. Create feature branch
```bash
git checkout -b feature/your-feature-name
```

2. Make changes และ test
```bash
npm run dev
```

3. Commit changes
```bash
git add .
git commit -m "Add feature: your feature description"
```

4. Push และสร้าง Pull Request
```bash
git push origin feature/your-feature-name
```

---

## 📄 License

This project is created for **FATU Open House 2025** event.

© 2024 คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์

---

## 👨‍💻 Development Team

- **คณะศิลปกรรมศาสตร์** - มหาวิทยาลัยธรรมศาสตร์

---

## 📞 Contact & Support

หากมีปัญหาหรือข้อสงสัย:
- ติดต่อทีมงาน Open House 2025
- คณะศิลปกรรมศาสตร์ มธ. ท่าพระจันทร์

---

## 🎯 TODO / Future Enhancements

- [ ] PWA Support (Add to Home Screen)
- [ ] Offline Mode
- [ ] Push Notifications
- [ ] Leaderboard System
- [ ] Social Sharing
- [ ] Multi-language Support (TH/EN)

---

<div align="center">
  <p>⚓ สร้างด้วย React, TypeScript, และความตั้งใจ 🏴‍☠️</p>
  <p><strong>ออกเรือไปกับเรา แล้วค้นพบสมบัติแห่งแรงบันดาลใจ!</strong></p>
</div>
