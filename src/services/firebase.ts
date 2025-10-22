import { firebaseDb } from "@/integrations/firebase/database";
import { supabase } from "@/integrations/supabase/client";
import { CHECKIN_SECRET } from "@/lib/constants";
import { signCheckin, todayStr } from "@/lib/crypto";

const encoder = new TextEncoder();

const ADMIN_SESSION_TTL_HOURS = 12;
const DEFAULT_POINTS_REQUIRED = 400;

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
  created_at: string;
  credentials_generated_at: string;
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
}

export interface PrizeRecord {
  id: string;
  name: string;
  weight: number;
  stock: number; // จำนวนคงเหลือ
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

export interface SpinRecord {
  participant_id: string;
  prize: string;
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
  settings: {
    pointsRequiredForWheel: number;
  };
}

const DEFAULT_LOCATIONS: Record<string, LocationRecord> = {
  "1": {
    id: 1,
    name: "จุดลงทะเบียนหลัก FATU 2025",
    lat: 14.0661446,
    lng: 100.6033427,
    points: 100,
    map_url: "https://maps.app.goo.gl/hJB4uaVZJkAWoyE98",
  },
  "2": {
    id: 2,
    name: "โซนกิจกรรมกลาง ลานพระบิดา",
    lat: 14.06879,
    lng: 100.604679,
    points: 100,
    map_url: "https://maps.app.goo.gl/eXgdntGV8D522TeQ6",
  },
  "3": {
    id: 3,
    name: "เวที Thammasat Playhouse",
    lat: 14.071901,
    lng: 100.6076747,
    points: 100,
    map_url: "https://maps.app.goo.gl/RNUzznFv6bz82JYN6",
  },
  "4": {
    id: 4,
    name: "เวิร์กช็อปสิ่งทอ (Textiles Workshop)",
    lat: 14.0671832,
    lng: 100.6067732,
    points: 100,
    map_url: "https://maps.app.goo.gl/kKjeJ4w8zqZdMECYA",
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
    title: "ขุมทรัพย์โจรสลัด",
    description: "สติ๊กเกอร์, พวงกุญแจ, ของสะสม และอีกมากมายรอให้คุณครอบครอง พร้อมสิทธิพิเศษสุดพิเศษ!",
    icon: "💎",
    link_url: "/rewards",
    link_text: "ดูสมบัติ",
    order: 3,
    is_active: true,
  },
  {
    title: "ติดต่อเรา",
    description: "ติดตามข่าวสารและกิจกรรมของคณะศิลปกรรมศาสตร์ ผ่าน Instagram, Facebook, TikTok และช่องทางอื่นๆ อัปเดตข้อมูลงาน FATU ได้ที่นี่!",
    icon: "📱",
    link_url: "https://linktr.ee/fineart.tusc",
    link_text: "ช่องทางติดต่อ",
    order: 4,
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
    await firebaseDb.update("locations", DEFAULT_LOCATIONS);
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

export const signupParticipant = async (payload: SignupPayload): Promise<SignupResponse> => {
  const { firstName, lastName, isAdmin } = payload;
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

export const spinWheel = async (participantId: string): Promise<{ prize: string }> => {
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
  const record: SpinRecord = {
    participant_id: participantId,
    prize: prizeName,
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

  return { prize: prizeName };
};

export const getMapData = async (participantId: string) => {
  await ensureDefaults();

  const [locationsRecord, checkinsRecord, participant, pointsRequired] = await Promise.all([
    firebaseDb.get<Record<string, LocationRecord>>("locations"),
    firebaseDb.get<Record<string, CheckinRecord>>(`checkins/${participantId}`),
    getParticipantById(participantId),
    getPointsRequired(),
  ]);

  const locations = objectValues(locationsRecord).sort((a, b) => a.id - b.id);
  const checkins = Object.keys(checkinsRecord ?? {}).map((id) => Number(id));
  const points = participant?.points ?? 0;

  return { locations, checkins, points, pointsRequired };
};

export const getRewardsData = async (participantId: string) => {
  await ensureDefaults();

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

  return {
    points: participant?.points ?? 0,
    hasSpun: Boolean(spinRecord),
    prizes,
    pointsRequired,
  };
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
  const [locationsRecord, participantsRecord, prizesRecord, pointsRequired] = await Promise.all([
    firebaseDb.get<Record<string, LocationRecord>>("locations"),
    firebaseDb.get<Record<string, ParticipantRecord>>("participants"),
    firebaseDb.get<Record<string, PrizeRecord>>("prizes"),
    getPointsRequired(),
  ]);

  console.log("Dashboard data loaded successfully");

  const participantsArr = objectValues(participantsRecord ?? {});
  const locationsArr = objectValues(locationsRecord ?? {});
  const prizesArr = objectValues(prizesRecord ?? {});

  return {
    ok: true,
    participants: participantsArr.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    locations: locationsArr.sort((a, b) => a.id - b.id),
    prizes: prizesArr.sort(
      (a, b) => new Date((a as any).created_at).getTime() - new Date((b as any).created_at).getTime(),
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

  // Update in both Firebase (source of truth) and Supabase (for public display)
  await firebaseDb.update(`locations/${location.id}`, updates);
  
  // Also update in Supabase (ignore errors if RLS blocks it)
  try {
    await supabase
      .from('locations')
      .update(updates)
      .eq('id', location.id);
  } catch (error) {
    console.warn('Supabase update failed, but Firebase updated successfully:', error);
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
  
  await Promise.all([
    firebaseDb.remove(`participants/${participantId}`),
    firebaseDb.remove(`participants_by_username/${normalized}`),
    firebaseDb.remove(`checkins/${participantId}`),
    firebaseDb.remove(`spins/${participantId}`),
  ]);
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

export const createPrize = async (token: string, name: string, weight: number, stock: number = 10) => {
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
  await ensureDefaults();
  
  const heroCardsRecord = await firebaseDb.get<Record<string, HeroCardRecord>>("hero_cards");
  const cards = objectValues(heroCardsRecord);
  
  // Sort by order and filter active cards
  return cards.sort((a, b) => a.order - b.order);
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
