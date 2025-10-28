import { firebaseDb } from "@/integrations/firebase/database";
import type { DashboardResponse } from "@/services/firebase";

export interface GoogleSheetsSettings {
  enabled: boolean;
  spreadsheetId?: string;
  range?: string;
}

// Get Google Sheets settings from Firebase
export const getGoogleSheetsSettings = async (): Promise<GoogleSheetsSettings | null> => {
  try {
    const settings = await firebaseDb.get<GoogleSheetsSettings>("settings/google_sheets");
    return settings;
  } catch (error) {
    console.error("Error getting Google Sheets settings:", error);
    return null;
  }
};

// Save Google Sheets settings (Admin only)
export const saveGoogleSheetsSettings = async (token: string, settings: GoogleSheetsSettings): Promise<void> => {
  // Validate admin token
  const adminToken = await firebaseDb.get<string>(`admin_sessions/${token}`);
  if (!adminToken) {
    throw new Error("Unauthorized");
  }

  await firebaseDb.set("settings/google_sheets", settings);
};

// Push data to Google Sheets using a Web App URL (client-side approach)
export const pushToGoogleSheets = async (
  spreadsheetId: string,
  sheetName: string,
  data: any[][]
): Promise<void> => {
  if (!spreadsheetId) {
    throw new Error("Spreadsheet ID is required");
  }

  // Use Google Apps Script Web App URL
  // You need to create this web app and provide the URL
  const webAppUrl = `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`;

  try {
    const response = await fetch(webAppUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "writeSheet",
        spreadsheetId,
        sheetName,
        data,
      }),
    });

    console.log("Data pushed to Google Sheets:", response);
  } catch (error) {
    console.error("Error pushing to Google Sheets:", error);
    throw error;
  }
};

