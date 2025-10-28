import { firebaseDb } from "@/integrations/firebase/database";

interface AISettings {
  openRouterKeys?: string[]; // Array of OpenRouter API Keys (fallback)
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

// Chat with pirate using OpenRouter AI (FREE!) with fallback support
export const chatWithPirate = async (
  userMessage: string,
  userContext?: UserContext
): Promise<string> => {

  const settings = await getGeminiSettings();
  
  // Get API keys (support both array and single key for backward compatibility)
  let apiKeys: string[] = [];
  if (settings?.openRouterKeys && Array.isArray(settings.openRouterKeys)) {
    apiKeys = settings.openRouterKeys.filter(key => key.trim());
  }
  
  // If no valid keys found, throw error (don't use placeholder)
  if (apiKeys.length === 0) {
    console.error('[OpenRouter AI] No API keys configured!');
    throw new Error("ยังไม่มีการตั้งค่า API Key กรุณาติดต่อผู้ดูแลระบบให้ตั้งค่าใน Admin Dashboard");
  }
  
  console.log(`[OpenRouter AI] Found ${apiKeys.length} API key(s) to try`);

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

  // System prompt for pirate character with source awareness
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

📌 สำคัญ - การระบุแหล่งที่มาของข้อมูล:
5. ⚓ ถ้าตอบจากข้อมูลที่มีให้ข้างต้น (ข้อมูลของลูกเรือ หรือข้อมูลเพิ่มเติมเกี่ยวกับงาน):
   → ให้ตอบตามปกติ และบอกว่า "📊 (ข้อมูลจากระบบของข้า)"
   
6. 🌐 ถ้าตอบจากความรู้ทั่วไป/คิดเอง (ไม่มีในข้อมูลที่ให้มา):
   → ให้ตอบได้ แต่ต้องบอกว่า "💭 (ข้าคิดเอง อาจไม่ถูกต้อง100% ลองถามเจ้าหน้าที่ดูอีกทีนะ!)"
   
7. ❌ ถ้าไม่รู้คำตอบเลย:
   → ให้บอกว่า "ข้าไม่แน่ใจในรายละเอียดนี้ ลองถามเจ้าหน้าที่ประจำท่าเรือดูนะ เพื่อให้ได้คำตอบที่แม่นยำ!"

8. เป็นมิตรและสนุกสนาน
9. ถ้า User ถามเกี่ยวกับข้อมูลของตัวเอง ให้ใช้ข้อมูลจาก "ข้อมูลของลูกเรือท่านนี้" ที่ให้ไว้ข้างต้น
10. เรียกชื่อ User ถ้ามีข้อมูลชื่อ เพื่อให้เป็นกันเอง
11. ถ้าถามเรื่องสถานที่หรือรายละเอียดงาน ให้ใช้ข้อมูลจาก "ข้อมูลเพิ่มเติมเกี่ยวกับงาน" ที่ Admin ตั้งค่าไว้

ตัวอย่างการตอบ:
- "คะแนนของเจ้าตอนนี้คือ 150 คะแนน ยังขาดอีก 150 เพื่อหมุนวงล้อ! ⚓💪 📊 (ข้อมูลจากระบบของข้า)"
- "คณะศิลปะมธ. มีหลักสูตรครอบคลุมทั้งศิลปะและการออกแบบ ตั้งแต่ปี พ.ศ. 2518 💭 (ข้าคิดเอง อาจไม่ถูกต้อง100% ลองถามเจ้าหน้าที่ดูอีกทีนะ!)"
- "รายละเอียดเกี่ยวกับการลงทะเบียนในอนาคต ข้าไม่แน่ใจ ลองถามเจ้าหน้าที่ประจำท่าเรือดูนะ!"`;

  const fullPrompt = `${systemPrompt}\n\n---\n\nคำถามจาก User: ${userMessage}`;
  
  console.log('[OpenRouter AI] Sending request with', apiKeys.length, 'fallback keys...');
  
  // Try each API key until one succeeds
  let lastError: Error | null = null;
  
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const keyPreview = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`;
    console.log(`[OpenRouter AI] Trying key ${i + 1}/${apiKeys.length} (${keyPreview})...`);
    
    try {
      // Create timeout promise (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // Call OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
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
        console.error(`[OpenRouter AI] ❌ Key ${i + 1} failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        // If rate limit or quota, try next key
        if (response.status === 429 || response.status === 402) {
          console.warn(`[OpenRouter AI] 🚫 Key ${i + 1} (${keyPreview}): Rate limit/quota exceeded`);
          const errorMsg = errorData?.error?.message || 'Quota exceeded';
          lastError = new Error(`Key ${i + 1}: ${errorMsg}`);
          continue; // Try next key
        }
        
        if (response.status === 401) {
          console.warn(`[OpenRouter AI] 🔑 Key ${i + 1} (${keyPreview}): Invalid/unauthorized`);
          lastError = new Error(`Key ${i + 1}: Invalid API key`);
          continue; // Try next key
        }
        
        // For other errors, try next key too
        console.warn(`[OpenRouter AI] ⚠️ Key ${i + 1} (${keyPreview}): Error ${response.status}`);
        lastError = new Error(`Key ${i + 1}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`[OpenRouter AI] ✅ Success with key ${i + 1}!`);

      const aiResponse = data.choices?.[0]?.message?.content;
      if (!aiResponse) {
        console.error('[OpenRouter AI] Invalid response format:', data);
        throw new Error("ไม่ได้รับคำตอบจาก AI");
      }

      return aiResponse; // Success!
      
    } catch (error: any) {
      console.error(`[OpenRouter AI] Error with key ${i + 1}:`, error);
      lastError = error;
      
      // If timeout or network error, try next key
      if (error.name === 'AbortError' || error.message?.includes('Failed to fetch')) {
        console.warn(`[OpenRouter AI] Network/timeout error with key ${i + 1}, trying next key...`);
        continue; // Try next key
      }
      
      // If it's not a retryable error, throw immediately
      if (!error.message?.includes('Key')) {
        // Continue to next key for other errors too
        continue;
      }
    }
  }
  
  // All keys failed
  console.error('[OpenRouter AI] ❌ ALL KEYS FAILED! Last error:', lastError);
  
  // Better error messages based on last error
  if (lastError?.name === 'AbortError') {
    throw new Error("⏱️ ข้าคิดนานเกินไป! ลองถามใหม่อีกครั้งนะ");
  } else if (lastError?.message?.includes('Failed to fetch') || lastError?.message?.includes('network')) {
    throw new Error("🌐 ข้าติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตของเจ้าสิ!");
  } else if (lastError?.message?.includes('Quota exceeded') || lastError?.message?.includes('quota')) {
    throw new Error(`🚫 API Keys ทั้งหมด (${apiKeys.length} keys) หมด quota แล้ว!\n\n💡 วิธีแก้:\n- รอสักครู่แล้วลองใหม่\n- หรือเพิ่ม API key ใหม่ใน Admin Dashboard\n\n(ดู Console สำหรับรายละเอียด)`);
  } else if (lastError?.message?.includes('Invalid')) {
    throw new Error(`🔑 API Keys ทั้งหมดไม่ถูกต้อง! กรุณาตรวจสอบการตั้งค่าใน Admin Dashboard\n\n(ดู Console สำหรับรายละเอียด)`);
  } else {
    throw new Error(`❌ ข้าไม่สามารถตอบได้! (ลอง ${apiKeys.length} keys แล้ว)\n\nดู Console (F12) สำหรับรายละเอียดข้อผิดพลาด`);
  }
};

