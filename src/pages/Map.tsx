import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData, checkinParticipant } from "@/services/firebase";
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

    const sig = signature || scannedQrData?.sig;
    const ver = version || scannedQrData?.version;

    if (!sig) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "ไม่พบ QR Signature กรุณาสแกน QR Code ใหม่",
        variant: "destructive",
      });
      return;
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

  const handleQrScan = useCallback((value: string) => {
    setScannerOpen(false);
    if (!value) return;
      
    console.log("QR Code scanned:", value);
      
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
    
    // If it's a valid checkin QR and location has sub-events, show bottle animation
    if (parsedData.isValid && parsedData.type === 'checkin' && parsedData.loc && participantId) {
      const locationId = parseInt(parsedData.loc);
      const location = locations.find(loc => loc.id === locationId);
      
      // Save QR data for later use
      setScannedQrData(parsedData);
      
      // If location has sub-events, show bottle modal directly
      if (location && location.sub_events && location.sub_events.length > 0) {
        setQuestLocation(location);
        setQuestModalOpen(true);
        return; // Don't show preview dialog
      }
    }
    
    // Show preview for other cases
    setScannedQrData(parsedData);
    setQrPreviewOpen(true);
  }, [locations, participantId]);

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

      <div className="container mx-auto max-w-6xl px-4 py-16 space-y-12 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-6 text-center animate-scale-in">
          {/* Decorative banner */}
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-400/60 shadow-2xl backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Compass className="h-8 w-8 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
              <Sparkles className="h-6 w-6 text-amber-600 animate-pulse" />
            </div>
            <span className="text-xl font-black text-amber-900 tracking-wide">🏴‍☠️ แผนที่สมบัติ FATU</span>
          </div>
          
          <h1 className="pirate-heading md:text-6xl text-4xl bg-gradient-to-r from-amber-900 via-orange-700 to-amber-900 bg-clip-text text-transparent">
            ล่าสมบัติกันเถอะ! ⚓🗺️
          </h1>
          <p className="pirate-subheading max-w-3xl text-lg">
            เช็กอิน 4 สถานที่เพื่อสะสมคะแนน ร่วมกิจกรรมย่อยเพื่อรับคะแนนพิเศษ +100! 
            <span className="block mt-2 text-amber-700 font-semibold">⚓💎 🎯🏆</span>
          </p>
        </div>

        {/* User Stats Card */}
        {participantId && (
          <div className="pirate-card p-8 shadow-2xl animate-slide-in border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50">
            <div className="space-y-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse" />
                    <Trophy className="relative h-10 w-10 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-2">⚔️ คะแนนสะสมของคุณ</p>
                    <h2 className="text-5xl font-black text-amber-900">
                      {points.toLocaleString()} แต้ม
                    </h2>
                    <p className="text-sm text-amber-800 font-semibold mt-1">
                      เป้าหมาย: {pointsRequired.toLocaleString()} แต้ม
                    </p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-lg px-8 py-6"
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanLine className="h-6 w-6" />
                  <span>🏴‍☠️ สแกน QR Code</span>
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-6 rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 backdrop-blur-sm px-6 py-5 shadow-lg">
                <div className="flex-1 space-y-3">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-amber-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      ความคืบหน้าระบบสมบัติ
                    </span>
                    <span className="text-amber-800 font-black text-lg">{points.toLocaleString()}/{pointsRequired.toLocaleString()}</span>
                  </div>
                  <div className="h-5 overflow-hidden rounded-full bg-amber-200 shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-700 shadow-lg relative"
                      style={{ width: `${Math.min((points / pointsRequired) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <p className="text-xs text-amber-800 font-bold">
                    {points >= pointsRequired ? '🎉 ครบแล้ว! ไปหมุนวงล้อได้เลย!' : `เหลืออีก ${(pointsRequired - points).toLocaleString()} คะแนน`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Locations Section */}
        <div className="space-y-6">
          {loading ? (
            <div className="pirate-card p-16 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg font-semibold text-primary">⚓ กำลังโหลดแผนที่สมบัติ...</p>
            </div>
          ) : (
            <>
              {/* Locations Header */}
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between px-6 py-6 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-3xl border-3 border-amber-400 shadow-2xl">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-amber-900 flex items-center gap-3">
                    <span className="text-4xl sm:text-5xl animate-bounce">🗺️</span>
                    <span>จุดล่าสมบัติทั้งหมด</span>
                  </h2>
                  <p className="text-base text-amber-800 mt-2 font-semibold">เช็กอิน + ร่วมกิจกรรม = คะแนนเพียบ! ⚓💎</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center bg-white px-6 py-4 rounded-2xl border-2 border-amber-400 shadow-xl hover:shadow-2xl transition-shadow">
                    <p className="text-4xl sm:text-5xl font-black text-amber-600">{checkins.length}</p>
                    <p className="text-sm text-amber-700 font-bold">เช็กอินแล้ว</p>
                  </div>
                  <span className="text-3xl text-amber-600 font-black">/</span>
                  <div className="text-center bg-white px-6 py-4 rounded-2xl border-2 border-amber-400 shadow-xl">
                    <p className="text-4xl sm:text-5xl font-black text-amber-600">{locations.length}</p>
                    <p className="text-sm text-amber-700 font-bold">ทั้งหมด</p>
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

        {/* Bottom Actions */}
        <div className="flex flex-col items-center justify-center gap-4 animate-fade-in">
          {participantId ? (
            <div className="flex flex-col w-full max-w-md gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/rewards")} 
                className="w-full gap-3 pirate-button shadow-xl text-lg py-6"
              >
                <Trophy className="h-6 w-6" />
                🎰 หมุนวงล้อสมบัติ
              </Button>
              <div className="grid grid-cols-3 gap-4">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/profile")} 
                  className="border-2 border-primary/30 hover:bg-primary/10"
                >
                  <User className="h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/")} 
                  className="border-2 border-primary/30 hover:bg-primary/10"
                >
                  <Anchor className="h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50"
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
                className="w-full pirate-button shadow-xl text-lg py-6"
              >
                🏴‍☠️ เข้าสู่ระบบเพื่อล่าสมบัติ
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/")} 
                className="w-full border-2 border-primary/30 hover:bg-primary/10"
              >
                <Anchor className="mr-2 h-5 w-5" />
                กลับหน้าแรก
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {participantId && (
        <QRScannerModal 
          isOpen={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScan={handleQrScan}
        />
      )}

      {/* QR Preview Dialog */}
      {participantId && (
        <Dialog open={qrPreviewOpen} onOpenChange={setQrPreviewOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {scannedQrData?.isValid ? "✅ อ่าน QR Code สำเร็จ" : "❌ QR Code ไม่ถูกต้อง"}
              </DialogTitle>
              <DialogDescription>
                {scannedQrData?.isValid 
                  ? "ตรวจสอบข้อมูลด้านล่างก่อนยืนยันการเช็กอิน"
                  : "QR Code ที่สแกนมีปัญหา กรุณาตรวจสอบ"
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {scannedQrData?.isValid ? (
                <>
                  {scannedQrData.type === 'checkin' ? (
                    <>
                      <div className="rounded-lg border-2 border-green-400 bg-green-50 p-5 shadow-lg">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-green-800 mb-1 font-bold">📍 จุดเช็กอิน</p>
                            <p className="text-xl font-black text-green-900">
                              จุดที่ {scannedQrData.loc}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-2 rounded-lg">
                              <p className="text-green-700 mb-1 font-semibold">QR Version</p>
                              <p className="font-mono font-bold text-green-900">v{scannedQrData.version || '1'}</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg">
                              <p className="text-green-700 mb-1 font-semibold">Signature</p>
                              <p className="font-mono text-xs truncate font-bold">{scannedQrData.sig?.substring(0, 12)}...</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={async () => {
                            setQrPreviewOpen(false);
                            if (scannedQrData.loc && scannedQrData.sig) {
                              const locationId = parseInt(scannedQrData.loc);
                              const location = locations.find(loc => loc.id === locationId);
                              
                              if (location && location.sub_events && Array.isArray(location.sub_events) && location.sub_events.length > 0) {
                                setQuestLocation(location);
                                setQuestModalOpen(true);
                              } else {
                                navigate(`/checkin?loc=${scannedQrData.loc}&sig=${scannedQrData.sig}&v=${scannedQrData.version || '1'}`);
                              }
                            }
                          }}
                          className="flex-1 gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          ยืนยันและเช็กอิน
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setQrPreviewOpen(false);
                            setScannerOpen(true);
                          }}
                        >
                          สแกนใหม่
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-5 shadow-lg">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-amber-700 mb-1 font-bold">🏴‍☠️ กิจกรรมพิเศษ</p>
                            <p className="text-xl font-black text-amber-900">
                              {scannedQrData.subEventId}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-2 rounded-lg">
                              <p className="text-amber-700 mb-1 font-semibold">QR Version</p>
                              <p className="font-mono font-bold text-amber-900">v{scannedQrData.version || '1'}</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg">
                              <p className="text-amber-700 mb-1 font-semibold">คะแนนพิเศษ</p>
                              <p className="font-bold text-amber-900">+100</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-yellow-50 border-2 border-yellow-400 p-4">
                        <p className="text-xs text-yellow-900">
                          💎 คะแนนพิเศษ +100 จะได้รับ<span className="font-bold">เฉพาะครั้งแรกต่อสถานที่</span>
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            setQrPreviewOpen(false);
                            if (scannedQrData.subEventId) {
                              let url = `/checkin?subevent=${scannedQrData.subEventId}&v=${scannedQrData.version || '1'}`;
                              if (scannedQrData.sig) {
                                url += `&sig=${scannedQrData.sig}`;
                              }
                              navigate(url);
                            }
                          }}
                          className="flex-1 gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          เข้าร่วมกิจกรรม
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setQrPreviewOpen(false);
                            setScannerOpen(true);
                          }}
                        >
                          สแกนใหม่
                        </Button>
                      </div>
                    </>
                  )}

                  <details className="text-xs">
                    <summary className="cursor-pointer text-foreground/60 hover:text-foreground font-semibold">
                      🔍 ดูข้อมูลดิบ (Raw Data)
                    </summary>
                    <div className="mt-2 rounded border-2 border-primary/10 bg-muted/50 p-3">
                      <code className="text-xs break-all">{scannedQrData.raw}</code>
                    </div>
                  </details>
                </>
              ) : (
                <>
                  <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-5">
                    <div className="flex items-start gap-3">
                      <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-destructive mb-1">เกิดข้อผิดพลาด</p>
                        <p className="text-sm text-destructive/90">{scannedQrData?.errorMessage}</p>
                      </div>
                    </div>
                  </div>

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
                </>
              )}
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
        qrSignature={scannedQrData?.sig}
        qrVersion={scannedQrData?.version}
        onCheckIn={handleCheckInFromModal}
      />
    </PirateBackdrop>
  );
};

export default Map;
