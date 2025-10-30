import { firebaseDb } from "@/integrations/firebase/database";
import { supabase } from "@/integrations/supabase/client";
import { CHECKIN_SECRET } from "@/lib/constants";
import { signCheckin, signSubEventCheckin, todayStr } from "@/lib/crypto";

const encoder = new TextEncoder();

const ADMIN_SESSION_TTL_HOURS = 12;
const DEFAULT_POINTS_REQUIRED = 300; // ✅ เปลี่ยนจาก 400 เป็น 300 คะแนน

// 🚀 Simple Cache Layer - เก็บข้อมูลไว้ชั่วคราวเพื่อลดการเรียก Firebase
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3000; // 3 seconds - for more dynamic updates

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(pattern?: string) {
  if (pattern) {
    Array.from(cache.keys()).forEach(key => {
      if (key.includes(pattern)) cache.delete(key);
    });
  } else {
    cache.clear();
  }
}

// Export clearCache for external use
export function clearAppCache(pattern?: string) {
  clearCache(pattern);
}

type Nullable<T> = T | null | undefined;

export interface ParticipantRecord {
  id: string;
  first_name: string;
  last_name: string;
  age: number | null;
  grade_level: string | null;
  school: string | null;
  program: string | null;
  username: string;
  password_hash: string;
  points: number;
  phone_number?: string; // เบอร์โทรศัพท์เพื่อป้องกันการสมัครซ้ำ
  created_at: string;
  credentials_generated_at: string;
}

export interface SubEvent {
  id: string; // unique ID per sub-event (e.g., "1-workshop-am", "1-workshop-pm")
  name: string; // ชื่อกิจกรรม
  location_id: number; // สถานที่ที่กิจกรรมนี้อยู่
  description?: string; // รายละเอียดกิจกรรม
  image_url?: string; // รูปภาพกิจกรรม
  time?: string; // เวลากิจกรรม (optional)
  qr_code_version?: number; // version ของ QR สำหรับ sub-event นี้
  points_awarded?: number; // คะแนนที่ได้ (default = 100, ถ้าเป็น 0 = ไม่ให้คะแนน)
  display_order?: number; // ลำดับการแสดงผล
}

export interface LocationRecord {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
  map_url?: string;
  image_url?: string;
  description?: string;
  qr_code_version?: number;
  sub_events?: SubEvent[]; // ✨ เปลี่ยนจาก events เป็น sub_events
  display_order?: number; // ลำดับการแสดงผล (เล็กไปใหญ่)
}

export interface PrizeRecord {
  id: string;
  name: string;
  weight: number;
  stock: number; // จำนวนคงเหลือ
  image_url?: string; // รูปภาพรางวัล
  description?: string; // รายละเอียดรางวัล
  created_at: string;
}

