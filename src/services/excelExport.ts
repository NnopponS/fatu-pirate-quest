import * as XLSX from 'xlsx';

/**
 * ระบบ Export ข้อมูลเป็น Excel ที่ละเอียดและครบถ้วน
 * รองรับการ export หลายรูปแบบและมีการจัดรูปแบบที่สวยงาม
 */

// Dashboard Response interface for excelExport
export interface DashboardResponse {
  ok: boolean;
  participants: any[];
  locations: any[];
  prizes: any[];
  spins: any[];
  checkins: any[];
  subEventCheckins: any[];
  settings: {
    pointsRequiredForWheel: number;
  };
}

interface ExportOptions {
  includeParticipants?: boolean;
  includeLocations?: boolean;
  includePrizes?: boolean;
  includeCheckins?: boolean;
  includeSubEventCheckins?: boolean;
  includeSpins?: boolean;
  includeStatistics?: boolean;
  separateSheets?: boolean;
}

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeParticipants: true,
  includeLocations: true,
  includePrizes: true,
  includeCheckins: true,
  includeSubEventCheckins: true,
  includeSpins: true,
  includeStatistics: true,
  separateSheets: true,
};

/**
 * สร้างเวลาปัจจุบันสำหรับชื่อไฟล์
 */
const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
};

/**
 * จัดรูปแบบวันที่เป็นภาษาไทย
 */
const formatDateThai = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateString;
  }
};

/**
 * สร้าง worksheet สำหรับผู้เข้าร่วม
 */
const createParticipantsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'ID',
      'Username',
      'ชื่อ',
      'นามสกุล',
      'คะแนนรวม',
      'อายุ',
      'ระดับชั้น',
      'โรงเรียน',
      'แผนการศึกษา',
      'เบอร์โทรศัพท์',
      'จำนวนเช็กอิน',
      'จำนวนกิจกรรมที่เข้าร่วม',
      'สถานะรางวัล',
      'รางวัลที่ได้รับ',
      'รหัสรับรางวัล',
      'สถานะการมอบรางวัล',
      'วันที่มอบรางวัล',
      'ลงทะเบียนเมื่อ',
    ]
  ];

  dashboard.participants.forEach((p) => {
    const spin = dashboard.spins.find((s) => s.participant_id === p.id);
    const checkinCount = dashboard.checkins.filter((c) => c.participant_id === p.id).length;
    const subEventCount = dashboard.subEventCheckins.filter((se) => se.participant_id === p.id).length;

    data.push([
      p.id,
      p.username,
      p.first_name,
      p.last_name,
      p.points,
      p.age ?? '',
      p.grade_level ?? '',
      p.school ?? '',
      p.program ?? '',
      p.phone_number ?? '',
      checkinCount,
      subEventCount,
      spin ? 'หมุนวงล้อแล้ว' : 'ยังไม่ได้หมุน',
      spin ? spin.prize : '-',
      spin ? spin.claim_code : '-',
      spin ? (spin.claimed ? '✓ มอบแล้ว' : '✗ รอมอบ') : '-',
      spin && spin.claimed_at ? formatDateThai(spin.claimed_at) : '-',
      formatDateThai(p.created_at),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // ตั้งค่าความกว้างของคอลัมน์
  ws['!cols'] = [
    { wch: 25 }, // ID
    { wch: 15 }, // Username
    { wch: 15 }, // ชื่อ
    { wch: 15 }, // นามสกุล
    { wch: 12 }, // คะแนน
    { wch: 8 },  // อายุ
    { wch: 12 }, // ระดับชั้น
    { wch: 30 }, // โรงเรียน
    { wch: 20 }, // แผนการศึกษา
    { wch: 15 }, // เบอร์โทร
    { wch: 15 }, // จำนวนเช็กอิน
    { wch: 20 }, // จำนวนกิจกรรม
    { wch: 18 }, // สถานะรางวัล
    { wch: 30 }, // รางวัล
    { wch: 15 }, // รหัสรับรางวัล
    { wch: 18 }, // สถานะการมอบ
    { wch: 20 }, // วันที่มอบ
    { wch: 20 }, // ลงทะเบียนเมื่อ
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับสถานที่
 */
const createLocationsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'ID',
      'ชื่อสถานที่',
      'Latitude',
      'Longitude',
      'คะแนนเช็กอิน',
      'จำนวนกิจกรรมย่อย',
      'จำนวนคนที่เช็กอิน',
      'คำอธิบาย',
      'QR Code Version',
      'ลำดับการแสดง',
    ]
  ];

  dashboard.locations.forEach((loc) => {
    const checkinCount = dashboard.checkins.filter((c) => c.location_id === loc.id).length;
    const subEventCount = loc.sub_events?.length ?? 0;

    data.push([
      loc.id,
      loc.name,
      loc.lat,
      loc.lng,
      loc.points,
      subEventCount,
      checkinCount,
      loc.description ?? '',
      loc.qr_code_version ?? 1,
      loc.display_order ?? 0,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 8 },  // ID
    { wch: 30 }, // ชื่อ
    { wch: 12 }, // Lat
    { wch: 12 }, // Lng
    { wch: 15 }, // คะแนน
    { wch: 18 }, // จำนวนกิจกรรม
    { wch: 20 }, // จำนวนคนเช็กอิน
    { wch: 40 }, // คำอธิบาย
    { wch: 15 }, // QR Version
    { wch: 15 }, // ลำดับ
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับกิจกรรมย่อย
 */
const createSubEventsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'Sub Event ID',
      'ชื่อกิจกรรม',
      'Location ID',
      'ชื่อสถานที่',
      'คะแนนที่ให้',
      'เวลากิจกรรม',
      'จำนวนคนเข้าร่วม',
      'คำอธิบาย',
      'QR Code Version',
    ]
  ];

  dashboard.locations.forEach((loc) => {
    if (loc.sub_events && loc.sub_events.length > 0) {
      loc.sub_events.forEach((se) => {
        const participantCount = dashboard.subEventCheckins.filter(
          (sec) => sec.sub_event_id === se.id
        ).length;

        data.push([
          se.id,
          se.name,
          loc.id,
          loc.name,
          se.points_awarded ?? 100,
          se.time ?? '',
          participantCount,
          se.description ?? '',
          se.qr_code_version ?? 1,
        ]);
      });
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 30 }, // Sub Event ID
    { wch: 35 }, // ชื่อกิจกรรม
    { wch: 12 }, // Location ID
    { wch: 30 }, // ชื่อสถานที่
    { wch: 15 }, // คะแนน
    { wch: 20 }, // เวลา
    { wch: 18 }, // จำนวนคน
    { wch: 40 }, // คำอธิบาย
    { wch: 15 }, // QR Version
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับรางวัล
 */
const createPrizesSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'ID',
      'ชื่อรางวัล',
      'น้ำหนัก (สำหรับสุ่ม)',
      'จำนวนคงเหลือ',
      'จำนวนที่แจก',
      'จำนวนที่มอบแล้ว',
      'คำอธิบาย',
      'สร้างเมื่อ',
    ]
  ];

  dashboard.prizes.forEach((prize) => {
    const totalGiven = dashboard.spins.filter((s) => s.prize === prize.name).length;
    const totalClaimed = dashboard.spins.filter((s) => s.prize === prize.name && s.claimed).length;

    data.push([
      prize.id,
      prize.name,
      prize.weight,
      prize.stock,
      totalGiven,
      totalClaimed,
      prize.description ?? '',
      prize.created_at ? formatDateThai(prize.created_at) : '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 30 }, // ID
    { wch: 30 }, // ชื่อ
    { wch: 20 }, // น้ำหนัก
    { wch: 15 }, // คงเหลือ
    { wch: 15 }, // แจก
    { wch: 15 }, // มอบแล้ว
    { wch: 40 }, // คำอธิบาย
    { wch: 20 }, // สร้างเมื่อ
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับเช็กอิน
 */
const createCheckinsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'Participant ID',
      'Username',
      'ชื่อ-นามสกุล',
      'Location ID',
      'ชื่อสถานที่',
      'วิธีเช็กอิน',
      'เช็กอินเมื่อ',
    ]
  ];

  dashboard.checkins.forEach((checkin) => {
    const participant = dashboard.participants.find((p) => p.id === checkin.participant_id);
    const location = dashboard.locations.find((l) => l.id === checkin.location_id);

    data.push([
      checkin.participant_id,
      participant?.username ?? '',
      participant ? `${participant.first_name} ${participant.last_name}` : '',
      checkin.location_id,
      location?.name ?? '',
      checkin.method,
      formatDateThai(checkin.created_at),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 }, // Participant ID
    { wch: 15 }, // Username
    { wch: 25 }, // ชื่อ-นามสกุล
    { wch: 12 }, // Location ID
    { wch: 30 }, // ชื่อสถานที่
    { wch: 15 }, // วิธี
    { wch: 20 }, // เวลา
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับการเข้าร่วมกิจกรรมย่อย
 */
const createSubEventCheckinsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'Participant ID',
      'Username',
      'ชื่อ-นามสกุล',
      'Sub Event ID',
      'ชื่อกิจกรรม',
      'Location ID',
      'ชื่อสถานที่',
      'คะแนนที่ได้',
      'เข้าร่วมเมื่อ',
    ]
  ];

  dashboard.subEventCheckins.forEach((checkin) => {
    const participant = dashboard.participants.find((p) => p.id === checkin.participant_id);
    const location = dashboard.locations.find((l) => l.id === checkin.location_id);
    const subEvent = location?.sub_events?.find((se) => se.id === checkin.sub_event_id);

    data.push([
      checkin.participant_id,
      participant?.username ?? '',
      participant ? `${participant.first_name} ${participant.last_name}` : '',
      checkin.sub_event_id,
      subEvent?.name ?? '',
      checkin.location_id,
      location?.name ?? '',
      checkin.points_awarded,
      formatDateThai(checkin.created_at),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 }, // Participant ID
    { wch: 15 }, // Username
    { wch: 25 }, // ชื่อ-นามสกุล
    { wch: 30 }, // Sub Event ID
    { wch: 35 }, // ชื่อกิจกรรม
    { wch: 12 }, // Location ID
    { wch: 30 }, // ชื่อสถานที่
    { wch: 15 }, // คะแนน
    { wch: 20 }, // เวลา
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับรางวัลที่แจก
 */
const createSpinsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const data = [
    [
      'Participant ID',
      'Username',
      'ชื่อ-นามสกุล',
      'รางวัล',
      'รหัสรับรางวัล',
      'สถานะการมอบ',
      'หมุนวงล้อเมื่อ',
      'มอบรางวัลเมื่อ',
    ]
  ];

  dashboard.spins.forEach((spin) => {
    const participant = dashboard.participants.find((p) => p.id === spin.participant_id);

    data.push([
      spin.participant_id,
      participant?.username ?? '',
      participant ? `${participant.first_name} ${participant.last_name}` : '',
      spin.prize,
      spin.claim_code,
      spin.claimed ? '✓ มอบแล้ว' : '✗ ยังไม่มอบ',
      formatDateThai(spin.created_at),
      spin.claimed_at ? formatDateThai(spin.claimed_at) : '-',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 25 }, // Participant ID
    { wch: 15 }, // Username
    { wch: 25 }, // ชื่อ-นามสกุล
    { wch: 30 }, // รางวัล
    { wch: 15 }, // รหัส
    { wch: 15 }, // สถานะ
    { wch: 20 }, // หมุนเมื่อ
    { wch: 20 }, // มอบเมื่อ
  ];

  return ws;
};

/**
 * สร้าง worksheet สำหรับสถิติ
 */
const createStatisticsSheet = (dashboard: DashboardResponse): XLSX.WorkSheet => {
  const totalParticipants = dashboard.participants.length;
  const totalCheckins = dashboard.checkins.length;
  const totalSubEventCheckins = dashboard.subEventCheckins.length;
  const totalSpins = dashboard.spins.length;
  const totalPrizesClaimed = dashboard.spins.filter((s) => s.claimed).length;
  const totalPoints = dashboard.participants.reduce((sum, p) => sum + p.points, 0);
  const avgPoints = totalParticipants > 0 ? (totalPoints / totalParticipants).toFixed(2) : 0;

  const data = [
    ['📊 สถิติรวมของระบบ', ''],
    ['', ''],
    ['จำนวนผู้เข้าร่วมทั้งหมด', totalParticipants],
    ['จำนวนเช็กอินทั้งหมด', totalCheckins],
    ['จำนวนการเข้าร่วมกิจกรรมย่อย', totalSubEventCheckins],
    ['จำนวนสถานที่ทั้งหมด', dashboard.locations.length],
    ['จำนวนกิจกรรมย่อยทั้งหมด', dashboard.locations.reduce((sum, loc) => sum + (loc.sub_events?.length ?? 0), 0)],
    ['จำนวนรางวัลทั้งหมด', dashboard.prizes.length],
    ['จำนวนคนที่หมุนวงล้อ', totalSpins],
    ['จำนวนรางวัลที่มอบแล้ว', totalPrizesClaimed],
    ['จำนวนรางวัลรอมอบ', totalSpins - totalPrizesClaimed],
    ['คะแนนรวมทั้งหมด', totalPoints],
    ['คะแนนเฉลี่ยต่อคน', avgPoints],
    ['คะแนนที่ต้องการเพื่อหมุนวงล้อ', dashboard.settings.pointsRequiredForWheel],
    ['', ''],
    ['🏆 สถิติรางวัล', ''],
    ['ชื่อรางวัล', 'จำนวนที่แจก'],
  ];

  // เพิ่มรายละเอียดรางวัล
  dashboard.prizes.forEach((prize) => {
    const count = dashboard.spins.filter((s) => s.prize === prize.name).length;
    data.push([prize.name, count]);
  });

  data.push(['', '']);
  data.push(['📍 สถิติสถานที่', '']);
  data.push(['ชื่อสถานที่', 'จำนวนเช็กอิน']);

  // เพิ่มรายละเอียดสถานที่
  dashboard.locations.forEach((loc) => {
    const count = dashboard.checkins.filter((c) => c.location_id === loc.id).length;
    data.push([loc.name, count]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  
  ws['!cols'] = [
    { wch: 40 }, // หัวข้อ
    { wch: 20 }, // ค่า
  ];

  return ws;
};

/**
 * Export ข้อมูลทั้งหมดเป็น Excel
 */
export const exportToExcel = (
  dashboard: DashboardResponse,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): void => {
  const workbook = XLSX.utils.book_new();

  // เพิ่ม sheets ตามที่เลือก
  if (options.includeStatistics) {
    XLSX.utils.book_append_sheet(workbook, createStatisticsSheet(dashboard), '📊 สถิติรวม');
  }

  if (options.includeParticipants) {
    XLSX.utils.book_append_sheet(workbook, createParticipantsSheet(dashboard), '👥 ผู้เข้าร่วม');
  }

  if (options.includeLocations) {
    XLSX.utils.book_append_sheet(workbook, createLocationsSheet(dashboard), '📍 สถานที่');
  }

  if (options.includeLocations) {
    XLSX.utils.book_append_sheet(workbook, createSubEventsSheet(dashboard), '🎯 กิจกรรมย่อย');
  }

  if (options.includePrizes) {
    XLSX.utils.book_append_sheet(workbook, createPrizesSheet(dashboard), '🎁 รางวัล');
  }

  if (options.includeSpins) {
    XLSX.utils.book_append_sheet(workbook, createSpinsSheet(dashboard), '🎰 รางวัลที่แจก');
  }

  if (options.includeCheckins) {
    XLSX.utils.book_append_sheet(workbook, createCheckinsSheet(dashboard), '✅ เช็กอิน');
  }

  if (options.includeSubEventCheckins) {
    XLSX.utils.book_append_sheet(workbook, createSubEventCheckinsSheet(dashboard), '🎪 การเข้าร่วมกิจกรรม');
  }

  // สร้างชื่อไฟล์
  const timestamp = getTimestamp();
  const filename = `Pirate_Quest_Export_${timestamp}.xlsx`;

  // Export
  XLSX.writeFile(workbook, filename);
};

/**
 * Export เฉพาะข้อมูลผู้เข้าร่วม
 */
export const exportParticipantsOnly = (dashboard: DashboardResponse): void => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, createParticipantsSheet(dashboard), 'ผู้เข้าร่วม');
  
  const timestamp = getTimestamp();
  const filename = `Participants_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Export เฉพาะข้อมูลสถิติ
 */
export const exportStatisticsOnly = (dashboard: DashboardResponse): void => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, createStatisticsSheet(dashboard), 'สถิติ');
  
  const timestamp = getTimestamp();
  const filename = `Statistics_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

/**
 * Export เฉพาะข้อมูลรางวัล
 */
export const exportPrizesOnly = (dashboard: DashboardResponse): void => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, createPrizesSheet(dashboard), 'รางวัล');
  XLSX.utils.book_append_sheet(workbook, createSpinsSheet(dashboard), 'รางวัลที่แจก');
  
  const timestamp = getTimestamp();
  const filename = `Prizes_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

