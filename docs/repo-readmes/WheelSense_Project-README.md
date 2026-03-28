# ♿ WheelSense Project — Embedded Systems & Server

<div align="center">

  <h3>ระบบ IoT ตรวจจับสิ่งกีดขวางสำหรับวีลแชร์อัจฉริยะ</h3>

  <p>
    <img src="https://img.shields.io/badge/PlatformIO-embedded-orange?logo=platformio" alt="PlatformIO"/>
    <img src="https://img.shields.io/badge/WiFi_Mesh-ESP32-blue" alt="ESP32"/>
    <img src="https://img.shields.io/badge/MQTT-protocol-purple" alt="MQTT"/>
    <img src="https://img.shields.io/badge/TypeScript-server-blue?logo=typescript" alt="TypeScript"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**WheelSense** คือระบบ IoT ที่ใช้ sensor ตรวจจับสิ่งกีดขวางรอบวีลแชร์ และส่งข้อมูลแบบ real-time ผ่าน WiFi Mesh Network และ MQTT protocol เพื่อเพิ่มความปลอดภัยให้กับผู้ใช้วีลแชร์

## 🏗️ โครงสร้างโปรเจค

```
WheelSense_Project/
├── ID_Wheel_Xiao_PlatformIO/   # Embedded firmware สำหรับ Seeed XIAO (PlatformIO)
├── WheelSense-Server/          # Backend server (TypeScript/Node.js)
├── WiFiMeshAndMQTT/            # WiFi Mesh + MQTT communication modules
└── nrfutil.exe                 # Nordic Semiconductor utility tool
```

## ✨ Features หลัก

- 📡 **WiFi Mesh Network** — Nodes หลายตัวสื่อสารกันได้โดยไม่ต้องผ่าน router
- 🔊 **Obstacle Detection** — ตรวจจับสิ่งกีดขวางด้วย ultrasonic/IR sensors
- 📲 **Real-time Alerts** — ส่งการแจ้งเตือนผ่าน MQTT → Mobile App
- 🔋 **Low Power** — ออกแบบให้ประหยัดพลังงาน
- 📊 **Data Logging** — บันทึกข้อมูล sensor สำหรับวิเคราะห์

## 🛠️ Hardware & Tech Stack

### Hardware
- **MCU:** Seeed XIAO (nRF52840 / ESP32)
- **Sensors:** Ultrasonic (HC-SR04), IR sensor
- **Communication:** WiFi 802.11 b/g/n, Bluetooth 5.0

### Software
- **Firmware:** C++ (PlatformIO + Arduino Framework)
- **Protocol:** MQTT (Mosquitto broker)
- **Server:** Node.js + TypeScript
- **Network:** WiFi Mesh (painlessMesh library)

## 🚀 Getting Started

### Firmware (PlatformIO)

```bash
# ติดตั้ง PlatformIO IDE (VS Code extension)
# เปิดโฟลเดอร์ ID_Wheel_Xiao_PlatformIO
# แก้ไข platformio.ini ให้ตรงกับบอร์ด

# Build และ Upload
pio run --target upload
```

### Server

```bash
cd WheelSense-Server
npm install
cp .env.example .env
npm run dev
```

## 🔗 Related Projects

- 🌐 **Webpage:** [WheelSense_Webpage](https://github.com/NnopponS/WheelSense_Webpage)
- 📊 **Dashboard:** [WheelSense-Dashboard-MockUp](https://github.com/NnopponS/WheelSense-Dashboard-MockUp)

## 👨‍💻 Team

**Noppon Sangsasri** & Team — Thammasat University

---

<div align="center">
  <p>♿ Smart Wheelchair Technology — เทคโนโลยีเพื่อคุณภาพชีวิตที่ดีขึ้น</p>
</div>
