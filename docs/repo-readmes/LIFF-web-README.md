# 💚 LIFF Web — LINE Front-end Framework Web App

<div align="center">

  <h3>เว็บแอปพลิเคชันสำหรับ LINE Bot ด้วย LIFF (LINE Front-end Framework)</h3>

  <p>
    <img src="https://img.shields.io/badge/LIFF-LINE_SDK-brightgreen?logo=line" alt="LIFF"/>
    <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript" alt="JavaScript"/>
    <img src="https://img.shields.io/badge/CSS3-styling-blue?logo=css3" alt="CSS3"/>
    <img src="https://img.shields.io/badge/HTML5-markup-orange?logo=html5" alt="HTML5"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**LIFF Web** คือ web application ที่รันบน LINE app ผ่าน LIFF SDK ให้ผู้ใช้สามารถทำงานต่างๆ ภายใน LINE ได้โดยไม่ต้องออกจากแอป

## 🏗️ โครงสร้างโปรเจค

```
LIFF-web/
├── index.html      # หน้าหลัก LIFF app
├── css/            # Stylesheets
├── js/             # JavaScript modules
├── assets/         # รูปภาพและ media files
└── installV.mp4    # วิดีโอสาธิตการติดตั้ง
```

## ✨ Features

- 🔐 **LINE Login** — ล็อกอินด้วยบัญชี LINE อัตโนมัติ
- 👤 **User Profile** — ดึงข้อมูล profile จาก LINE
- 📤 **Message Sending** — ส่งข้อความกลับไปยัง LINE chat
- 📷 **Camera Access** — ถ่ายรูปและอัปโหลดภายใน LINE
- 📍 **Location Sharing** — แชร์ตำแหน่งผ่าน LINE

## 🛠️ Tech Stack

- **LIFF SDK:** v2.x
- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript
- **LINE Platform:** LINE Messaging API

## 🚀 Getting Started

### Prerequisites

- LINE Developer Account
- LIFF App ที่สร้างใน LINE Developers Console

### Setup

```bash
# Clone repository
git clone https://github.com/NnopponS/LIFF-web.git
cd LIFF-web
```

1. สร้าง LIFF App ใน [LINE Developers Console](https://developers.line.biz/)
2. คัดลอก **LIFF ID** 
3. แก้ไขในไฟล์ `js/app.js`:
   ```javascript
   const LIFF_ID = "your-liff-id-here";
   ```
4. Deploy ไปยัง hosting ที่รองรับ HTTPS (Vercel, Netlify, etc.)
5. อัปเดต Endpoint URL ใน LINE Developers Console

### Deploy

```bash
# Deploy to Vercel
vercel --prod
```

## 📋 Environment Variables

```env
LIFF_ID=your-liff-id
LINE_CHANNEL_ACCESS_TOKEN=your-channel-token
```

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University (2023)

---

<div align="center">
  <p>💚 Built with LINE LIFF SDK — Bringing Web into LINE</p>
</div>
