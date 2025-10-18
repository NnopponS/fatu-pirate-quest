import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SpinWheel } from "@/components/SpinWheel";
import { Button } from "@/components/ui/button";
import { Anchor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { POINTS_REQUIRED_FOR_WHEEL } from "@/lib/constants";

const Rewards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [points, setPoints] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [loading, setLoading] = useState(true);

  const participantId = localStorage.getItem('participantId');

  useEffect(() => {
    if (!participantId) {
      navigate('/signup');
      return;
    }

    loadData();
  }, [participantId]);

  const loadData = async () => {
    try {
      const [participantRes, spinRes] = await Promise.all([
        supabase.from('participants').select('points').eq('id', participantId).single(),
        supabase.from('spins').select('id').eq('participant_id', participantId).maybeSingle(),
      ]);

      if (participantRes.data) setPoints(participantRes.data.points);
      if (spinRes.data) setHasSpun(true);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('spin', {
        body: { participantId }
      });

      if (error) throw error;

      if (data?.prize) {
        setHasSpun(true);
        return data.prize;
      }
      throw new Error('ไม่สามารถหมุนวงล้อได้');
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-parchment flex items-center justify-center">
      <p className="text-lg">กำลังโหลด...</p>
    </div>;
  }

  if (points < POINTS_REQUIRED_FOR_WHEEL) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Anchor className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">คะแนนยังไม่พอ</h2>
          <p className="text-lg mb-2">คุณมี {points} คะแนน</p>
          <p className="text-muted-foreground mb-6">
            ต้องการอีก {POINTS_REQUIRED_FOR_WHEEL - points} คะแนน เพื่อหมุนวงล้อ
          </p>
          <Button onClick={() => navigate('/map')}>
            ไปเก็บคะแนนเพิ่ม
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Anchor className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-primary mb-2">🎰 วงล้อลุ้นรางวัล</h1>
          <p className="text-muted-foreground">คุณมี {points} คะแนน</p>
        </div>

        <div className="bg-card p-8 rounded-2xl border-2 border-rope shadow-xl">
          <SpinWheel onSpin={handleSpin} disabled={hasSpun} />
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => navigate('/map')}>
            กลับไปแผนที่
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
