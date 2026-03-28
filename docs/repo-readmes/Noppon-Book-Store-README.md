# 📚 Noppon Book Store — ระบบร้านหนังสือ

<div align="center">

  <h3>ระบบจัดการร้านหนังสือออนไลน์ด้วย C# .NET</h3>

  <p>
    <img src="https://img.shields.io/badge/C%23-.NET_6-purple?logo=csharp" alt="C#"/>
    <img src="https://img.shields.io/badge/ASP.NET-web_app-blue?logo=dotnet" alt="ASP.NET"/>
    <img src="https://img.shields.io/badge/SQLite-database-blue?logo=sqlite" alt="SQLite"/>
    <img src="https://img.shields.io/badge/Windows_Forms-GUI-blueviolet" alt="WinForms"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**Noppon Book Store** คือระบบจัดการร้านหนังสือที่พัฒนาด้วย C# ประกอบด้วยทั้ง Desktop Application (Windows Forms) และ Web Application ที่จัดการสินค้า คำสั่งซื้อ และสมาชิก

## 🏗️ โครงสร้างโปรเจค

```
Noppon-Book-Store/
├── Noppon Book Store App/      # Desktop Application (Windows Forms)
│   ├── Models/                     # Data models
│   ├── Views/                      # UI forms
│   ├── Controllers/                # Business logic
│   └── Database/                   # SQLite database
└── Noppon Book Store Webpage/  # Web Application
    ├── Controllers/
    ├── Views/
    └── Models/
```

## ✨ Features

### Desktop App (Windows Forms)
- 📦 **จัดการสินค้า** — เพิ่ม แก้ไข ลบ ค้นหาหนังสือ
- 🛒 **ระบบขาย** — บันทึกการขาย ออก receipt
- 👥 **จัดการสมาชิก** — ลงทะเบียนและจัดการข้อมูลลูกค้า
- 📊 **รายงาน** — สรุปยอดขายและสินค้าคงเหลือ
- 💾 **SQLite Database** — เก็บข้อมูลในเครื่อง

### Web Application
- 🌐 **หน้าร้านออนไลน์** — แสดงรายการหนังสือ
- 🔍 **ค้นหาหนังสือ** — ค้นหาตามชื่อ ผู้แต่ง หมวดหมู่
- 🛒 **ตะกร้าสินค้า** — เพิ่มและสั่งซื้อ

## 🛠️ Tech Stack

- **Language:** C# (.NET 6)
- **Desktop:** Windows Forms
- **Web:** ASP.NET MVC / Razor Pages
- **Database:** SQLite + Entity Framework
- **ORM:** Entity Framework Core

## 🚀 Getting Started

### Prerequisites
- Visual Studio 2022
- .NET 6 SDK

### การรัน Desktop App

```bash
# เปิด solution ใน Visual Studio
# เลือก project: Noppon Book Store App
# กด F5 เพื่อ run
```

### การรัน Web App

```bash
cd "Noppon Book Store Webpage"
dotnet restore
dotnet run
```

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University (2022)

---

<div align="center">
  <p>📚 C# .NET Book Store Management System</p>
</div>
