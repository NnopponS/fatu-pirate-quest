# 🚁 DroneDetector

<div align="center">

  <h3>ระบบตรวจจับโดรนด้วย Computer Vision และ Machine Learning</h3>

  <p>
    <img src="https://img.shields.io/badge/Python-3.10+-blue?logo=python" alt="Python"/>
    <img src="https://img.shields.io/badge/YOLOv8-object_detection-red" alt="YOLO"/>
    <img src="https://img.shields.io/badge/OpenCV-4.x-green?logo=opencv" alt="OpenCV"/>
    <img src="https://img.shields.io/badge/PyTorch-deep_learning-orange?logo=pytorch" alt="PyTorch"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**DroneDetector** คือระบบตรวจจับโดรนแบบ real-time ด้วย Computer Vision ใช้โมเดล object detection (YOLOv8) เพื่อระบุตำแหน่งและติดตามโดรนจากภาพวิดีโอหรือกล้อง

## 🏗️ โครงสร้างโปรเจค

```
DroneDetector/
├── src/            # Source code หลัก
│   ├── detector.py     # โมดูลตรวจจับโดรน
│   ├── tracker.py      # โมดูลติดตาม object
│   └── utils.py        # Helper functions
├── models/         # Pre-trained model weights (.pt files)
├── data/           # Training data และ test datasets
├── assets/         # รูปภาพและวิดีโอตัวอย่าง
├── run_gui.py      # GUI application entry point
└── requirements.txt
```

## ✨ Features

- 🎯 **Real-time Detection** — ตรวจจับโดรนจากกล้องแบบ live
- 📹 **Video Analysis** — วิเคราะห์จากไฟล์วิดีโอที่บันทึกไว้
- 🖥️ **GUI Interface** — หน้าต่าง GUI ใช้งานง่าย
- 📊 **Confidence Score** — แสดงค่าความมั่นใจในการตรวจจับ
- 📏 **Bounding Box** — วาดกรอบรอบโดรนที่ตรวจพบ
- 💾 **Export Results** — บันทึกผลลัพธ์เป็นรูปภาพหรือวิดีโอ

## 🛠️ Tech Stack

- **Language:** Python 3.10+
- **Detection Model:** YOLOv8 (Ultralytics)
- **Computer Vision:** OpenCV 4.x
- **Deep Learning:** PyTorch
- **GUI:** Tkinter / PyQt5

## 🚀 Getting Started

### Prerequisites

- Python 3.10 หรือสูงกว่า
- GPU ที่รองรับ CUDA (แนะนำ) หรือ CPU

### Installation

```bash
# Clone repository
git clone https://github.com/NnopponS/DroneDetector.git
cd DroneDetector

# สร้าง virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# ติดตั้ง dependencies
pip install -r requirements.txt
```

### การใช้งาน

```bash
# รัน GUI application
python run_gui.py

# รัน detection จาก command line
python src/detector.py --source 0          # webcam
python src/detector.py --source video.mp4  # จากไฟล์วิดีโอ
python src/detector.py --source image.jpg  # จากรูปภาพ
```

## 📦 Requirements

```
ultralytics>=8.0.0
opencv-python>=4.8.0
torch>=2.0.0
numpy>=1.24.0
```

> ดู `requirements.txt` สำหรับ version ที่แน่นอน

## 🎯 Model Performance

| Metric | Value |
|--------|-------|
| mAP@0.5 | - |
| Inference Speed | - ms/frame |
| Input Resolution | 640×640 |

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University

---

<div align="center">
  <p>🚁 Drone Detection with AI — ระบบเฝ้าระวังโดรนอัจฉริยะ</p>
</div>
