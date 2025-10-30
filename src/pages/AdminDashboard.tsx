import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createPrize as createPrizeApi,
  deletePrize as deletePrizeApi,
  getDashboardData,
  invalidateAdminSession,
  savePrize as savePrizeApi,
  setSpinThreshold as setSpinThresholdApi,
  updateLocation as updateLocationApi,
  deleteParticipant as deleteParticipantApi,
  updateParticipant as updateParticipantApi,
  getHeroCards,
  createHeroCard,
  saveHeroCard,
  deleteHeroCard,
  type HeroCardRecord,
} from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeminiSettingsTab } from "@/components/GeminiSettingsTab";
import {
  RefreshCw,
  LogOut,
  Download,
  Save,
  Plus,
  Trash2,
  Anchor,
  MapPin,
  Gift,
  Users,
  Layers,
  Search,
  Calendar,
  FileSpreadsheet,
  Bot,
  CheckCircle2,
  XCircle,
  Trophy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { AdminLocationManager } from "@/components/AdminLocationManager";
import { AdminParticipantManager } from "@/components/AdminParticipantManager";
import { HeroCardsTab } from "@/components/HeroCardsTabContent";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { 
  exportToExcel, 
  exportParticipantsOnly, 
  exportStatisticsOnly,
  exportPrizesOnly
} from "@/services/excelExport";
import { Switch } from "@/components/ui/switch";

interface ParticipantRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  points: number;
  age: number | null;
  grade_level: string | null;
  school: string | null;
  program: string | null;
  phone_number?: string; // ✅ เพิ่มเบอร์โทร
  created_at: string;
}

interface SpinRow {
  participant_id: string;
  prize: string;
  created_at: string;
  claim_code: string;
  claimed: boolean;
  claimed_at?: string;
}

interface LocationRow {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
  map_url?: string;
  image_url?: string;
  description?: string;
  qr_code_version?: number;
  display_order?: number;
  sub_events?: any[];
}

interface PrizeRow {
  id: string;
  name: string;
  weight: number;
  stock: number;
  image_url?: string;
  description?: string;
  created_at?: string;
}

interface DashboardResponse {
  ok: boolean;
  participants: ParticipantRow[];
  locations: LocationRow[];
  prizes: PrizeRow[];
  spins: SpinRow[]; // ✅ เพิ่มข้อมูลรางวัล
  checkins: any[];
  subEventCheckins: any[];
  settings: {
    pointsRequiredForWheel: number;
  };
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [locationDrafts, setLocationDrafts] = useState<LocationRow[]>([]);
  const [prizeDrafts, setPrizeDrafts] = useState<PrizeRow[]>([]);
  const [pointsRequired, setPointsRequired] = useState<number>(300); // ✅ Default 300 คะแนน
  const [savingLocationId, setSavingLocationId] = useState<number | null>(null);
  const [savingPrizeId, setSavingPrizeId] = useState<string | null>(null);
  const [newPrize, setNewPrize] = useState({ name: "", weight: "10", stock: "10", image_url: "", description: "" });
  const [updatingThreshold, setUpdatingThreshold] = useState(false);
  const [uploadingPrizeImage, setUploadingPrizeImage] = useState<string | null>(null); // For existing prizes
  const [uploadingNewPrizeImage, setUploadingNewPrizeImage] = useState(false); // For new prize
  const [heroCards, setHeroCards] = useState<HeroCardRecord[]>([]);
  const [heroCardDrafts, setHeroCardDrafts] = useState<HeroCardRecord[]>([]);
  const [newHeroCard, setNewHeroCard] = useState({ 
    title: "", 
    description: "", 
    icon: "🎯",
    order: "1"
  });
  const [searchQuery, setSearchQuery] = useState(""); // ✅ เพิ่ม search state
  const [exportingExcel, setExportingExcel] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("participants");

  const adminUsername = useMemo(() => localStorage.getItem("adminUsername") ?? "admin", []);
  const { logout: authLogout } = useAuth();

  const logout = useCallback(() => {
    void invalidateAdminSession(localStorage.getItem("adminToken") ?? "");
    authLogout();
    toast({
      title: "ออกจากระบบแล้ว",
      description: "ปิดการควบคุมเรือโจรสลัดเรียบร้อย",
    });
    navigate("/login");
  }, [authLogout, navigate, toast]);

