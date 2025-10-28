import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, AlertCircle, CheckCircle2 } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

export const QRScannerModal = ({ isOpen, onClose, onScan }: QRScannerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasDetected, setHasDetected] = useState(false);
  const frameSkipRef = useRef(0);

  // Method to check if we should use BarcodeDetector or jsQR
  const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
  const [scanMethod, setScanMethod] = useState<'barcode' | 'jsqr' | null>(null);

  const stopScanning = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
    setHasDetected(false);
    frameSkipRef.current = 0; // Reset frame counter
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScanning(true);
      setHasDetected(false);

      // Check which method to use
      if (hasBarcodeDetector) {
        setScanMethod('barcode');
      } else {
        setScanMethod('jsqr');
      }

      // Request camera with lower resolution for better performance
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' },
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 }
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
      }

      try {
        await videoRef.current!.play();
      } catch (playError) {
        console.error('Play error:', playError);
        setError('❌ ไม่สามารถเปิดกล้องได้\n\nกรุณารีเฟรชหน้าเว็บและลองใหม่');
        stopScanning();
        return;
      }

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          resolve();
        } else {
          videoRef.current!.onloadeddata = () => resolve();
        }
      });

      // Start scanning based on method - with frame skipping for performance
      const scan = async () => {
        if (hasDetected || !videoRef.current || !videoRef.current.srcObject) {
          return;
        }

        // Skip frames - only process every 5th frame for better performance
        frameSkipRef.current++;
        if (frameSkipRef.current % 5 !== 0) {
          animationFrameRef.current = requestAnimationFrame(scan);
          return;
        }

        try {
          if (hasBarcodeDetector) {
            // Use BarcodeDetector API
            const Detector = (window as typeof window & { BarcodeDetector: BarcodeDetectorConstructor }).BarcodeDetector;
            const detector = new Detector({ formats: ['qr_code'] });
            
            const detections = await detector.detect(videoRef.current);
            const value = detections.find((item) => item.rawValue)?.rawValue;
            
            if (value) {
              console.log('✅ QR detected (BarcodeDetector):', value);
              setHasDetected(true);
              stopScanning();
              onScan(value);
              return;
            }
          } else {
            // Use jsQR fallback with scaled down canvas for performance
            const canvas = canvasRef.current;
            if (!canvas) return;

            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) return;

            const video = videoRef.current;
            
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              // Scale down to 320x240 for faster processing
              const scale = 0.5;
              canvas.height = video.videoHeight * scale;
              canvas.width = video.videoWidth * scale;
              
              context.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              if (code && code.data) {
                console.log('✅ QR detected (jsQR):', code.data);
                setHasDetected(true);
                stopScanning();
                onScan(code.data);
                return;
              }
            }
          }

          // Continue scanning
          animationFrameRef.current = requestAnimationFrame(scan);
        } catch (scanError) {
          console.error('Scan error:', scanError);
          animationFrameRef.current = requestAnimationFrame(scan);
        }
      };

      // Start scanning loop
      scan();
    } catch (cameraError) {
      console.error('Camera error:', cameraError);
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
      
      setScanning(false);
    }
  }, [hasBarcodeDetector, onScan, hasDetected, stopScanning]);

  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
      setError(null);
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-amber-600" />
            🏴‍☠️ สแกน QR Code เพื่อเช็กอิน
          </DialogTitle>
          <DialogDescription>
            ชี้กล้องไปยัง QR Code เพื่อทำการเช็กอิน
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setError(null);
                  startScanning();
                }} 
                className="flex-1"
              >
                ลองอีกครั้ง
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-amber-400 bg-black shadow-xl">
              <video 
                ref={videoRef} 
                className="h-full w-full object-cover" 
                playsInline 
                muted 
                autoPlay 
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning Overlay with frame */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />
                
                {/* Scanning line animation */}
                <div className="absolute inset-x-8 top-16 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-pulse" />
              </div>

              {/* Success overlay */}
              {hasDetected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                  <div className="text-center space-y-2">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
                    <p className="text-white font-bold text-lg">สแกนสำเร็จ! 🎉</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="text-center text-sm font-medium text-amber-900">
                🔍 กำลังสแกน QR Code...
              </p>
              <p className="text-center text-xs text-amber-700">
                💡 วาง QR Code ให้อยู่ในกรอบสี่เหลี่ยม
              </p>
              {scanMethod && (
                <p className="text-center text-xs text-amber-600">
                  {scanMethod === 'barcode' 
                    ? '⚡ ใช้ BarcodeDetector API' 
                    : '🍎 ใช้ jsQR (รองรับทุกเบราว์เซอร์)'}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            ปิด
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
