import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance;

export const QRScannerModal = ({ isOpen, onClose }: QRScannerModalProps) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  // Start camera and scanning
  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScanning(true);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Start scanning loop
      scanIntervalRef.current = window.setInterval(() => {
        scanQRCode();
      }, 300); // Scan every 300ms
    } catch (err) {
      console.error("Camera error:", err);
      setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้องในเบราว์เซอร์");
      setScanning(false);
    }
  }, []);

  // Stop camera and scanning
  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  // Scan QR code from video
  const scanQRCode = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Try modern Barcode Detection API first (Chrome/Edge)
    if ("BarcodeDetector" in window) {
      const BarcodeDetector = (window as any).BarcodeDetector as BarcodeDetectorConstructor;
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      
      detector
        .detect(canvas)
        .then((barcodes) => {
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            handleQRDetected(barcodes[0].rawValue);
          }
        })
        .catch((err) => {
          console.error("Barcode detection error:", err);
        });
    } else {
      // Fallback to jsQR for Safari/Firefox
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        handleQRDetected(code.data);
      }
    }
  }, []);

  // Handle QR code detected
  const handleQRDetected = useCallback((data: string) => {
    console.log("[QR Scanner] Detected:", data);
    
    setScanned(true);
    stopScanning();

    try {
      const url = new URL(data);
      
      // Check if it's a checkin URL
      if (url.pathname.includes("/checkin")) {
        // Navigate to checkin page with query params
        const params = url.search;
        navigate(`/checkin${params}`);
        onClose();
      } else {
        setError("QR Code นี้ไม่ใช่ QR Code สำหรับเช็กอินหรือกิจกรรม");
        setTimeout(() => {
          setScanned(false);
          setError(null);
          startScanning();
        }, 2000);
      }
    } catch (err) {
      setError("QR Code ไม่ถูกต้อง กรุณาสแกนใหม่");
      setTimeout(() => {
        setScanned(false);
        setError(null);
        startScanning();
      }, 2000);
    }
  }, [navigate, onClose, stopScanning, startScanning]);

  // Start/stop scanning when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      startScanning();
    } else {
      stopScanning();
      setError(null);
      setScanned(false);
    }

    return () => {
      stopScanning();
    };
  }, [isOpen, startScanning, stopScanning]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            สแกน QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Overlay */}
            {scanning && !scanned && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-64 w-64">
                  {/* Scanning Frame */}
                  <div className="absolute inset-0 border-4 border-primary rounded-lg">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                  
                  {/* Scanning Line */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-primary animate-scan" />
                </div>
              </div>
            )}

            {/* Success Overlay */}
            {scanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-2 animate-in zoom-in" />
                  <p className="text-white font-semibold">สแกนสำเร็จ!</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {!scanning && !scanned && error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center px-4">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-2" />
                  <p className="text-white font-semibold">ไม่สามารถเปิดกล้องได้</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {!error && !scanned && (
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertDescription>
                นำกล้องไปจ่อที่ QR Code เพื่อเช็กอินหรือเข้าร่วมกิจกรรม
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!scanning && !scanned && (
              <Button
                onClick={startScanning}
                className="flex-1"
                disabled={scanning}
              >
                <Camera className="h-4 w-4 mr-2" />
                เปิดกล้อง
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              ปิด
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Add animation for scanning line
const style = document.createElement('style');
style.textContent = `
  @keyframes scan {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(16rem);
    }
  }
  
  .animate-scan {
    animation: scan 2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

