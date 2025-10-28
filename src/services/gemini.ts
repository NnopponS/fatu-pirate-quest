import { firebaseDb } from "@/integrations/firebase/database";

interface AISettings {
  openRouterKey?: string; // OpenRouter API Key
  knowledgeBase?: string; // Context/knowledge for the chatbot
}

// Get AI settings from Firebase
export const getGeminiSettings = async (): Promise<AISettings | null> => {
  try {
    const settings = await firebaseDb.get<AISettings>("settings/ai");
    return settings;
  } catch (error) {
    console.error("Error getting AI settings:", error);
    return null;
  }
};

// Save AI settings (Admin only)
export const saveGeminiSettings = async (token: string, settings: AISettings): Promise<void> => {
  // Validate admin token
  const adminToken = await firebaseDb.get<string>(`admin_sessions/${token}`);
  if (!adminToken) {
    throw new Error("Unauthorized");
  }

  await firebaseDb.set("settings/ai", settings);
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

// Chat with pirate using OpenRouter AI (FREE!)
export const chatWithPirate = async (
  userMessage: string,
  userContext?: UserContext
): Promise<string> => {

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
- เป็นกิจกรรมล่าสมบัติที่มี 4 สถานที่ ผู้เข้าร่วมต้องเช็กอินอย่างน้อย 3 จาก 4 สถานที่
- ได้คะแนนครบ 300 คะแนนสามารถหมุนวงล้อรับรางวัล
- มีกิจกรรมย่อยต่างๆ ในแต่ละสถานที่ที่สามารถทำเพื่อรับคะแนนเพิ่ม

${settings?.knowledgeBase ? `\n\nข้อมูลเพิ่มเติมเกี่ยวกับงาน:\n${settings.knowledgeBase}` : ""}

${userContextText}

กฎการตอบ:
1. ตอบเป็นภาษาไทยเท่านั้น
2. ใช้ "ข้า" และ "เจ้า" ตลอดเวลา
3. ใช้คำพูดแบบโจรสลัด เช่น "อาฮอย!", "ฮาฮอย!", "เออ เจ้าหนู"
4. ตอบสั้นๆ กระชับ ไม่เกิน 3-4 ประโยค
5. ถ้าไม่รู้คำตอบหรือข้อมูลไม่ครบถ้วน ให้บอกว่า "ข้าไม่แน่ใจในรายละเอียด ลองถามเจ้าหน้าที่ประจำท่าเรือดูนะ เพื่อให้ได้คำตอบที่แม่นยำ!"
6. เป็นมิตรและสนุกสนาน
7. ถ้า User ถามเกี่ยวกับข้อมูลของตัวเอง ให้ใช้ข้อมูลจาก "ข้อมูลของลูกเรือท่านนี้" ที่ให้ไว้ข้างต้น
8. เรียกชื่อ User ถ้ามีข้อมูลชื่อ เพื่อให้เป็นกันเอง
9. ถ้าถามเรื่องสถานที่หรือรายละเอียดงาน ให้ใช้ข้อมูลจาก "ข้อมูลเพิ่มเติมเกี่ยวกับงาน" ที่ Admin ตั้งค่าไว้`;

  const fullPrompt = `${systemPrompt}\n\n---\n\nคำถามจาก User: ${userMessage}`;
  
  console.log('[OpenRouter AI] Sending request...');
  
  try {
    // Create timeout promise (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings?.openRouterKey || 'sk-or-v1-b5b3c0e5c3b5b3c0e5c3b5b3c0e5c3b5b3c0e5c3b5b3c0e5c3b5b3c0e5c3b5b3c0e5c3'}`, // Placeholder for free tier
        'HTTP-Referer': window.location.origin,
        'X-Title': 'FATU Pirate Quest',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free', // Free Gemini model
        messages: [
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[OpenRouter AI] API Error:', errorData);
      
      if (response.status === 401) {
        throw new Error("API Key ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ");
      } else if (response.status === 429) {
        throw new Error("ใช้งานเกิน quota กรุณาลองใหม่ในภายหลัง");
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    }

    const data = await response.json();
    console.log('[OpenRouter AI] Response received');

    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse) {
      console.error('[OpenRouter AI] Invalid response format:', data);
      throw new Error("ไม่ได้รับคำตอบจาก AI");
    }

    return aiResponse;
  } catch (error: any) {
    console.error('[OpenRouter AI] Error:', error);
    
    // More specific error messages
    if (error.name === 'AbortError') {
      throw new Error("ข้าคิดนานเกินไป! ลองถามใหม่อีกครั้งนะ");
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
      throw new Error("ข้าติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตของเจ้าสิ!");
    } else if (error.message?.includes('API Key') || error.message?.includes('quota')) {
      throw error; // Pass through API-specific errors
    } else {
      throw new Error("ข้าไม่สามารถตอบได้ในตอนนี้ ลองใหม่อีกครั้งนะ!");
    }
  }
};

