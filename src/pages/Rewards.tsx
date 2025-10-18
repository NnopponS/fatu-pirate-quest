import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SpinWheel } from "@/components/SpinWheel";
import { Button } from "@/components/ui/button";
import { Anchor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const participantId = localStorage.getItem("participantId");

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

      const settingsValue = settingsRes.data?.value as { value?: number } | undefined;
      if (settingsValue?.value !== undefined) {
        setPointsRequired(settingsValue.value);
      }

      if (prizesRes.data) {
        setPrizes(prizesRes.data.map((prize) => ({ name: prize.name, weight: prize.weight })));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Failed to load rewards",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [participantId, toast]);

  useEffect(() => {
    if (!participantId) {
      toast({
        title: "Login required",
        description: "Please log in before accessing rewards.",
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
        toast({ title: "Congratulations!", description: `You won ${data.prize}` });
        return data.prize;
      }

      throw new Error("Spin failed, please try again.");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading reward data...</p>
      </div>
    );
  }

  if (points < pointsRequired) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
        <div className="text-center max-w-md space-y-4">
          <Anchor className="w-20 h-20 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Not enough points yet</h2>
          <p className="text-lg">
            You currently have {points} points. Collect {pointsRequired - points} more to spin the
            wheel.
          </p>
          <Button onClick={() => navigate("/map")}>Back to map</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-2">
          <Anchor className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-4xl font-bold text-primary">Spin for treasure</h1>
          <p className="text-muted-foreground">
            You have {points} points. One spin per participant.
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl border-2 border-rope shadow-xl">
          <SpinWheel
            onSpin={handleSpin}
            disabled={hasSpun || prizes.length === 0}
            prizes={prizes}
          />
          {hasSpun && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              You have already claimed a prize for this event.
            </p>
          )}
          {prizes.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Prizes have not been configured yet. Please check again later.
            </p>
          )}
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/map")}>
            Return to map
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Rewards;
