# 🖥️ Mama Mai Project — GUI Homework

<div align="center">

  <h3>การบ้าน GUI Programming ด้วย C# Windows Forms</h3>

  <p>
    <img src="https://img.shields.io/badge/C%23-.NET-purple?logo=csharp" alt="C#"/>
    <img src="https://img.shields.io/badge/Windows_Forms-GUI-blueviolet" alt="WinForms"/>
    <img src="https://img.shields.io/badge/type-homework-yellow" alt="Homework"/>
  </p>

</div>

---

## 📖 เกี่ยวกับโปรเจค

**Mama Mai Project** คือการบ้าน GUI Programming ด้วย C# Windows Forms พัฒนาแอปพลิเคชันแสดงข้อมูลและ UI สำหรับโปรเจค "Mama Mai" (แม่ไม้)

## 📂 โครงสร้าง

```
Mama-Mai-Project/
├── GuiHomeWork1.sln        # Visual Studio Solution
└── GuiHomeWork1/           # Main project
    ├── Form1.cs                # Main form
    ├── Form1.Designer.cs       # UI designer code
    ├── *.cs                    # Additional forms/classes
    └── GuiHomeWork1.csproj     # Project file
```

## ✨ Features

- 🎨 **Windows Forms UI** — Interface กราฟิกสำหรับ Windows
- 📝 **Form Validation** — ตรวจสอบข้อมูลที่ผู้ใช้กรอก
- 🔘 **Controls ต่างๆ** — Button, TextBox, Label, ComboBox, etc.
- 📊 **Data Display** — แสดงข้อมูลในรูปแบบต่างๆ

## 📚 สิ่งที่เรียนรู้

- การสร้าง GUI ด้วย Windows Forms Designer
- Event-driven programming
- Control properties และ events
- Form communication (ส่งข้อมูลระหว่าง forms)
- Object-Oriented Programming ใน C#

## 🚀 การรัน

### Prerequisites
- Visual Studio 2019+ 
- .NET Framework 4.x หรือ .NET 6

```bash
# เปิดไฟล์ GuiHomeWork1.sln ใน Visual Studio
# กด F5 หรือ Ctrl+F5 เพื่อ run
```

## 💻 ตัวอย่างโค้ด

```csharp
// Event handler สำหรับปุ่ม
private void btnSubmit_Click(object sender, EventArgs e)
{
    string name = txtName.Text.Trim();
    
    if (string.IsNullOrEmpty(name))
    {
        MessageBox.Show("กรุณากรอกชื่อ!", "แจ้งเตือน", 
                        MessageBoxButtons.OK, MessageBoxIcon.Warning);
        return;
    }
    
    lblResult.Text = $"สวัสดี, {name}!";
}
```

## 👨‍💻 Developer

**Noppon Sangsasri** — Thammasat University (2022)

---

<div align="center">
  <p>🖥️ C# Windows Forms — GUI Programming Homework</p>
</div>
