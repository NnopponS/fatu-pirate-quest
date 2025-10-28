# 📊 Google Sheets Integration Setup Guide

คู่มือการตั้งค่า Google Sheets เพื่อส่งข้อมูลไปยัง Google Sheets แบบเรียลไทม์

## 🎯 ภาพรวม

ด้วยระบบนี้ Admin สามารถ:
- ✅ ส่งข้อมูลทั้งหมดไปยัง Google Sheets อัตโนมัติ
- ✅ แบ่งข้อมูลเป็น Sheet ต่างๆ อัตโนมัติ:
  - ข้อมูลผู้ลงทะเบียน
  - เช็กอินสถานที่ทั้งหมด
  - เช็กอินแยกตามสถานที่
  - กิจกรรมย่อย
- ✅ ดูข้อมูลได้แบบเรียลไทม์บน Google Sheets
- ✅ แชร์ข้อมูลกับทีมได้ทันที

## 📋 ข้อกำหนดเบื้องต้น

1. Google Account
2. การเข้าถึง Google Drive / Google Sheets
3. Spreadsheet ID จาก Google Sheets ที่ต้องการส่งข้อมูล

## 🚀 วิธีตั้งค่า (ขั้นตอนละเอียด)

### Step 1: สร้าง Google Apps Script

1. ไปที่ https://script.google.com
2. คลิก "New Project"
3. ตั้งชื่อ Project เช่น "FATU Export Script"
4. วางโค้ดดังนี้:

```javascript
/**
 * Google Apps Script สำหรับ FATU Pirate Quest
 * ฟังก์ชันสำหรับรับและเขียนข้อมูลไปยัง Google Sheets
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'writeSheet') {
      const { spreadsheetId, sheetName, data: sheetData } = data;
      
      // เปิด Spreadsheet
      const ss = SpreadsheetApp.openById(spreadsheetId);
      
      // ตรวจสอบว่ามี Sheet นี้อยู่หรือไม่ ถ้าไม่มีให้สร้างใหม่
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // ลบข้อมูลเดิมทั้งหมด
      sheet.clear();
      
      // เขียนข้อมูลใหม่ทั้งหมด
      if (sheetData && sheetData.length > 0) {
        sheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
        
        // ปรับความกว้างของคอลัมน์ให้พอดี
        sheet.autoResizeColumns(1, sheetData[0].length);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true,
        message: `Data written to ${sheetName} successfully`
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      error: 'Unknown action' 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ฟังก์ชันทดสอบ (สำหรับทดสอบการทำงาน)
 */
function testWrite() {
  const spreadsheetId = 'YOUR_SPREADSHEET_ID';
  const sheetName = 'Test';
  const testData = [
    ['Header 1', 'Header 2', 'Header 3'],
    ['Data 1', 'Data 2', 'Data 3'],
    ['Data 4', 'Data 5', 'Data 6']
  ];
  
  const ss = SpreadsheetApp.openById(spreadsheetId);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.clear();
  sheet.getRange(1, 1, testData.length, testData[0].length).setValues(testData);
  sheet.autoResizeColumns(1, testData[0].length);
  
  Logger.log('Test data written successfully!');
}
```

5. บันทึกไฟล์ (Ctrl+S หรือ Cmd+S)

### Step 2: Deploy เป็น Web App

1. คลิก "Deploy" > "New deployment"
2. เลือก Type: "Web app"
3. ตั้งค่าดังนี้:
   - **Description**: FATU Export Script
   - **Execute as**: Me (your-email@gmail.com)
   - **Who has access**: Anyone
