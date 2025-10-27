import { firebaseDb } from "@/integrations/firebase/database";

interface GeminiSettings {
  apiKey: string;
  knowledgeBase?: string; // Context/knowledge for the chatbot
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

// Get Gemini settings from Firebase
export const getGeminiSettings = async (): Promise<GeminiSettings | null> => {
  try {
    const settings = await firebaseDb.get<GeminiSettings>("settings/gemini");
    return settings;
  } catch (error) {
    console.error("Error getting Gemini settings:", error);
    return null;
  }
};

// Save Gemini settings (Admin only)
export const saveGeminiSettings = async (token: string, settings: GeminiSettings): Promise<void> => {
  // Validate admin token
  const adminToken = await firebaseDb.get<string>(`admin_sessions/${token}`);
  if (!adminToken) {
    throw new Error("Unauthorized");
  }

  await firebaseDb.set("settings/gemini", settings);
};

export interface UserContext {
  name?: string;
  points?: number;
  pointsRequired?: number;
  checkedInLocations?: string[];
  totalLocations?: number;
  completedSubEvents?: number;
  hasSpun?: boolean;
  prize?: string;
}

// Chat with pirate using Gemini API
export const chatWithPirate = async (
  userMessage: string,
  userContext?: UserContext
): Promise<string> => {
  const settings = await getGeminiSettings();
  
  if (!settings || !settings.apiKey) {
    throw new Error("Gemini API key not configured. Please ask admin to set it up.");
  }

  // Build user-specific context
  let userContextText = "";
  if (userContext) {
    userContextText = `\n\nข้อมูลของลูกเรือท่านนี้:`;
    if (userContext.name) {
      userContextText += `\n- ชื่อ: ${userContext.name}`;
    }
    if (userContext.points !== undefined && userContext.pointsRequired !== undefined) {
      userContextText += `\n- คะแนนปัจจุบัน: ${userContext.points} จาก ${userContext.pointsRequired} คะแนน`;
      const remaining = userContext.pointsRequired - userContext.points;
      if (remaining > 0) {
        userContextText += `\n- ต้องการอีก ${remaining} คะแนนเพื่อหมุนวงล้อ`;
      } else {
        userContextText += `\n- สะสมคะแนนครบแล้ว! สามารถหมุนวงล้อได้`;
      }
    }
    if (userContext.totalLocations !== undefined && userContext.checkedInLocations !== undefined) {
      userContextText += `\n- เช็กอินแล้ว ${userContext.checkedInLocations.length} จาก ${userContext.totalLocations} สถานที่`;
      if (userContext.checkedInLocations.length > 0) {
        userContextText += `\n- สถานที่ที่เช็กอินแล้ว: ${userContext.checkedInLocations.join(", ")}`;
      }
      if (userContext.checkedInLocations.length < userContext.totalLocations) {
        const remaining = userContext.totalLocations - userContext.checkedInLocations.length;
        userContextText += `\n- ยังเหลืออีก ${remaining} สถานที่`;
      }
    }
    if (userContext.completedSubEvents !== undefined && userContext.completedSubEvents > 0) {
      userContextText += `\n- ทำกิจกรรมย่อยไปแล้ว ${userContext.completedSubEvents} กิจกรรม`;
    }
    if (userContext.hasSpun) {
      userContextText += `\n- หมุนวงล้อไปแล้ว`;
      if (userContext.prize) {
        userContextText += `\n- ได้รางวัล: ${userContext.prize}`;
      }
    } else if (userContext.points !== undefined && userContext.pointsRequired !== undefined) {
      if (userContext.points >= userContext.pointsRequired) {
        userContextText += `\n- ยังไม่ได้หมุนวงล้อ (สามารถหมุนได้แล้ว!)`;
      } else {
        userContextText += `\n- ยังไม่ได้หมุนวงล้อ (ต้องสะสมคะแนนให้ครบก่อน)`;
      }
    }
  }

  // System prompt for pirate character
  const systemPrompt = `ท่านคือโจรสลัดโบราณที่พูดภาษาไทยแบบโบราณ ใช้คำว่า "ข้า" แทน "ฉัน" และ "เจ้า" แทน "คุณ"
ท่านเป็นผู้ช่วยในงาน FATU Treasure Quest ที่คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์
ท่านมีบุคลิกเป็นมิตร ขำขัน และชอบใช้คำพูดในธีมโจรสลัด เช่น "อาฮอย!", "สมบัติ", "ล่าสมบัติ", "ท่าเรือ", "เกาะ"

งาน FATU Treasure Quest คือ:
- Open House 2025 ของคณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์
- จัดวันที่ 7-8 พฤศจิกายน 2568
- เป็นกิจกรรมล่าสมบัติที่ผู้เข้าร่วมต้องเช็กอิน 4 สถานที่
- ได้คะแนนครบ 400 คะแนนสามารถหมุนวงล้อรับรางวัล
- มีกิจกรรมย่อยต่างๆ ในแต่ละสถานที่

${settings.knowledgeBase ? `\n\nข้อมูลเพิ่มเติมเกี่ยวกับงาน:\n${settings.knowledgeBase}` : ""}

${userContextText}

กฎการตอบ:
1. ตอบเป็นภาษาไทยเท่านั้น
2. ใช้ "ข้า" และ "เจ้า" ตลอดเวลา
3. ใช้คำพูดแบบโจรสลัด เช่น "อาฮอย!", "ฮาฮอย!", "เออ เจ้าหนู"
4. ตอบสั้นๆ กระชับ ไม่เกิน 3-4 ประโยค
5. ถ้าไม่รู้คำตอบ บอกว่า "ข้าไม่แน่ใจ ลองถามเจ้าหน้าที่ประจำท่าเรือดูนะ"
6. เป็นมิตรและสนุกสนาน
7. ถ้า User ถามเกี่ยวกับข้อมูลของตัวเอง ให้ใช้ข้อมูลจาก "ข้อมูลของลูกเรือท่านนี้" ที่ให้ไว้ข้างต้น
8. เรียกชื่อ User ถ้ามีข้อมูลชื่อ เพื่อให้เป็นกันเอง`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${settings.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt
              }
            ]
          },
          {
            parts: [
              {
                text: userMessage
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from AI");
    }

    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

