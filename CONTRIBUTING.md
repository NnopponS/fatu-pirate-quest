# 🤝 Contributing to FATU Pirate Quest

ขอบคุณที่สนใจร่วมพัฒนาโปรเจคนี้! 🏴‍☠️

## 📋 สารบัญ

- [Code of Conduct](#code-of-conduct)
- [การตั้งค่า Development Environment](#การตั้งค่า-development-environment)
- [Workflow การพัฒนา](#workflow-การพัฒนา)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Coding Standards](#coding-standards)

---

## Code of Conduct

โปรดปฏิบัติตนอย่างสุภาพและเคารพต่อผู้อื่นในทุกการสื่อสาร

---

## การตั้งค่า Development Environment

```bash
# 1. Clone repository
git clone https://github.com/NnopponS/fatu-pirate-quest.git
cd fatu-pirate-quest

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env จาก example
cp .env.example .env
# แก้ไข .env ใส่ค่าจริง

# 4. รัน dev server
npm run dev
```

---

## Workflow การพัฒนา

1. **Fork** repository และ **clone** มาที่เครื่อง
2. สร้าง **feature branch** จาก `main`
   ```bash
   git checkout -b feature/ชื่อฟีเจอร์
   # หรือสำหรับ bug fix
   git checkout -b fix/ชื่อบั๊ก
   ```
3. **พัฒนา** และ **ทดสอบ** การเปลี่ยนแปลง
4. **Commit** ตาม guidelines ด้านล่าง
5. **Push** และสร้าง **Pull Request**

---

## Commit Message Guidelines

ใช้รูปแบบ [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

### Types:
| Type | ใช้เมื่อ |
|------|---------|
| `feat` | เพิ่มฟีเจอร์ใหม่ |
| `fix` | แก้ไขบั๊ก |
| `docs` | แก้ไข documentation |
| `style` | เปลี่ยน UI/CSS (ไม่ใช่ logic) |
| `refactor` | Refactor โค้ด |
| `perf` | ปรับปรุง performance |
| `chore` | งาน build/config |

### ตัวอย่าง:
```bash
feat(auth): เพิ่มการตรวจสอบเบอร์โทรซ้ำ
fix(qr): แก้ปัญหา scanner ไม่ทำงานบน iOS
docs: อัปเดต README วิธีติดตั้ง
```

---

## Coding Standards

- ใช้ **TypeScript** อย่างเต็มรูปแบบ (หลีกเลี่ยง `any`)
- Component ใช้ **React Functional Components** + hooks
- Styling ใช้ **TailwindCSS** (ไม่แนะนำ inline styles)
- Form validation ใช้ **Zod** + **React Hook Form**
- ตั้งชื่อ component เป็น **PascalCase** (เช่น `QRScannerModal`)
- ตั้งชื่อ functions/variables เป็น **camelCase**
- รัน `npm run lint` ก่อน commit ทุกครั้ง

---

## 🔒 Security

- **ห้ามใส่ API keys** หรือ secrets ใน code/commit
- ใช้ `.env` สำหรับค่าที่เป็นความลับ (ดู `.env.example`)
- รายงานช่องโหว่ด้านความปลอดภัยผ่าน Issues แบบ private

---

<div align="center">
  <p>⚓ ขอบคุณที่ร่วมสร้างการผจญภัยนี้ด้วยกัน! 🏴‍☠️</p>
</div>
