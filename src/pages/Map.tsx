import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData, checkinParticipant, checkinSubEvent } from "@/services/firebase";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Anchor, Compass, Trophy, ScanLine, CheckCircle2, XCircle, LogOut, User, Sparkles, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { BottleQuestModal } from "@/components/BottleQuestModal";
import { PirateChatbot } from "@/components/PirateChatbot";
import { QRScannerModal } from "@/components/QRScannerModal";
import { signSubEventCheckin, todayStr } from "@/lib/crypto";
import { CHECKIN_SECRET } from "@/lib/constants";

interface SubEventEntry {
  id: string;
  name: string;
  location_id: number;
  description?: string;
  image_url?: string;
  time?: string;
  qr_code_version?: number;
  points_awarded?: number;
}

interface LocationEntry {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
  mapUrl?: string;
  imageUrl?: string;
  description?: string;
  sub_events?: SubEventEntry[];
}

const Map = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [checkins, setCheckins] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(300);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [scannedQrData, setScannedQrData] = useState<{
    raw: string;
    type?: 'checkin' | 'subevent';
    loc?: string;
    sig?: string;
    subEventId?: string;
    version?: string;
    isValid: boolean;
    errorMessage?: string;
  } | null>(null);
  
  // Bottle Quest Modal state
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [questLocation, setQuestLocation] = useState<LocationEntry | null>(null);
  const [completedSubEvents, setCompletedSubEvents] = useState<string[]>([]);
  
  // Chatbot state
  const [chatbotOpen, setChatbotOpen] = useState(false);

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
    try {
      if (participantId) {
        const data: any = await getMapData(participantId);
        
        const transformedLocations = data.locations.map((location: any) => ({
          id: location.id,
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          points: location.points,
          mapUrl: location.mapUrl || location.map_url,
          imageUrl: location.imageUrl || location.image_url,
          description: location.description,
          sub_events: location.sub_events && Array.isArray(location.sub_events) ? location.sub_events : [],
        }));
        
        setLocations(transformedLocations);
        setCheckins(data.checkins);
        setPoints(data.points ?? 0);
        setPointsRequired(data.pointsRequired);
        
        if (data.subEventCheckins && Array.isArray(data.subEventCheckins)) {
          const completedIds = data.subEventCheckins.map((se: any) => se.sub_event_id);
          setCompletedSubEvents(completedIds);
        }
      } else {
        const data: any = await getMapData('');
        const transformedLocations = data.locations.map((location: any) => ({
          id: location.id,
          name: location.name,
          lat: location.lat,
          lng: location.lng,
          points: location.points,
          mapUrl: location.mapUrl || location.map_url,
          imageUrl: location.imageUrl || location.image_url,
          description: location.description,
          sub_events: location.sub_events && Array.isArray(location.sub_events) ? location.sub_events : [],
        }));
        
        setLocations(transformedLocations);
        setPointsRequired(data.pointsRequired);
      }
    } catch (error: unknown) {
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [participantId, toast]);

  useEffect(() => {
    loadData();

    // Check if we should show bottle animation after returning from check-in
    const showBottleAnimation = sessionStorage.getItem('showBottleAnimation');
    const bottleLocationId = sessionStorage.getItem('bottleLocationId');
    
    if (showBottleAnimation === 'true' && bottleLocationId) {
      setTimeout(() => {
        const location = locations.find(loc => loc.id === parseInt(bottleLocationId, 10));
        if (location && location.sub_events && location.sub_events.length > 0) {
          setQuestLocation(location);
          setQuestModalOpen(true);
        }
        sessionStorage.removeItem('showBottleAnimation');
        sessionStorage.removeItem('bottleLocationId');
      }, 500);
    }

    // Poll for updates every 3 seconds when page is visible
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleForceRefresh = () => {
      loadData();
    };
    window.addEventListener('force-map-refresh', handleForceRefresh);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('force-map-refresh', handleForceRefresh);
    };
  }, [loadData, locations]);

  const handleCheckInFromModal = useCallback(async (locationId: number, signature?: string, version?: string) => {
    if (!participantId) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "ไม่สามารถเช็กอินได้ กรุณาเข้าสู่ระบบ",
        variant: "destructive",
      });
      return;
    }

    // Generate signature if not provided
    let sig = signature || scannedQrData?.sig;
    const ver = version || scannedQrData?.version;

    if (!sig) {
      // Auto-generate signature for manual check-in
      const { signCheckin } = await import("@/lib/crypto");
      const { todayStr } = await import("@/lib/crypto");
      const { CHECKIN_SECRET } = await import("@/lib/constants");
      sig = await signCheckin(locationId, todayStr(0), CHECKIN_SECRET, 1);
    }

    try {
      const result = await checkinParticipant(
        participantId,
        locationId,
        sig,
        ver ? parseInt(ver, 10) : undefined
      );

      if (result.pointsAdded > 0) {
        toast({
          title: "เช็กอินสำเร็จ! 🎉",
          description: `ได้รับ +${result.pointsAdded} คะแนน`,
        });
      } else {
        toast({
          title: "เช็กอินแล้ว",
          description: "คุณเคยเช็กอินสถานที่นี้แล้ว",
        });
      }

      loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      toast({
        title: "เช็กอินไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
      throw error; // Re-throw to let BottleQuestModal handle it
    }
  }, [scannedQrData, participantId, toast, loadData]);

  const handleSubEventQrScan = useCallback(async (value: string) => {
    console.log("📱 Sub-event QR Code scanned from bottle modal:", value);
    
    if (!value || !value.startsWith("SUBEVENT|") || !participantId) {
      toast({
        title: "QR Code ไม่ถูกต้อง",
        description: "กรุณาสแกน QR Code ของกิจกรรม",
        variant: "destructive",
      });
      return;
    }

    try {
      const parts = value.split("|");
      console.log("Parsing SUBEVENT QR parts:", parts);
      
      const subEventId = parts[1];
      const version = parts.length >= 3 ? parts[2] : "1";
      
      // Format: SUBEVENT|subEventId|version (3 parts, fixed QR code, no signature validation)
      // Generate a dummy signature since checkinSubEvent requires it but won't validate
      const dummySig = await signSubEventCheckin(subEventId, todayStr(0), CHECKIN_SECRET, parseInt(version, 10));

      console.log("Calling checkinSubEvent with:", { subEventId, version });
      
      // Note: checkinSubEvent will be called, which already saves location_id
      const result = await checkinSubEvent(
        participantId,
        subEventId,
        dummySig,
        parseInt(version, 10)
      );

      toast({
        title: result.pointsAdded > 0 ? "เข้าร่วมกิจกรรมสำเร็จ! 🎉" : "บันทึกการเข้าร่วมแล้ว",
        description: result.pointsAdded > 0 ? `ได้รับ +${result.pointsAdded} คะแนน` : "คุณเคยเข้าร่วมกิจกรรมนี้แล้ว",
      });

      // Reload data to update UI
      loadData();
    } catch (error) {
      toast({
        title: "เช็กอินกิจกรรมไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  }, [participantId, toast, loadData]);

  const handleQrScan = useCallback((value: string) => {
    console.log("📱 QR Code received in Map.tsx:", value);
    
    if (!value) {
      console.log("❌ Empty QR value, returning");
      return;
    }
      
    console.log("✅ Processing QR Code:", value);
    
    // Close scanner modal
    setScannerOpen(false);
      
    let parsedData: typeof scannedQrData = {
      raw: value,
      isValid: false,
    };
      
    // Parse QR code format: CHECKIN|loc|sig|version
    if (value.startsWith("CHECKIN|")) {
      const parts = value.split("|");
      console.log("CHECKIN QR Code parsed:", { parts, length: parts.length });
      
      if (parts.length >= 4) {
        parsedData = {
          raw: value,
          type: 'checkin',
          loc: parts[1],
          sig: parts[2],
          version: parts[3],
          isValid: true,
        };
      } else {
        parsedData.errorMessage = `รูปแบบไม่ถูกต้อง (พบ ${parts.length} ส่วน, ต้องการ 4 ส่วน)`;
      }
    }
    // Parse Sub-Event QR code format: SUBEVENT|subEventId|sig|version
    else if (value.startsWith("SUBEVENT|")) {
      const parts = value.split("|");
      console.log("SUBEVENT QR Code parsed:", { parts, length: parts.length });
      
      if (parts.length >= 3) {
        if (parts.length === 3) {
          parsedData = {
            raw: value,
            type: 'subevent',
            subEventId: parts[1],
            version: parts[2],
            isValid: true,
          };
        } else {
          parsedData = {
            raw: value,
            type: 'subevent',
            subEventId: parts[1],
            sig: parts[2],
            version: parts[3],
            isValid: true,
          };
        }
      } else {
        parsedData.errorMessage = `รูปแบบไม่ถูกต้อง (พบ ${parts.length} ส่วน, ต้องการ 3 หรือ 4 ส่วน)`;
      }
    }
    else {
      parsedData.errorMessage = "QR Code นี้ไม่ใช่ของระบบเช็กอิน";
    }
      
    console.log("Setting scanned QR data:", parsedData);
    
    // Handle SUBEVENT QR codes - find location and show bottle modal
    if (parsedData.isValid && parsedData.type === 'subevent' && parsedData.subEventId && participantId) {
      console.log("Processing sub-event QR code:", parsedData.subEventId);
      
      // Find the location that contains this sub-event
      const location = locations.find(loc => 
        loc.sub_events && loc.sub_events.some(se => se.id === parsedData.subEventId)
      );
      
      if (location) {
        console.log("Found location for sub-event:", location.name);
        setScannedQrData(parsedData);
        setQuestLocation(location);
        setTimeout(() => {
          setQuestModalOpen(true);
        }, 100);
        return;
      } else {
        parsedData.errorMessage = "ไม่พบข้อมูลกิจกรรมนี้ในระบบ";
        setScannedQrData(parsedData);
        setQrPreviewOpen(true);
        return;
      }
    }
    
    // If it's a valid checkin QR and location has sub-events, show bottle animation
    if (parsedData.isValid && parsedData.type === 'checkin' && parsedData.loc && participantId) {
      const locationId = parseInt(parsedData.loc);
      const location = locations.find(loc => loc.id === locationId);
      
      // Save QR data for later use
      setScannedQrData(parsedData);
      
      // If location has sub-events, show bottle modal directly
      if (location && location.sub_events && location.sub_events.length > 0) {
        setQuestLocation(location);
        // Add a small delay to ensure smooth animation
        setTimeout(() => {
          setQuestModalOpen(true);
        }, 100);
        return; // Don't show preview dialog
      }
      
      // If location exists but no sub-events, just show success message
      if (location && (!location.sub_events || location.sub_events.length === 0)) {
        toast({
          title: "✅ สแกน QR Code สำเร็จ",
          description: `สถานที่: ${location.name} - กรุณาเช็กอินผ่านระบบหลัก`,
        });
        return;
      }
      
      // If location not found
      if (!location) {
        parsedData.errorMessage = "ไม่พบข้อมูลสถานที่นี้ในระบบ";
        setScannedQrData(parsedData);
        setQrPreviewOpen(true);
        return;
      }
    }
    
    // Show error for other cases
    if (!parsedData.isValid) {
      setScannedQrData(parsedData);
      setQrPreviewOpen(true);
    }
  }, [locations, participantId, navigate, setScannerOpen, setQuestModalOpen, setQuestLocation, setScannedQrData, setQrPreviewOpen]);

  return (
    <PirateBackdrop>
      <PirateCharacter 
        messages={[
          "ฮาฮอย! นี่คือแผนที่สมบัติ! 🗺️",
          "คลิกที่ข้าได้ถ้าอยากคุยนะ! 💬",
          "เช็กอินทั้ง 4 จุดเพื่อสะสมคะแนน! ⚓",
          "สแกน QR Code ที่แต่ละจุดด้วยนะ! 📱",
          "สะสมครบ 400 คะแนนแล้วหมุนวงล้อ! 🎰",
          "โชคดีในการล่าสมบัติ! 💎",
        ]}
        onChatbotOpen={() => setChatbotOpen(true)}
      />
      
      <PirateChatbot 
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-fade-in">
        {/* Header Section - Treasure Map Style */}
        <div className="relative">
          {/* Parchment background */}
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
            {/* Burning edges effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-16 h-16 bg-amber-400/20 rounded-full blur-xl animate-pulse"
                  style={{
                    left: i % 4 === 0 ? 0 : i % 4 === 1 ? '33%' : i % 4 === 2 ? '66%' : '100%',
                    top: Math.floor(i / 4) === 0 ? 0 : Math.floor(i / 4) === 1 ? '50%' : '100%',
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}
            </div>

            {/* Wax seal */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="w-20 h-20 rounded-full bg-red-700 border-4 border-red-900 flex items-center justify-center shadow-xl animate-zoom-in">
                <div className="text-amber-200 text-3xl">🏴‍☠️</div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-6 px-6 text-center relative z-10">
              <div className="mb-6">
                <Compass className="h-12 w-12 text-amber-700 mx-auto animate-spin mb-4" style={{ animationDuration: '8s' }} />
                <h1 className="text-4xl md:text-5xl font-black text-amber-900 mb-3" style={{ fontFamily: 'Pirata One, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                  แผนที่สมบัติ FATU
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-800/20 border-2 border-amber-700">
                  <Sparkles className="h-5 w-5 text-amber-700 animate-pulse" />
                  <span className="text-sm md:text-base font-bold text-amber-900">ล่าสมบัติกันเถอะ! ⚓🗺️</span>
                </div>
              </div>
              
              <div className="max-w-3xl mx-auto space-y-4">
                <p className="text-base md:text-lg text-amber-800 leading-relaxed italic">
                  ถึงท่านผู้กล้าหาญ,
                </p>
                <p className="text-sm md:text-base text-amber-900 leading-relaxed">
                  ข้าขอต้อนรับเจ้าเข้าสู่แผนที่สมบัติแห่งเกาะ FATU 
                  เช็กอินทั้ง <span className="font-bold text-amber-800">4 จุด</span> เพื่อสะสมคะแนน 
                  และร่วม<span className="font-bold text-amber-800">กิจกรรมพิเศษ</span>เพื่อรับคะแนนเพิ่มเติม +100!
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-lg">
                  <span className="px-3 py-1 bg-amber-100 border-2 border-amber-400 rounded-full">⚓</span>
                  <span className="px-3 py-1 bg-amber-100 border-2 border-amber-400 rounded-full">💎</span>
                  <span className="px-3 py-1 bg-amber-100 border-2 border-amber-400 rounded-full">🎯</span>
                  <span className="px-3 py-1 bg-amber-100 border-2 border-amber-400 rounded-full">🏆</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Stats Card - Map Style */}
        {participantId && (
          <div 
            className="relative overflow-hidden rounded-2xl border-4 border-amber-700 bg-[#f9f1df] shadow-2xl"
            style={{
              backgroundImage: `radial-gradient(circle at 20px 20px, rgba(139, 115, 85, 0.1) 2px, transparent 2px)`,
              backgroundSize: '40px 40px'
            }}
          >
            <div className="relative p-6 md:p-8 space-y-6 z-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl border-4 border-amber-700">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse" />
                    <Trophy className="relative h-8 w-8 sm:h-10 sm:w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-800 mb-1">⚔️ คะแนนสะสม</p>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-900">
                      {points.toLocaleString()}
                    </h2>
                    <p className="text-xs sm:text-sm text-amber-800 font-semibold">
                      เป้าหมาย: <span className="text-amber-700">{pointsRequired.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="gap-2 sm:gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 font-bold animate-pulse"
                  onClick={() => {
                    console.log('Opening QR Scanner...');
                    setScannerOpen(true);
                  }}
                >
                  <ScanLine className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>🏴‍☠️ สแกน QR Code</span>
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="rounded-xl border-2 border-amber-600 bg-gradient-to-br from-amber-100 to-orange-100 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 shadow-lg">
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-3">
                  <span className="text-amber-900 flex items-center gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    ความคืบหน้า
                  </span>
                  <span className="text-amber-800 font-black">{points.toLocaleString()}/{pointsRequired.toLocaleString()}</span>
                </div>
                <div className="h-4 sm:h-5 overflow-hidden rounded-full bg-amber-200 shadow-inner border-2 border-amber-400">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-700 shadow-lg relative"
                    style={{ width: `${Math.min((points / pointsRequired) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-amber-800 font-bold mt-2 text-center">
                  {points >= pointsRequired ? '🎉 ครบแล้ว! ไปหมุนวงล้อ!' : `เหลือ ${(pointsRequired - points).toLocaleString()} คะแนน`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Locations Section */}
        <div className="space-y-6">
          {loading ? (
            <div 
              className="relative overflow-hidden rounded-2xl border-4 border-amber-700 bg-[#f4e4c1] p-16 text-center shadow-xl"
              style={{
                backgroundImage: `radial-gradient(circle at 20px 20px, rgba(139, 115, 85, 0.1) 2px, transparent 2px)`,
                backgroundSize: '40px 40px'
              }}
            >
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-amber-800 border-t-transparent" />
              <p className="text-lg font-semibold text-amber-900" style={{ fontFamily: 'Pirata One, serif' }}>⚓ กำลังโหลดแผนที่สมบัติ...</p>
            </div>
          ) : (
            <>
              {/* Locations Header */}
              <div 
                className="relative overflow-hidden rounded-2xl border-4 border-amber-700 bg-[#f9f1df] px-4 sm:px-6 py-5 sm:py-6 shadow-2xl"
                style={{
                  backgroundImage: `radial-gradient(circle at 20px 20px, rgba(139, 115, 85, 0.1) 2px, transparent 2px)`,
                  backgroundSize: '40px 40px'
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl animate-bounce">🗺️</span>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-amber-900" style={{ fontFamily: 'Pirata One, serif' }}>
                        จุดล่าสมบัติ
                      </h2>
                      <p className="text-xs sm:text-sm text-amber-800 font-semibold">เช็กอิน + ร่วมกิจกรรม ⚓💎</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="text-center bg-white border-2 border-amber-600 px-4 sm:px-6 py-3 rounded-xl shadow-lg">
                      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-700">{checkins.length}</p>
                      <p className="text-xs sm:text-sm text-amber-800 font-bold">เช็กอิน</p>
                    </div>
                    <span className="text-xl sm:text-2xl text-amber-600 font-black">/</span>
                    <div className="text-center bg-white border-2 border-amber-600 px-4 sm:px-6 py-3 rounded-xl shadow-lg">
                      <p className="text-2xl sm:text-3xl md:text-4xl font-black text-amber-700">{locations.length}</p>
                      <p className="text-xs sm:text-sm text-amber-800 font-bold">ทั้งหมด</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Locations Grid */}
              <div className="grid gap-8 md:grid-cols-2">
                {locations.map((location, idx) => (
                  <div 
                    key={location.id} 
                    className="animate-fade-in hover:scale-[1.02] transition-transform duration-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <LocationCard
                      id={location.id}
                      name={location.name}
                      lat={location.lat}
                      lng={location.lng}
                      points={location.points}
                      mapUrl={location.mapUrl}
                      imageUrl={location.imageUrl}
                      description={location.description}
                      subEvents={location.sub_events}
                      checkedIn={checkins.includes(location.id)}
                      completedSubEvents={completedSubEvents}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions - Map Style */}
        <div 
          className="relative overflow-hidden rounded-2xl border-4 border-amber-700 bg-[#f9f1df] p-6 sm:p-8 shadow-2xl"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(139, 115, 85, 0.1) 2px, transparent 2px)`,
            backgroundSize: '40px 40px'
          }}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            {participantId ? (
              <div className="flex flex-col w-full max-w-md gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/rewards")} 
                  className="w-full gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl hover:scale-105 transition-transform text-base sm:text-lg py-5 sm:py-6 font-bold"
                >
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                  🎰 หมุนวงล้อสมบัติ
                </Button>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/profile")} 
                    className="border-2 border-amber-600 hover:bg-amber-100"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => navigate("/")} 
                    className="border-2 border-amber-600 hover:bg-amber-100"
                  >
                    <Anchor className="h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={handleLogout} 
                    className="border-2 border-red-400 text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col w-full max-w-md gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/login")} 
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl hover:scale-105 transition-transform text-base sm:text-lg py-5 sm:py-6 font-bold"
                >
                  🏴‍☠️ เข้าสู่ระบบเพื่อล่าสมบัติ
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/")} 
                  className="w-full border-2 border-amber-600 hover:bg-amber-100"
                >
                  <Anchor className="mr-2 h-5 w-5" />
                  กลับหน้าแรก
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {participantId && (
        <QRScannerModal 
          isOpen={scannerOpen}
          onClose={() => {
            console.log('Closing QR Scanner modal...');
            setScannerOpen(false);
          }}
          onScan={(value) => {
            console.log('QR Scanner onScan called with:', value);
            handleQrScan(value);
          }}
        />
      )}

      {/* QR Preview Dialog - Only for errors */}
      {participantId && (
        <Dialog open={qrPreviewOpen} onOpenChange={setQrPreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                ❌ QR Code ไม่ถูกต้อง
              </DialogTitle>
              <DialogDescription>
                QR Code ที่สแกนมีปัญหา กรุณาตรวจสอบ
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-5">
                <div className="flex items-start gap-3">
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-destructive mb-1">เกิดข้อผิดพลาด</p>
                    <p className="text-sm text-destructive/90">{scannedQrData?.errorMessage}</p>
                  </div>
                </div>
              </div>

              {scannedQrData?.raw && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-foreground/60 hover:text-foreground font-semibold">
                    🔍 ดูข้อมูลที่สแกนได้
                  </summary>
                  <div className="mt-2 rounded border-2 border-destructive/10 bg-destructive/5 p-3">
                    <code className="text-xs break-all">{scannedQrData?.raw}</code>
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setQrPreviewOpen(false);
                    setScannerOpen(true);
                  }}
                  className="flex-1"
                >
                  สแกนใหม่
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setQrPreviewOpen(false)}
                >
                  ปิด
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Bottle Quest Modal */}
      <BottleQuestModal
        isOpen={questModalOpen}
        onClose={() => {
          setQuestModalOpen(false);
        }}
        locationName={questLocation?.name || ""}
        subEvents={questLocation?.sub_events?.map(se => ({
          id: se.id,
          name: se.name,
          description: se.description,
          time: se.time,
          points_awarded: se.points_awarded ?? 100
        })) || []}
        alreadyCheckedIn={questLocation ? checkins.includes(questLocation.id) : false}
        completedSubEvents={completedSubEvents}
        locationId={questLocation?.id}
        subEventId={scannedQrData?.subEventId}
        qrSignature={scannedQrData?.sig}
        qrVersion={scannedQrData?.version}
        onCheckIn={handleCheckInFromModal}
        onScanQR={handleSubEventQrScan}
      />
    </PirateBackdrop>
  );
};

export default Map;
