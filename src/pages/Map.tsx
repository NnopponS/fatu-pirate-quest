import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData } from "@/services/firebase";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Anchor, Compass, Trophy, ScanLine, CheckCircle2, XCircle, LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { BottleQuestModal } from "@/components/BottleQuestModal";
import { PirateChatbot } from "@/components/PirateChatbot";
import jsQR from "jsqr";

interface SubEventEntry {
  id: string;
  name: string;
  location_id: number;
  description?: string;
  image_url?: string;
  time?: string;
  qr_code_version?: number;
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

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

const Map = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();

  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [checkins, setCheckins] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(300); // ✅ Default 300 คะแนน
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
      // Load all data including locations from getMapData (Firebase source)
      if (participantId) {
        const data = await getMapData(participantId);
        setLocations(
          data.locations.map((location: any) => ({
            id: location.id,
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            points: location.points,
            mapUrl: location.mapUrl || location.map_url,
            imageUrl: location.imageUrl || location.image_url,
            description: location.description,
            sub_events: location.sub_events,
          }))
        );
        setCheckins(data.checkins);
        setPoints(data.points ?? 0);
        setPointsRequired(data.pointsRequired);
        
        // Load completed sub-events
        if (data.subEventCheckins && Array.isArray(data.subEventCheckins)) {
          const completedIds = data.subEventCheckins.map((se: any) => se.sub_event_id);
          setCompletedSubEvents(completedIds);
        }
      } else {
        // Load locations from getMapData for anonymous users
        const data = await getMapData('');
        setLocations(
          data.locations.map((location: any) => ({
            id: location.id,
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            points: location.points,
            mapUrl: location.mapUrl || location.map_url,
            imageUrl: location.imageUrl || location.image_url,
            description: location.description,
            sub_events: location.sub_events,
          }))
        );
        setPointsRequired(data.pointsRequired);
      }
    } catch (error: unknown) {
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description:
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [participantId, toast]);

  useEffect(() => {
    loadData();

    // Poll for updates every 3 seconds (only when page is visible)
    const pollInterval = setInterval(() => {
      // Only reload if document is visible (not in background tab)
      if (document.visibilityState === 'visible') {
        loadData();
      }
    }, 3000);

    // Also reload when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

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
      
      {/* AI Chatbot */}
      <PirateChatbot 
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />
      <div className="container mx-auto max-w-5xl px-4 py-16 space-y-12 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center animate-scale-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-400/50">
            <Compass className="h-5 w-5 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-sm font-bold text-amber-900">🏴‍☠️ 4 จุดล่าสมบัติ</span>
          </div>
          <h1 className="pirate-heading md:text-5xl">
            ท่องดินแดน FATU เช็กอินด้วย QR
          </h1>
          <p className="pirate-subheading max-w-2xl">
            สะสมคะแนนจากการเช็กอินและร่วมกิจกรรม เพื่อปลดล็อกสมบัติ! ⚓💎
          </p>
        </div>

        {participantId && (
          <div className="pirate-card p-6 shadow-xl animate-slide-in">
            <div className="relative space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                    <Trophy className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">⚔️ คะแนนสะสมของคุณ</p>
                    <h2 className="text-3xl font-black text-primary">
                      {points} แต้ม
                    </h2>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all"
                  onClick={() => setScannerOpen(true)}
                >
                  <ScanLine className="h-5 w-5" />
                  🏴‍☠️ สแกน QR
                </Button>
              </div>

              <div className="flex items-center gap-3 rounded-xl border-2 border-amber-300 bg-amber-50/50 backdrop-blur-sm px-4 py-3">
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-amber-900">⚓ ความคืบหน้า</span>
                    <span className="font-bold text-amber-800">{points}/{pointsRequired}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-amber-200">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 transition-all duration-500"
                      style={{ width: `${Math.min((points / pointsRequired) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-amber-800">เหลืออีก</p>
                  <p className="text-lg font-black text-amber-900">{Math.max(pointsRequired - points, 0)}</p>
                </div>
              </div>

              {points >= pointsRequired && (
                <div className="rounded-xl border-2 border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 p-4 text-center animate-pulse">
                  <p className="text-sm font-bold text-green-800">🎉 ฮาฮอย! ครบแล้ว! ไปหมุนวงล้อรับสมบัติได้เลย!</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="pirate-card p-12 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg font-semibold text-primary">⚓ กำลังโหลดแผนที่สมบัติ...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-bold text-gray-800">🗺️ จุดล่าสมบัติทั้งหมด</h2>
                <span className="rounded-full bg-amber-100 px-4 py-1 text-sm font-bold text-amber-800 border-2 border-amber-300">
                  ⚓ {checkins.length}/{locations.length} จุด
                </span>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {locations.map((location, idx) => (
                  <div 
                    key={location.id} 
                    className="animate-fade-in"
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
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 animate-fade-in">
          {participantId ? (
            <div className="flex flex-col w-full max-w-md gap-3">
              <Button 
                size="lg" 
                onClick={() => navigate("/rewards")} 
                className="w-full gap-2 pirate-button shadow-lg"
              >
                <Trophy className="h-5 w-5" />
                🎰 หมุนวงล้อสมบัติ
              </Button>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/profile")} 
                  className="border-2 border-primary/30 hover:bg-primary/10"
                >
                  <User className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => navigate("/")} 
                  className="border-2 border-primary/30 hover:bg-primary/10"
                >
                  <Anchor className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleLogout} 
                  className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-md gap-3">
              <Button 
                size="lg" 
                onClick={() => navigate("/login")} 
                className="w-full pirate-button shadow-lg"
              >
                🏴‍☠️ เข้าสู่ระบบเพื่อล่าสมบัติ
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/")} 
                className="w-full border-2 border-primary/30 hover:bg-primary/10"
              >
                <Anchor className="mr-2 h-4 w-4" />
                กลับหน้าแรก
              </Button>
            </div>
          )}
        </div>
      </div>
      {participantId && (
        <>
        <QrScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={(value) => {
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
              // Parse Sub-Event QR code format: SUBEVENT|subEventId|version
              else if (value.startsWith("SUBEVENT|")) {
                const parts = value.split("|");
                console.log("SUBEVENT QR Code parsed:", { parts, length: parts.length });
                
                if (parts.length >= 3) {
                  parsedData = {
                    raw: value,
                    type: 'subevent',
                    subEventId: parts[1],
                    version: parts[2],
                    isValid: true,
                  };
                } else {
                  parsedData.errorMessage = `รูปแบบไม่ถูกต้อง (พบ ${parts.length} ส่วน, ต้องการ 3 ส่วน)`;
                }
              }
              // Backward compatibility: support old URL format
              else if (value.includes("/checkin?")) {
                try {
                  const url = new URL(value, window.location.origin);
                  const loc = url.searchParams.get("loc");
                  const sig = url.searchParams.get("sig");
                  const version = url.searchParams.get("v");
                  
                  if (loc && sig) {
                    parsedData = {
                      raw: value,
                      type: 'checkin',
                      loc,
                      sig,
                      version: version || undefined,
                      isValid: true,
                    };
            } else {
                    parsedData.errorMessage = "ไม่พบข้อมูลที่จำเป็น (loc และ sig)";
                  }
                } catch (error) {
                  parsedData.errorMessage = "ไม่สามารถอ่าน URL ได้";
                }
              }
              else {
                parsedData.errorMessage = "QR Code นี้ไม่ใช่ของระบบเช็กอิน";
              }
              
              // Show preview dialog
              setScannedQrData(parsedData);
              setQrPreviewOpen(true);
            }}
          />

          {/* QR Preview Dialog */}
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
                  // Valid QR - Show parsed data
                  <div className="space-y-3">
                    {scannedQrData.type === 'checkin' ? (
                      // Checkin QR
                      <>
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-foreground/60 mb-1">📍 จุดเช็กอิน</p>
                              <p className="text-lg font-semibold text-primary">
                                จุดที่ {scannedQrData.loc}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-foreground/60 mb-1">QR Version</p>
                                <p className="font-mono font-semibold">v{scannedQrData.version || '1'}</p>
                              </div>
                              <div>
                                <p className="text-foreground/60 mb-1">Signature</p>
                                <p className="font-mono text-xs truncate">{scannedQrData.sig?.substring(0, 12)}...</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              setQrPreviewOpen(false);
                              if (scannedQrData.loc && scannedQrData.sig) {
                                // Find the location
                                const locationId = parseInt(scannedQrData.loc);
                                const location = locations.find(loc => loc.id === locationId);
                                
                                if (location && location.sub_events && location.sub_events.length > 0) {
                                  // Show quest modal if location has sub-events
                                  setQuestLocation(location);
                                  setQuestModalOpen(true);
                                } else {
                                  // Navigate directly if no sub-events
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
                      // Sub-Event QR
                      <>
                        <div className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-amber-700 mb-1">🏴‍☠️ กิจกรรมพิเศษ</p>
                              <p className="text-lg font-semibold text-amber-900">
                                {scannedQrData.subEventId}
                              </p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-amber-700 mb-1">QR Version</p>
                                <p className="font-mono font-semibold text-amber-900">v{scannedQrData.version || '1'}</p>
                              </div>
                              <div>
                                <p className="text-amber-700 mb-1">คะแนนพิเศษ</p>
                                <p className="font-semibold text-amber-900">+100</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-3">
                          <p className="text-xs text-yellow-800">
                            💎 คะแนนพิเศษ +100 จะได้รับ<span className="font-bold">เฉพาะครั้งแรกต่อสถานที่</span>
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={() => {
                              setQrPreviewOpen(false);
                              if (scannedQrData.subEventId) {
                                navigate(`/checkin?subevent=${scannedQrData.subEventId}&v=${scannedQrData.version || '1'}`);
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
                      <summary className="cursor-pointer text-foreground/60 hover:text-foreground">
                        🔍 ดูข้อมูลดิบ (Raw Data)
                      </summary>
                      <div className="mt-2 rounded border border-primary/10 bg-muted/50 p-3">
                        <code className="text-xs break-all">{scannedQrData.raw}</code>
                      </div>
                    </details>
                  </div>
                ) : (
                  // Invalid QR - Show error
                  <div className="space-y-3">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-destructive mb-1">เกิดข้อผิดพลาด</p>
                          <p className="text-sm text-destructive/90">{scannedQrData?.errorMessage}</p>
                        </div>
                      </div>
                    </div>

                    <details className="text-xs">
                      <summary className="cursor-pointer text-foreground/60 hover:text-foreground">
                        🔍 ดูข้อมูลที่สแกนได้
                      </summary>
                      <div className="mt-2 rounded border border-destructive/20 bg-destructive/5 p-3">
                        <code className="text-xs break-all">{scannedQrData?.raw}</code>
                      </div>
                    </details>

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
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      
      {/* Bottle Quest Modal */}
      <BottleQuestModal
        isOpen={questModalOpen}
        onClose={() => {
          setQuestModalOpen(false);
          // Navigate to checkin after closing modal
          if (scannedQrData && scannedQrData.loc && scannedQrData.sig) {
            navigate(`/checkin?loc=${scannedQrData.loc}&sig=${scannedQrData.sig}&v=${scannedQrData.version || '1'}`);
          }
        }}
        locationName={questLocation?.name || ""}
        subEvents={questLocation?.sub_events?.map(se => ({
          id: se.id,
          name: se.name,
          description: se.description,
          time: se.time,
          points_awarded: 100
        })) || []}
        alreadyCheckedIn={questLocation ? checkins.includes(questLocation.id) : false}
        completedSubEvents={completedSubEvents}
      />
    </PirateBackdrop>
  );
};

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
}

const QrScannerDialog = ({ open, onOpenChange, onScan }: QrScannerDialogProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanMethod, setScanMethod] = useState<'barcode' | 'jsqr' | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let stream: MediaStream | null = null;
    let raf: number | null = null;
    let cancelled = false;

    const stopStream = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    };

    const start = async () => {
      setError(null);

      // Detect which scanning method to use
      const hasBarcodeDetector = typeof window !== "undefined" && 'BarcodeDetector' in window;
      
      if (hasBarcodeDetector) {
        console.log('🔍 Using BarcodeDetector API');
        setScanMethod('barcode');
      } else {
        console.log('🔍 Using jsQR fallback (iOS/Safari compatible)');
        setScanMethod('jsqr');
      }

      // Get camera stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });
      } catch (cameraError) {
        console.error('Camera error', cameraError);
        const errorName = (cameraError as Error).name;
        if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
          setError('❌ ไม่ได้รับอนุญาตให้เข้าถึงกล้อง\n\nวิธีแก้ไข (iOS):\n1. ไปที่ การตั้งค่า > Safari > กล้อง\n2. เลือก "ถาม" หรือ "อนุญาต"\n3. รีเฟรชหน้าเว็บและลองใหม่\n\nวิธีแก้ไข (Android):\n1. กดไอคอนกล้องในแถบ URL\n2. เลือก "อนุญาต"');
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setError('❌ ไม่พบกล้อง\n\nกรุณาตรวจสอบว่าอุปกรณ์มีกล้อง');
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setError('❌ กล้องถูกใช้งานโดยแอปอื่น\n\nวิธีแก้ไข:\n1. ปิดแอปอื่นที่ใช้กล้อง\n2. ลองอีกครั้ง');
        } else {
          setError('❌ ไม่สามารถเข้าถึงกล้องได้\n\nกรุณาตรวจสอบ:\n• อนุญาตให้เข้าถึงกล้อง\n• ไม่มีแอปอื่นใช้กล้องอยู่\n• ใช้ HTTPS หรือ localhost\n• รีเฟรชหน้าเว็บ');
        }
        return;
      }

      const video = videoRef.current;
      if (!video) {
        setError('❌ เกิดข้อผิดพลาดภายใน\n\nกรุณาลองใหม่อีกครั้ง');
        return;
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('autoplay', 'true');
      video.setAttribute('muted', 'true');

      try {
        await video.play();
      } catch (playError) {
        console.error('Play error', playError);
        setError('❌ ไม่สามารถเปิดกล้องได้\n\nกรุณา:\n1. รีเฟรชหน้าเว็บ\n2. ลองอีกครั้ง');
        return;
      }

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.onloadeddata = () => resolve();
        }
      });

      // Setup scanning based on method
      if (hasBarcodeDetector) {
        // Use BarcodeDetector API (Chrome, Edge)
        const Detector = (window as typeof window & { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;
        let detector: BarcodeDetectorInstance;
        
        try {
          detector = new Detector({ formats: ['qr_code'] });
        } catch (detectorError) {
          console.error('BarcodeDetector error', detectorError);
          setError('❌ ไม่สามารถเริ่มตัวสแกน QR ได้\n\nกรุณาลองใหม่อีกครั้ง');
        return;
      }

      const scan = async () => {
        if (cancelled || !videoRef.current) {
          return;
        }
        try {
          const detections = await detector.detect(videoRef.current);
          const value = detections.find((item) => item.rawValue)?.rawValue;
          if (value) {
              console.log('✅ QR detected (BarcodeDetector):', value);
            stopStream();
            onScan(value);
            return;
          }
        } catch (scanError) {
          console.error('Scan error', scanError);
        }
        raf = requestAnimationFrame(scan);
      };

      raf = requestAnimationFrame(scan);
      } else {
        // Use jsQR fallback (iOS Safari, Firefox)
        const canvas = canvasRef.current;
        if (!canvas) {
          setError('❌ เกิดข้อผิดพลาดภายใน\n\nกรุณาลองใหม่อีกครั้ง');
          return;
        }

        const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        if (!canvasContext) {
          setError('❌ ไม่สามารถสร้าง canvas context ได้');
          return;
        }

        const scan = () => {
          if (cancelled || !videoRef.current || !canvasRef.current) {
            return;
          }

          const video = videoRef.current;
          
          // Only scan if video is playing
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;

            canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              console.log('✅ QR detected (jsQR):', code.data);
              stopStream();
              onScan(code.data);
              return;
            }
          }

          raf = requestAnimationFrame(scan);
        };

        raf = requestAnimationFrame(scan);
      }
    };

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, onOpenChange, onScan]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>สแกน QR Code เพื่อเช็กอิน</DialogTitle>
          <DialogDescription>
            ชี้กล้องไปยัง QR Code เพื่อทำการเช็กอิน หากสแกนไม่ได้สามารถกดไปที่หน้ากรอกโค้ดได้
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive whitespace-pre-line">
              {error}
            </div>
            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setError(null);
                  onOpenChange(false);
                  setTimeout(() => onOpenChange(true), 100);
                }} 
                className="w-full"
              >
                ลองอีกครั้ง
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                ปิด
            </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative aspect-video overflow-hidden rounded-xl border-2 border-primary/20 bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
              
              {/* Hidden canvas for jsQR processing */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning overlay with corner markers */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-center text-sm text-primary font-medium">
                🔍 กำลังสแกน QR Code...
              </p>
            <p className="text-center text-xs text-foreground/60">
                💡 วาง QR Code ให้อยู่ในกรอบสี่เหลี่ยม
              </p>
              {scanMethod && (
                <p className="text-center text-xs text-foreground/50">
                  {scanMethod === 'barcode' 
                    ? '⚡ ใช้ BarcodeDetector API' 
                    : '🍎 ใช้ jsQR (iOS/Safari compatible)'}
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ปิด
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Map;
