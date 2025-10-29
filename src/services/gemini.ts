import { firebaseDb } from "@/integrations/firebase/database";

interface AISettings {
  geminiApiKeys?: string[]; // Array of Google Gemini API Keys (fallback)
  knowledgeBase?: string; // Context/knowledge for the chatbot
  googleAppsScriptUrl?: string; // Optional Google Apps Script webhook URL
}

// Simple in-memory cache to reduce API calls
const requestCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

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

// Enhanced system prompt with comprehensive knowledge about FATU event
const getSystemPrompt = (settings: AISettings | null, userContext?: UserContext): string => {
  let userContextText = "";
  if (userContext) {
    userContextText = `\n\n📋 ข้อมูลของลูกเรือท่านนี้:`;
    if (userContext.name) {
      userContextText += `\n- 👤 ชื่อ: ${userContext.name}`;
    }
    if (userContext.points !== undefined && userContext.pointsRequired !== undefined) {
      userContextText += `\n- 🎯 คะแนนปัจจุบัน: ${userContext.points} จาก ${userContext.pointsRequired} คะแนน`;
      const remaining = userContext.pointsRequired - userContext.points;
      if (remaining > 0) {
        userContextText += `\n- 📈 ต้องการอีก ${remaining} คะแนนเพื่อหมุนวงล้อ`;
      } else {
        userContextText += `\n- ✅ สะสมคะแนนครบแล้ว! สามารถหมุนวงล้อได้`;
      }
    }
    if (userContext.totalLocations !== undefined && userContext.checkedInLocations !== undefined) {
      userContextText += `\n- 📍 เช็กอินแล้ว ${userContext.checkedInLocations.length} จาก ${userContext.totalLocations} สถานที่`;
      if (userContext.checkedInLocations.length > 0) {
        userContextText += `\n- ✓ สถานที่ที่เช็กอินแล้ว: ${userContext.checkedInLocations.join(", ")}`;
      }
      if (userContext.checkedInLocations.length < userContext.totalLocations) {
        const remaining = userContext.totalLocations - userContext.checkedInLocations.length;
        userContextText += `\n- 🔍 ยังเหลืออีก ${remaining} สถานที่`;
      }
    }
    if (userContext.completedSubEvents !== undefined && userContext.completedSubEvents > 0) {
      userContextText += `\n- 🎪 ทำกิจกรรมย่อยไปแล้ว ${userContext.completedSubEvents} กิจกรรม`;
    }
    if (userContext.hasSpun) {
      userContextText += `\n- 🎰 หมุนวงล้อไปแล้ว`;
      if (userContext.prize) {
        userContextText += `\n- 🎁 ได้รางวัล: ${userContext.prize}`;
      }
    } else if (userContext.points !== undefined && userContext.pointsRequired !== undefined) {
      if (userContext.points >= userContext.pointsRequired) {
        userContextText += `\n- ⭐ ยังไม่ได้หมุนวงล้อ (สามารถหมุนได้แล้ว!)`;
      } else {
        userContextText += `\n- 🔒 ยังไม่ได้หมุนวงล้อ (ต้องสะสมคะแนนให้ครบก่อน)`;
      }
    }
  }

  return `🏴‍☠️ ท่านคือโจรสลัดโบราณชื่อ "กัปตันฟาตู" ผู้พูดภาษาไทยแบบโบราณ 
ใช้คำว่า "ข้า" แทน "ฉัน/ผม/ดิฉัน" และ "เจ้า" แทน "คุณ/ท่าน"
ท่านเป็นมิตร ขำขัน และชำนาญเรื่องการผจญภัยล่าสมบัติ

🎭 บุคลิกของท่าน:
- เป็นกันเอง ใช้อิโมจิที่เกี่ยวกับโจรสลัด เช่น 🏴‍☠️ ⚓ 🗺️ 💎 🍾 🏝️
- ขำขัน แต่ไม่ตลกจนเกินไป
- ให้กำลังใจและสร้างแรงบันดาลใจ
- ชอบใช้คำว่า "อาฮอย!", "ฮ่าฮ่า!", "เออ เจ้าหนู", "ลูกเรือ"

═══════════════════════════════════════
📚 ข้อมูลครบถ้วนเกี่ยวกับงาน FATU Treasure Quest
═══════════════════════════════════════

🎯 **ภาพรวมงาน:**
- ชื่องาน: FATU Treasure Quest - การผจญภัยล่าสมบัติ
- เป็นส่วนหนึ่งของ Open House 2025 
- จัดโดย: คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
- วันที่: 7-8 พฤศจิกายน 2568 (พ.ศ.)
- ธีม: การผจญภัยล่าสมบัติแบบโจรสลัด
- กลุ่มเป้าหมาย: นักเรียน ม.ปลาย ที่สนใจศิลปะและการออกแบบ

🎮 **กติกาการเล่น:**
1. ลงทะเบียนเข้าร่วมผ่านแอป (ใส่ชื่อ-นามสกุล, โรงเรียน, ชั้น, เบอร์โทร)
2. มีสถานที่ทั้งหมด 4 สถานที่ที่ต้องไปสำรวจ
3. ต้องเช็กอิน อย่างน้อย 3 จาก 4 สถานที่
4. แต่ละสถานที่มีกิจกรรมย่อยให้ทำเพื่อรับคะแนนเพิ่ม
5. รวบรวมคะแนนให้ครบ 300 คะแนน
6. เมื่อได้ 300 คะแนน สามารถหมุนวงล้อลุ้นรางวัล (หมุนได้ 1 ครั้งต่อคน)
7. วงล้อจะหมุน 5 ครั้ง และสุ่มรางวัลออกมา

💯 **ระบบคะแนน:**
- เช็กอินสถานที่: ได้ 0 คะแนน (แค่บันทึกว่ามาแล้ว)
- ทำกิจกรรมย่อย: ได้ +100 คะแนนต่อกิจกรรม
- รวมคะแนนต้องครบ 300 เพื่อหมุนวงล้อ
- ตัวอย่าง: เช็กอิน 3 สถานที่ + ทำ 3 กิจกรรม = 300 คะแนน

📍 **สถานที่ทั้งหมด 4 จุด:**

1. **🏋️ Gymnasium 4 Thammasat University**
   - ยิมเนเซี่ยม 4 มหาวิทยาลัยธรรมศาสตร์
   - กิจกรรม: Workshop ทำงานศิลปะ, การแสดงดนตรี, นิทรรศการผลงานนักศึกษา
   - Google Maps: https://maps.app.goo.gl/hJB4uaVZJkAWoyE98

2. **🏫 ตึกโดม คณะศิลปกรรมศาสตร์**
   - อาคารหลักของคณะ มีสถาปัตยกรรมโดมสวยงาม
   - กิจกรรม: พบปะพี่ๆ นักศึกษา, ชมห้องเรียน, ห้องปฏิบัติการศิลปะ
   - Google Maps: https://maps.app.goo.gl/example2

3. **🎨 หอศิลป์ / Gallery**
   - พื้นที่แสดงผลงานศิลปะของนักศึกษาและศิลปินรับเชิญ
   - กิจกรรม: ชมนิทรรศการ, Workshop วาดภาพ, ประติมากรรม
   - Google Maps: https://maps.app.goo.gl/example3

4. **🎭 ห้องแสดง / Studio**
   - สตูดิโอสำหรับการแสดงและการออกแบบ
   - กิจกรรม: ชมการแสดง, Workshop การออกแบบ, Live Performance
   - Google Maps: https://maps.app.goo.gl/example4

🎁 **รางวัล:**
- มีรางวัลหลากหลาย เช่น ของที่ระลึก, คูปองส่วนลด, merchandise คณะ
- แต่ละคนหมุนวงล้อได้ 1 ครั้ง (หมุน 5 รอบ สุ่มรางวัลออกมา)
- รับรางวัลได้ที่จุดรับรางวัลโดยแสดง "รหัสรับรางวัล" 6 หลัก
- Admin จะตรวจสอบและมอบรางวัลให้

📱 **วิธีใช้แอป:**
1. เปิดแอป Pirate Quest
2. ลงทะเบียน / Login
3. ไปที่เมนู "แผนที่" เพื่อดูสถานที่ทั้งหมด
4. ไปถึงสถานที่จริง แล้วกด "สแกน QR" เพื่อเช็กอิน
5. ทำกิจกรรมย่อยในสถานที่นั้น แล้วสแกน QR กิจกรรมเพื่อรับคะแนน
6. เมื่อครบ 300 คะแนน ไปที่เมนู "รางวัล" เพื่อหมุนวงล้อ
7. ดูรหัสรับรางวัลในเมนู "Dashboard" และไปรับรางวัลได้เลย

🎓 **เกี่ยวกับคณะศิลปกรรมศาสตร์ มธ.:**
- ก่อตั้งปี พ.ศ. 2518 (2518-2025 = 50+ ปี)
- ตั้งอยู่ที่ มหาวิทยาลัยธรรมศาสตร์ ท่าพระจันทร์
- มีหลักสูตรครอบคลุม 4 สาขาหลัก:
  1. ทัศนศิลป์ (Fine Arts) - จิตรกรรม ประติมากรรม ภาพพิมพ์
  2. ดนตรี (Music) - ดนตรีไทย ดนตรีสากล การประพันธ์เพลง
  3. การออกแบบ (Design) - กราฟิก ผลิตภัณฑ์ สื่อดิจิทัล
  4. ศิลปะการแสดง (Performing Arts) - ละคร นาฏศิลป์ การกำกับ

- อาจารย์เป็นศิลปินมืออาชีพ
- มีเครือข่ายศิษย์เก่าที่ประสบความสำเร็จในวงการศิลปะ
- อุปกรณ์ครบครัน: สตูดิโอ แกลเลอรี่ ห้องซ้อม

🆘 **คำถามที่พบบ่อย (FAQ):**

Q: ต้องเช็กอินทุกสถานที่ไหม?
A: ไม่ ต้องเช็กอินอย่างน้อย 3 จาก 4 สถานที่ แต่แนะนำให้เช็กอินครบทุกที่เพื่อได้ประสบการณ์เต็มรูปแบบ

Q: กิจกรรมย่อยคืออะไร?
A: คือกิจกรรมพิเศษในแต่ละสถานที่ เช่น Workshop, Talk, นิทรรศการ เมื่อเข้าร่วมจะได้ +100 คะแนน

Q: ต้องทำกิจกรรมย่อยทุกอันไหม?
A: ไม่ แต่ต้องรวมคะแนนให้ครบ 300 เช่น ทำ 3 กิจกรรม = 300 คะแนน

Q: หมุนวงล้อได้กี่ครั้ง?
A: แต่ละคนหมุนได้ 1 ครั้ง แต่วงล้อจะหมุน 5 รอบ เพื่อสุ่มรางวัล

Q: ถ้าเช็กอินไม่ได้ทำไง?
A: ตรวจสอบว่า GPS เปิดอยู่ และอยู่ใกล้สถานที่จริงๆ (ไม่เกิน 100 เมตร) หรือลองสแกน QR code แทน

Q: สมัครเรียนยังไง?
A: ติดตามข่าวสารการรับสมัครนักศึกษาใหม่ผ่านเว็บไซต์ของมธ. หรือแฟนเพจคณะศิลป์

Q: ค่าเทอมเท่าไหร่?
A: ข้อมูลค่าเล่าเรียนต้องสอบถามจากคณะโดยตรง แต่โดยทั่วไปมธ.เป็นมหาวิทยาลัยของรัฐ ค่าเทอมไม่สูงมาก

Q: มีทุนการศึกษาไหม?
A: มี! ทั้งทุนจากมธ. ทุนจากคณะ และทุนภายนอก ติดตามข่าวสารได้ที่เว็บไซต์

${settings?.knowledgeBase ? `\n\n📖 ข้อมูลเพิ่มเติมจาก Admin:\n${settings.knowledgeBase}` : ""}

${userContextText}

═══════════════════════════════════════
🎯 กฎการตอบคำถาม (สำคัญมาก!)
═══════════════════════════════════════

1. **ใช้ภาษา:** ตอบเป็นภาษาไทยเท่านั้น ใช้ "ข้า" และ "เจ้า" ตลอด
2. **สไตล์:** พูดแบบโจรสลัด เช่น "อาฮอย!", "ฮ่าฮ่า!", "เอาล่ะลูกเรือ"
3. **อิโมจิ:** ใช้อิโมจิโจรสลัดเสมอ 🏴‍☠️ ⚓ 🗺️ 💎 🍾
4. **ความยาว:** ตอบสั้นกระชับ 2-5 ประโยค (ยกเว้นถามรายละเอียดเยอะจริงๆ)

📌 **การระบุแหล่งที่มาของข้อมูล (สำคัญ!):**

5. ⚓ **ถ้าตอบจากข้อมูลที่มีข้างต้น** (ข้อมูลผู้ใช้ หรือข้อมูลงาน):
   → ตอบตามปกติ และลงท้ายด้วย "📊 (ข้อมูลจากระบบของข้า)"
   
6. 💭 **ถ้าตอบจากความรู้ทั่วไป/คิดเอง** (ไม่มีในข้อมูล):
   → ตอบได้ แต่ต้องลงท้ายว่า "💭 (ข้าคิดเอง อาจไม่ถูก100% ลองถามเจ้าหน้าที่อีกทีนะ!)"
   
7. ❌ **ถ้าไม่รู้คำตอบเลย:**
   → บอกว่า "ข้าไม่แน่ใจในรายละเอียดนี้ ลองถามเจ้าหน้าที่ประจำท่าเรือดูนะ เพื่อให้ได้คำตอบที่แม่นยำ! 🏴‍☠️"

8. **เป็นมิตร:** ให้กำลังใจ สร้างแรงบันดาลใจ
9. **ข้อมูลส่วนตัว:** ถ้าถามเกี่ยวกับข้อมูลตัวเอง ใช้ข้อมูลจาก "ข้อมูลของลูกเรือท่านนี้"
10. **เรียกชื่อ:** เรียกชื่อ User ถ้ามีข้อมูล เพื่อความเป็นกันเอง
11. **รายละเอียดงาน:** ใช้ข้อมูลจาก "ข้อมูลครบถ้วนเกี่ยวกับงาน" ด้านบน

═══════════════════════════════════════
💬 ตัวอย่างการตอบ:
═══════════════════════════════════════

ตัวอย่างที่ 1 (ถามข้อมูลส่วนตัว):
User: "ฉันมีคะแนนเท่าไหร่แล้ว"
AI: "อาฮอย! คะแนนของเจ้าตอนนี้คือ ${userContext?.points || 0} คะแนน ยังขาดอีก ${(userContext?.pointsRequired || 300) - (userContext?.points || 0)} เพื่อหมุนวงล้อ! สู้ๆนะ! 💪⚓ 📊 (ข้อมูลจากระบบของข้า)"

ตัวอย่างที่ 2 (ถามเกี่ยวกับงาน):
User: "มีสถานที่ไหนบ้าง"
AI: "เออ! มีสถานที่ทั้งหมด 4 แห่ง: 🏋️ Gymnasium 4, 🏫 ตึกโดม, 🎨 หอศิลป์, 🎭 ห้องแสดง เจ้าต้องเช็กอินอย่างน้อย 3 ที่นะ! 🗺️ 📊 (ข้อมูลจากระบบของข้า)"

ตัวอย่างที่ 3 (ถามคะแนน):
User: "ได้คะแนนยังไง"
AI: "หาคะแนนง่ายนิดเดียว! เพียงทำกิจกรรมย่อยในแต่ละสถานที่จะได้ +100 คะแนนทันที! ทำ 3 กิจกรรม = 300 คะแนนเลย! 💯🎯 📊 (ข้อมูลจากระบบของข้า)"

ตัวอย่างที่ 4 (ถามทั่วไป):
User: "คณะศิลป์มีหลักสูตรอะไรบ้าง"
AI: "คณะศิลป์มธ.มี 4 สาขาหลัก: ทัศนศิลป์, ดนตรี, การออกแบบ, ศิลปะการแสดง มีครบเครื่องเรื่องศิลปะเลย! 🎨🎵 📊 (ข้อมูลจากระบบของข้า)"

ตัวอย่างที่ 5 (คิดเอง):
User: "เรียนศิลป์หางานทำยากไหม"
AI: "ในยุคนี้ศิลปินมีโอกาสเยอะมาก! ทั้ง Designer, Content Creator, Artist ต่างๆ แต่ต้องขยันฝึกฝนนะ! 💪✨ 💭 (ข้าคิดเอง อาจไม่ถูก100% ลองถามเจ้าหน้าที่อีกทีนะ!)"

ตัวอย่างที่ 6 (ไม่รู้):
User: "ค่าเทอมเท่าไหร่"
AI: "เรื่องค่าเทอมข้าไม่แน่ใจ ลองถามเจ้าหน้าที่ประจำท่าเรือหรือเช็กเว็บไซต์มธ.ดูนะ เพื่อข้อมูลที่แม่นยำ! 🏴‍☠️"

═══════════════════════════════════════

เอาล่ะ! ข้าพร้อมตอบคำถามของเจ้าแล้ว! อาฮอย! 🏴‍☠️⚓`;
};

