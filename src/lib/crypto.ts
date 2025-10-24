export async function signCheckin(locId: number, yyyymmdd: string, secret: string, version: number = 1): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${locId}:${yyyymmdd}:${version}`);
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyCheckinSig(
  locId: number,
  yyyymmdd: string,
  sig: string,
  secret: string,
  version: number = 1
): Promise<boolean> {
  const expected = await signCheckin(locId, yyyymmdd, secret, version);
  return expected === sig;
}

export function todayStr(offsetDays = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getUTCDate()}`.padStart(2, '0');
  return `${y}${m}${dd}`;
}

// ✨ สำหรับ Sub-Events
export async function signSubEventCheckin(subEventId: string, yyyymmdd: string, secret: string, version: number = 1): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`subevent:${subEventId}:${yyyymmdd}:${version}`);
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}