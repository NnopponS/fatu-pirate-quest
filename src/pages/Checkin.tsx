import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "success" | "error";

const Checkin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [pointsAdded, setPointsAdded] = useState(0);

  useEffect(() => {
    const performCheckin = async () => {
      const participantId = localStorage.getItem("participantId");
      if (!participantId) {
        toast({
          title: "Login required",
          description: "Please log in before checking in.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const loc = searchParams.get("loc");
      const sig = searchParams.get("sig");

      if (!loc || !sig) {
        setStatus("error");
        setMessage("Invalid check-in link. Please scan the QR code again.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke<{
          ok: boolean;
          pointsAdded: number;
        }>("checkin", {
          body: { participantId, locationId: parseInt(loc, 10), signature: sig },
        });

        if (error) throw error;

        if (data?.ok) {
          setStatus("success");
          setPointsAdded(data.pointsAdded || 0);
          setMessage(
            data.pointsAdded > 0
              ? `Check-in completed! +${data.pointsAdded} points`
              : "You have already checked in at this station.",
          );

          toast({
            title: "Check-in recorded",
            description: data.pointsAdded > 0 ? `+${data.pointsAdded} points` : "Already checked in.",
          });

          setTimeout(() => navigate("/map"), 2000);
        } else {
          throw new Error("Unexpected response from check-in service.");
        }
      } catch (error: unknown) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Unable to complete check-in.");
        toast({
          title: "Check-in failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };

    performCheckin();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === "loading" && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Checking in...</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-card p-8 rounded-2xl border-2 border-primary shadow-xl space-y-4">
            <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
            <h2 className="text-2xl font-bold text-primary">Success!</h2>
            <p className="text-lg">{message}</p>
            {pointsAdded > 0 && (
              <div className="text-4xl font-bold text-accent">+{pointsAdded}</div>
            )}
            <Button onClick={() => navigate("/map")}>Back to map</Button>
          </div>
        )}

        {status === "error" && (
          <div className="bg-card p-8 rounded-2xl border-2 border-destructive shadow-xl space-y-4">
            <XCircle className="w-20 h-20 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold text-destructive">Check-in failed</h2>
            <p className="text-lg">{message}</p>
            <Button variant="outline" onClick={() => navigate("/map")}>
              Back to map
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkin;