export interface HeroCardRecord {
  id: string;
  title: string;
  description: string;
  icon: string; // emoji or icon name
  image_url?: string;
  link_url?: string;
  link_text?: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export interface CheckinRecord {
  participant_id: string;
  location_id: number;
  method: string;
  created_at: string;
}

export interface SubEventCheckinRecord {
  participant_id: string;
  sub_event_id: string; // ID ของ sub-event
  location_id: number; // สถานที่ที่ sub-event นี้อยู่
  points_awarded: number; // คะแนนที่ได้ (100 หรือ 0)
  created_at: string;
}

export interface SpinRecord {
  participant_id: string;
  prize: string;
  claim_code: string; // 4-digit claim code
  claimed: boolean; // Has the prize been claimed?
  claimed_at?: string; // When was it claimed?
  created_at: string;
}

export interface AdminUserRecord {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface AdminSessionRecord {
  token: string;
  admin_id: string;
  username: string;
  created_at: string;
  expires_at: string;
}

export interface SignupPayload {
  firstName: string;
  lastName: string;
  age?: number | null;
  gradeLevel?: string | null;
  school?: string | null;
  program?: string | null;
  username?: string | null;
  password?: string | null;
  phoneNumber?: string; // เบอร์โทรศัพท์
  autoGenerateCredentials?: boolean;
  isAdmin?: boolean;
}

export interface SignupResponse {
  ok: boolean;
  participantId: string;
  username: string;
  password: string;
}

export interface LoginParticipantResult {
  ok: boolean;
  role: "participant";
  participantId: string;
  username: string;
  displayName: string;
}

export interface LoginAdminResult {
  ok: boolean;
  role: "admin";
  token: string;
  username: string;
  expiresAt: string;
}

export type LoginResult = LoginParticipantResult | LoginAdminResult;

export interface CheckinResponse {
  ok: boolean;
  pointsAdded: number;
}

export interface DashboardResponse {
  ok: boolean;
  participants: ParticipantRecord[];
  locations: LocationRecord[];
  prizes: PrizeRecord[];
  spins: SpinRecord[]; // ✅ เพิ่มข้อมูลรางวัลที่ได้
  checkins: CheckinRecord[]; // ✅ ข้อมูลการเช็กอินสถานที่
  subEventCheckins: SubEventCheckinRecord[]; // ✅ ข้อมูลการเข้ากิจกรรมย่อย
  settings: {
    pointsRequiredForWheel: number;
  };
}

const DEFAULT_LOCATIONS: Record<string, LocationRecord> = {
  "1": {
    id: 1,
    name: "Gymnasium 4 Thammasat University",
    lat: 14.0661446,
    lng: 100.6033427,
    points: 100,
    map_url: "https://maps.app.goo.gl/hJB4uaVZJkAWoyE98",
    display_order: 1,
    sub_events: [
      {
        id: "1-survey",
        name: "ตอบแบบสอบถาม",
        location_id: 1,
        description: "ทำแบบสอบถามความสนใจเข้าศึกษาและความพึงพอใจต่อกิจกรรมของคณะศิลปกรรมศาสตร์ โดยกดปุ่มในแผนที่เพื่อไปยังแบบฟอร์ม และรับคะแนน +100 เมื่อสแกน QR ของกิจกรรมนี้ที่หน้างาน",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 0
      },
      { 
        id: "1-arts-management", 
        name: "Workshop การบริหารจัดการศิลปะ", 
        location_id: 1, 
        description: "เรียนรู้การจัดการงานศิลปะในมุมมืออาชีพ การวางแผนงาน การจัดการทีมงาน การสร้างแบรนด์ให้กับศิลปิน และการบริหารงานศิลปะและวัฒนธรรมอย่างยั่งยืน",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 1
      },
    ],
  },
  "2": {
    id: 2,
    name: "Faculty of Fine and Applied Arts, Thammasat University",
    lat: 14.06879,
    lng: 100.604679,
    points: 100,
    map_url: "https://maps.app.goo.gl/eXgdntGV8D522TeQ6",
    display_order: 2,
    sub_events: [
      { 
        id: "2-moodboard-fashion", 
        name: "กิจกรรมสร้าง Mood Board จากนิตยสาร และทำชุดจากเศษผ้าเหลือใช้", 
        location_id: 2, 
        description: "สร้างสรรค์ Mood Board แสดงไอเดีย ความคิดสร้างสรรค์จากนิตยสาร จากนั้นออกแบบและตัดเย็บชุดจากเศษผ้าเหลือใช้ เรียนรู้ Fashion Design แบบ Sustainable และ Upcycling",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 1
      },
    ],
  },
  "3": {
    id: 3,
    name: "Textiles Workshop, Faculty of Fine and Applied Arts, Thammasat University",
    lat: 14.071901,
    lng: 100.6076747,
    points: 100,
    map_url: "https://maps.app.goo.gl/RNUzznFv6bz82JYN6",
    display_order: 3,
    sub_events: [
      { 
        id: "3-badge", 
        name: "กิจกรรมทำเข็มกลัด", 
        location_id: 3, 
        description: "ออกแบบและสร้างเข็มกลัดด้วยตัวเอง ใช้ผ้า กระดุม และวัสดุต่างๆ สร้างสรรค์ชิ้นงานที่มีเอกลักษณ์เฉพาะตัว เรียนรู้พื้นฐาน Textile Art และ Accessory Design",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 1
      },
      { 
        id: "3-weaving", 
        name: "กิจกรรมลองใช้กี่ทอผ้า", 
        location_id: 3, 
        description: "ทดลองใช้กี่ทอผ้าด้วยตัวเอง เรียนรู้กระบวนการทอผ้าแบบดั้งเดิม สัมผัสศิลปะการทอที่สืบทอดมาช้านาน เข้าใจกระบวนการสร้างผ้าจากด้ายสู่ผืนผ้า",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 2
      },
    ],
  },
  "4": {
    id: 4,
    name: "Thammasat Playhouse",
    lat: 14.0671832,
    lng: 100.6067732,
    points: 100,
    map_url: "https://maps.app.goo.gl/kKjeJ4w8zqZdMECYA",
    display_order: 4,
    sub_events: [
      { 
        id: "4-theatrical-design", 
        name: "Workshop Theatrical Design", 
        location_id: 4, 
        description: "เรียนรู้การออกแบบฉากละคร การจัดแสงสี เครื่องแต่งกาย และองค์ประกอบต่างๆ บนเวที สร้างสรรค์ชุดออกแบบฉากของตัวเอง พร้อมเทคนิคจากผู้เชี่ยวชาญ",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 1
      },
      { 
        id: "4-story-creation", 
        name: "Workshop Story Creation", 
        location_id: 4, 
        description: "พัฒนาทักษะการเขียนบทละคร การสร้างตัวละครที่มีมิติ การวางพล็อตเรื่อง และโครงสร้างเรื่องราวที่น่าสนใจ เรียนรู้จากนักเขียนบทมืออาชีพ",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 2
      },
      { 
        id: "4-acting", 
        name: "Workshop Acting", 
        location_id: 4, 
        description: "ฝึกทักษะการแสดงเบื้องต้น การแสดงออกทางอารมณ์ ภาษากาย การสร้างตัวละคร และเทคนิคการแสดงบนเวที จากอาจารย์ผู้เชี่ยวชาญด้านศิลปะการแสดง",
        points_awarded: 100,
        qr_code_version: 1,
        display_order: 3
      },
    ],
  },
};

const DEFAULT_PRIZES: Array<Omit<PrizeRecord, "id" | "created_at">> = [
  { name: "Pirate Sticker Set", weight: 40, stock: 50 },
  { name: "FATU Tote Bag", weight: 30, stock: 30 },
  { name: "Limited Edition T-Shirt", weight: 20, stock: 20 },
  { name: "Grand Prize Mystery Box", weight: 10, stock: 5 },
];

const DEFAULT_HERO_CARDS: Array<Omit<HeroCardRecord, "id" | "created_at">> = [
  {
    title: "4 จุดล่าสมบัติ",
    description: "ท่องดินแดน FATU เช็กอินด้วย QR เพื่อปลดล็อกจากจุดหมายสำคัญ พบกับกิจกรรมน่าสนใจมากมาย",
    icon: "🗺️",
    link_url: "/map",
    link_text: "ดูแผนที่",
    order: 1,
    is_active: true,
  },
  {
    title: "400 คะแนน",
    description: "สะสมครบเพื่อหมุนวงล้อสมบัติ ลุ้นรับของรางวัลพิเศษเฉพาะงานนี้เท่านั้น",
    icon: "🎁",
    link_url: "/rewards",
    link_text: "ดูรางวัล",
    order: 2,
    is_active: true,
  },
  {
    title: "ตรวจสอบรางวัล",
    description: "ค้นหาชื่อหรือเบอร์โทรเพื่อตรวจสอบว่าได้รับรางวัลแล้วหรือยัง พร้อมแสดงรายละเอียดรางวัลที่ชนะ",
    icon: "🔍",
    link_url: "/prize-verification",
    link_text: "ตรวจสอบ",
    order: 3,
    is_active: true,
  },
  {
    title: "ขุมทรัพย์โจรสลัด",
    description: "สติ๊กเกอร์, พวงกุญแจ, ของสะสม และอีกมากมายรอให้คุณครอบครอง พร้อมสิทธิพิเศษสุดพิเศษ!",
    icon: "💎",
    link_url: "/rewards",
    link_text: "ดูสมบัติ",
    order: 4,
    is_active: true,
  },
  {
    title: "ติดต่อเรา",
    description: "ติดตามข่าวสารและกิจกรรมของคณะศิลปกรรมศาสตร์ ผ่าน Instagram, Facebook, TikTok และช่องทางอื่นๆ อัปเดตข้อมูลงาน FATU ได้ที่นี่!",
    icon: "📱",
    link_url: "https://linktr.ee/fineart.tusc",
    link_text: "ช่องทางติดต่อ",
    order: 5,
    is_active: true,
  },
];

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD_HASH = "ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270"; // sha256("admin1234")

const getCrypto = () => {
  if (!globalThis.crypto) {
    throw new Error("Web Crypto API is required but not available in this environment.");
  }
  return globalThis.crypto;
};

const randomUUID = () => {
  const cryptoRef = getCrypto();
  if (typeof cryptoRef.randomUUID === "function") {
    return cryptoRef.randomUUID();
  }

  const buffer = new Uint8Array(16);
  cryptoRef.getRandomValues(buffer);

  buffer[6] = (buffer[6] & 0x0f) | 0x40;
  buffer[8] = (buffer[8] & 0x3f) | 0x80;

  const hex = Array.from(buffer, (byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex
    .slice(8, 10)
    .join("")}-${hex.slice(10, 16).join("")}`;
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const hashPassword = async (password: string) => {
  const cryptoRef = getCrypto();
  if (!cryptoRef.subtle) {
    throw new Error("Secure hashing requires a browser with SubtleCrypto support.");
  }
  const digest = await cryptoRef.subtle.digest("SHA-256", encoder.encode(password));
  return toHex(digest);
};

// Export hash and verify functions
export { hashPassword };

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const computedHash = await hashPassword(password);
  return computedHash === hashedPassword;
};

const normalizeUsername = (value: string) =>
  value.trim().toLowerCase();

const stripDiacritics = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const objectValues = <T>(input: Nullable<Record<string, T> | T[]>): T[] =>
  Array.isArray(input)
    ? ((input.filter(Boolean) as unknown[]) as T[])
    : input
    ? ((Object.values(input).filter(Boolean) as unknown[]) as T[])
    : [];

let defaultsEnsured = false;

const ensureDefaults = async () => {
  if (defaultsEnsured) return;

  const [locations, settings, prizes, heroCards, adminUser] = await Promise.all([
    firebaseDb.get<Record<string, LocationRecord>>("locations"),
    firebaseDb.get<{ value: number }>("app_settings/points_required_for_wheel"),
    firebaseDb.get<Record<string, PrizeRecord>>("prizes"),
    firebaseDb.get<Record<string, HeroCardRecord>>("hero_cards"),
    firebaseDb.get<AdminUserRecord>(`admin_users/${DEFAULT_ADMIN_USERNAME}`),
  ]);

  if (!locations || Object.keys(locations).length === 0) {
    // Only initialize if no locations exist
    await firebaseDb.update("locations", DEFAULT_LOCATIONS);
  } else {
    // Check if we need to add new locations from DEFAULT_LOCATIONS
    // But DON'T overwrite existing custom changes to name, description, etc.
    const updates: Record<string, any> = {};
    Object.entries(DEFAULT_LOCATIONS).forEach(([key, defaultLoc]) => {
      const existingLoc = locations[key];
      if (!existingLoc) {
        // Only create new location if it doesn't exist
        updates[key] = defaultLoc;
      }
      // Don't update existing locations - preserve user changes
    });
    if (Object.keys(updates).length > 0) {
      await firebaseDb.update("locations", updates);
    }

    // Ensure survey sub-event exists for location 1 without overwriting other sub-events
    const loc1 = locations["1"]; 
    if (loc1) {
      const existingSubEvents = Array.isArray(loc1.sub_events) ? loc1.sub_events : [];
      const hasSurvey = existingSubEvents.some(se => se && se.id === "1-survey");
      if (!hasSurvey) {
        const newSubEvents = [
          {
            id: "1-survey",
            name: "ตอบแบบสอบถาม",
            location_id: 1,
            description: "ทำแบบสอบถามที่กำหนดและรับคะแนน +100 โดยสแกน QR ของกิจกรรมนี้",
            points_awarded: 100,
            qr_code_version: 1,
            display_order: 0,
          },
          ...existingSubEvents,
        ];
        await firebaseDb.update("locations/1", { sub_events: newSubEvents });
      }
    }
  }

  if (!settings) {
    await firebaseDb.set("app_settings/points_required_for_wheel", { value: DEFAULT_POINTS_REQUIRED });
  }

  if (!prizes || Object.keys(prizes).length === 0) {
    const now = new Date().toISOString();
    const seeded: Record<string, PrizeRecord> = {};
    DEFAULT_PRIZES.forEach((prize) => {
      const id = randomUUID();
      seeded[id] = { id, created_at: now, ...prize };
    });
    await firebaseDb.update("prizes", seeded);
  }

  if (!heroCards || Object.keys(heroCards).length === 0) {
    const now = new Date().toISOString();
    const seeded: Record<string, HeroCardRecord> = {};
    DEFAULT_HERO_CARDS.forEach((card) => {
      const id = randomUUID();
      seeded[id] = { id, created_at: now, ...card };
    });
    await firebaseDb.update("hero_cards", seeded);
  }

  if (!adminUser) {
    const now = new Date().toISOString();
    await firebaseDb.set(`admin_users/${DEFAULT_ADMIN_USERNAME}`, {
      id: randomUUID(),
      username: DEFAULT_ADMIN_USERNAME,
      password_hash: DEFAULT_ADMIN_PASSWORD_HASH,
      created_at: now,
    } satisfies AdminUserRecord);
  }

  defaultsEnsured = true;
};

const ensureParticipantsIndex = async () => {
  const participants = await firebaseDb.get<Record<string, ParticipantRecord>>("participants");
  if (!participants) return;

  const indexUpdates: Record<string, string> = {};
  Object.values(participants).forEach((participant) => {
    indexUpdates[normalizeUsername(participant.username)] = participant.id;
  });

  if (Object.keys(indexUpdates).length > 0) {
    await firebaseDb.update("participants_by_username", indexUpdates);
  }
};

const generateUniqueUsername = async (
  firstName: string,
  lastName: string,
): Promise<{ username: string; normalized: string }> => {
  await ensureParticipantsIndex();

  const existingIndex =
    (await firebaseDb.get<Record<string, string>>("participants_by_username")) ?? {};

  const base = (() => {
    const first = stripDiacritics(firstName);
    const last = stripDiacritics(lastName);
    const raw = [first, last].filter(Boolean).join("");
    return (raw || "pirate").slice(0, 12);
  })();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const candidate = `${base}${suffix}`;
    const normalized = normalizeUsername(candidate);
    if (!existingIndex[normalized]) {
      existingIndex[normalized] = "reserved";
      return { username: candidate, normalized };
    }
  }

  throw new Error("Unable to generate unique username. Please try again.");
};

const reserveManualUsername = async (rawUsername: string) => {
  const trimmed = rawUsername.trim();
  if (!trimmed) {
    throw new Error("กรุณากรอกชื่อผู้ใช้");
  }

  await ensureParticipantsIndex();

  const normalized = normalizeUsername(trimmed);
  const existing = await firebaseDb.get<string | null>(
    `participants_by_username/${normalized}`,
  );
  if (existing) {
    throw new Error("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
  }

  return { username: trimmed, normalized };
};

const getParticipantById = async (participantId: string) =>
  firebaseDb.get<ParticipantRecord>(`participants/${participantId}`);

const getParticipantByUsername = async (username: string) => {
  const participantId = await firebaseDb.get<string | null>(
    `participants_by_username/${normalizeUsername(username)}`,
  );
  if (!participantId) return null;
  return getParticipantById(participantId);
};

/**
 * ตรวจสอบการสมัครซ้ำด้วยเบอร์โทรหรือชื่อ-นามสกุล
 * @returns true ถ้าพบข้อมูลซ้ำ, false ถ้าไม่ซ้ำ
 */
const checkDuplicateParticipant = async (
  firstName: string,
  lastName: string,
  phoneNumber?: string,
): Promise<{ isDuplicate: boolean; reason?: string }> => {
  const participants = await firebaseDb.get<Record<string, ParticipantRecord>>("participants");
  if (!participants) {
    return { isDuplicate: false };
  }

  const participantsArray = Object.values(participants);

  // ตรวจสอบเบอร์โทรซ้ำ (ถ้ามีการกรอก)
  if (phoneNumber) {
    const normalizedPhone = phoneNumber.replace(/\D/g, ''); // เอาเฉพาะตัวเลข
    if (normalizedPhone.length >= 9) { // อย่างน้อย 9 หลัก
      const phoneExists = participantsArray.some(
        (p) => p.phone_number && p.phone_number.replace(/\D/g, '') === normalizedPhone
      );
      if (phoneExists) {
        return { 
          isDuplicate: true, 
          reason: "เบอร์โทรศัพท์นี้เคยลงทะเบียนแล้ว กรุณาติดต่อทีมงานหากต้องการความช่วยเหลือ" 
        };
      }
    }
  }

  // ตรวจสอบชื่อ-นามสกุลซ้ำ
  const normalizedFirstName = firstName.trim().toLowerCase();
  const normalizedLastName = lastName.trim().toLowerCase();
  
  const nameExists = participantsArray.some(
    (p) => 
      p.first_name.trim().toLowerCase() === normalizedFirstName &&
      p.last_name.trim().toLowerCase() === normalizedLastName
  );
  
  if (nameExists) {
    return { 
      isDuplicate: true, 
      reason: "ชื่อ-นามสกุลนี้เคยลงทะเบียนแล้ว หากเป็นคนคนเดียวกันไม่สามารถสมัครซ้ำได้ กรุณาติดต่อทีมงานหากลืมรหัสผ่าน" 
    };
  }

  return { isDuplicate: false };
};

export const signupParticipant = async (payload: SignupPayload): Promise<SignupResponse> => {
  const { firstName, lastName, isAdmin, phoneNumber } = payload;
  if (!firstName || !lastName) {
    throw new Error("firstName and lastName are required");
  }

  await ensureDefaults();

  // If signing up as admin, create admin user instead
  if (isAdmin) {
    const trimmedUsername = payload.username?.trim() ?? "";
    const trimmedPassword = payload.password?.trim() ?? "";
    
    if (!trimmedUsername) {
      throw new Error("กรุณากรอกชื่อผู้ใช้สำหรับ Admin");
    }
    if (!trimmedPassword) {
      throw new Error("กรุณากรอกรหัสผ่านสำหรับ Admin");
    }
    if (trimmedPassword.length < 6) {
      throw new Error("รหัสผ่าน Admin ต้องยาวอย่างน้อย 6 ตัวอักษร");
    }

    const normalized = normalizeUsername(trimmedUsername);
    const existingAdmin = await firebaseDb.get<AdminUserRecord>(`admin_users/${normalized}`);
    
    if (existingAdmin) {
      throw new Error("ชื่อผู้ใช้ Admin นี้ถูกใช้งานแล้ว");
    }

    const passwordHash = await hashPassword(trimmedPassword);
    const now = new Date().toISOString();
    const adminId = randomUUID();

    const adminRecord: AdminUserRecord = {
      id: adminId,
      username: trimmedUsername,
      password_hash: passwordHash,
      created_at: now,
    };

    await firebaseDb.set(`admin_users/${normalized}`, adminRecord);

    return {
      ok: true,
      participantId: adminId,
      username: trimmedUsername,
      password: trimmedPassword,
    };
  }

  // ✅ ตรวจสอบการสมัครซ้ำสำหรับ participant (ไม่ใช่ admin)
  const duplicateCheck = await checkDuplicateParticipant(
    firstName, 
    lastName, 
    phoneNumber
  );
  
  if (duplicateCheck.isDuplicate) {
    throw new Error(duplicateCheck.reason || "ไม่สามารถลงทะเบียนซ้ำได้");
  }

  const trimmedUsername = payload.username?.trim() ?? "";
  const trimmedPassword = payload.password?.trim() ?? "";
  const shouldGenerate =
    payload.autoGenerateCredentials !== false ||
    !trimmedUsername ||
    !trimmedPassword;

  if (payload.autoGenerateCredentials === false) {
    if (!trimmedUsername) {
      throw new Error("กรุณากรอกชื่อผู้ใช้");
    }
    if (!trimmedPassword) {
      throw new Error("กรุณากรอกรหัสผ่าน");
    }
    if (trimmedPassword.length < 6) {
      throw new Error("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
    }
  }

  let username: string;
  let normalizedUsername: string;
  let password: string;

  if (shouldGenerate) {
    const generated = await generateUniqueUsername(firstName, lastName);
    username = generated.username;
    normalizedUsername = generated.normalized;
    password = randomUUID().replace(/-/g, "").slice(0, 10);
  } else {
    const manual = await reserveManualUsername(trimmedUsername);
    username = manual.username;
    normalizedUsername = manual.normalized;
    password = trimmedPassword;
  }

  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const participantId = randomUUID();

  const record: ParticipantRecord = {
    id: participantId,
    first_name: firstName,
    last_name: lastName,
    age: payload.age ?? null,
    grade_level: payload.gradeLevel ?? null,
    school: payload.school ?? null,
    program: payload.program ?? null,
    username,
    password_hash: passwordHash,
    points: 0,
    phone_number: phoneNumber || null, // ✅ เพิ่มเบอร์โทร
    created_at: now,
    credentials_generated_at: now,
  };

  await Promise.all([
    firebaseDb.set(`participants/${participantId}`, record),
    firebaseDb.set(
      `participants_by_username/${normalizedUsername}`,
      participantId,
    ),
  ]);

  return {
    ok: true,
    participantId,
    username,
    password,
  };
};

const createAdminSession = async (user: AdminUserRecord): Promise<LoginAdminResult> => {
  const token = randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ADMIN_SESSION_TTL_HOURS * 60 * 60 * 1000);

  const session: AdminSessionRecord = {
    token,
    admin_id: user.id,
    username: user.username,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };

  await firebaseDb.set(`admin_sessions/${token}`, session);

  return {
    ok: true,
    role: "admin",
    token,
    username: user.username,
    expiresAt: session.expires_at,
  };
};

const validateAdminSession = async (token: string): Promise<AdminSessionRecord | null> => {
  const session = await firebaseDb.get<AdminSessionRecord>(`admin_sessions/${token}`);
  if (!session) return null;

  if (new Date(session.expires_at) <= new Date()) {
    await firebaseDb.remove(`admin_sessions/${token}`);
    return null;
  }

  return session;
};

export const login = async (
  role: "participant" | "admin",
  username: string,
  password: string,
): Promise<LoginResult> => {
  if (!username || !password) {
    throw new Error("username and password are required");
  }

  await ensureDefaults();

  const passwordHash = await hashPassword(password);

  if (role === "admin") {
    const norm = normalizeUsername(username);
    const adminUser = (await firebaseDb.get<AdminUserRecord>(`admin_users/${norm}`)) ?? null;

    // Allow fixed admin credentials even if DB seed hasn't happened yet
    if (norm === DEFAULT_ADMIN_USERNAME && passwordHash === DEFAULT_ADMIN_PASSWORD_HASH) {
      const user: AdminUserRecord = adminUser ?? {
        id: randomUUID(),
        username: DEFAULT_ADMIN_USERNAME,
        password_hash: DEFAULT_ADMIN_PASSWORD_HASH,
        created_at: new Date().toISOString(),
      };
      if (!adminUser) {
        await firebaseDb.set(`admin_users/${DEFAULT_ADMIN_USERNAME}`, user);
      }
      return createAdminSession(user);
    }

    if (!adminUser || adminUser.password_hash !== passwordHash) {
      throw new Error("Invalid credentials");
    }

    return createAdminSession(adminUser);
  }

  const participant = await getParticipantByUsername(username);
  if (!participant || participant.password_hash !== passwordHash) {
    throw new Error("Invalid credentials");
  }

  return {
    ok: true,
    role: "participant",
    participantId: participant.id,
    username: participant.username,
    displayName: `${participant.first_name} ${participant.last_name}`,
  };
};

// Removed duplicate functions - using signCheckin and todayStr from @/lib/crypto instead

export const checkinParticipant = async (
  participantId: string,
  locationId: number,
  signature: string,
  qrVersion?: number,
): Promise<CheckinResponse> => {
  if (!participantId || !locationId || !signature) {
    throw new Error("Missing required fields");
  }

  await ensureDefaults();

  // Get location from Firebase to check version (Firebase is source of truth)
  const location = await firebaseDb.get<LocationRecord>(`locations/${locationId}`);

  if (!location) {
    throw new Error("Location not found");
  }

  // Use the current QR version from the database
  const currentVersion = location.qr_code_version ?? 1;
  
  // If QR has a version parameter, validate it matches current version
  if (qrVersion !== undefined && qrVersion !== currentVersion) {
    throw new Error("QR code ไม่ถูกต้อง กรุณาใช้ QR code เวอร์ชันล่าสุด");
  }

  // Validate signature with the version
  const versionToValidate = qrVersion ?? currentVersion;
  const signatures = await Promise.all([
    signCheckin(locationId, todayStr(-1), CHECKIN_SECRET, versionToValidate),
    signCheckin(locationId, todayStr(0), CHECKIN_SECRET, versionToValidate),
    signCheckin(locationId, todayStr(1), CHECKIN_SECRET, versionToValidate),
  ]);

  if (!signatures.includes(signature)) {
    throw new Error("QR code ไม่ถูกต้องหรือหมดอายุแล้ว");
  }

  const existingCheckin = await firebaseDb.get<CheckinRecord>(
    `checkins/${participantId}/${locationId}`,
  );

  if (existingCheckin) {
    return { ok: true, pointsAdded: 0 };
  }

  const checkin: CheckinRecord = {
    participant_id: participantId,
    location_id: locationId,
    method: "qr",
    created_at: new Date().toISOString(),
  };

  const participant = await getParticipantById(participantId);
  if (!participant) {
    throw new Error("Participant not found");
  }

  const updatedPoints = participant.points + (location.points ?? 0);

  await Promise.all([
    firebaseDb.set(`checkins/${participantId}/${locationId}`, checkin),
    firebaseDb.update(`participants/${participantId}`, { points: updatedPoints }),
  ]);

  return { ok: true, pointsAdded: location.points ?? 0 };
};

// ✨ Checkin Sub-Event (ร่วมกิจกรรมเพื่อเพิ่มคะแนน +100)
export const checkinSubEvent = async (
  participantId: string,
  subEventId: string,
  signature?: string, // Optional for fixed QR codes
  qrVersion?: number,
): Promise<CheckinResponse> => {
  if (!participantId || !subEventId) {
    throw new Error("Missing required fields");
  }

  await ensureDefaults();

  // ค้นหา sub-event จากทุก location
  let foundSubEvent: SubEvent | null = null;
  let parentLocation: LocationRecord | null = null;

  const locationsRecord = await firebaseDb.get<Record<string, LocationRecord>>("locations");
  const locations = objectValues(locationsRecord);

  console.log("🔍 Searching for sub-event:", subEventId);
  console.log("📋 Total locations:", locations.length);

  for (const location of locations) {
    if (location.sub_events) {
      console.log(`  Checking location ${location.name} (${location.sub_events.length} sub-events)`);
      const subEvent = location.sub_events.find((se) => se.id === subEventId);
      if (subEvent) {
        console.log("✅ Found sub-event:", subEvent);
        foundSubEvent = subEvent;
        parentLocation = location;
        break;
      }
    }
  }

  if (!foundSubEvent || !parentLocation) {
    console.error("❌ Sub-event not found:", subEventId);
    throw new Error(`ไม่พบกิจกรรมที่มี ID: ${subEventId} กรุณาตรวจสอบ QR Code`);
  }

  // Fixed QR codes - no version or signature validation needed
  // Accept any version of QR code as long as sub-event exists

  // ตรวจสอบว่าเคย scan sub-event นี้แล้วหรือไม่
  const existingSubEventCheckin = await firebaseDb.get<SubEventCheckinRecord>(
    `sub_event_checkins/${participantId}/${subEventId}`
  );

  if (existingSubEventCheckin) {
    return { ok: true, pointsAdded: 0 }; // เคย scan แล้ว ไม่ได้คะแนนเพิ่ม
  }

  // ตรวจสอบว่าเคยได้คะแนนจาก sub-event ของสถานที่นี้แล้วหรือไม่
  const allSubEventCheckins = await firebaseDb.get<Record<string, SubEventCheckinRecord>>(
    `sub_event_checkins/${participantId}`
  );

  let hasGottenPointsFromThisLocation = false;
  if (allSubEventCheckins) {
    hasGottenPointsFromThisLocation = objectValues(allSubEventCheckins).some(
      (checkin) => checkin.location_id === parentLocation.id && checkin.points_awarded > 0
    );
  }

  // คำนวณคะแนนที่จะได้รับ
  // - ถ้า sub-event กำหนด points_awarded = 0 → ไม่ให้คะแนน
  // - ถ้าไม่กำหนด → default = 100
  // - ถ้าเคยทำกิจกรรมย่อยที่ให้คะแนนในสถานที่นี้แล้ว → ให้ 0
  const SUB_EVENT_BASE_POINTS = foundSubEvent.points_awarded ?? 100;
  const pointsToAward = SUB_EVENT_BASE_POINTS === 0 ? 0 : (hasGottenPointsFromThisLocation ? 0 : SUB_EVENT_BASE_POINTS);

  // บันทึก sub-event checkin
  const subEventCheckin: SubEventCheckinRecord = {
    participant_id: participantId,
    sub_event_id: subEventId,
    location_id: parentLocation.id,
    points_awarded: pointsToAward,
    created_at: new Date().toISOString(),
  };

  // Check if location has been checked in, if not, auto check-in
  const existingLocationCheckin = await firebaseDb.get<CheckinRecord>(
    `checkins/${participantId}/${parentLocation.id}`
  );

  const needsLocationCheckin = !existingLocationCheckin;

  const participant = await getParticipantById(participantId);
  if (!participant) {
    throw new Error("Participant not found");
  }

  // No location points, only sub-event points
  const updatedPoints = participant.points + pointsToAward;

  // Prepare operations
  const operations: Array<Promise<unknown>> = [
    firebaseDb.set(`sub_event_checkins/${participantId}/${subEventId}`, subEventCheckin),
  ];

  // Add location checkin if needed (no points, just mark as checked in)
  if (needsLocationCheckin) {
    const locationCheckin: CheckinRecord = {
      participant_id: participantId,
      location_id: parentLocation.id,
      method: "subevent_auto",
      created_at: new Date().toISOString(),
    };
    operations.push(firebaseDb.set(`checkins/${participantId}/${parentLocation.id}`, locationCheckin));
  }

  // Update points if there are any to add
  if (updatedPoints > participant.points) {
    operations.push(firebaseDb.update(`participants/${participantId}`, { points: updatedPoints }));
  }

  await Promise.all(operations);

  return { ok: true, pointsAdded: pointsToAward };
};

const getPointsRequired = async () => {
  const value = await firebaseDb.get<{ value: number }>("app_settings/points_required_for_wheel");
  return value?.value ?? DEFAULT_POINTS_REQUIRED;
};

const drawPrize = (prizes: Array<{ name: string; weight: number }>) => {
  const total = prizes.reduce((sum, prize) => sum + (prize.weight ?? 0), 0);
  let random = Math.random() * total;

  for (const prize of prizes) {
    random -= prize.weight;
    if (random <= 0) return prize.name;
  }

  return prizes[0]?.name ?? "Prize";
};

export const spinWheel = async (participantId: string): Promise<{ prize: string; claimCode: string }> => {
  if (!participantId) {
    throw new Error("participantId required");
  }

  await ensureDefaults();

  const [participant, spin, prizesRecord, pointsRequired] = await Promise.all([
    getParticipantById(participantId),
    firebaseDb.get<SpinRecord>(`spins/${participantId}`),
    firebaseDb.get<Record<string, PrizeRecord>>("prizes"),
    getPointsRequired(),
  ]);

  if (!participant) {
    throw new Error("Participant not found");
  }

  if (participant.points < pointsRequired) {
    throw new Error("Not enough points");
  }

  if (spin) {
    throw new Error("Already spun");
  }

  // Filter prizes with stock > 0
  const prizePool = objectValues(prizesRecord).filter(
    (prize) => typeof prize.weight === "number" && prize.weight > 0 && prize.stock > 0,
  );

  if (prizePool.length === 0) {
    throw new Error("No prizes available (all prizes out of stock)");
  }

  const prizeName = drawPrize(prizePool);
  
  // Generate 4-digit claim code
  const claimCode = Math.floor(1000 + Math.random() * 9000).toString();
  
  const record: SpinRecord = {
    participant_id: participantId,
    prize: prizeName,
    claim_code: claimCode,
    claimed: false, // Not claimed yet
    created_at: new Date().toISOString(),
  };

  // Find the prize that was won and reduce its stock
  const wonPrize = prizePool.find((p) => p.name === prizeName);
  if (wonPrize && wonPrize.stock > 0) {
    await firebaseDb.update(`prizes/${wonPrize.id}`, {
      stock: wonPrize.stock - 1,
    });
  }

  await firebaseDb.set(`spins/${participantId}`, record);

  return { prize: prizeName, claimCode };
};

export const getMapData = async (participantId: string) => {
  // 🚀 Check cache first - but reduce cache time for more dynamic updates
  const cacheKey = `mapData:${participantId}`;
  const cached = getCached(cacheKey);
  
  // Use cache only for very short duration (3 seconds instead of 10)
  if (cached) {
    console.log("Using cached map data");
    return cached;
  }

  await ensureDefaults();

  console.log("Fetching fresh map data from Firebase");
  const [locationsRecord, checkinsRecord, subEventCheckinsRecord, participant, pointsRequired] = await Promise.all([
    firebaseDb.get<Record<string, LocationRecord>>("locations"),
    firebaseDb.get<Record<string, CheckinRecord>>(`checkins/${participantId}`),
    firebaseDb.get<Record<string, SubEventCheckinRecord>>(`sub_event_checkins/${participantId}`),
    getParticipantById(participantId),
    getPointsRequired(),
  ]);

  const locations = objectValues(locationsRecord).sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id));
  const checkins = Object.keys(checkinsRecord ?? {}).map((id) => Number(id));
  const points = participant?.points ?? 0;
  
  // Convert checkins to array with timestamps
  const checkinsData = objectValues(checkinsRecord ?? {}).filter(c => c && c.created_at);
  
  // Convert sub-event checkins to array with timestamps
  const subEventCheckins = objectValues(subEventCheckinsRecord ?? {}).filter(c => c && c.created_at);
  
  // Get participant name
  const participantName = participant ? `${participant.first_name} ${participant.last_name}` : "ลูกเรือ";

  console.log("Locations from Firebase:", locations.map(loc => ({ 
    id: loc.id, 
    name: loc.name, 
    subEventsCount: loc.sub_events?.length || 0,
    subEvents: loc.sub_events 
  })));

  const result = { 
    locations, 
    checkins, 
    points, 
    pointsRequired,
    checkinsData,
    subEventCheckins,
    participantName
  };

  // 🚀 Cache for only 3 seconds for more dynamic updates
  setCache(cacheKey, result);
  return result;
};

export const getRewardsData = async (participantId: string) => {
  await ensureDefaults();

  // 🚀 Check cache first but don't cache rewards data as it changes often
  const cacheKey = `rewardsData:${participantId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [participant, spinRecord, prizesRecord, pointsRequired] = await Promise.all([
    getParticipantById(participantId),
    firebaseDb.get<SpinRecord>(`spins/${participantId}`),
    firebaseDb.get<Record<string, PrizeRecord>>("prizes"),
    getPointsRequired(),
  ]);

  // Filter prizes with stock > 0 and include stock information
  const prizes = objectValues(prizesRecord)
    .filter((prize) => prize.stock > 0)
    .map((prize) => ({
      name: prize.name,
      weight: prize.weight,
      stock: prize.stock,
    }));

  const result = {
    points: participant?.points ?? 0,
    hasSpun: Boolean(spinRecord),
    prizes,
    pointsRequired,
  };

  // Cache for 5 seconds only to reduce load but keep data fresh
  setCache(cacheKey, result);
  clearCache(`mapData:${participantId}`); // Clear map cache to refresh points
  return result;
};

export const getDashboardData = async (token: string): Promise<DashboardResponse> => {
  if (!token) {
    throw new Error("token required");
  }

  await ensureDefaults();

  console.log("Validating admin session:", token);
  const session = await validateAdminSession(token);
  console.log("Session validation result:", session);
  
  if (!session) {
    throw new Error("Invalid session");
  }

  // Get locations from Firebase (source of truth for admin)
  const [locationsRecord, participantsRecord, prizesRecord, spinsRecord, checkinsRecord, subEventCheckinsRecord, pointsRequired] = await Promise.all([
    firebaseDb.get<Record<string, LocationRecord>>("locations"),
    firebaseDb.get<Record<string, ParticipantRecord>>("participants"),
    firebaseDb.get<Record<string, PrizeRecord>>("prizes"),
    firebaseDb.get<Record<string, SpinRecord>>("spins"), // ✅ ดึงข้อมูลรางวัล
    firebaseDb.get<Record<string, Record<string, CheckinRecord>>>("checkins"), // ✅ ดึงข้อมูล check-ins
    firebaseDb.get<Record<string, Record<string, SubEventCheckinRecord>>>("sub_event_checkins"), // ✅ ดึงข้อมูล sub-event check-ins
    getPointsRequired(),
  ]);

  console.log("Dashboard data loaded successfully");

  const participantsArr = objectValues(participantsRecord ?? {});
  const locationsArr = objectValues(locationsRecord ?? {});
  const prizesArr = objectValues(prizesRecord ?? {});
  const spinsArr = objectValues(spinsRecord ?? {}); // ✅ แปลง spins เป็น array
  
  // ✅ แปลง check-ins จาก nested object เป็น flat array
  const checkinsArr: CheckinRecord[] = [];
  Object.values(checkinsRecord ?? {}).forEach((participantCheckins) => {
    Object.values(participantCheckins ?? {}).forEach((checkin) => {
      if (checkin && checkin.created_at) { // ✅ Filter out null/undefined
        checkinsArr.push(checkin);
      }
    });
  });
  
  // ✅ แปลง sub-event check-ins จาก nested object เป็น flat array
  const subEventCheckinsArr: SubEventCheckinRecord[] = [];
  Object.values(subEventCheckinsRecord ?? {}).forEach((participantSubEventCheckins) => {
    Object.values(participantSubEventCheckins ?? {}).forEach((subEventCheckin) => {
      if (subEventCheckin && subEventCheckin.created_at) { // ✅ Filter out null/undefined
        subEventCheckinsArr.push(subEventCheckin);
      }
    });
  });

  return {
    ok: true,
    participants: participantsArr.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    locations: locationsArr.sort((a, b) => (a.display_order ?? a.id) - (b.display_order ?? b.id)),
    prizes: prizesArr.sort(
      (a, b) => new Date((a as any).created_at).getTime() - new Date((b as any).created_at).getTime(),
    ),
    spins: spinsArr.sort( // ✅ ส่งข้อมูลรางวัล
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    checkins: checkinsArr.sort( // ✅ ส่งข้อมูล check-ins
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    subEventCheckins: subEventCheckinsArr.sort( // ✅ ส่งข้อมูล sub-event check-ins
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    settings: {
      pointsRequiredForWheel: pointsRequired,
    },
  };
};

export const updateLocation = async (token: string, location: Partial<LocationRecord> & { id: number }) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  const updates: Record<string, any> = {};
  if (location.name !== undefined) updates.name = location.name;
  if (location.points !== undefined) updates.points = location.points;
  if (location.map_url !== undefined) updates.map_url = location.map_url;
  if (location.image_url !== undefined) updates.image_url = location.image_url;
  if (location.description !== undefined) updates.description = location.description;
  if (location.sub_events !== undefined) updates.sub_events = location.sub_events;
  if (location.display_order !== undefined) updates.display_order = location.display_order;
  // Add lat/lng if provided to keep them in sync
  if (location.lat !== undefined) updates.lat = location.lat;
  if (location.lng !== undefined) updates.lng = location.lng;

  console.log('Updating location:', location.id, updates);

  // Update in Firebase (source of truth)
  await firebaseDb.update(`locations/${location.id}`, updates);
  
  // Clear cache immediately when locations are updated
  clearCache('mapData');
  console.log('Cache cleared after location update');
  
  // Also try to update in Supabase, but don't fail if it errors (Firebase is source of truth)
  try {
    const { error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id);
    
    if (error) {
      console.warn('Supabase update failed (this is OK, Firebase is source of truth):', error);
    } else {
      console.log('Successfully synced to Supabase');
    }
  } catch (error) {
    console.warn('Supabase update error (this is OK, Firebase is source of truth):', error);
  }
};

export const regenerateLocationQR = async (token: string, locationId: number) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  // Get current version from Firebase first
  const fbLocation = await firebaseDb.get<LocationRecord>(`locations/${locationId}`);
  const currentVersion = fbLocation?.qr_code_version ?? 1;
  const newVersion = currentVersion + 1;
  
  // Update in Firebase (source of truth)
  await firebaseDb.update(`locations/${locationId}`, { qr_code_version: newVersion });
  
  // Also update in Supabase (ignore errors if RLS blocks it)
  try {
    await supabase
      .from('locations')
      .update({ qr_code_version: newVersion })
      .eq('id', locationId);
  } catch (error) {
    console.warn('Supabase QR version update failed, but Firebase updated successfully:', error);
  }

  return newVersion;
};

export const deleteParticipant = async (token: string, participantId: string) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  const participant = await firebaseDb.get<ParticipantRecord>(`participants/${participantId}`);
  if (!participant) {
    throw new Error("Participant not found");
  }

  const normalized = normalizeUsername(participant.username);
  
  // ลบข้อมูลทั้งหมดที่เกี่ยวข้องกับ participant
  await Promise.all([
    firebaseDb.remove(`participants/${participantId}`),
    firebaseDb.remove(`participants_by_username/${normalized}`),
    firebaseDb.remove(`checkins/${participantId}`),
    firebaseDb.remove(`sub_event_checkins/${participantId}`), // ✅ เพิ่มการลบ sub_event_checkins
    firebaseDb.remove(`spins/${participantId}`),
  ]);
  
  console.log(`[Admin] Deleted participant ${participantId} and all related data`);
};

export const updateParticipant = async (
  token: string, 
  participantId: string, 
  updates: Partial<Pick<ParticipantRecord, 'first_name' | 'last_name' | 'age' | 'grade_level' | 'school' | 'program' | 'points'>>
) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  await firebaseDb.update(`participants/${participantId}`, updates);
};

export const createPrize = async (
  token: string, 
  name: string, 
  weight: number, 
  stock: number = 10,
  image_url?: string,
  description?: string
) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  if (!name || typeof weight !== "number" || weight <= 0 || typeof stock !== "number" || stock < 0) {
    throw new Error("Invalid payload");
  }

  const id = randomUUID();
  const record: PrizeRecord = {
    id,
    name,
    weight,
    stock,
    image_url,
    description,
    created_at: new Date().toISOString(),
  };

  await firebaseDb.set(`prizes/${id}`, record);
};

export const savePrize = async (token: string, prize: PrizeRecord) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  if (!prize.id || !prize.name || !prize.weight || prize.weight <= 0 || typeof prize.stock !== "number" || prize.stock < 0) {
    throw new Error("Invalid payload");
  }

