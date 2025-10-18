import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SpinWheel } from "@/components/SpinWheel";
import { Button } from "@/components/ui/button";
import { Anchor, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PirateBackdrop } from "@/components/PirateBackdrop";

interface PrizeOption {
  name: string;
  weight: number;
}

const Rewards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(300);
  const [prizes, setPrizes] = useState<PrizeOption[]>([]);
  const [hasSpun, setHasSpun] = useState(false);
  const [loading, setLoading] = useState(true);

  const participantId = useMemo(() => localStorage.getItem("participantId"), []);

  const loadData = useCallback(async () => {
    if (!participantId) return;
    try {
      const [participantRes, spinRes, settingsRes, prizesRes] = await Promise.all([
        supabase.from("participants").select("points").eq("id", participantId).single(),
        supabase.from("spins").select("id").eq("participant_id", participantId).maybeSingle(),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "points_required_for_wheel")
          .maybeSingle(),
        supabase.from("prizes").select("name, weight").order("created_at", { ascending: true }),
      ]);

      if (participantRes.data) setPoints(participantRes.data.points ?? 0);
      if (spinRes.data) setHasSpun(true);

      const value = settingsRes.data?.value as { value?: number } | null;
      if (value?.value !== undefined) {
        setPointsRequired(value.value);
      }

      if (prizesRes.data) {
        setPrizes(prizesRes.data.map((prize) => ({ name: prize.name, weight: prize.weight })));
      }
    } catch (error: unknown) {
      toast({
        title: "โหลดรางวัลไม่สำเร็จ",
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
        description: "กรุณาเข้าสู่ระบบเพื่อแลกรางวัล",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    loadData();
  }, [participantId, toast, navigate, loadData]);

  const handleSpin = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke<{ prize: string }>("spin", {
        body: { participantId },
      });

      if (error) {
        throw error;
      }

      if (data?.prize) {
        setHasSpun(true);
        toast({
          title: "ยินดีด้วย!",
          description: `คุณได้รับ ${data.prize}`,
        });
        return data.prize;
      }

      throw new Error("ไม่สามารถหมุนวงล้อได้ กรุณาลองใหม่อีกครั้ง");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "หมุนวงล้อไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    }
  };

  if (!participantId) {
    return null;
  }

  const notEnoughPoints = points < pointsRequired;

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-5xl px-4 py-16 space-y-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight">
            <Gift className="h-4 w-4 text-accent" />
            วงล้อขุมทรัพย์
          </span>
          <h1 className="pirate-heading md:text-5xl">หมุนวงล้อแห่งโชค</h1>
          <p className="pirate-subheading">
            สะสมคะแนนให้ครบแล้วปล่อยให้วงล้อพาไปสู่รางวัลล้ำค่า ประกายสมบัติโจรสลัดรออยู่ตรงหน้า!
          </p>
        </div>

        {loading ? (
          <div className="pirate-card p-12 text-center text-foreground/70">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            กำลังโหลดข้อมูลรางวัล...
          </div>
        ) : (
          <>
            {notEnoughPoints ? (
              <div className="pirate-card px-8 py-12 space-y-4 text-center">
                <Anchor className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="text-3xl font-semibold text-primary">คะแนนยังไม่เพียงพอ</h2>
                <p className="text-lg text-foreground/70">
                  คุณมี {points} คะแนน
                  ต้องสะสมเพิ่มอีก {pointsRequired - points} คะแนนเพื่อปลดล็อกวงล้อสมบัติ
                </p>
                <Button size="lg" onClick={() => navigate("/map")}>
                  กลับไปสะสมคะแนนต่อ
                </Button>
              </div>
            ) : (
              <div className="pirate-card px-6 py-10 space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-semibold text-primary">
                    พร้อมหมุนวงล้อสมบัติแล้ว!
                  </h2>
                  <p className="text-sm text-foreground/70">
                    คุณสะสมทั้งหมด {points} คะแนน หมุนได้เพียง 1 ครั้งต่อคน
                  </p>
                </div>
                <SpinWheel onSpin={handleSpin} disabled={hasSpun || prizes.length === 0} prizes={prizes} />
                {hasSpun && (
                  <p className="text-center text-sm text-foreground/70">
                    คุณหมุนวงล้อแล้ว หากต้องการรับชมผลอีกครั้ง ให้สอบถามทีมงานได้เลย
                  </p>
                )}
                {prizes.length === 0 && (
                  <p className="text-center text-sm text-foreground/70">
                    ขณะนี้ยังไม่มีการตั้งค่ารางวัล กรุณาติดต่อทีมงาน
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/map")}>
            กลับไปที่แผนที่
          </Button>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Rewards;
