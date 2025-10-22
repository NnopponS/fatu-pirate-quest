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
  regenerateLocationQR as regenerateLocationQRApi,
  deleteParticipant as deleteParticipantApi,
  updateParticipant as updateParticipantApi,
} from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { AdminLocationManager } from "@/components/AdminLocationManager";
import { AdminParticipantManager } from "@/components/AdminParticipantManager";
import { supabase } from "@/integrations/supabase/client";

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
  created_at: string;
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
}

interface PrizeRow {
  id: string;
  name: string;
  weight: number;
  stock: number;
  created_at?: string;
}

interface DashboardResponse {
  ok: boolean;
  participants: ParticipantRow[];
  locations: LocationRow[];
  prizes: PrizeRow[];
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
  const [token, setToken] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [locationDrafts, setLocationDrafts] = useState<LocationRow[]>([]);
  const [prizeDrafts, setPrizeDrafts] = useState<PrizeRow[]>([]);
  const [pointsRequired, setPointsRequired] = useState<number>(400);
  const [savingLocationId, setSavingLocationId] = useState<number | null>(null);
  const [savingPrizeId, setSavingPrizeId] = useState<string | null>(null);
  const [newPrize, setNewPrize] = useState({ name: "", weight: "10", stock: "10" });
  const [updatingThreshold, setUpdatingThreshold] = useState(false);

  const adminUsername = useMemo(() => localStorage.getItem("adminUsername") ?? "admin", []);

  const logout = useCallback(() => {
    void invalidateAdminSession(localStorage.getItem("adminToken") ?? "");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("authRole");
    toast({
      title: "ออกจากระบบแล้ว",
      description: "ปิดการควบคุมเรือโจรสลัดเรียบร้อย",
    });
    navigate("/login");
  }, [navigate, toast]);

  const fetchDashboard = useCallback(
    async (sessionToken: string) => {
      setLoading(true);
      try {
        const data = await getDashboardData(sessionToken);

        setDashboard(data);
        setLocationDrafts(data.locations.map((loc) => ({ ...loc })));
        setPrizeDrafts(data.prizes.map((prize) => ({ ...prize })));
        setPointsRequired(data.settings.pointsRequiredForWheel);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        const errorMsg = errorMessage(error);
        
        toast({
          title: "ไม่สามารถโหลดข้อมูลได้",
          description: errorMsg,
          variant: "destructive",
        });
        
        // Only logout if session is actually invalid
        if (errorMsg.includes("Invalid session") || errorMsg.includes("session")) {
          logout();
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
      });
      toast({ title: "อัปเดตจุดเช็กอินแล้ว" });
      fetchDashboard(token);
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

  const regenerateQR = async (locationId: number) => {
    if (!token) return;
    
    try {
      await regenerateLocationQRApi(token, locationId);
      toast({ 
        title: "สร้าง QR Code ใหม่สำเร็จ",
        description: "QR code เวอร์ชันเก่าจะใช้ไม่ได้แล้ว" 
      });
      fetchDashboard(token);
    } catch (error) {
      toast({
        title: "สร้าง QR ไม่สำเร็จ",
        description: errorMessage(error),
        variant: "destructive",
      });
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
        description: errorMessage(error),
        variant: "destructive",
      });
    }
  };

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
      await createPrizeApi(token, trimmedName, weightValue, stockValue);
      toast({ title: "เพิ่มรางวัลสำเร็จ" });
      setNewPrize({ name: "", weight: "10", stock: "10" });
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

  const exportParticipants = () => {
    if (!dashboard) return;

    const header = [
      "ID",
      "Username",
      "ชื่อ",
      "นามสกุล",
      "คะแนน",
      "อายุ",
      "ระดับชั้น",
      "สถานศึกษา",
      "โปรแกรม",
      "ลงทะเบียนเมื่อ",
    ];

    const rows = dashboard.participants.map((p) => [
      p.id,
      p.username,
      p.first_name,
      p.last_name,
      String(p.points),
      p.age ? String(p.age) : "",
      p.grade_level ?? "",
      p.school ?? "",
      p.program ?? "",
      new Date(p.created_at).toISOString(),
    ]);

    const csvContent = [header, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const sanitized = value.replace(/"/g, '""');
            return `"${sanitized}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fatu_participants_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

        {loading || !dashboard ? (
          <div className="pirate-card py-16 text-center text-foreground/70">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            กำลังโหลดข้อมูลแดชบอร์ด...
          </div>
        ) : (
          <Tabs defaultValue="participants" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 bg-white/80">
              <TabsTrigger value="participants" className="gap-2">
                <Users className="h-4 w-4" />
                ลูกเรือ
              </TabsTrigger>
              <TabsTrigger value="locations" className="gap-2">
                <MapPin className="h-4 w-4" />
                จุดเช็กอิน
              </TabsTrigger>
              <TabsTrigger value="prizes" className="gap-2">
                <Gift className="h-4 w-4" />
                รางวัล
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Anchor className="h-4 w-4" />
                ตั้งค่า
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="space-y-4">
              <div className="pirate-card px-6 py-8 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-primary">ลูกเรือทั้งหมด</h2>
                    <p className="text-sm text-foreground/70">
                      มีลูกเรือ {dashboard.participants.length} คนร่วมออกล่าสมบัติ
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2" onClick={exportParticipants}>
                    <Download className="h-4 w-4" />
                    ดาวน์โหลด CSV
                  </Button>
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
                        <th className="p-3 text-left text-sm font-semibold">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.participants.map((participant) => (
                        <AdminParticipantManager
                          key={participant.id}
                          participant={participant}
                          onUpdate={updateParticipant}
                          onDelete={deleteParticipant}
                          onAdjustPoints={adjustParticipantPoints}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="pirate-card px-6 py-8 space-y-6">
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

                <div className="grid gap-6">
                  {dashboard.locations.map((location) => (
                    <AdminLocationManager
                      key={location.id}
                      location={location}
                      onSave={saveLocation}
                      onGenerateQR={regenerateQR}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prizes" className="space-y-4">
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
                  {prizeDrafts.map((prize, index) => (
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
                                updated[index] = { ...updated[index], name: event.target.value };
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
                                updated[index] = {
                                  ...updated[index],
                                  weight: Number(event.target.value),
                                };
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
                                updated[index] = {
                                  ...updated[index],
                                  stock: Number(event.target.value),
                                };
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
                  ))}
                </div>

                <div className="rounded-2xl border border-dashed border-rope/40 bg-white/60 px-6 py-6 shadow-inner">
                  <h3 className="text-lg font-semibold text-primary mb-4">เพิ่มรางวัลใหม่</h3>
                  <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
                    <Input
                      placeholder="ชื่อรางวัล"
                      value={newPrize.name}
                      onChange={(event) =>
                        setNewPrize((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="น้ำหนัก"
                      value={newPrize.weight}
                      onChange={(event) =>
                        setNewPrize((prev) => ({ ...prev, weight: event.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="จำนวน"
                      value={newPrize.stock}
                      onChange={(event) =>
                        setNewPrize((prev) => ({ ...prev, stock: event.target.value }))
                      }
                    />
                    <Button className="gap-2" onClick={addPrize}>
                      <Plus className="h-4 w-4" />
                      เพิ่มรางวัล
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







