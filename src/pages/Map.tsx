import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Anchor, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Map = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const participantId = localStorage.getItem('participantId');

  useEffect(() => {
    if (!participantId) {
      toast({
        title: "กรุณาลงทะเบียนก่อน",
        description: "คุณต้องลงทะเบียนก่อนเข้าใช้งาน",
        variant: "destructive",
      });
      navigate('/signup');
      return;
    }

    loadData();
  }, [participantId]);

  const loadData = async () => {
    try {
      const [locsRes, checkinsRes, participantRes] = await Promise.all([
        supabase.from('locations').select('*').order('id'),
        supabase.from('checkins').select('location_id').eq('participant_id', participantId),
        supabase.from('participants').select('points').eq('id', participantId).single(),
      ]);

      if (locsRes.data) setLocations(locsRes.data);
      if (checkinsRes.data) setCheckins(checkinsRes.data.map(c => c.location_id));
      if (participantRes.data) setPoints(participantRes.data.points);
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

  if (loading) {
    return <div className="min-h-screen bg-parchment flex items-center justify-center">
      <p className="text-lg">กำลังโหลด...</p>
    </div>;
  }

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <Anchor className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-primary mb-2">🗺️ แผนที่ล่าสมบัติ</h1>
          <div className="inline-block bg-accent/20 px-6 py-3 rounded-full border-2 border-accent/50">
            <p className="text-2xl font-bold text-accent">
              <Trophy className="inline w-6 h-6 mr-2" />
              {points} คะแนน
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {locations.map((loc) => (
            <LocationCard
              key={loc.id}
              {...loc}
              checkedIn={checkins.includes(loc.id)}
            />
          ))}
        </div>

        {points >= 300 && (
          <div className="text-center">
            <Button
              size="lg"
              className="text-lg gap-2"
              onClick={() => navigate('/rewards')}
            >
              🎰 หมุนวงล้อลุ้นรางวัล
            </Button>
          </div>
        )}

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Map;
