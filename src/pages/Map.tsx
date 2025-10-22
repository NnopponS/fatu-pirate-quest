import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData } from "@/services/firebase";
import { supabase } from "@/integrations/supabase/client";
import { LocationCard } from "@/components/LocationCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Anchor, Compass, Trophy, ScanLine } from "lucide-react";
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

  const participantId = useMemo(() => localStorage.getItem("participantId"), []);

  const loadData = useCallback(async () => {
    try {
      // Load locations for everyone (public access)
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .order('id');

      if (locationsData) {
        setLocations(
          locationsData.map((location: any) => ({
            id: location.id,
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            points: location.points,
            mapUrl: location.map_url,
            imageUrl: location.image_url,
            description: location.description,
          }))
        );
      }

      // Load event settings for everyone
      const { data: settingsData } = await supabase
        .from('event_settings')
        .select('points_for_spin')
        .single();

      if (settingsData) {
        setPointsRequired(settingsData.points_for_spin);
      }

      // Load participant-specific data if logged in
      if (participantId) {
        const data = await getMapData(participantId);
        setCheckins(data.checkins);
        setPoints(data.points ?? 0);
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

    // Subscribe to real-time updates for locations table
    const locationsSubscription = supabase
      .channel('locations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'locations',
        },
        (payload) => {
          console.log('Location updated:', payload);
          // Reload locations when any change happens
          loadData();
        }
      )
      .subscribe();

    // Subscribe to real-time updates for event_settings table
    const settingsSubscription = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_settings',
        },
        (payload) => {
          console.log('Settings updated:', payload);
          // Reload data when settings change
          loadData();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(locationsSubscription);
      supabase.removeChannel(settingsSubscription);
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
                <Button size="sm" variant="secondary" className="gap-2 hover-scale" onClick={() => setScannerOpen(true)}>
                  <ScanLine className="h-4 w-4" />
                  เปิดกล้องสแกน QR
                </Button>
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
        <QrScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={(value) => {
            setScannerOpen(false);
            if (!value) return;
            if (value.startsWith("http")) {
              window.location.href = value;
            } else {
              navigate(`/checkin?payload=${encodeURIComponent(value)}`);
            }
          }}
        />
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
        setError('อุปกรณ์นี้ไม่รองรับการสแกน QR Code');
        return;
      }

      const Detector = (window as typeof window & { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;

      let detector: BarcodeDetectorInstance;
      try {
        detector = new Detector({ formats: ['qr_code'] });
      } catch (detectorError) {
        console.error('BarcodeDetector error', detectorError);
        setError('ไม่สามารถเริ่มตัวตรวจจับ QR Code ได้');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
        });
      } catch (cameraError) {
        console.error('Camera error', cameraError);
        setError('ไม่สามารถเข้าถึงกล้องได้ โปรดอนุญาตการใช้งานกล้อง');
        return;
      }

      const video = videoRef.current;
      if (!video) {
        setError('ไม่พบวิดีโอสำหรับแสดงผล');
        return;
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');

      try {
        await video.play();
      } catch (playError) {
        console.error('Play error', playError);
        setError('ไม่สามารถเล่นวิดีโอจากกล้องได้');
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
            <div className="rounded-lg border border-dashed border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
            <Button asChild className="w-full" variant="secondary">
              <a href="/checkin">ไปหน้ากรอกโค้ด</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="aspect-video overflow-hidden rounded-xl border bg-black/80">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            </div>
            <p className="text-center text-xs text-foreground/60">
              เคล็ดลับ: วาง QR ไว้กึ่งกลางและให้มีแสงเพียงพอ
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ???????????
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Map;
