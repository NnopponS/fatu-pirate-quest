import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { checkinParticipant, checkinSubEvent, getMapData } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShipWheel, XCircle, MapPin, User, Calendar } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { signSubEventCheckin, todayStr } from "@/lib/crypto";
import { CHECKIN_SECRET } from "@/lib/constants";

type Status = "loading" | "confirm" | "processing" | "success" | "error";

interface LocationInfo {
  id: number;
  name: string;
  points: number;
  imageUrl?: string;
}

interface SubEventInfo {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  time?: string;
  location_id: number;
  location_name: string;
  points_awarded?: number;
}

const Checkin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [pointsAdded, setPointsAdded] = useState(0);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [subEventInfo, setSubEventInfo] = useState<SubEventInfo | null>(null);
  const [userName, setUserName] = useState("");
  const [isSubEvent, setIsSubEvent] = useState(false);

  useEffect(() => {
    const loadCheckinInfo = async () => {
      const participantId = localStorage.getItem("participantId");
      const username = localStorage.getItem("participantUsername");
      
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

      setUserName(username || "ผู้ใช้งาน");

      const subEventId = searchParams.get("subevent");
      const loc = searchParams.get("loc");
      const sig = searchParams.get("sig");

      console.log("Checkin page params:", { 
        subEventId,
        loc, 
        sig, 
        allParams: Object.fromEntries(searchParams.entries())
      });

      // Check if this is a sub-event checkin
      if (subEventId) {
        setIsSubEvent(true);
        try {
          // Load sub-event info
          const mapData = await getMapData(participantId);
          let foundSubEvent: any = null;
          let parentLocation: any = null;

          for (const location of mapData.locations) {
            if (location.sub_events) {
              const subEvent = location.sub_events.find((se: any) => se.id === subEventId);
              if (subEvent) {
                foundSubEvent = subEvent;
                parentLocation = location;
                break;
              }
            }
          }

          if (!foundSubEvent || !parentLocation) {
            setStatus("error");
            setMessage("ไม่พบข้อมูลกิจกรรมนี้");
            return;
          }

          setSubEventInfo({
            id: foundSubEvent.id,
            name: foundSubEvent.name,
            description: foundSubEvent.description,
            image_url: foundSubEvent.image_url,
            time: foundSubEvent.time,
            location_id: parentLocation.id,
            location_name: parentLocation.name,
            points_awarded: foundSubEvent.points_awarded,
          });

          // Show confirmation page
          setStatus("confirm");
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
          setStatus("error");
          setMessage(message);
        }
      } else {
        // Regular location checkin
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
      }
    };

    loadCheckinInfo();
  }, [searchParams, navigate, toast]);

  const handleConfirmCheckin = async () => {
    const participantId = localStorage.getItem("participantId");
    if (!participantId) return;

    setStatus("processing");

    try {
      if (isSubEvent && subEventInfo) {
        // Sub-event checkin
        const version = searchParams.get("v");
        
        // Generate signature for sub-event
        const sig = await signSubEventCheckin(
          subEventInfo.id,
          todayStr(0),
          CHECKIN_SECRET,
          version ? parseInt(version, 10) : 1
        );

        const result = await checkinSubEvent(
          participantId,
          subEventInfo.id,
          sig,
          version ? parseInt(version, 10) : undefined
        );
        
        setStatus("success");
        setPointsAdded(result.pointsAdded || 0);
        setMessage(
          result.pointsAdded > 0
            ? `เข้าร่วมกิจกรรมสำเร็จ! ได้รับ +${result.pointsAdded} คะแนน`
            : "คุณเคยเข้าร่วมกิจกรรมในสถานที่นี้แล้ว (ได้คะแนนแล้ว)"
        );

        toast({
          title: "เข้าร่วมกิจกรรมสำเร็จ",
          description: result.pointsAdded > 0 ? `+${result.pointsAdded} คะแนน` : "บันทึกการเข้าร่วมแล้ว",
        });
      } else if (locationInfo) {
        // Regular location checkin
        const sig = searchParams.get("sig");
        const version = searchParams.get("v");

        if (!sig) {
          setStatus("error");
          setMessage("ลิงก์เช็กอินไม่ถูกต้อง");
          return;
        }

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
      }

      setTimeout(() => navigate("/map"), 2500);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      setStatus("error");
      setMessage(message);
      toast({
        title: isSubEvent ? "เข้าร่วมกิจกรรมไม่สำเร็จ" : "เช็กอินไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <PirateBackdrop>
      <PirateCharacter 
        messages={[
          "อาร์ร์! เช็กอินเพื่อรับคะแนน! 🏴‍☠️",
          "ยืนยันข้อมูลก่อนเช็กอินนะ! ⚓",
          "เยี่ยมมาก! คะแนนเพิ่มขึ้นแล้ว! 💎",
          "สะสมต่อไปเรื่อยๆ! 🗺️",
        ]}
        interval={4000}
      />
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <div className="pirate-card px-8 py-12 text-center space-y-6">
          {status === "loading" && (
            <>
              <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg text-foreground/70">กำลังโหลดข้อมูล...</p>
            </>
          )}

          {status === "confirm" && !isSubEvent && locationInfo && (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-600/20 rounded-full blur-3xl" />
                <MapPin className="relative mx-auto h-20 w-20 text-amber-600 animate-in fade-in zoom-in" />
              </div>
              <h2 className="text-3xl font-semibold text-amber-600">ยืนยันการเช็กอิน</h2>
              
              {locationInfo.imageUrl && (
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border-2 border-amber-300 shadow-lg">
                  <img 
                    src={locationInfo.imageUrl} 
                    alt={locationInfo.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 text-left">
                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow-md">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-2 font-semibold">
                    <User className="h-5 w-5" />
                    <span>ผู้เช็กอิน</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{userName}</p>
                </div>

                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow-md">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-2 font-semibold">
                    <MapPin className="h-5 w-5" />
                    <span>สถานที่</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{locationInfo.name}</p>
                  <p className="text-sm text-amber-800 mt-3 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                    คะแนนที่ได้รับ: <span className="font-bold text-amber-900">⚓ {locationInfo.points} แต้ม</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-amber-700 font-medium">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยันการเช็กอิน
              </p>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirmCheckin}
                  className="flex-1 gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  ยืนยันเช็กอิน
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/map")}
                  size="lg"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  ยกเลิก
                </Button>
              </div>
            </>
          )}

          {status === "confirm" && isSubEvent && subEventInfo && (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-600/20 rounded-full blur-3xl" />
                <Calendar className="relative mx-auto h-20 w-20 text-amber-600 animate-in fade-in zoom-in" />
              </div>
              <h2 className="text-3xl font-semibold text-amber-600">🏴‍☠️ ยืนยันการเข้าร่วมกิจกรรม</h2>
              
              {subEventInfo.image_url && (
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border-2 border-amber-300 shadow-lg">
                  <img 
                    src={subEventInfo.image_url} 
                    alt={subEventInfo.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 text-left">
                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow-md">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-2 font-semibold">
                    <User className="h-5 w-5" />
                    <span>ผู้เข้าร่วม</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{userName}</p>
                </div>

                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow-md">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-2 font-semibold">
                    <Calendar className="h-5 w-5" />
                    <span>กิจกรรม</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">⚓ {subEventInfo.name}</p>
                  {subEventInfo.time && (
                    <p className="text-sm text-amber-800 mt-2">🕐 {subEventInfo.time}</p>
                  )}
                  {subEventInfo.description && (
                    <p className="text-sm text-amber-800 mt-2 leading-relaxed">{subEventInfo.description}</p>
                  )}
                </div>

                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 p-5 shadow-md">
                  <div className="flex items-center gap-2 text-sm text-amber-700 mb-2 font-semibold">
                    <MapPin className="h-5 w-5" />
                    <span>สถานที่</span>
                  </div>
                  <p className="text-lg font-bold text-amber-900">{subEventInfo.location_name}</p>
                  {(subEventInfo.points_awarded ?? 100) > 0 ? (
                    <p className="text-sm text-amber-800 mt-3 bg-yellow-50 rounded-lg px-3 py-2 border border-yellow-300">
                      💎 คะแนนพิเศษ: <span className="font-bold text-amber-900">+{subEventInfo.points_awarded ?? 100} แต้ม</span> (ครั้งแรกต่อสถานที่)
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 rounded-lg px-3 py-2 border border-gray-300">
                      ℹ️ กิจกรรมนี้ไม่มีคะแนน (บันทึกการเข้าร่วมเท่านั้น)
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-amber-700 font-medium">
                กรุณาตรวจสอบข้อมูลก่อนยืนยันการเข้าร่วมกิจกรรม
              </p>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirmCheckin}
                  className="flex-1 gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
                  size="lg"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  ยืนยันเข้าร่วมกิจกรรม
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/map")}
                  size="lg"
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
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
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-green-600/30 rounded-full blur-3xl animate-pulse" />
                <CheckCircle2 className="relative mx-auto h-24 w-24 text-green-600 animate-in fade-in zoom-in drop-shadow-lg" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-4xl font-bold text-green-600 animate-in fade-in slide-in-from-bottom-4">
                  🎉 เช็กอินสำเร็จ! 🎉
                </h2>
                <p className="text-xl text-green-700 font-semibold">{message}</p>
              </div>

              {pointsAdded > 0 && (
                <div className="rounded-2xl border-4 border-green-500 bg-gradient-to-br from-green-50 to-green-100 p-8 shadow-2xl shadow-green-500/30 animate-in fade-in zoom-in">
                  <p className="text-sm text-green-700 font-semibold mb-2">คะแนนที่ได้รับ</p>
                  <div className="text-6xl font-black text-green-600 animate-bounce">
                    +{pointsAdded}
                  </div>
                  <p className="text-lg text-green-700 font-semibold mt-2">แต้ม</p>
                </div>
              )}

              {locationInfo && (
                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 shadow-md">
                  <div className="flex items-center gap-2 text-sm text-green-700 mb-2 font-semibold">
                    <User className="h-5 w-5" />
                    <span>ผู้เช็กอิน</span>
                  </div>
                  <p className="text-xl font-bold text-green-900">{userName}</p>
                </div>
              )}

              <Button 
                onClick={() => navigate("/map")}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-500/30"
              >
                กลับไปยังแผนที่
              </Button>
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
