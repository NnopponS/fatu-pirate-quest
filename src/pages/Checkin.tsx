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
          // Clear cache and load fresh sub-event info with retry
          const { clearAppCache } = await import("@/services/firebase");
          clearAppCache();
          
          // Try to get map data with retry
          let mapData = await getMapData(participantId) as any;
          let foundSubEvent: any = null;
          let parentLocation: any = null;

          // Look for sub-event in all locations
          for (const location of (mapData?.locations || [])) {
            if (location.sub_events && Array.isArray(location.sub_events)) {
              const subEvent = location.sub_events.find((se: any) => se.id === subEventId);
              if (subEvent) {
                foundSubEvent = subEvent;
                parentLocation = location;
                break;
              }
            }
          }

          // If not found, wait 2 seconds, clear cache again and retry once
          if (!foundSubEvent || !parentLocation) {
            console.log("Sub-event not found immediately, waiting and retrying...");
            await new Promise(resolve => setTimeout(resolve, 2000));
            clearAppCache();
            mapData = await getMapData(participantId) as any;
            
            for (const location of (mapData?.locations || [])) {
              if (location.sub_events && Array.isArray(location.sub_events)) {
                const subEvent = location.sub_events.find((se: any) => se.id === subEventId);
                if (subEvent) {
                  foundSubEvent = subEvent;
                  parentLocation = location;
                  break;
                }
              }
            }
          }

          if (!foundSubEvent || !parentLocation) {
            console.error("Sub-event not found after retry:", {
              subEventId,
              availableSubEvents: (mapData?.locations || []).flatMap((loc: any) => loc.sub_events || []).map((se: any) => se.id),
              locationsCount: (mapData?.locations || []).length
            });
            setStatus("error");
            setMessage("ไม่พบข้อมูลกิจกรรมนี้ กรุณารอสักครู่แล้วสแกน QR Code อีกครั้ง");
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
          const mapData = await getMapData(participantId) as any;
          const location = (mapData?.locations || []).find((l: any) => l.id === parseInt(loc, 10));
          
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
        // Sub-event checkin (fixed QR codes - no signature needed)
        const version = searchParams.get("v");
        
        // Generate a dummy signature since checkinSubEvent expects it but won't validate it
        const dummySig = await signSubEventCheckin(
          subEventInfo.id,
          todayStr(0),
          CHECKIN_SECRET,
          version ? parseInt(version, 10) : 1
        );

        console.log("Calling checkinSubEvent with:", { 
          subEventId: subEventInfo.id, 
          version: version ? parseInt(version, 10) : undefined 
        });

        const result = await checkinSubEvent(
          participantId,
          subEventInfo.id,
          dummySig,
          version ? parseInt(version, 10) : undefined
        );
        
        console.log("checkinSubEvent result:", result);
        
        setStatus("success");
        setPointsAdded(result.pointsAdded || 0);
        
        // Sub-event now auto-checks in location
        setMessage(
          result.pointsAdded > 0
            ? `เช็กอินสถานที่และเข้าร่วมกิจกรรมสำเร็จ! ได้รับ +${result.pointsAdded} คะแนน`
            : "คุณเคยเข้าร่วมกิจกรรมนี้แล้ว"
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

      // Navigate back to map and trigger bottle animation if location has sub-events
      setTimeout(async () => {
        try {
          const mapData = await getMapData(participantId) as any;
          const location = isSubEvent 
            ? (mapData?.locations || []).find((l: any) => l.sub_events?.some((se: any) => se.id === subEventInfo?.id))
            : (mapData?.locations || []).find((l: any) => l.id === locationInfo?.id);
          
          if (location && location.sub_events && location.sub_events.length > 0) {
            // Store location info for bottle animation
            sessionStorage.setItem('showBottleAnimation', 'true');
            sessionStorage.setItem('bottleLocationId', location.id.toString());
          }
        } catch (error) {
          console.error('Error checking for sub-events:', error);
        }
        
        navigate("/map");
      }, 2500);
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
          "ฮาฮอย! เช็กอินเพื่อรับคะแนน! 🏴‍☠️",
          "ยืนยันข้อมูลก่อนเช็กอินนะ! ⚓",
          "เยี่ยมมาก! คะแนนเพิ่มขึ้นแล้ว! 💎",
          "สะสมต่อไปเรื่อยๆ! 🗺️",
        ]}
        interval={4000}
      />
      <style>{`
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
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
              {/* Pirate Header */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 to-orange-600/30 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-center gap-3">
                  <MapPin className="h-16 w-16 text-amber-600" />
                  <ShipWheel className="h-12 w-12 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-amber-900 mb-2" style={{ fontFamily: 'Pirata One, serif' }}>
                ⚓ ยืนยันการเช็กอิน ⚓
              </h2>
              <p className="text-amber-700 italic">ตรวจสอบข้อมูลก่อนออกเดินทาง</p>
              
              {locationInfo.imageUrl && (
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-4 border-amber-600 shadow-2xl ring-4 ring-amber-500/20">
                  <img 
                    src={locationInfo.imageUrl} 
                    alt={locationInfo.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 text-left">
                {/* Pirate Parchment Style Cards */}
                <div className="rounded-2xl border-4 border-amber-600 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,115,85,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-600/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 text-sm text-amber-800 mb-3 font-bold">
                    <User className="h-6 w-6" />
                    <span className="uppercase tracking-wider">ลูกเรือที่ทำการเช็กอิน</span>
                  </div>
                  <p className="text-3xl font-black text-amber-900">{userName}</p>
                </div>

                <div className="rounded-2xl border-4 border-amber-600 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,115,85,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-600/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 text-sm text-amber-800 mb-3 font-bold">
                    <MapPin className="h-6 w-6" />
                    <span className="uppercase tracking-wider">จุดล่าสมบัติ</span>
                  </div>
                  <p className="text-3xl font-black text-amber-900 mb-3">{locationInfo.name}</p>
                  <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-xl px-4 py-3 border-2 border-amber-400 shadow-inner">
                    <p className="text-base font-black text-amber-900">
                      💎 คะแนนที่ได้รับ: <span className="text-2xl">⚓ +{locationInfo.points}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-100 border-4 border-amber-500 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-amber-900">
                  ⚠️ ตรวจสอบข้อมูลให้ถูกต้องก่อนยืนยัน
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirmCheckin}
                  className="flex-1 gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl border-4 border-amber-700 hover:scale-105 transition-transform"
                  size="lg"
                  style={{ fontFamily: 'Pirata One, serif' }}
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-lg">ยืนยันเช็กอิน</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/map")}
                  size="lg"
                  className="border-4 border-amber-600 text-amber-900 hover:bg-amber-100 font-bold px-6"
                >
                  ยกเลิก
                </Button>
              </div>
            </>
          )}

          {status === "confirm" && isSubEvent && subEventInfo && (
            <>
              {/* Pirate Header */}
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-amber-600/30 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-center gap-3">
                  <Calendar className="h-16 w-16 text-purple-600" />
                  <span className="text-6xl">🏴‍☠️</span>
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-purple-900 mb-2" style={{ fontFamily: 'Pirata One, serif' }}>
                ภารกิจพิเศษ!
              </h2>
              <p className="text-purple-700 italic">ร่วมกิจกรรมเพื่อรับรางวัล</p>
              
              {subEventInfo.image_url && (
                <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-4 border-purple-600 shadow-2xl ring-4 ring-purple-500/20">
                  <img 
                    src={subEventInfo.image_url} 
                    alt={subEventInfo.name}
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-4 text-left">
                {/* Pirate Parchment Style Cards */}
                <div className="rounded-2xl border-4 border-purple-600 bg-gradient-to-br from-purple-50 via-amber-50 to-yellow-50 p-6 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,115,85,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 text-sm text-purple-800 mb-3 font-bold">
                    <User className="h-6 w-6" />
                    <span className="uppercase tracking-wider">ลูกเรือที่มาถึง</span>
                  </div>
                  <p className="text-3xl font-black text-purple-900">{userName}</p>
                </div>

                <div className="rounded-2xl border-4 border-purple-600 bg-gradient-to-br from-purple-50 via-amber-50 to-yellow-50 p-6 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,115,85,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-purple-600/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 text-sm text-purple-800 mb-3 font-bold">
                    <Calendar className="h-6 w-6" />
                    <span className="uppercase tracking-wider">ภารกิจ</span>
                  </div>
                  <p className="text-3xl font-black text-purple-900 mb-3">⚓ {subEventInfo.name}</p>
                  {subEventInfo.time && (
                    <p className="text-base text-purple-800 font-semibold bg-purple-100 rounded-lg px-3 py-2 mb-2">🕐 {subEventInfo.time}</p>
                  )}
                  {subEventInfo.description && (
                    <p className="text-base text-purple-800 leading-relaxed border-l-4 border-purple-500 pl-4">{subEventInfo.description}</p>
                  )}
                </div>

                <div className="rounded-2xl border-4 border-amber-600 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-6 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,115,85,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-600/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 text-sm text-amber-800 mb-3 font-bold">
                    <MapPin className="h-6 w-6" />
                    <span className="uppercase tracking-wider">จุดล่าสมบัติ</span>
                  </div>
                  <p className="text-2xl font-black text-amber-900 mb-3">{subEventInfo.location_name}</p>
                  {(subEventInfo.points_awarded ?? 100) > 0 ? (
                    <div className="bg-gradient-to-r from-yellow-200 to-orange-200 rounded-xl px-4 py-3 border-2 border-amber-400 shadow-inner">
                      <p className="text-base font-black text-amber-900">
                        💎 คะแนนพิเศษ: <span className="text-2xl">+{subEventInfo.points_awarded ?? 100}</span>
                      </p>
                      <p className="text-sm text-amber-800 font-semibold mt-1">(ครั้งแรกต่อสถานที่)</p>
                    </div>
                  ) : (
                    <div className="bg-gray-100 rounded-xl px-4 py-3 border-2 border-gray-300">
                      <p className="text-sm text-gray-700 font-semibold">
                        ℹ️ กิจกรรมนี้ไม่มีคะแนน (บันทึกการเข้าร่วมเท่านั้น)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-purple-100 border-4 border-purple-500 rounded-xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-purple-900">
                  ⚠️ ตรวจสอบข้อมูลก่อนยืนยัน
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleConfirmCheckin}
                  className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 shadow-xl border-4 border-purple-700 hover:scale-105 transition-transform"
                  size="lg"
                  style={{ fontFamily: 'Pirata One, serif' }}
                >
                  <CheckCircle2 className="h-6 w-6" />
                  <span className="text-lg">ยืนยันเข้าร่วม</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/map")}
                  size="lg"
                  className="border-4 border-purple-600 text-purple-900 hover:bg-purple-100 font-bold px-6"
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
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-green-600/30 rounded-full blur-3xl animate-pulse" />
                <div className="relative flex items-center justify-center gap-4">
                  <CheckCircle2 className="h-24 w-24 text-green-600 animate-in fade-in zoom-in drop-shadow-lg" />
                  <ShipWheel className="h-16 w-16 text-green-500 animate-spin" style={{ animationDuration: '2s' }} />
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <h2 className="text-5xl font-bold text-green-700 animate-in fade-in slide-in-from-bottom-4" style={{ fontFamily: 'Pirata One, serif' }}>
                  🎉 สำเร็จแล้ว! 🎉
                </h2>
                <p className="text-2xl text-green-800 font-semibold">{message}</p>
              </div>

              {pointsAdded > 0 && (
                <div className="rounded-3xl border-4 border-green-600 bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 p-8 shadow-2xl shadow-green-500/30 animate-in fade-in zoom-in relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,139,34,0.15) 1px, transparent 0)', backgroundSize: '50px 50px' }}>
                  {/* Sparkle effects */}
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-sparkle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${1 + Math.random()}s`
                      }}
                    />
                  ))}
                  <div className="relative z-10">
                    <p className="text-sm text-green-700 font-bold mb-3 uppercase tracking-wider">💎 คะแนนที่ได้รับ</p>
                    <div className="text-7xl font-black text-green-700 animate-bounce mb-3">
                      +{pointsAdded}
                    </div>
                    <p className="text-2xl text-green-800 font-bold">แต้ม</p>
                  </div>
                </div>
              )}

              {locationInfo && (
                <div className="rounded-2xl border-4 border-green-500 bg-gradient-to-br from-green-50 to-yellow-50 p-6 shadow-xl relative overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(139,115,85,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-600/10 rounded-full blur-2xl" />
                  <div className="flex items-center gap-3 text-sm text-green-700 mb-3 font-bold">
                    <User className="h-6 w-6" />
                    <span className="uppercase tracking-wider">ลูกเรือ</span>
                  </div>
                  <p className="text-2xl font-black text-green-900">{userName}</p>
                </div>
              )}

              <Button 
                onClick={() => navigate("/map")}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-2xl border-4 border-green-800 hover:scale-105 transition-transform mt-6"
                style={{ fontFamily: 'Pirata One, serif' }}
              >
                <span className="text-lg">🗺️ กลับไปยังแผนที่</span>
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