  await firebaseDb.update(`prizes/${prize.id}`, {
    name: prize.name,
    weight: prize.weight,
    stock: prize.stock,
    description: prize.description,
    image_url: prize.image_url,
  });
};

export const deletePrize = async (token: string, prizeId: string) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  await firebaseDb.remove(`prizes/${prizeId}`);
};

// Hero Cards Management
export const getHeroCards = async (): Promise<HeroCardRecord[]> => {
  // 🚀 Check cache first
  const cacheKey = 'heroCards';
  const cached = getCached<HeroCardRecord[]>(cacheKey);
  if (cached) return cached;

  await ensureDefaults();
  
  const heroCardsRecord = await firebaseDb.get<Record<string, HeroCardRecord>>("hero_cards");
  const cards = objectValues(heroCardsRecord);
  
  // Sort by order and filter active cards
  const result = cards.sort((a, b) => a.order - b.order);
  
  // 🚀 Cache for 1 minute
  setCache(cacheKey, result);
  return result;
};

export const getPrizes = async (): Promise<PrizeRecord[]> => {
  // 🚀 Check cache first  
  const cacheKey = 'prizes';
  const cached = getCached<PrizeRecord[]>(cacheKey);
  if (cached) return cached;

  await ensureDefaults();
  
  const prizesRecord = await firebaseDb.get<Record<string, PrizeRecord>>("prizes");
  const prizes = objectValues(prizesRecord);
  
  // Filter prizes with stock > 0 and return them
  const result = prizes.filter(p => p.stock > 0);
  
  // 🚀 Cache for 30 seconds
  setCache(cacheKey, result);
  return result;
};

