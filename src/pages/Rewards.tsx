import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRewardsData, spinWheel } from "@/services/firebase";
import { BottleShaker } from "@/components/BottleShaker";
import { Button } from "@/components/ui/button";
import { Anchor, Gift, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { BottomNav } from "@/components/BottomNav";

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
  const [pointsRequired, setPointsRequired] = useState(200); // ✅ Default 200 คะแนน
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

  const handleShake = async (): Promise<{ prize: string; claimCode: string }> => {
    try {
      if (!participantId) {
        throw new Error("Missing participant identifier");
      }

      const { prize, claimCode } = await spinWheel(participantId);
      setHasSpun(true);
      toast({
        title: "ยินดีด้วย! 🎉",
        description: `คุณได้รับ ${prize}`,
      });
      return { prize, claimCode };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "เขย่าขวดไม่สำเร็จ",
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
      <BottomNav />
      <PirateCharacter 
        messages={[
          "ฮาฮอย! คะแนนเจ้าครบแล้วหรือยัง? 🍾",
          "เขย่าขวด 5 ครั้งเพื่อรับสมบัติ! 💎",
          "แต่ละคนเขย่าได้ครั้งเดียวนะ! ⚓",
          "โชคดีกับการลุ้นรางวัล! 🏴‍☠️",
          "สมบัติรออยู่ข้างหน้า! 🎁",
        ]}
      />
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-fade-in">
        {/* Header Section - Treasure Map Style */}
        <div className="relative">
          <div 
            className="relative overflow-hidden rounded-3xl border-8 border-amber-800 bg-[#f4e4c1] shadow-2xl"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent)
              `,
              backgroundSize: '50px 50px'
            }}
          >
            {/* Wax seal */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="w-20 h-20 rounded-full bg-red-700 border-4 border-red-900 flex items-center justify-center shadow-xl">
                <div className="text-amber-200 text-3xl">🍾</div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-6 px-6 text-center relative z-10">
              <div className="mb-6">
                <Gift className="h-12 w-12 text-amber-700 mx-auto mb-4" />
                <h1 className="text-4xl md:text-5xl font-black text-amber-900 mb-3" style={{ fontFamily: 'Pirata One, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                  ขวดล่าสมบัติแห่งโชค
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-800/20 border-2 border-amber-700">
                  <span className="text-sm md:text-base font-bold text-amber-900">เขย่า 5 ครั้งเพื่อรับรางวัล! 🍾💎</span>
                </div>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="text-base md:text-lg text-amber-800 leading-relaxed italic">
                  สวัสดีท่านลูกเรือผู้กล้าหาญ,
                </p>
                <p className="text-sm md:text-base text-amber-900 leading-relaxed">
                  เมื่อเจ้าสะสมคะแนนได้ครบแล้ว เจ้าสามารถเขย่าขวดสมบัติได้ <span className="font-bold text-amber-800">1 ครั้ง</span> เพื่อค้นหาสมบัติที่ซ่อนอยู่!
                </p>
              </div>
            </div>
          </div>
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
                  ต้องสะสมเพิ่มอีก {pointsRequired - points} คะแนนเพื่อปลดล็อกขวดสมบัติ
                </p>
                <Button size="lg" onClick={() => navigate("/map")}>
                  กลับไปสะสมคะแนนต่อ
                </Button>
              </div>
            ) : (
              <div className="pirate-card px-6 py-10 space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-semibold text-primary">
                    พร้อมเขย่าขวดสมบัติแล้ว!
                  </h2>
                  <p className="text-sm text-foreground/70">
                    คุณสะสมทั้งหมด {points} คะแนน เขย่าขวดได้เพียง 1 ครั้งต่อคน
                  </p>
                </div>
                <BottleShaker onShake={handleShake} disabled={hasSpun || prizes.length === 0} prizes={prizes} />
                {hasSpun && (
                  <p className="text-center text-sm text-foreground/70">
                    คุณเขย่าขวดแล้ว หากต้องการรับชมผลอีกครั้ง ให้สอบถามทีมงานได้เลย
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