4. คลิก "Deploy"
5. รอให้ Deploy เสร็จ แล้วจะเห็น "Web app URL"
6. **คัดลอก URL นี้ไว้** (ตัวอย่าง: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`)

### Step 3: อนุญาตการเข้าถึง

1. ระบบจะขอให้ Review permissions
2. คลิก "Review permissions"
3. เลือกบัญชี Google ของคุณ
4. คลิก "Advanced" > "Go to FATU Export Script (unsafe)"
5. คลิก "Allow"

### Step 4: อัปเดต Web App URL ใน Code

1. เปิดไฟล์ `src/services/googleSheets.ts`
2. หาบรรทัดที่มี:

```typescript
const webAppUrl = `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`;
```

3. แทนที่ `YOUR_DEPLOYMENT_ID` ด้วย URL ที่คัดลอกมาตั้งแต่ Step 2:

```typescript
const webAppUrl = `https://script.google.com/macros/s/AKfyc...xyz/exec`;
```

### Step 5: สร้าง Google Sheets ใหม่ (Optional)

1. ไปที่ https://sheets.google.com
2. สร้าง Spreadsheet ใหม่
3. คัดลอก Spreadsheet ID จาก URL:

```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
```

ตัวอย่าง: 
- URL: `https://docs.google.com/spreadsheets/d/1ABcDeFgHiJkLmNoPqRsTuVwXyZ/edit`
- Spreadsheet ID: `1ABcDeFgHiJkLmNoPqRsTuVwXyZ`

### Step 6: ตั้งค่าใน Admin Dashboard

1. ไปที่ Admin Dashboard
2. ไปที่แท็บ "Export ข้อมูล"
3. เลื่อนไปที่ส่วน "Google Sheets Integration"
4. เปิดใช้งาน Google Sheets:
   - เปิดสวิตช์ "เปิดใช้งาน Google Sheets"
5. ใส่ Spreadsheet ID:
   - วาง Spreadsheet ID ที่ได้จาก Step 5
6. คลิก "บันทึกการตั้งค่า"
7. คลิก "ส่งข้อมูลไปยัง Sheets" เพื่อทดสอบ

## ✅ การทดสอบ

หลังจากตั้งค่าเสร็จ:

1. เปิด Admin Dashboard
2. ไปที่แท็บ "Export ข้อมูล"
3. คลิก "ส่งข้อมูลไปยัง Sheets"
4. ไปดูที่ Google Sheets ควรเห็นข้อมูลทั้งหมดถูกส่งมาแล้ว

### โครงสร้างข้อมูลที่จะถูกส่ง:

1. **Sheet: ผู้ลงทะเบียน**
   - ข้อมูลผู้ลงทะเบียนทั้งหมด พร้อมคะแนนและรางวัล

2. **Sheet: เช็กอินทั้งหมด**
   - ข้อมูลเช็กอินทั้งหมดจากทุกสถานที่

3. **Sheet: [ชื่อสถานที่]** (หลาย Sheets)
   - ข้อมูลเช็กอินแยกตามแต่ละสถานที่

4. **Sheet: กิจกรรมย่อย**
   - ข้อมูลการเข้าร่วมกิจกรรมย่อยทั้งหมด

## 🔧 การแก้ไขปัญหา

### ❌ "Error: Cannot find spreadsheet"
- ตรวจสอบว่า Spreadsheet ID ถูกต้อง
- ตรวจสอบว่า Spreadsheet มีการแชร์ให้ใช้งานได้

### ❌ "Error: Unauthorized"
- ตรวจสอบว่า Web App Deploy แล้ว
- ตรวจสอบว่า URL ถูกต้อง
- ลอง Deploy ใหม่อีกครั้ง

### ❌ "Error: Script execution not finished"
- ข้อมูลอาจจะมากเกินไป
- ลองลดข้อมูลที่ส่ง หรือแบ่งเป็นหลายครั้ง

### ❌ ส่งข้อมูลไม่สำเร็จ
- ตรวจสอบ Console log ใน Admin Dashboard
- ตรวจสอบว่า Spreadsheet ID ถูกต้อง
- ตรวจสอบ Network tab ใน DevTools

## 📝 หมายเหตุ

1. **Security**: Google Apps Script ที่ Deploy แบบ "Anyone" สามารถเรียกใช้จาก Client-side ได้
2. **Quota**: Google Apps Script มี quota ของ API calls ต่อวัน
3. **Performance**: การส่งข้อมูลปริมาณมากอาจใช้เวลา
4. **Real-time**: ข้อมูลจะถูกอัปเดตเมื่อ Admin คลิก "ส่งข้อมูลไปยัง Sheets" เท่านั้น

## 🎉 ขั้นตอนต่อไป

- ✅ ตั้งค่า Auto-refresh ด้วย Google Sheets' built-in refresh
- ✅ เพิ่ม Scheduled triggers ใน Google Apps Script
- ✅ เพิ่ม Data validation ใน Google Sheets
- ✅ ตั้งค่า Conditional formatting สำหรับข้อมูลสำคัญ

## 📞 การสนับสนุน

หากพบปัญหา ตรวจสอบ:
1. Console logs ใน Browser DevTools
2. Execution logs ใน Google Apps Script
3. Network requests ใน Browser DevTools

---

**สร้างโดย:** FATU Pirate Quest Team  
**วันที่:** 2025  
**เวอร์ชัน:** 1.0