// Admin: Verify and claim prize by code
export const verifyClaimCode = async (
  token: string,
  claimCode: string
): Promise<{ 
  found: boolean; 
  participantId?: string;
  participantName?: string;
  prize?: string;
  claimed?: boolean;
  claimedAt?: string;
}> => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  // Search all spins for matching claim code
  const spinsRecord = await firebaseDb.get<Record<string, SpinRecord>>("spins");
  
  for (const [participantId, spin] of Object.entries(spinsRecord || {})) {
    if (spin && spin.claim_code === claimCode) {
      // Found the spin! Get participant info
      const participant = await getParticipantById(participantId);
      
      return {
        found: true,
        participantId,
        participantName: participant ? `${participant.first_name} ${participant.last_name}` : "ไม่ทราบชื่อ",
        prize: spin.prize,
        claimed: spin.claimed || false,
        claimedAt: spin.claimed_at
      };
    }
  }

  return { found: false };
};

// Admin: Mark prize as claimed
export const markPrizeClaimed = async (token: string, participantId: string): Promise<void> => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  const spin = await firebaseDb.get<SpinRecord>(`spins/${participantId}`);
  if (!spin) {
    throw new Error("Spin record not found");
  }

  if (spin.claimed) {
    throw new Error("รางวัลนี้ถูกรับไปแล้ว");
  }

  await firebaseDb.update(`spins/${participantId}`, {
    claimed: true,
    claimed_at: new Date().toISOString()
  });
};

