import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShipWheel, XCircle } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";

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
          title: "ต้องเข้าสู่ระบบก่อน",
          description: "กรุณาเข้าสู่ระบบเพื่อใช้การเช็กอิน",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const loc = searchParams.get("loc");
      const sig = searchParams.get("sig");

      if (!loc || !sig) {
        setStatus("error");
        setMessage("ลิงก์เช็กอินไม่ถูกต้อง กรุณาสแกน QR ใหม่อีกครั้ง");
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
              ? `เช็กอินสำเร็จ! ได้รับ +${data.pointsAdded} คะแนน`
              : "คุณเคยเช็กอินสถานีนี้แล้ว"
          );

          toast({
            title: "เช็กอินสำเร็จ",
            description: data.pointsAdded > 0 ? `+${data.pointsAdded} คะแนน` : undefined,
          });

          setTimeout(() => navigate("/map"), 2500);
        } else {
          throw new Error("ไม่สามารถตรวจสอบเช็กอินได้");
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        setStatus("error");
        setMessage(message);
        toast({
          title: "เช็กอินไม่สำเร็จ",
          description: message,
          variant: "destructive",
        });
      }
    };

    performCheckin();
  }, [searchParams, navigate, toast]);

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="pirate-card px-8 py-12 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg text-foreground/70">กำลังตรวจสอบการเช็กอิน...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-20 w-20 text-primary animate-in fade-in zoom-in" />
              <h2 className="text-3xl font-semibold text-primary">เช็กอินสำเร็จ</h2>
              <p className="text-lg text-foreground/80">{message}</p>
              {pointsAdded > 0 && (
                <div className="text-4xl font-bold text-accent">+{pointsAdded}</div>
              )}
              <Button onClick={() => navigate("/map")}>กลับไปยังแผนที่</Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="mx-auto h-20 w-20 text-destructive animate-in fade-in zoom-in" />
              <h2 className="text-3xl font-semibold text-destructive">เช็กอินไม่สำเร็จ</h2>
              <p className="text-lg text-foreground/80">{message}</p>
              <Button variant="outline" onClick={() => navigate("/map")}>
                กลับไปยังแผนที่
              </Button>
            </>
          )}

          <div className="pirate-divider" />
          <div className="flex items-center justify-center gap-2 text-sm text-foreground/60">
            <ShipWheel className="h-4 w-4" />
            สนุกกับการล่าสมบัติอย่างปลอดภัย โปรดระวังลิงก์ปลอมที่ไม่ใช่ของกิจกรรม
          </div>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Checkin;
