import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRewardsData, spinWheel } from "@/services/firebase";
import { SpinWheel } from "@/components/SpinWheel";
import { Button } from "@/components/ui/button";
import { Anchor, Gift, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";

interface PrizeOption {
  name: string;
  weight: number;
  stock: number;
}

const Rewards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(400);
  const [prizes, setPrizes] = useState<PrizeOption[]>([]);
  const [hasSpun, setHasSpun] = useState(false);
  const [loading, setLoading] = useState(true);

  const participantId = useMemo(() => localStorage.getItem("participantId"), []);

  const handleLogout = useCallback(() => {
    logout();
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "แล้วพบกันใหม่ในการผจญภัยครั้งหน้า!",
    });
    navigate("/login");
  }, [logout, toast, navigate]);

  const loadData = useCallback(async () => {
    if (!participantId) return;
    try {
      const data = await getRewardsData(participantId);

      setPoints(data.points ?? 0);
      setHasSpun(data.hasSpun);
      setPointsRequired(data.pointsRequired);
      setPrizes(data.prizes);
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
      if (!participantId) {
        throw new Error("Missing participant identifier");
      }

      const { prize } = await spinWheel(participantId);
      setHasSpun(true);
      toast({
        title: "Congrats on your prize!",
        description: `You just won ${prize}.`,
      });
      return prize;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Spin failed",
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
      <PirateCharacter 
        messages={[
          "อาร์ร์! คะแนนเจ้าครบแล้วหรือยัง? 🎰",
          "หมุนวงล้อเพื่อรับสมบัติ! 💎",
          "แต่ละคนหมุนได้ครั้งเดียวนะ! ⚓",
          "โชคดีกับการลุ้นรางวัล! 🏴‍☠️",
          "สมบัติรออยู่ข้างหน้า! 🎁",
        ]}
      />
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

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="ghost" onClick={() => navigate("/map")}>
            <Anchor className="mr-2 h-4 w-4" />
            กลับไปที่แผนที่
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Rewards;