export const createHeroCard = async (token: string, card: Omit<HeroCardRecord, "id" | "created_at">) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  if (!card.title || !card.description) {
    throw new Error("Invalid payload");
  }

  const id = randomUUID();
  const record: HeroCardRecord = {
    id,
    ...card,
    created_at: new Date().toISOString(),
  };

  await firebaseDb.set(`hero_cards/${id}`, record);
  return record;
};

export const saveHeroCard = async (token: string, card: HeroCardRecord) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  if (!card.id || !card.title || !card.description) {
    throw new Error("Invalid payload");
  }

  await firebaseDb.update(`hero_cards/${card.id}`, {
    title: card.title,
    description: card.description,
    icon: card.icon,
    image_url: card.image_url,
    link_url: card.link_url,
    link_text: card.link_text,
    order: card.order,
    is_active: card.is_active,
  });
};

export const deleteHeroCard = async (token: string, cardId: string) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  await firebaseDb.remove(`hero_cards/${cardId}`);
};

export const setSpinThreshold = async (token: string, pointsRequired: number) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  if (typeof pointsRequired !== "number" || pointsRequired < 0) {
    throw new Error("Invalid payload");
  }

  await firebaseDb.set("app_settings/points_required_for_wheel", { value: pointsRequired });
};

export const invalidateAdminSession = async (token: string) => {
  if (!token) return;
  await firebaseDb.remove(`admin_sessions/${token}`);
};

