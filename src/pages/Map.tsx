import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData } from "@/services/firebase";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Anchor, Compass, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PirateBackdrop } from "@/components/PirateBackdrop";

interface LocationEntry {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
}

const Map = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [checkins, setCheckins] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(300);
  const [loading, setLoading] = useState(true);

  const participantId = useMemo(() => localStorage.getItem("participantId"), []);

  const loadData = useCallback(async () => {
    if (!participantId) return;
    try {
      const data = await getMapData(participantId);

      setLocations(data.locations);
      setCheckins(data.checkins);
      setPoints(data.points ?? 0);
      setPointsRequired(data.pointsRequired);
    } catch (error: unknown) {
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description:
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [participantId, toast]);

  useEffect(() => {
    if (!participantId) {
      toast({
        title: "ต้องเข้าสู่ระบบก่อน",
        description: "กรุณาเข้าสู่ระบบเพื่อดูสถานะการผจญภัยของคุณ",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    loadData();
  }, [participantId, toast, navigate, loadData]);

  if (!participantId) {
    return null;
  }

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-5xl px-4 py-16 space-y-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight">
            <Compass className="h-4 w-4 text-secondary" />
            แผนที่ล่าสมบัติ
          </span>
          <h1 className="pirate-heading md:text-5xl">สถานีผจญภัยของลูกเรือ</h1>
          <p className="pirate-subheading">
            เช็กอินครบทั้ง 4 จุดสะสมคะแนนให้ครบกำหนด แล้วปลดล็อกวงล้อสมบัติเพื่อรับรางวัลใหญ่!
          </p>
        </div>

        <div className="pirate-card p-8 space-y-6">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-sm uppercase tracking-wider text-foreground/60">
                  คะแนนปัจจุบัน
                </p>
                <h2 className="text-3xl font-semibold text-primary">{points} คะแนน</h2>
              </div>
            </div>
            <div className="text-sm text-foreground/70">
              ต้องการอีก{" "}
              <span className="font-semibold text-primary">
                {Math.max(pointsRequired - points, 0)}
              </span>{" "}
              คะแนนเพื่อหมุนวงล้อสมบัติ
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-foreground/70">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              กำลังโหลดจุดเช็กอิน...
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <LocationCard
                  key={location.id}
                  {...location}
                  checkedIn={checkins.includes(location.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" variant="outline" onClick={() => navigate("/rewards")}>
            ไปหน้าวงล้อสมบัติ
          </Button>
          <Button size="lg" variant="ghost" onClick={() => navigate("/")}>
            <Anchor className="mr-2 h-4 w-4" />
            กลับหน้าแรก
          </Button>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Map;

