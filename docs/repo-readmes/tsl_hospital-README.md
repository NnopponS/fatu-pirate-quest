# 🏥 TSL Hospital — ระบบจัดการโรงพยาบาล

<div align="center">

  <h3>ระบบ AI วิเคราะห์และจัดการข้อมูลผู้ป่วยสำหรับโรงพยาบาล</h3>

  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python"/>
    <img src="https://img.shields.io/badge/Flask-web_framework-black?logo=flask" alt="Flask"/>
    <img src="https://img.shields.io/badge/Machine_Learning-scikit--learn-orange" alt="ML"/>
    <img src="https://img.shields.io/badge/SQLite-database-blue?logo=sqlite" alt="SQLite"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**TSL Hospital** คือระบบจัดการข้อมูลและวิเคราะห์ด้วย AI สำหรับโรงพยาบาล ช่วยในการบริหารจัดการผู้ป่วย วิเคราะห์แนวโน้ม และสนับสนุนการตัดสินใจทางการแพทย์

## 🏗️ โครงสร้างโปรเจค

```
tsl_hospital/
├── app.py          # Main Flask application
├── core/           # Core business logic
│   ├── models/         # ML models
│   ├── analysis/       # Data analysis modules
│   └── utils/          # Helper functions
├── configs/        # Configuration files
├── models/         # Trained ML model files
├── data/           # Sample datasets
└── requirements.txt
```

## ✨ Features

- 👨‍⚕️ **Patient Management** — บันทึกและจัดการข้อมูลผู้ป่วย
- 🤖 **AI Prediction** — วิเคราะห์และทำนายผลการรักษา
- 📊 **Dashboard** — แสดงสถิติและกราฟข้อมูลผู้ป่วย
- 📋 **Report Generation** — สร้างรายงานอัตโนมัติ
- 🔐 **Access Control** — ควบคุมสิทธิ์การเข้าถึงข้อมูล

## 🛠️ Tech Stack

- **Language:** Python 3.10+
- **Web Framework:** Flask
- **ML Libraries:** scikit-learn, pandas, numpy
- **Database:** SQLite
- **Visualization:** Matplotlib, Plotly

## 🚀 Getting Started

```bash
# Clone repository
git clone https://github.com/NnopponS/tsl_hospital.git
cd tsl_hospital

# สร้าง virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# ติดตั้ง dependencies
pip install -r requirements.txt

# รัน application
python app.py
```

เปิดเบราว์เซอร์ที่ `http://localhost:5000`

## 📦 Requirements

```
flask
pandas
numpy
scikit-learn
matplotlib
```

> ดู `requirements.txt` สำหรับ version ที่แน่นอน

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University

---

<div align="center">
  <p>🏥 AI for Healthcare — เทคโนโลยีเพื่อสุขภาพที่ดีกว่า</p>
</div>
