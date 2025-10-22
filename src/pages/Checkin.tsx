import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkinParticipant, getMapData } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShipWheel, XCircle, MapPin, User } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";

type Status = "loading" | "confirm" | "processing" | "success" | "error";

interface LocationInfo {
  id: number;
  name: string;
  points: number;
  imageUrl?: string;
}

const Checkin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [pointsAdded, setPointsAdded] = useState(0);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const loadCheckinInfo = async () => {
      const participantId = localStorage.getItem("participantId");
      const displayName = localStorage.getItem("displayName");
      
      if (!participantId) {
        // Save current URL to return after login
        const currentUrl = window.location.pathname + window.location.search;
        sessionStorage.setItem("returnUrl", currentUrl);
        
        toast({
          title: "ต้องเข้าสู่ระบบก่อน",
          description: "กรุณาเข้าสู่ระบบเพื่อใช้การเช็กอิน",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      setUserName(displayName || "ผู้ใช้งาน");

      const loc = searchParams.get("loc");
      const sig = searchParams.get("sig");

      console.log("Checkin page params:", { 
        loc, 
        sig, 
        allParams: Object.fromEntries(searchParams.entries())
      });

      if (!loc || !sig) {
        console.error("Missing required params", { loc: !!loc, sig: !!sig });
        setStatus("error");
        setMessage("ลิงก์เช็กอินไม่ถูกต้อง กรุณาสแกน QR ใหม่อีกครั้ง");
        return;
      }

      try {
        // Load location info
        const mapData = await getMapData(participantId);
        const location = mapData.locations.find((l: any) => l.id === parseInt(loc, 10));
        
        if (!location) {
          setStatus("error");
          setMessage("ไม่พบข้อมูลจุดเช็กอินนี้");
          return;
        }

        setLocationInfo({
          id: location.id,
          name: location.name,
          points: location.points,
          imageUrl: location.imageUrl || location.image_url,
        });

        // Show confirmation page
        setStatus("confirm");
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
        setStatus("error");
        setMessage(message);
      }
    };

    loadCheckinInfo();
  }, [searchParams, navigate, toast]);

  const handleConfirmCheckin = async () => {
    const participantId = localStorage.getItem("participantId");
    if (!participantId || !locationInfo) return;

    const sig = searchParams.get("sig");
    const version = searchParams.get("v");

    if (!sig) {
      setStatus("error");
      setMessage("ลิงก์เช็กอินไม่ถูกต้อง");
      return;
    }

    setStatus("processing");

    try {
      const result = await checkinParticipant(
        participantId,
        locationInfo.id,
        sig,
        version ? parseInt(version, 10) : undefined
      );
      
      setStatus("success");
      setPointsAdded(result.pointsAdded || 0);
      setMessage(
        result.pointsAdded > 0
          ? `เช็กอินสำเร็จ! ได้รับ +${result.pointsAdded} คะแนน`
          : "คุณเคยเช็กอินสถานีนี้แล้ว"
      );

      toast({
        title: "เช็กอินสำเร็จ",
        description: result.pointsAdded > 0 ? `+${result.pointsAdded} คะแนน` : undefined,
      });

      setTimeout(() => navigate("/map"), 2500);
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

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="pirate-card px-8 py-12 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg text-foreground/70">กำลังโหลดข้อมูล...</p>
            </>
          )}

          {status === "confirm" && locationInfo && (
            <>
              <MapPin className="mx-auto h-20 w-20 text-primary animate-in fade-in zoom-in" />
              <h2 className="text-3xl font-semibold text-primary">ยืนยันการเช็กอิน</h2>
              
              {locationInfo.imageUrl && (
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg">
                  <img 
                    src={locationInfo.imageUrl} 
                    alt={locationInfo.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 text-left">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                    <User className="h-4 w-4" />
                    <span>ผู้เช็กอิน</span>
                  </div>
                  <p className="text-xl font-semibold text-primary">{userName}</p>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span>สถานที่</span>
                  </div>
                  <p className="text-xl font-semibold text-primary">{locationInfo.name}</p>
                  <p className="text-sm text-foreground/70 mt-2">
                    คะแนนที่ได้รับ: <span className="font-semibold text-primary">{locationInfo.points} แต้ม</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-foreground/60">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยันการเช็กอิน
              </p>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirmCheckin}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  ยืนยันเช็กอิน
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/map")}
                  size="lg"
                >
                  ยกเลิก
                </Button>
              </div>
            </>
          )}

          {status === "processing" && (
            <>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg text-foreground/70">กำลังทำการเช็กอิน...</p>
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
