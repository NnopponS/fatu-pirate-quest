# 📍 LocationTracking — ระบบติดตามตำแหน่ง

<div align="center">

  <h3>ระบบ Real-time Location Tracking ด้วย Python Flask</h3>

  <p>
    <img src="https://img.shields.io/badge/Python-3.x-blue?logo=python" alt="Python"/>
    <img src="https://img.shields.io/badge/Flask-web_framework-black?logo=flask" alt="Flask"/>
    <img src="https://img.shields.io/badge/Heroku-deployed-purple?logo=heroku" alt="Heroku"/>
    <img src="https://img.shields.io/badge/Google_Maps-API-red?logo=googlemaps" alt="Google Maps"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**LocationTracking** คือระบบติดตามตำแหน่งแบบ real-time พัฒนาด้วย Python Flask รองรับการแสดงตำแหน่งบน Google Maps และวิเคราะห์ข้อมูลการเดินทาง

## 🏗️ โครงสร้างโปรเจค

```
LocationTracking/
├── app.py              # Flask application หลัก
├── casedata.xlsx       # ข้อมูล case study สำหรับทดสอบ
├── requirements.txt    # Python dependencies
├── runtime.txt         # Python version สำหรับ Heroku
└── Procfile            # Heroku deployment config
```

## ✨ Features

- 📍 **Real-time Tracking** — แสดงตำแหน่งบนแผนที่แบบ live
- 🗺️ **Google Maps Integration** — แสดงผลบน Google Maps
- 📊 **Data Analysis** — วิเคราะห์ข้อมูลการเดินทางจาก Excel
- 🌐 **REST API** — API สำหรับรับ/ส่งข้อมูลตำแหน่ง
- ☁️ **Cloud Deployed** — Deploy บน Heroku

## 🛠️ Tech Stack

- **Backend:** Python + Flask
- **Maps:** Google Maps JavaScript API
- **Data:** Pandas + OpenPyXL (Excel)
- **Deployment:** Heroku

## 🚀 Getting Started

### Local Development

```bash
# Clone repository
git clone https://github.com/NnopponS/LocationTracking.git
cd LocationTracking

# สร้าง virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# รัน application
python app.py
```

### Deploy บน Heroku

```bash
# Login Heroku
heroku login

# สร้าง app ใหม่
heroku create your-app-name

# Deploy
git push heroku main
```

## 📦 Requirements

```
flask
pandas
openpyxl
gunicorn
```

> ดู `requirements.txt` สำหรับ version ที่แน่นอน

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University (2023)

---

<div align="center">
  <p>📍 Track. Analyze. Navigate.</p>
</div>