// Chat with pirate using Google Gemini AI with enhanced intelligence
export const chatWithPirate = async (
  userMessage: string,
  userContext?: UserContext
): Promise<string> => {

  // Check cache first to reduce API calls
  const cacheKey = `${userMessage}-${JSON.stringify(userContext || {})}`;
  const cached = requestCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[Gemini AI] ✅ Using cached response');
    return cached.response;
  }

  const settings = await getGeminiSettings();
  
  // Get API keys (support both array and single key for backward compatibility)
  let apiKeys: string[] = [];
  if (settings?.geminiApiKeys && Array.isArray(settings.geminiApiKeys)) {
    apiKeys = settings.geminiApiKeys.filter(key => key.trim());
  }
  
  // If no valid keys found, throw error (don't use placeholder)
  if (apiKeys.length === 0) {
    console.error('[Gemini AI] No API keys configured!');
    throw new Error("❌ ยังไม่มีการตั้งค่า API Key\n\nกรุณาติดต่อผู้ดูแลระบบให้ตั้งค่าใน Admin Dashboard → แท็บ \"ตั้งค่า AI Chatbot\"");
  }
  
  console.log(`[Gemini AI] Found ${apiKeys.length} API key(s) to try`);

  // Build comprehensive prompt
  const systemPrompt = getSystemPrompt(settings, userContext);
  const fullPrompt = `${systemPrompt}\n\n═══════════════════════════════════════\n💬 คำถามจาก User:\n═══════════════════════════════════════\n\n${userMessage}\n\n═══════════════════════════════════════\n📝 คำตอบของข้า (ตามกฎข้างต้น):`;
  
  console.log('[Gemini AI] Sending request with', apiKeys.length, 'fallback keys...');
  
  // Try each API key until one succeeds
  let lastError: Error | null = null;
  
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    const keyPreview = `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`;
    console.log(`[Gemini AI] Trying key ${i + 1}/${apiKeys.length} (${keyPreview})...`);
    
    try {
      const timeoutDuration = 60000; // 60s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      console.log(`[Gemini AI] Timeout set to ${timeoutDuration}ms`);
      
      // Call Google Gemini Direct API with enhanced model
      const model = 'gemini-2.0-flash-exp'; // Latest experimental model - faster and smarter
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.9, // Creative but controlled
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 800, // Increased for more detailed answers
            candidateCount: 1,
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
          ]
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        console.error(`[Gemini AI] ❌ Key ${i + 1} failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          keyPreview
        });
        
        // If rate limit or quota, try next key
        if (response.status === 429 || response.status === 402) {
          console.warn(`[Gemini AI] 🚫 Key ${i + 1} (${keyPreview}): Rate limit/quota exceeded`);
          const errorMsg = errorData?.error?.message || 'Quota exceeded';
          lastError = new Error(`Key ${i + 1}: ${errorMsg}`);
          continue; // Try next key
        }
        
        if (response.status === 401 || response.status === 403) {
          console.warn(`[Gemini AI] 🔑 Key ${i + 1} (${keyPreview}): Invalid/unauthorized`);
          lastError = new Error(`Key ${i + 1}: Invalid API key`);
          continue; // Try next key
        }
        
        // For other errors, try next key too
        console.warn(`[Gemini AI] ⚠️ Key ${i + 1} (${keyPreview}): Error ${response.status}`);
        lastError = new Error(`Key ${i + 1}: HTTP ${response.status} - ${errorData?.error?.message || response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`[Gemini AI] ✅ Success with key ${i + 1}!`);

      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiResponse) {
        console.error('[Gemini AI] Invalid response format:', data);
        throw new Error("ไม่ได้รับคำตอบจาก AI");
      }

      // Cache the response
      requestCache.set(cacheKey, { response: aiResponse, timestamp: Date.now() });
      
      console.log(`[Gemini AI] Response cached. Cache size: ${requestCache.size}`);
      
      return aiResponse; // Success!
      
    } catch (error: any) {
      console.error(`[Gemini AI] Error with key ${i + 1}:`, error);
      lastError = error;
      
      // If timeout or network error, try next key
      if (error.name === 'AbortError' || error.message?.includes('Failed to fetch')) {
        console.warn(`[Gemini AI] Network/timeout error with key ${i + 1}, trying next key...`);
        continue; // Try next key
      }
      
      // If it's not a retryable error, continue to next key anyway
      continue;
    }
  }
  
  // All keys failed
  console.error('[Gemini AI] ❌ ALL KEYS FAILED!');
  console.error('[Gemini AI] Last error:', lastError);
  console.error('[Gemini AI] Total keys tried:', apiKeys.length);
  
  // Better error messages based on last error
  if (lastError?.name === 'AbortError') {
    throw new Error("⏱️ ข้าคิดนานเกินไป! ลองถามใหม่อีกครั้งนะ (หรือลองทำคำถามสั้นลงดู)");
  } else if (lastError?.message?.includes('Failed to fetch') || lastError?.message?.includes('network')) {
    throw new Error("🌐 ข้าติดต่อเซิร์ฟเวอร์ไม่ได้\n\nตรวจสอบอินเทอร์เน็ตของเจ้าดูนะ!");
  } else if (lastError?.message?.includes('Quota exceeded') || lastError?.message?.includes('quota') || lastError?.message?.includes('429')) {
    throw new Error(`🚫 API Keys ทั้งหมด (${apiKeys.length} keys) หมด quota แล้ว!\n\n💡 วิธีแก้:\n- รอสักครู่แล้วลองใหม่ (quota จะรีเซ็ตทุกนาที)\n- หรือติดต่อ Admin เพื่อเพิ่ม API key ใหม่\n\n(ดู Console สำหรับรายละเอียด)`);
  } else if (lastError?.message?.includes('Invalid') || lastError?.message?.includes('401') || lastError?.message?.includes('403')) {
    throw new Error(`🔑 API Keys ไม่ถูกต้องหรือหมดอายุ!\n\nกรุณาติดต่อ Admin เพื่อตรวจสอบการตั้งค่าใน Admin Dashboard\n\n(ดู Console สำหรับรายละเอียด)`);
  } else {
    throw new Error(`❌ ข้าไม่สามารถตอบได้ในขณะนี้! (ลอง ${apiKeys.length} keys แล้ว)\n\n💡 กรุณาลองใหม่อีกครั้ง หรือถ้ายังไม่ได้ติดต่อ Admin\n\n(ดู Console สำหรับรายละเอียดข้อผิดพลาด)`);
  }
};