// Reset User Data Only (ลบเฉพาะข้อมูล User - ไม่ลบ locations, prizes, hero_cards, settings)
export const resetAllData = async (token: string, adminPassword: string) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  // Verify admin password
  const adminUser = await firebaseDb.get<AdminUserRecord>(`admin_users/${DEFAULT_ADMIN_USERNAME}`);
  if (!adminUser) {
    throw new Error("ไม่พบข้อมูล Admin");
  }

  const isPasswordValid = await verifyPassword(adminPassword, adminUser.password_hash);
  if (!isPasswordValid) {
    throw new Error("รหัสผ่าน Admin ไม่ถูกต้อง");
  }

  // ลบเฉพาะข้อมูล User Data เท่านั้น
  const checkinsRecord = await firebaseDb.get<Record<string, any>>("checkins");
  const subEventCheckinsRecord = await firebaseDb.get<Record<string, any>>("sub_event_checkins");
  const spinsRecord = await firebaseDb.get<Record<string, any>>("spins");

  const deletePromises = [];

  // Delete checkins
  if (checkinsRecord) {
    deletePromises.push(...Object.keys(checkinsRecord).map(participantId => 
      firebaseDb.remove(`checkins/${participantId}`)
    ));
  }

  // Delete sub-event checkins
  if (subEventCheckinsRecord) {
    deletePromises.push(...Object.keys(subEventCheckinsRecord).map(participantId =>
      firebaseDb.remove(`sub_event_checkins/${participantId}`)
    ));
  }

  // Delete spins
  if (spinsRecord) {
    deletePromises.push(...Object.keys(spinsRecord).map(participantId =>
      firebaseDb.remove(`spins/${participantId}`)
    ));
  }

  // Execute all deletions
  await Promise.all(deletePromises);

  // Clear cache
  clearCache();
};

