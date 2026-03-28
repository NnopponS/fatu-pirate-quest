-- ============================================
-- คำสั่ง SQL สำหรับแก้ปัญหา RLS
-- รันใน Lovable Database Console หรือ Supabase SQL Editor
-- ============================================

-- ปิด RLS สำหรับ locations table
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;

-- ลบ policies เก่าของ locations (ถ้ามี)
DROP POLICY IF EXISTS "locations_public_read" ON locations;
DROP POLICY IF EXISTS "locations_allow_update" ON locations;
DROP POLICY IF EXISTS "locations_allow_insert" ON locations;
DROP POLICY IF EXISTS "locations_allow_delete" ON locations;

-- ปิด RLS สำหรับ participants table  
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;

-- ลบ policies เก่าของ participants (ถ้ามี)
DROP POLICY IF EXISTS "participants_public_read" ON participants;
DROP POLICY IF EXISTS "participants_allow_update" ON participants;
DROP POLICY IF EXISTS "participants_allow_insert" ON participants;
DROP POLICY IF EXISTS "participants_allow_delete" ON participants;

-- ปิด RLS สำหรับ event_settings table
ALTER TABLE event_settings DISABLE ROW LEVEL SECURITY;

-- ลบ policies เก่าของ event_settings (ถ้ามี)
DROP POLICY IF EXISTS "event_settings_public_read" ON event_settings;
DROP POLICY IF EXISTS "event_settings_allow_update" ON event_settings;

-- ตรวจสอบว่า RLS ถูกปิดแล้วจริงๆ
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('locations', 'participants', 'event_settings');

-- ถ้า rls_enabled = false แสดงว่าสำเร็จ! ✅

