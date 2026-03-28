# 📊 WheelSense Dashboard MockUp

<div align="center">

  <h3>Dashboard แสดงข้อมูล Sensor แบบ Real-time สำหรับระบบ WheelSense</h3>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/React-18-blue?logo=react" alt="React"/>
    <img src="https://img.shields.io/badge/Vite-5.x-purple?logo=vite" alt="Vite"/>
    <img src="https://img.shields.io/badge/Firebase-Realtime_DB-orange?logo=firebase" alt="Firebase"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**WheelSense Dashboard** คือ web dashboard สำหรับแสดงข้อมูล sensor จากระบบ WheelSense แบบ real-time พัฒนาด้วย React + TypeScript และเชื่อมต่อกับ Firebase Realtime Database

> ℹ️ นี่คือ **MockUp / Prototype** ของ Dashboard ที่อยู่ระหว่างการพัฒนา

## ✨ Features

- 📈 **Real-time Charts** — กราฟข้อมูล sensor อัปเดตทุก 1 วินาที
- 🗺️ **Location Tracking** — แสดงตำแหน่ง wheelchair บนแผนที่
- 🚨 **Alert System** — แสดงการแจ้งเตือนเมื่อตรวจพบสิ่งกีดขวาง
- 📊 **Data History** — ประวัติข้อมูล sensor ย้อนหลัง
- 👥 **Multi-device** — ดูข้อมูลจากหลาย wheelchair พร้อมกัน

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS + shadcn/ui
- **Database:** Firebase Realtime Database
- **Charts:** Recharts
- **Deployment:** Vercel

## 🚀 Getting Started

```bash
# Clone และ install
git clone https://github.com/NnopponS/WheelSense-Dashboard-MockUp.git
cd WheelSense-Dashboard-MockUp
npm install

# ตั้งค่า Firebase
cp .env.example .env
# ใส่ VITE_FIREBASE_* ใน .env

# รัน dev server
npm run dev
```

## ⚙️ Environment Variables

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_DB_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## 🔗 Related Projects

- ⚙️ **Hardware:** [WheelSense_Project](https://github.com/NnopponS/WheelSense_Project)
- 🌐 **Webpage:** [WheelSense_Webpage](https://github.com/NnopponS/WheelSense_Webpage)

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University

---

<div align="center">
  <p>📊 Visualizing data to enhance wheelchair user safety</p>
</div>
