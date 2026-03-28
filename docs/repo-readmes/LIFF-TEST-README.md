# 💚 LIFF TEST — LINE LIFF Template

<div align="center">

  <h3>Template สำหรับเริ่มต้นพัฒนา LINE LIFF Application</h3>

  <p>
    <img src="https://img.shields.io/badge/LIFF-LINE_SDK-brightgreen?logo=line" alt="LIFF"/>
    <img src="https://img.shields.io/badge/HTML5-template-orange?logo=html5" alt="HTML5"/>
    <img src="https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript" alt="JavaScript"/>
    <img src="https://img.shields.io/badge/type-template-blue" alt="Template"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**LIFF-TEST** คือ template repository สำหรับเริ่มต้นพัฒนา LINE LIFF (LINE Front-end Framework) Application พร้อม backend สำหรับ LINE Messaging API

> 🧩 นี่คือ **Template Repository** — สามารถใช้เป็น starting point สำหรับโปรเจค LIFF ใหม่

## 🏗️ โครงสร้าง Template

```
LIFF-TEST/
├── index.html      # หน้าหลัก LIFF app
├── answer.html     # หน้า response/callback
├── css/            # Stylesheets
├── js/             # JavaScript modules
│   └── liff.js         # LIFF SDK integration
├── backend/        # Backend server
│   ├── app.js          # Node.js/Express server
│   └── ...
└── path/           # Route configuration
```

## 🚀 วิธีใช้ Template นี้

1. คลิก **"Use this template"** บน GitHub
2. ตั้งชื่อ repository ใหม่
3. Clone และแก้ไข `LIFF_ID` ในไฟล์ `js/liff.js`
4. Deploy ไปยัง hosting ที่รองรับ HTTPS

## ⚙️ Configuration

```javascript
// js/liff.js
const LIFF_ID = "your-liff-id-here";

liff.init({ liffId: LIFF_ID })
  .then(() => {
    // Your code here
  });
```

## 📋 Prerequisites

- LINE Developer Account
- LIFF App ที่สร้างใน [LINE Developers Console](https://developers.line.biz/)
- HTTPS hosting (Vercel, Netlify, Firebase Hosting)

## 🛠️ Tech Stack

- **LIFF SDK:** LINE LIFF v2.x
- **Frontend:** HTML5 + CSS3 + JavaScript
- **Backend:** Node.js + Express (ใน `/backend`)

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University (2023)

---

<div align="center">
  <p>💚 Use this template to kickstart your LIFF project!</p>
</div>