// Export all data to Google Sheets
export const exportAllDataToGoogleSheets = async (
  dashboard: DashboardResponse,
  settings: GoogleSheetsSettings
): Promise<void> => {
  if (!settings.enabled || !settings.spreadsheetId) {
    throw new Error("Google Sheets integration is not configured");
  }

  const spreadsheetId = settings.spreadsheetId;

  // 1. Push Participants Data
  const participantsData = [
    ["ID", "Username", "ชื่อ", "นามสกุล", "คะแนน", "อายุ", "ระดับชั้น", "สถานศึกษา", "โปรแกรม", "เบอร์โทร", "สถานะรางวัล", "รางวัลที่ได้", "รหัสรับรางวัล", "มอบรางวัลแล้ว", "วันที่มอบรางวัล", "ลงทะเบียนเมื่อ"],
    ...dashboard.participants.map((p) => {
      const spin = dashboard.spins.find((s) => s.participant_id === p.id);
      return [
        p.id,
        p.username,
        p.first_name,
        p.last_name,
        p.points,
        p.age ?? "",
        p.grade_level ?? "",
        p.school ?? "",
        p.program ?? "",
        p.phone_number ?? "",
        spin ? "หมุนวงล้อแล้ว" : "ยังไม่ได้หมุน",
        spin ? spin.prize : "-",
        spin ? spin.claim_code : "-",
        spin ? (spin.claimed ? "มอบแล้ว" : "รอมอบ") : "-",
        spin && spin.claimed_at ? new Date(spin.claimed_at).toLocaleString('th-TH') : "-",
        new Date(p.created_at).toLocaleString('th-TH'),
      ];
    }),
  ];

  await pushToGoogleSheets(spreadsheetId, "ผู้ลงทะเบียน", participantsData);

  // 2. Push All Checkins
  const allCheckinsData = [
    ["Checkin ID", "Participant ID", "Username", "ชื่อ-นามสกุล", "Location ID", "ชื่อสถานที่", "Method", "เช็กอินเมื่อ"],
    ...dashboard.checkins.map((checkin) => {
      const participant = dashboard.participants.find((p) => p.id === checkin.participant_id);
      const location = dashboard.locations.find((l) => l.id === checkin.location_id);
      return [
        `${checkin.participant_id}-${checkin.location_id}`,
        checkin.participant_id,
        participant?.username ?? "",
        participant ? `${participant.first_name} ${participant.last_name}` : "",
        String(checkin.location_id),
        location?.name ?? "",
        checkin.method,
        new Date(checkin.created_at).toISOString(),
      ];
    }),
  ];

  await pushToGoogleSheets(spreadsheetId, "เช็กอินทั้งหมด", allCheckinsData);

  // 3. Push Checkins by Location
  for (const location of dashboard.locations) {
    const locationCheckins = dashboard.checkins.filter((c) => c.location_id === location.id);
    const locationData = [
      ["Participant ID", "Username", "ชื่อ-นามสกุล", "Method", "เช็กอินเมื่อ"],
      ...locationCheckins.map((checkin) => {
        const participant = dashboard.participants.find((p) => p.id === checkin.participant_id);
        return [
          checkin.participant_id,
          participant?.username ?? "",
          participant ? `${participant.first_name} ${participant.last_name}` : "",
          checkin.method,
          new Date(checkin.created_at).toLocaleString('th-TH'),
        ];
      }),
    ];
    
    const sheetName = location.name.substring(0, 31); // Google Sheets limit
    await pushToGoogleSheets(spreadsheetId, sheetName, locationData);
  }

  // 4. Push Sub Events Data
  const subEventsData = [
    ["Checkin ID", "Participant ID", "Username", "ชื่อ-นามสกุล", "Sub Event ID", "ชื่อกิจกรรม", "Location ID", "ชื่อสถานที่", "คะแนนที่ได้", "เข้าร่วมเมื่อ"],
    ...dashboard.subEventCheckins.map((checkin) => {
      const participant = dashboard.participants.find((p) => p.id === checkin.participant_id);
      const location = dashboard.locations.find((l) => l.id === checkin.location_id);
      const subEvent = location?.sub_events?.find((se) => se.id === checkin.sub_event_id);
      return [
        `${checkin.participant_id}-${checkin.sub_event_id}`,
        checkin.participant_id,
        participant?.username ?? "",
        participant ? `${participant.first_name} ${participant.last_name}` : "",
        checkin.sub_event_id,
        subEvent?.name ?? "",
        checkin.location_id,
        location?.name ?? "",
        checkin.points_awarded,
        new Date(checkin.created_at).toLocaleString('th-TH'),
      ];
    }),
  ];

  await pushToGoogleSheets(spreadsheetId, "กิจกรรมย่อย", subEventsData);
};

// Get the Google Apps Script setup instructions
export const getGoogleSheetsSetupInstructions = (): string => {
  return `
# 📊 Google Sheets Integration Setup

## Step 1: Create Google Apps Script

1. ไปที่ https://script.google.com
2. สร้าง New Project
3. วางโค้ดดังนี้:

\`\`\`javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'writeSheet') {
      const { spreadsheetId, sheetName, data: sheetData } = data;
      const ss = SpreadsheetApp.openById(spreadsheetId);
      let sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
      }
      
      // Clear existing data
      sheet.clear();
      
      // Write new data
      sheet.getRange(1, 1, sheetData.length, sheetData[0].length).setValues(sheetData);
      
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
\`\`\`

## Step 2: Deploy as Web App

1. Click "Deploy" > "New deployment"
2. Choose type "Web app"
3. Set Execute as: "Me"
4. Set Who has access: "Anyone"
5. Click "Deploy"
6. Copy the Web app URL

## Step 3: Update Web App URL

1. เปิดไฟล์ \`src/services/googleSheets.ts\`
2. แทนที่ \`YOUR_DEPLOYMENT_ID\` ด้วย Web app URL ที่ได้

## Step 4: Configure in Admin Dashboard

1. ไปที่ Admin Dashboard
2. ไปที่แท็บ "Export ข้อมูล"
3. เปิดใช้งาน Google Sheets
4. ใส่ Spreadsheet ID (จาก URL ของ Google Sheet)
5. Click "บันทึก"
  `;
};