// Delete All Participants (ลบลูกเรือทั้งหมด)
export const deleteAllParticipants = async (token: string, adminPassword: string) => {
  const session = await validateAdminSession(token);
  if (!session) {
    throw new Error("Invalid session");
  }

  // Verify admin password
  const adminUser = await firebaseDb.get<AdminUserRecord>(`admin_users/${DEFAULT_ADMIN_USERNAME}`);
  if (!adminUser) {
    throw new Error("ไม่พบข้อมูล Admin");
  }

  const isPasswordValid = await verifyPassword(adminPassword, adminUser.password_hash);
  if (!isPasswordValid) {
    throw new Error("รหัสผ่าน Admin ไม่ถูกต้อง");
  }

  // Get all data
  const participantsRecord = await firebaseDb.get<Record<string, ParticipantRecord>>("participants");
  const checkinsRecord = await firebaseDb.get<Record<string, any>>("checkins");
  const subEventCheckinsRecord = await firebaseDb.get<Record<string, any>>("sub_event_checkins");
  const spinsRecord = await firebaseDb.get<Record<string, any>>("spins");

  const deletePromises = [];

  // Delete all participants
  if (participantsRecord) {
    deletePromises.push(...Object.keys(participantsRecord).map(participantId =>
      firebaseDb.remove(`participants/${participantId}`)
    ));
  }

  // Delete all checkins
  if (checkinsRecord) {
    deletePromises.push(...Object.keys(checkinsRecord).map(participantId =>
      firebaseDb.remove(`checkins/${participantId}`)
    ));
  }

  // Delete all sub-event checkins
  if (subEventCheckinsRecord) {
    deletePromises.push(...Object.keys(subEventCheckinsRecord).map(participantId =>
      firebaseDb.remove(`sub_event_checkins/${participantId}`)
    ));
  }

  // Delete all spins
  if (spinsRecord) {
    deletePromises.push(...Object.keys(spinsRecord).map(participantId =>
      firebaseDb.remove(`spins/${participantId}`)
    ));
  }

  // Execute all deletions
  await Promise.all(deletePromises);

  // Clear cache
  clearCache();

  console.log("[Admin] Reset all data - cleared checkins, sub-event checkins, spins, and reset all points to 0");
};