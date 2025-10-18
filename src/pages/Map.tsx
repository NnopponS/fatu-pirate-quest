import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Anchor, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const participantId = localStorage.getItem("participantId");

  useEffect(() => {
    if (!participantId) {
      toast({
        title: "Login required",
        description: "Sign in to keep track of your progress.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    loadData();
  }, [participantId, toast, navigate, loadData]);

  const loadData = useCallback(async () => {
    if (!participantId) return;
    try {
      const [locsRes, checkinsRes, participantRes, settingsRes] = await Promise.all([
        supabase.from("locations").select("*").order("id"),
        supabase.from("checkins").select("location_id").eq("participant_id", participantId),
        supabase.from("participants").select("points").eq("id", participantId).single(),
        supabase
          .from("app_settings")
          .select("value")
          .eq("key", "points_required_for_wheel")
          .maybeSingle(),
      ]);

      if (locsRes.data) setLocations(locsRes.data);
      if (checkinsRes.data) setCheckins(checkinsRes.data.map((c) => c.location_id));
      if (participantRes.data) setPoints(participantRes.data.points ?? 0);

      const settingsValue = settingsRes.data?.value as { value?: number } | undefined;
      if (settingsValue?.value !== undefined) {
        setPointsRequired(settingsValue.value);
      }
    } catch (error: unknown) {
      toast({
        title: "Unable to load map",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [participantId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-4xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-3">
          <Anchor className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-4xl font-bold text-primary">Treasure map</h1>
          <div className="inline-block bg-accent/20 px-6 py-3 rounded-full border-2 border-accent/50">
            <p className="text-2xl font-bold text-accent flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6" />
              {points} points collected
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {locations.map((loc) => (
            <LocationCard key={loc.id} {...loc} checkedIn={checkins.includes(loc.id)} />
          ))}
        </div>

        {points >= pointsRequired && (
          <div className="text-center">
            <Button size="lg" className="text-lg gap-2" onClick={() => navigate("/rewards")}>
              Spin for rewards
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              Requires {pointsRequired} points to unlock the wheel.
            </p>
          </div>
        )}

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/")}>
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Map;
