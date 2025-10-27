import { firebaseDb } from "@/integrations/firebase/database";

// Declare puter global from Puter.js (following official API)
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (message: string, imageUrl?: string | any, options?: any) => Promise<any>;
      };
    };
  }
}

// Puter global (no window prefix needed)
declare const puter: {
  ai: {
    chat: (message: string, imageUrl?: string | any, options?: any) => Promise<any>;
  };
};

interface PuterSettings {
  knowledgeBase?: string; // Context/knowledge for the chatbot
}

// Get Puter settings from Firebase (only knowledge base, no API key needed!)
export const getGeminiSettings = async (): Promise<PuterSettings | null> => {
  try {
    const settings = await firebaseDb.get<PuterSettings>("settings/puter");
    return settings;
  } catch (error) {
    console.error("Error getting Puter settings:", error);
    return null;
  }
};

// Save Puter settings (Admin only)
export const saveGeminiSettings = async (token: string, settings: PuterSettings): Promise<void> => {
  // Validate admin token
  const adminToken = await firebaseDb.get<string>(`admin_sessions/${token}`);
  if (!adminToken) {
    throw new Error("Unauthorized");
  }

  await firebaseDb.set("settings/puter", settings);
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

// Chat with pirate using Puter.js AI (FREE! No API key needed!)
// Following official tutorial: https://developer.puter.com/tutorials/free-gemini-api/
export const chatWithPirate = async (
  userMessage: string,
  userContext?: UserContext
): Promise<string> => {
  // Check if Puter.js is loaded
  if (typeof puter === 'undefined') {
    throw new Error("Puter.js is not loaded. Please refresh the page.");
  }

  const settings = await getGeminiSettings();

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

${settings?.knowledgeBase ? `\n\nข้อมูลเพิ่มเติมเกี่ยวกับงาน:\n${settings.knowledgeBase}` : ""}

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
    // Use Puter.js AI chat following official API
    // Reference: https://developer.puter.com/tutorials/free-gemini-api/
    const fullPrompt = `${systemPrompt}\n\n---\n\nคำถามจาก User: ${userMessage}`;
    
    // Call Puter AI with official format
    const response = await puter.ai.chat(fullPrompt, {
      model: 'google/gemini-2.5-flash', // Latest Gemini 2.5 Flash - Fast & Smart
      stream: false,
      mode: 'background', // Run in background to prevent loading popup
    });

    // Extract content from response (official format: response.message.content)
    if (response?.message?.content) {
      return response.message.content;
    } else if (typeof response === 'string') {
      return response;
    } else {
      throw new Error("Invalid response format");
    }
  } catch (error: any) {
    console.error("Puter AI chat error:", error);
    throw new Error("ข้าไม่สามารถตอบได้ในตอนนี้ ลองใหม่อีกครั้งนะ!");
  }
};

