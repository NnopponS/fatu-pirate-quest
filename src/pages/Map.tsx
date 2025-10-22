import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData } from "@/services/firebase";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Anchor, Compass, Trophy, ScanLine, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PirateBackdrop } from "@/components/PirateBackdrop";

interface LocationEntry {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
  mapUrl?: string;
  imageUrl?: string;
  description?: string;
}

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

const Map = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [checkins, setCheckins] = useState<number[]>([]);
  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(300);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrPreviewOpen, setQrPreviewOpen] = useState(false);
  const [scannedQrData, setScannedQrData] = useState<{
    raw: string;
    loc?: string;
    sig?: string;
    version?: string;
    isValid: boolean;
    errorMessage?: string;
  } | null>(null);

  const participantId = useMemo(() => localStorage.getItem("participantId"), []);

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
          }))
        );
        setCheckins(data.checkins);
        setPoints(data.points ?? 0);
        setPointsRequired(data.pointsRequired);
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
      <div className="container mx-auto max-w-5xl px-4 py-16 space-y-12 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center animate-scale-in">
          <span className="pirate-highlight">
            <Compass className="h-4 w-4 text-secondary" />
            4 จุดล่าสมบัติ
          </span>
          <h1 className="pirate-heading md:text-5xl">ท่องดินแดน FATU เช็กอินด้วย QR</h1>
          <p className="pirate-subheading">
            เพื่อปลดล็อกจากจุดหมายสำคัญ
          </p>
        </div>

        {participantId && (
          <div className="pirate-card p-8 space-y-6 animate-slide-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-wider text-foreground/60">คะแนนสะสมทั้งหมด</p>
                  <h2 className="text-3xl font-semibold text-primary">{points} คะแนน</h2>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-center sm:items-end sm:text-right">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="gap-2 hover-scale" onClick={() => setScannerOpen(true)}>
                  <ScanLine className="h-4 w-4" />
                  เปิดกล้องสแกน QR
                </Button>
              </div>
                <div className="text-center sm:text-right">
                  <p className="text-2xl font-bold text-primary">{pointsRequired} คะแนน</p>
                  <p className="text-sm text-foreground/70">สะสมครบเพื่อหมุนวงล้อสมบัติ</p>
                  <p className="text-xs text-foreground/60 mt-1">ลุ้นรับของรางวัลพิเศษเฉพาะงานนี้เท่านั้น</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pirate-card p-8 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-foreground/70">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              กำลังโหลดข้อมูลสถานที่...
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location, idx) => (
                <div key={location.id} style={{ animationDelay: `${idx * 100}ms` }}>
                  <LocationCard
                    id={location.id}
                    name={location.name}
                    lat={location.lat}
                    lng={location.lng}
                    points={location.points}
                    mapUrl={location.mapUrl}
                    imageUrl={location.imageUrl}
                    description={location.description}
                    checkedIn={checkins.includes(location.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in">
          {participantId ? (
            <>
              <Button size="lg" variant="outline" onClick={() => navigate("/rewards")} className="hover-scale">
                ไปหน้าวงล้อสมบัติ
              </Button>
              <Button size="lg" variant="ghost" onClick={() => navigate("/")} className="hover-scale">
                <Anchor className="mr-2 h-4 w-4" />
                กลับหน้าแรก
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" onClick={() => navigate("/login")} className="hover-scale">
                เข้าสู่ระบบเพื่อเช็กอิน
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="hover-scale">
                <Anchor className="mr-2 h-4 w-4" />
                กลับหน้าแรก
              </Button>
            </>
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
                console.log("QR Code parsed:", { parts, length: parts.length });
                
                if (parts.length >= 4) {
                  parsedData = {
                    raw: value,
                    loc: parts[1],
                    sig: parts[2],
                    version: parts[3],
                    isValid: true,
                  };
                } else {
                  parsedData.errorMessage = `รูปแบบไม่ถูกต้อง (พบ ${parts.length} ส่วน, ต้องการ 4 ส่วน)`;
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
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-foreground/60 mb-1">จุดเช็กอิน</p>
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

                    <details className="text-xs">
                      <summary className="cursor-pointer text-foreground/60 hover:text-foreground">
                        🔍 ดูข้อมูลดิบ (Raw Data)
                      </summary>
                      <div className="mt-2 rounded border border-primary/10 bg-muted/50 p-3">
                        <code className="text-xs break-all">{scannedQrData.raw}</code>
                      </div>
                    </details>

                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          setQrPreviewOpen(false);
                          if (scannedQrData.loc && scannedQrData.sig) {
                            navigate(`/checkin?loc=${scannedQrData.loc}&sig=${scannedQrData.sig}&v=${scannedQrData.version || '1'}`);
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
  const [error, setError] = useState<string | null>(null);

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

      if (typeof window === "undefined" || !('BarcodeDetector' in window)) {
        setError('เบราว์เซอร์นี้ไม่รองรับการสแกน QR Code\n\nกรุณาใช้:\n• Chrome (แนะนำ)\n• Safari\n• Edge\n\n❌ Firefox ยังไม่รองรับ');
        return;
      }

      const Detector = (window as typeof window & { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;

      let detector: BarcodeDetectorInstance;
      try {
        detector = new Detector({ formats: ['qr_code'] });
      } catch (detectorError) {
        console.error('BarcodeDetector error', detectorError);
        setError('❌ ไม่สามารถเริ่มตัวสแกน QR ได้\n\nกรุณาลองใหม่อีกครั้ง');
        return;
      }

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
          setError('❌ ไม่ได้รับอนุญาตให้เข้าถึงกล้อง\n\nวิธีแก้ไข:\n1. กดไอคอนกล้องในแถบ URL\n2. เลือก "อนุญาต"\n3. รีเฟรชหน้าเว็บ');
        } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
          setError('❌ ไม่พบกล้อง\n\nกรุณาตรวจสอบว่าอุปกรณ์มีกล้อง');
        } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
          setError('❌ กล้องถูกใช้งานโดยแอปอื่น\n\nวิธีแก้ไข:\n1. ปิดแอปอื่นที่ใช้กล้อง\n2. ลองอีกครั้ง');
        } else {
          setError('❌ ไม่สามารถเข้าถึงกล้องได้\n\nกรุณาตรวจสอบ:\n• อนุญาตให้เข้าถึงกล้อง\n• ไม่มีแอปอื่นใช้กล้องอยู่\n• รีเฟรชหน้าเว็บ');
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

      const scan = async () => {
        if (cancelled || !videoRef.current) {
          return;
        }
        try {
          const detections = await detector.detect(videoRef.current);
          const value = detections.find((item) => item.rawValue)?.rawValue;
          if (value) {
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