  const fetchDashboard = useCallback(
    async (sessionToken: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardData(sessionToken);

        setDashboard(data);
        setLocationDrafts(data.locations.map((loc) => ({ ...loc })));
        setPrizeDrafts(data.prizes.map((prize) => ({ ...prize })));
        setPointsRequired(data.settings.pointsRequiredForWheel);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        const errorMsg = errorMessage(error);
        setError(errorMsg);
        
        toast({
          title: "ไม่สามารถโหลดข้อมูลได้",
          description: errorMsg,
          variant: "destructive",
        });
        
        // Only logout if session is actually invalid
        if (errorMsg.includes("Invalid session") || errorMsg.includes("session")) {
          setTimeout(() => logout(), 1500);
        }
      } finally {
        setLoading(false);
      }
    },
    [logout, toast],
  );

  useEffect(() => {
    const sessionToken = localStorage.getItem("adminToken");
    if (!sessionToken) {
      navigate("/login");
      return;
    }
    setToken(sessionToken);
    fetchDashboard(sessionToken);
  }, [fetchDashboard, navigate]);

  const handleLocationChange = (index: number, field: keyof LocationRow, value: string) => {
    setLocationDrafts((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };

      if (field === "lat" || field === "lng" || field === "points") {
        const numeric = value === "" ? NaN : Number(value);
        current[field] = numeric;
      } else {
        current[field] = value as never;
      }

      updated[index] = current;
      return updated;
    });
  };

  const saveLocation = async (location: LocationRow) => {
    if (!token) return;

    if (!location.name.trim() || Number.isNaN(location.points)) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "ชื่อและคะแนนต้องไม่ว่าง",
        variant: "destructive",
      });
      return;
    }

    setSavingLocationId(location.id);
    try {
      await updateLocationApi(token, {
        id: location.id,
        name: location.name.trim(),
        points: Number(location.points),
        map_url: location.map_url,
        image_url: location.image_url,
        description: location.description,
        display_order: location.display_order,
        // Ensure sub_events are included if they exist
        sub_events: location.sub_events,
      });
      
      // Trigger force refresh event for immediate updates
      window.dispatchEvent(new CustomEvent('force-map-refresh'));
      
      // Fetch dashboard to refresh the UI
      await fetchDashboard(token);
    } catch (error) {
      toast({
        title: "บันทึกจุดเช็กอินไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingLocationId(null);
    }
  };


  const saveSubEvents = async (locationId: number, subEvents: any[]) => {
    if (!token) return;
    
    try {
      await updateLocationApi(token, {
        id: locationId,
        sub_events: subEvents,
      });
      
      // Cache is automatically cleared by updateLocation
      toast({ title: "อัปเดตกิจกรรมย่อยแล้ว" });
      fetchDashboard(token);
      
      // Trigger force refresh event for all map pages
      window.dispatchEvent(new CustomEvent('force-map-refresh'));
    } catch (error) {
      toast({
        title: "บันทึกกิจกรรมย่อยไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteParticipant = async (participantId: string) => {
    if (!token) return;
    
    try {
      await deleteParticipantApi(token, participantId);
      toast({ title: "ลบลูกเรือสำเร็จ" });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "ลบลูกเรือไม่สำเร็จ",
      });
    }
  };

  // Removed old handleResetAllData - use handleResetUserData or handleDeleteAllParticipants instead

  const updateParticipant = async (participantId: string, updates: Partial<ParticipantRow>) => {
    if (!token) return;
    
    try {
      await updateParticipantApi(token, participantId, updates);
      toast({ title: "อัปเดตข้อมูลลูกเรือสำเร็จ" });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "อัปเดตข้อมูลไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };

  const adjustParticipantPoints = async (participantId: string, delta: number) => {
    if (!token) return;
    
    try {
      // Get current participant data from Firebase
      const participant = dashboard?.participants.find(p => p.id === participantId);
      if (!participant) {
        throw new Error("ไม่พบข้อมูลลูกเรือ");
      }
      
      // Calculate new points (minimum 0)
      const newPoints = Math.max(0, participant.points + delta);
      
      // Update points using Firebase
      await updateParticipant(participantId, { points: newPoints });
      
      toast({ 
        title: "ปรับคะแนนสำเร็จ",
        description: `${delta > 0 ? '+' : ''}${delta} คะแนน (รวม: ${newPoints} คะแนน)`
      });
      
      // Refresh dashboard to show updated points
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "ปรับคะแนนไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };


  const savePrize = async (prize: PrizeRow) => {
    if (!token) return;
    if (!prize.name.trim() || prize.weight <= 0 || prize.stock < 0) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณากรอกชื่อ, น้ำหนัก และจำนวนที่ถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    setSavingPrizeId(prize.id);
    try {
      await savePrizeApi(token, {
        id: prize.id,
        name: prize.name.trim(),
        weight: Number(prize.weight),
        stock: Number(prize.stock),
        image_url: prize.image_url || undefined,
        description: prize.description || undefined,
        created_at: prize.created_at || new Date().toISOString(),
      });
      toast({ title: "บันทึกรางวัลสำเร็จ" });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "บันทึกรางวัลไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSavingPrizeId(null);
    }
  };

  const deletePrize = async (id: string) => {
    if (!token) return;
    try {
      await deletePrizeApi(token, id);
      toast({ title: "ลบรางวัลสำเร็จ" });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "ลบรางวัลไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handlePrizeImageUpload = async (prizeId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingPrizeImage(prizeId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `prize-${prizeId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("location-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("location-images")
        .getPublicUrl(filePath);

      // Update the prize draft
      setPrizeDrafts((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((p) => p.id === prizeId);
        if (index >= 0) {
          updated[index] = { ...updated[index], image_url: data.publicUrl };
        }
        return updated;
      });

      toast({
        title: "อัปโหลดรูปภาพสำเร็จ",
        description: "กรุณากดบันทึกเพื่อบันทึกการเปลี่ยนแปลง",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "อัปโหลดไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setUploadingPrizeImage(null);
    }
  };

  const handleNewPrizeImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingNewPrizeImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `prize-new-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("location-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("location-images")
        .getPublicUrl(filePath);

      setNewPrize((prev) => ({ ...prev, image_url: data.publicUrl }));

      toast({
        title: "อัปโหลดรูปภาพสำเร็จ",
        description: "รูปภาพจะถูกบันทึกเมื่อเพิ่มรางวัล",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "อัปโหลดไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setUploadingNewPrizeImage(false);
    }
  };

  const addPrize = async () => {
    if (!token) return;

    const trimmedName = newPrize.name.trim();
    const weightValue = Number(newPrize.weight);
    const stockValue = Number(newPrize.stock);
    if (!trimmedName || Number.isNaN(weightValue) || weightValue <= 0 || Number.isNaN(stockValue) || stockValue < 0) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณากรอกชื่อ, น้ำหนัก และจำนวนที่ถูกต้อง",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPrizeApi(
        token, 
        trimmedName, 
        weightValue, 
        stockValue,
        newPrize.image_url || undefined,
        newPrize.description || undefined
      );
      toast({ title: "เพิ่มรางวัลสำเร็จ" });
      setNewPrize({ name: "", weight: "10", stock: "10", image_url: "", description: "" });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "เพิ่มรางวัลไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };

  const updateThreshold = async () => {
    if (!token) return;

    if (Number.isNaN(pointsRequired) || pointsRequired < 0) {
      toast({
        title: "Invalid points threshold",
        description: "Please provide a non-negative number for the wheel requirement.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingThreshold(true);
    try {
      await setSpinThresholdApi(token, pointsRequired);
      toast({ title: "Updated spin threshold" });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "Unable to update threshold",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUpdatingThreshold(false);
    }
  };

  // ✅ Filter participants ตาม search query
  const filteredParticipants = useMemo(() => {
    if (!dashboard) return [];
    if (!searchQuery.trim()) return dashboard.participants;
    
    const query = searchQuery.toLowerCase().trim();
    return dashboard.participants.filter((p) => {
      const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
      const phone = p.phone_number?.replace(/\D/g, '') || '';
      const queryPhone = query.replace(/\D/g, '');
      
      return (
        fullName.includes(query) ||
        p.first_name.toLowerCase().includes(query) ||
        p.last_name.toLowerCase().includes(query) ||
        p.username.toLowerCase().includes(query) ||
        (phone && queryPhone && phone.includes(queryPhone))
      );
    });
  }, [dashboard, searchQuery]);

  // Removed old CSV export functions - use Excel Export instead
  
  const handleResetUserData = async () => {
    if (!token) return;

    const adminPassword = prompt(
      "⚠️ กรุณากรอกรหัสผ่าน Admin เพื่อยืนยันการ Reset ข้อมูล User:\n\n" +
      "การดำเนินการนี้จะลบ:\n" +
      "• ข้อมูลเช็กอินทั้งหมด\n" +
      "• ข้อมูลกิจกรรมย่อยทั้งหมด\n" +
      "• ข้อมูลการหมุนวงล้อและรางวัล\n\n" +
      "แต่จะไม่ลบ: ข้อมูลลูกเรือ, สถานที่, กิจกรรม, รางวัล, Hero Cards\n\n" +
      "กรอกรหัสผ่าน Admin:"
    );

    if (!adminPassword) return;

    if (!confirm("⚠️ ยืนยันอีกครั้ง! แน่ใจว่าต้องการ Reset ข้อมูล User?")) {
      return;
    }

    try {
      const { resetAllData } = await import("@/services/firebase");
      await resetAllData(token, adminPassword);
      toast({
        title: "✅ Reset ข้อมูล User สำเร็จ",
        description: "ลบเช็กอิน กิจกรรม และรางวัลเรียบร้อย (ข้อมูลลูกเรือยังอยู่)",
      });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "❌ Reset ไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllParticipants = async () => {
    if (!token) return;

    const adminPassword = prompt(
      "🚨 กรุณากรอกรหัสผ่าน Admin เพื่อยืนยันการลบลูกเรือทั้งหมด:\n\n" +
      "⚠️ คำเตือนรุนแรง!\n" +
      "การดำเนินการนี้จะลบ:\n" +
      "• ข้อมูลลูกเรือทั้งหมด\n" +
      "• ข้อมูลเช็กอินทั้งหมด\n" +
      "• ข้อมูลกิจกรรมทั้งหมด\n" +
      "• ข้อมูลรางวัลทั้งหมด\n\n" +
      "ไม่สามารถย้อนกลับได้!\n\n" +
      "กรอกรหัสผ่าน Admin:"
    );

    if (!adminPassword) return;

    if (!confirm("🚨 ยืนยันอีกครั้ง! แน่ใจ 100% ว่าต้องการลบลูกเรือทั้งหมด?")) {
      return;
    }

    if (!confirm("🚨 ยืนยันครั้งสุดท้าย! การกระทำนี้ไม่สามารถกู้คืนได้!")) {
      return;
    }

    try {
      const { deleteAllParticipants } = await import("@/services/firebase");
      await deleteAllParticipants(token, adminPassword);
      toast({
        title: "✅ ลบลูกเรือทั้งหมดสำเร็จ",
        description: "ข้อมูลลูกเรือทั้งหมดถูกลบออกจากระบบแล้ว",
      });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "❌ ลบไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };

  // Excel Export Functions
  const handleExportToExcel = async (type: 'all' | 'participants' | 'statistics' | 'prizes' = 'all') => {
    if (!dashboard) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "กรุณารอโหลดข้อมูลเสร็จก่อน",
        variant: "destructive",
      });
      return;
    }

    setExportingExcel(true);
    try {
      switch (type) {
        case 'participants':
          exportParticipantsOnly(dashboard);
          toast({
            title: "✅ Export สำเร็จ",
            description: "ดาวน์โหลดข้อมูลผู้เข้าร่วมเรียบร้อยแล้ว",
          });
          break;
        case 'statistics':
          exportStatisticsOnly(dashboard);
          toast({
            title: "✅ Export สำเร็จ",
            description: "ดาวน์โหลดข้อมูลสถิติเรียบร้อยแล้ว",
          });
          break;
        case 'prizes':
          exportPrizesOnly(dashboard);
          toast({
            title: "✅ Export สำเร็จ",
            description: "ดาวน์โหลดข้อมูลรางวัลเรียบร้อยแล้ว",
          });
          break;
        default:
          exportToExcel(dashboard);
          toast({
            title: "✅ Export สำเร็จ",
            description: "ดาวน์โหลดข้อมูลทั้งหมดเรียบร้อยแล้ว",
          });
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "❌ Export ไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setExportingExcel(false), 500);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-6xl px-4 py-16 space-y-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight">
            <Anchor className="h-4 w-4 text-primary" />
            แดชบอร์ดผู้ควบคุมเรือ
          </span>
          <h1 className="pirate-heading md:text-5xl">บริหารกองเรือ FATU</h1>
          <p className="pirate-subheading">
            ติดตามลูกเรือ จัดการจุดเช็กอิน กำหนดรางวัล และดูคะแนนได้จากศูนย์ควบคุมแห่งนี้
          </p>
        </div>

        <div className="pirate-card flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left">
            <p className="text-sm uppercase tracking-wide text-foreground/60">
              เข้าสู่ระบบในนาม
            </p>
            <p className="text-lg font-semibold text-primary">{adminUsername}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => token && fetchDashboard(token)}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              รีเฟรชข้อมูล
            </Button>
            <Button variant="outline" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="pirate-card py-16 text-center text-foreground/70">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            กำลังโหลดข้อมูลแดชบอร์ด...
          </div>
        ) : error ? (
          <div className="pirate-card py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-foreground/70 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => token && fetchDashboard(token)} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                ลองอีกครั้ง
              </Button>
              <Button variant="outline" onClick={logout}>
                กลับไปหน้า Login
              </Button>
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl mx-auto text-left">
              <p className="text-sm font-semibold text-amber-900 mb-2">💡 เช็คสิ่งเหล่านี้:</p>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Firebase Database URL ตั้งค่าถูกต้องใน Vercel หรือยัง?</li>
                <li>• Environment Variable: <code className="bg-amber-100 px-1 py-0.5 rounded">VITE_FIREBASE_DB_URL</code></li>
                <li>• ตรวจสอบ Firebase Rules ว่าอนุญาตให้ Admin เข้าถึงหรือยัง</li>
                <li>• เปิด Console (F12) ดู error details</li>
              </ul>
            </div>
          </div>
        ) : !dashboard ? (
          <div className="pirate-card py-16 text-center text-foreground/70">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <XCircle className="h-10 w-10 text-gray-400" />
            </div>
            <p>ไม่พบข้อมูล</p>
            <Button onClick={() => token && fetchDashboard(token)} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              โหลดใหม่
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 md:grid-cols-5 lg:grid-cols-8 bg-white/80">
              <TabsTrigger value="participants" className="gap-2">
                <Users className="h-4 w-4" />
                ลูกเรือ
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="h-4 w-4" />
                จุดเช็กอิน & กิจกรรม
              </TabsTrigger>
              <TabsTrigger value="prizes" className="gap-2">
                <Gift className="h-4 w-4" />
                รางวัล & มอบรางวัล
              </TabsTrigger>
              <TabsTrigger value="herocards" className="gap-2">
                <Layers className="h-4 w-4" />
                Hero Cards
              </TabsTrigger>
              <TabsTrigger value="export" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export Data
              </TabsTrigger>
              <TabsTrigger value="gemini" className="gap-2">
                <Bot className="h-4 w-4" />
                AI Chatbot
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Anchor className="h-4 w-4" />
                ตั้งค่า
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="space-y-4">
              <div className="pirate-card px-6 py-8 space-y-6">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-primary">ลูกเรือทั้งหมด</h2>
                      <p className="text-sm text-foreground/70">
                        มีลูกเรือ {dashboard.participants.length} คนร่วมออกล่าสมบัติ
                        {searchQuery && ` (แสดง ${filteredParticipants.length} คนจากการค้นหา)`}
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => handleExportToExcel('participants')}>
                      <Download className="h-4 w-4" />
                      ดาวน์โหลด Excel
                    </Button>
                  </div>

                  {/* ✅ Search Box */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                      <Input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อ, นามสกุล, เบอร์โทร หรือ Username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {searchQuery && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSearchQuery("")}
                      >
                        ล้าง
                      </Button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-primary/10">
                  <table className="w-full">
                    <thead className="bg-primary/5">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold">Username</th>
                        <th className="p-3 text-left text-sm font-semibold">ชื่อ</th>
                        <th className="p-3 text-left text-sm font-semibold">นามสกุล</th>
                        <th className="p-3 text-center text-sm font-semibold">คะแนน</th>
                        <th className="p-3 text-left text-sm font-semibold">สถานศึกษา</th>
                        <th className="p-3 text-center text-sm font-semibold">สถานะรางวัล</th>
                        <th className="p-3 text-left text-sm font-semibold">รางวัล</th>
                        <th className="p-3 text-left text-sm font-semibold">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-foreground/60">
                            {searchQuery ? "ไม่พบผู้เข้าร่วมที่ตรงกับการค้นหา" : "ยังไม่มีผู้เข้าร่วม"}
                          </td>
                        </tr>
                      ) : (
                        filteredParticipants.map((participant) => {
                          const spin = dashboard.spins.find((s) => s.participant_id === participant.id);
                          return (
                            <AdminParticipantManager
                              key={participant.id}
                              participant={participant}
                              spin={spin} // ✅ ส่งข้อมูลรางวัล
                              onUpdate={updateParticipant}
                              onDelete={deleteParticipant}
                              onAdjustPoints={adjustParticipantPoints}
                            />
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="pirate-card px-6 py-8 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-primary">จัดการจุดเช็กอิน</h2>
                    <p className="text-sm text-foreground/70">
                      แก้ไขรายละเอียด อัปโหลดรูปภาพ และสร้าง QR Code สำหรับแต่ละจุด
                    </p>
                  </div>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={() => handleExportToExcel('all')}>
                    <Download className="h-4 w-4" />
                    Export Excel
                  </Button>
                </div>

                <div className="grid gap-6">
                  {dashboard.locations.map((location) => (
                    <AdminLocationManager
                      key={location.id}
                      location={location}
                      onSave={saveLocation}
                      onSaveSubEvents={saveSubEvents}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>


            <TabsContent value="prizes" className="space-y-4">
              {/* Prize Management Section */}
              <div className="pirate-card px-6 py-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Gift className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-primary">รายชื่อรางวัล</h2>
                    <p className="text-sm text-foreground/70">
                      ปรับแต่งรางวัลบนวงล้อและน้ำหนักการสุ่มได้ตามต้องการ
                    </p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {prizeDrafts.map((prize) => {
                    const prizeIndex = prizeDrafts.findIndex(p => p.id === prize.id);
                    return (
                    <div
                      key={prize.id}
                      className="rounded-2xl border border-rope/40 bg-white/70 px-6 py-6 shadow-sm"
                    >
                      <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
                        <div className="space-y-2">
                          <Label htmlFor={`prize-name-${prize.id}`}>ชื่อรางวัล</Label>
                          <Input
                            id={`prize-name-${prize.id}`}
                            value={prize.name}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                const idx = updated.findIndex(p => p.id === prize.id);
                                if (idx >= 0) {
                                  updated[idx] = { ...updated[idx], name: event.target.value };
                                }
                                return updated;
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`prize-weight-${prize.id}`}>น้ำหนัก (โอกาส)</Label>
                          <Input
                            id={`prize-weight-${prize.id}`}
                            type="number"
                            value={prize.weight}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                const idx = updated.findIndex(p => p.id === prize.id);
                                if (idx >= 0) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    weight: Number(event.target.value),
                                  };
                                }
                                return updated;
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`prize-stock-${prize.id}`}>จำนวนคงเหลือ</Label>
                          <Input
                            id={`prize-stock-${prize.id}`}
                            type="number"
                            min="0"
                            value={prize.stock}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                const idx = updated.findIndex(p => p.id === prize.id);
                                if (idx >= 0) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    stock: Number(event.target.value),
                                  };
                                }
                                return updated;
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`prize-image-${prize.id}`}>รูปภาพรางวัล</Label>
                          {prize.image_url && (
                            <div className="relative mb-2">
                              <img 
                                src={prize.image_url} 
                                alt={prize.name}
                                className="h-32 w-full object-cover rounded-lg border-2 border-amber-300"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setPrizeDrafts((prev) => {
                                    const updated = [...prev];
                                    const idx = updated.findIndex(p => p.id === prize.id);
                                    if (idx >= 0) {
                                      updated[idx] = {
                                        ...updated[idx],
                                        image_url: undefined,
                                      };
                                    }
                                    return updated;
                                  });
                                  toast({ title: "ลบรูปภาพสำเร็จ", description: "อย่าลืมบันทึกเพื่อยืนยันการเปลี่ยนแปลง" });
                                }}
                                className="absolute top-2 right-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePrizeImageUpload(prize.id, e)}
                              disabled={uploadingPrizeImage === prize.id}
                              className="flex-1"
                            />
                            {uploadingPrizeImage === prize.id && (
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-foreground/60">หรือใส่ URL รูปภาพ:</p>
                          <Input
                            id={`prize-image-url-${prize.id}`}
                            type="url"
                            placeholder="https://..."
                            value={prize.image_url || ""}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                const idx = updated.findIndex(p => p.id === prize.id);
                                if (idx >= 0) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    image_url: event.target.value || undefined,
                                  };
                                }
                                return updated;
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`prize-description-${prize.id}`}>รายละเอียด (ไม่บังคับ)</Label>
                          <Input
                            id={`prize-description-${prize.id}`}
                            placeholder="คำอธิบายรางวัล"
                            value={prize.description || ""}
                            onChange={(event) =>
                              setPrizeDrafts((prev) => {
                                const updated = [...prev];
                                const idx = updated.findIndex(p => p.id === prize.id);
                                if (idx >= 0) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    description: event.target.value || undefined,
                                  };
                                }
                                return updated;
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button
                          onClick={() => savePrize(prize)}
                          disabled={savingPrizeId === prize.id}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          {savingPrizeId === prize.id ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => deletePrize(prize.id)}>
                          <Trash2 className="h-4 w-4" />
                          ลบ
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-dashed border-rope/40 bg-white/60 px-6 py-6 shadow-inner">
                  <h3 className="text-lg font-semibold text-primary mb-4">เพิ่มรางวัลใหม่</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>ชื่อรางวัล *</Label>
                    <Input
                      placeholder="ชื่อรางวัล"
                      value={newPrize.name}
                      onChange={(event) =>
                        setNewPrize((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>น้ำหนัก *</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="น้ำหนัก"
                      value={newPrize.weight}
                      onChange={(event) =>
                        setNewPrize((prev) => ({ ...prev, weight: event.target.value }))
                      }
                    />
                      </div>
                      <div className="space-y-2">
                        <Label>จำนวน *</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="จำนวน"
                      value={newPrize.stock}
                      onChange={(event) =>
                        setNewPrize((prev) => ({ ...prev, stock: event.target.value }))
                      }
                    />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>รูปภาพรางวัล</Label>
                      {newPrize.image_url && (
                        <div className="relative mb-2">
                          <img 
                            src={newPrize.image_url} 
                            alt="Preview"
                            className="h-32 w-full object-cover rounded-lg border-2 border-amber-300"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setNewPrize((prev) => ({ ...prev, image_url: "" }));
                              toast({ title: "ลบรูปภาพสำเร็จ" });
                            }}
                            className="absolute top-2 right-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleNewPrizeImageUpload}
                          disabled={uploadingNewPrizeImage}
                          className="flex-1"
                        />
                        {uploadingNewPrizeImage && (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        )}
                      </div>
                      <p className="text-xs text-foreground/60">หรือใส่ URL รูปภาพ:</p>
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={newPrize.image_url}
                        onChange={(event) =>
                          setNewPrize((prev) => ({ ...prev, image_url: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>รายละเอียด</Label>
                      <Input
                        placeholder="คำอธิบายรางวัล"
                        value={newPrize.description}
                        onChange={(event) =>
                          setNewPrize((prev) => ({ ...prev, description: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button className="gap-2" onClick={addPrize}>
                      <Plus className="h-4 w-4" />
                      เพิ่มรางวัล
                    </Button>
                  </div>
                </div>
              </div>

              {/* Prize Claims Management Section */}
              <div className="pirate-card px-6 py-8 space-y-6 mt-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-primary">จัดการการมอบรางวัล</h2>
                    <p className="text-sm text-foreground/70">
                      ตรวจสอบและยืนยันการมอบรางวัล
                    </p>
                  </div>
                </div>

                <div className="pirate-divider" />

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="text-sm font-semibold text-foreground/70">รางวัลทั้งหมด</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">{dashboard.spins.length}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-800">มอบแล้ว</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                      {dashboard.spins.filter(s => s.claimed).length}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-5 w-5 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">รอมอบ</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-600">
                      {dashboard.spins.filter(s => !s.claimed).length}
                    </p>
                  </div>
                </div>

                {/* Search Box */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                    <Input
                      type="text"
                      placeholder="ค้นหาด้วยรหัส, ชื่อ, นามสกุล หรือรางวัล..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSearchQuery("")}
                    >
                      ล้าง
                    </Button>
                  )}
                </div>

                {/* Table */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รหัส</TableHead>
                        <TableHead>ชื่อ-นามสกุล</TableHead>
                        <TableHead>รางวัล</TableHead>
                        <TableHead>วันที่หมุน</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">การกระทำ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboard.spins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-foreground/50 py-8">
                            ยังไม่มีผู้ที่หมุนวงล้อ
                          </TableCell>
                        </TableRow>
                      ) : (
                        dashboard.spins
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .filter((spin) => {
                            if (!searchQuery) return true;
                            const participant = dashboard.participants.find(p => p.id === spin.participant_id);
                            const searchLower = searchQuery.toLowerCase();
                            return (
                              spin.claim_code.toLowerCase().includes(searchLower) ||
                              spin.prize.toLowerCase().includes(searchLower) ||
                              (participant && (
                                participant.first_name.toLowerCase().includes(searchLower) ||
                                participant.last_name.toLowerCase().includes(searchLower)
                              ))
                            );
                          })
                          .map((spin) => {
                            const participant = dashboard.participants.find(p => p.id === spin.participant_id);
                            return (
                              <TableRow key={spin.participant_id}>
                                <TableCell className="font-mono text-sm">{spin.claim_code}</TableCell>
                                <TableCell>
                                  {participant ? `${participant.first_name} ${participant.last_name}` : spin.participant_id}
                                </TableCell>
                                <TableCell className="font-semibold">{spin.prize}</TableCell>
                                <TableCell className="text-sm text-foreground/70">
                                  {new Date(spin.created_at).toLocaleString('th-TH')}
                                </TableCell>
                                <TableCell>
                                  {spin.claimed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                                      <CheckCircle2 className="h-3 w-3" />
                                      มอบแล้ว
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                                      <XCircle className="h-3 w-3" />
                                      รอมอบ
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {!spin.claimed && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-green-300 text-green-700 hover:bg-green-50"
                                      onClick={async () => {
                                        if (confirm(`ยืนยันการมอบรางวัล "${spin.prize}" ให้ ${participant?.first_name} ${participant?.last_name}?\n\nรหัส: ${spin.claim_code}`)) {
                                          try {
                                            const { markPrizeClaimed } = await import("@/services/firebase");
                                            await markPrizeClaimed(token!, spin.participant_id);
                                            toast({
                                              title: "มอบรางวัลสำเร็จ",
                                              description: "บันทึกการมอบรางวัลเรียบร้อยแล้ว",
                                            });
                                            fetchDashboard(token!);
                                          } catch (error) {
                                            toast({
                                              title: "เกิดข้อผิดพลาด",
                                              description: error instanceof Error ? error.message : "ไม่สามารถบันทึกได้",
                                              variant: "destructive",
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      มอบแล้ว
                                    </Button>
                                  )}
                                  {spin.claimed && spin.claimed_at && (
                                    <span className="text-xs text-foreground/50">
                                      {new Date(spin.claimed_at).toLocaleString('th-TH')}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="herocards" className="space-y-4">
              <HeroCardsTab token={token} />
            </TabsContent>

            <TabsContent value="gemini" className="space-y-4">
              <GeminiSettingsTab token={token} />
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <div className="pirate-card px-6 py-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-primary">Export ข้อมูลทั้งหมด</h2>
                    <p className="text-sm text-foreground/70">
                      ดาวน์โหลดข้อมูลทั้งหมดในไฟล์ Excel แยกเป็น Sheets ตามประเภทข้อมูล
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Excel Export - Main Feature */}
                  <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 px-6 py-8 shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                      <h3 className="text-xl font-semibold text-primary">Export Excel แบบครบถ้วน</h3>
                    </div>
                    <p className="mb-6 text-sm text-foreground/70">
                      ดาวน์โหลดไฟล์ Excel ที่รวมข้อมูลทั้งหมด แยกเป็น Sheets ดังนี้:
                    </p>
                    <ul className="mb-6 space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✓</span>
                        <span>ข้อมูลผู้ลงทะเบียนทั้งหมด (ชื่อ, อายุ, ระดับชั้น, สถานศึกษา, แผนการศึกษา, เบอร์โทร, รางวัล)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✓</span>
                        <span>เช็กอินสถานที่ทั้งหมดรวมกัน</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✓</span>
                        <span>เช็กอินแยกตามแต่ละสถานที่ (1 Sheet ต่อสถานที่)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-0.5 text-primary">✓</span>
                        <span>กิจกรรมย่อยทั้งหมด</span>
                      </li>
                    </ul>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleExportToExcel('all')}
                        disabled={exportingExcel || !dashboard}
                        className="w-full gap-2 shadow-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                        size="lg"
                      >
                        {exportingExcel ? (
                          <>
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            กำลัง Export...
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5" />
                            📥 ดาวน์โหลด Excel ทั้งหมด
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="mt-3 text-center text-xs text-foreground/60">
                      ภาษาไทยจะแสดงผลถูกต้องใน Excel
                    </p>
                  </div>

                </div>

                {/* Google Sheets Integration */}
                <div className="rounded-2xl border-4 border-amber-600 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 px-6 py-6 shadow-xl">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <FileSpreadsheet className="h-7 w-7 text-amber-700" />
                      <h3 className="text-2xl font-black text-amber-900">📊 Export ข้อมูล Excel</h3>
                    </div>
                    <p className="text-sm text-amber-800 font-semibold">
                      ดาวน์โหลดข้อมูลทั้งหมดในรูปแบบ Excel พร้อมจัดรูปแบบอัตโนมัติ
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={() => handleExportToExcel('all')}
                      disabled={exportingExcel || !dashboard}
                      className="w-full gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-lg h-14 text-base"
                      size="lg"
                    >
                      {exportingExcel ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          กำลัง Export...
                        </>
                      ) : (
                        <>
                          <Download className="h-6 w-6" />
                          📥 Export ข้อมูลทั้งหมด
                        </>
                      )}
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t-2 border-amber-300" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-amber-700 font-bold rounded-full border-2 border-amber-300">
                          หรือ Export เฉพาะส่วน
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button
                        onClick={() => handleExportToExcel('participants')}
                        disabled={exportingExcel || !dashboard}
                        variant="outline"
                        className="gap-2 border-2 border-amber-500 hover:bg-amber-100 font-bold"
                        size="lg"
                      >
                        <Users className="h-5 w-5" />
                        👥 ผู้เข้าร่วม
                      </Button>

                      <Button
                        onClick={() => handleExportToExcel('statistics')}
                        disabled={exportingExcel || !dashboard}
                        variant="outline"
                        className="gap-2 border-2 border-amber-500 hover:bg-amber-100 font-bold"
                        size="lg"
                      >
                        <Trophy className="h-5 w-5" />
                        📊 สถิติรวม
                      </Button>

                      <Button
                        onClick={() => handleExportToExcel('prizes')}
                        disabled={exportingExcel || !dashboard}
                        variant="outline"
                        className="gap-2 border-2 border-amber-500 hover:bg-amber-100 font-bold"
                        size="lg"
                      >
                        <Gift className="h-5 w-5" />
                        🎁 รางวัล
                      </Button>
                    </div>

                    <div className="rounded-xl border-2 border-amber-400 bg-amber-100 px-4 py-3">
                      <p className="text-sm text-amber-900 font-bold mb-2">
                        ✨ ความสามารถของระบบ Excel Export:
                      </p>
                      <ul className="text-xs text-amber-800 space-y-1.5">
                        <li>• 📋 แยก Sheet ตามประเภทข้อมูล</li>
                        <li>• 📊 สถิติรวมและการวิเคราะห์อัตโนมัติ</li>
                        <li>• 🗓️ วันที่และเวลาภาษาไทย</li>
                        <li>• 📐 จัดขนาดคอลัมน์อัตโนมัติ</li>
                        <li>• ✅ ข้อมูลครบถ้วนและพร้อมใช้งาน</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
                  <h4 className="mb-2 font-semibold text-primary">สถิติข้อมูล</h4>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{dashboard.participants.length}</p>
                      <p className="text-xs text-foreground/70">ผู้ลงทะเบียน</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">{dashboard.checkins.length}</p>
                      <p className="text-xs text-foreground/70">เช็กอินสถานที่</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent">{dashboard.subEventCheckins.length}</p>
                      <p className="text-xs text-foreground/70">เข้าร่วมกิจกรรม</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{dashboard.spins.length}</p>
                      <p className="text-xs text-foreground/70">ได้รับรางวัล</p>
                    </div>
                  </div>
                </div>

                {/* Danger Zone - Reset & Delete */}
                <div className="space-y-4">
                  {/* Reset User Data */}
                  <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 px-6 py-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      ⚠️ Reset ข้อมูล User
                    </h3>
                    <p className="text-sm text-orange-800 mb-3">
                      ลบข้อมูลการเข้าร่วมของ User (ไม่ลบข้อมูลลูกเรือ):
                    </p>
                    <ul className="text-sm text-orange-800 space-y-1 mb-4">
                      <li>• ข้อมูลเช็กอินทั้งหมด</li>
                      <li>• ข้อมูลกิจกรรมย่อยทั้งหมด</li>
                      <li>• ข้อมูลการหมุนวงล้อและรางวัล</li>
                      <li className="text-green-700 font-bold">✓ ไม่ลบ: ข้อมูลลูกเรือ, สถานที่, กิจกรรม, รางวัล, Hero Cards</li>
                    </ul>
                    <Button 
                      variant="destructive"
                      size="lg"
                      className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                      onClick={handleResetUserData}
                    >
                      <Trash2 className="h-5 w-5" />
                      Reset ข้อมูล User (ต้องใส่รหัส Admin)
                    </Button>
                  </div>

                  {/* Delete All Participants */}
                  <div className="rounded-2xl border-4 border-red-500 bg-red-50 px-6 py-6 shadow-xl">
                    <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-6 w-6" />
                      🚨 ลบลูกเรือทั้งหมด
                    </h3>
                    <p className="text-sm text-red-800 mb-3 font-semibold">
                      ⚠️ อันตราย! ลบข้อมูลลูกเรือทุกคนออกจากระบบ:
                    </p>
                    <ul className="text-sm text-red-900 space-y-1 mb-4 font-semibold">
                      <li>• ข้อมูลลูกเรือทั้งหมด</li>
                      <li>• ข้อมูลเช็กอินทั้งหมด</li>
                      <li>• ข้อมูลกิจกรรมทั้งหมด</li>
                      <li>• ข้อมูลรางวัลทั้งหมด</li>
                    </ul>
                    <p className="text-xs text-red-700 font-black mb-4 bg-red-200 px-3 py-2 rounded-lg">
                      🚨 คำเตือนรุนแรง: ไม่สามารถย้อนกลับได้! ต้องใส่รหัสผ่าน Admin!
                    </p>
                    <Button 
                      variant="destructive"
                      size="lg"
                      className="w-full gap-2 bg-red-700 hover:bg-red-800 text-white font-bold"
                      onClick={handleDeleteAllParticipants}
                    >
                      <Trash2 className="h-5 w-5" />
                      🚨 ลบลูกเรือทั้งหมด (ต้องใส่รหัส Admin)
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="pirate-card px-6 py-8 space-y-6">
                <h2 className="text-2xl font-semibold text-primary">ตั้งค่าระบบรางวัล</h2>
                <div className="max-w-sm space-y-3">
                  <Label htmlFor="points-required">คะแนนขั้นต่ำในการหมุนวงล้อ</Label>
                  <Input
                    id="points-required"
                    type="number"
                    min="0"
                    value={pointsRequired}
                    onChange={(event) => setPointsRequired(Number(event.target.value))}
                  />
                </div>
                <Button onClick={updateThreshold} disabled={updatingThreshold} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updatingThreshold ? "กำลังบันทึก..." : "บันทึกค่าคะแนน"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </PirateBackdrop>
  );
};

export default AdminDashboard;







