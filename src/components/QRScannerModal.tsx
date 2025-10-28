import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export const QRScannerModal = ({ isOpen, onClose, onScan }: QRScannerModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [hasDetected, setHasDetected] = useState(false);
  const [detectedValue, setDetectedValue] = useState<string>("");

  const stopScanning = useCallback(() => {
    // Stop animation frame
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    // Stop camera stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScanning(true);
      setHasDetected(false);
      setDetectedValue("");

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Start scanning loop
      const scanQRCode = () => {
        if (!videoRef.current || !canvasRef.current) {
          scanLoopRef.current = requestAnimationFrame(scanQRCode);
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
              console.log('✅ QR Code detected:', code.data);
              setHasDetected(true);
              setDetectedValue(code.data);
              
              // Stop scanning and wait 500ms before calling onScan
              stopScanning();
              setTimeout(() => {
                onScan(code.data);
              }, 500);
              return;
            }
          }
        }

        // Continue scanning
        scanLoopRef.current = requestAnimationFrame(scanQRCode);
      };

      // Wait a bit for video to be ready, then start scanning
      setTimeout(() => {
        scanLoopRef.current = requestAnimationFrame(scanQRCode);
      }, 500);

    } catch (err: any) {
      console.error('Camera error:', err);
      const errorName = err.name || err.constructor.name;
      
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        setError('❌ ไม่ได้รับอนุญาตให้เข้าถึงกล้อง\n\nกรุณาอนุญาตให้เข้าถึงกล้องผ่านการตั้งค่าเบราว์เซอร์');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setError('❌ ไม่พบกล้อง\n\nกรุณาตรวจสอบว่าอุปกรณ์มีกล้อง');
      } else if (errorName === 'NotReadableError') {
        setError('❌ กล้องถูกใช้งานโดยแอปอื่น\n\nกรุณาปิดแอปอื่นที่ใช้กล้องอยู่');
      } else {
        setError('❌ ไม่สามารถเปิดกล้องได้\n\nกรุณาลองรีเฟรชหน้าเว็บ');
      }
      
      setScanning(false);
    }
  }, [onScan, stopScanning]);

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

  const handleRetry = useCallback(() => {
    setError(null);
    startScanning();
  }, [startScanning]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-4 border-amber-800 bg-[#f9f1df]">
        {/* Decorative header */}
        <div className="relative bg-gradient-to-br from-amber-100 to-orange-100 p-6 border-b-4 border-amber-600">
          <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-amber-200/50 animate-pulse"></div>
          <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-orange-200/50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-amber-600 shadow-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-amber-900 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-amber-600 animate-pulse" />
                  สแกน QR Code
                </DialogTitle>
                <DialogDescription className="text-amber-800 font-semibold mt-1">
                  ชี้กล้องไปยัง QR Code
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-2 border-red-500 bg-red-50">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="whitespace-pre-line text-sm">
                  {error}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleRetry} 
                  className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold"
                >
                  🔄 ลองอีกครั้ง
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-2 border-amber-600 hover:bg-amber-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Camera preview with pirate theme */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-4 border-amber-700 bg-black shadow-2xl">
                <video 
                  ref={videoRef} 
                  className="h-full w-full object-cover" 
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning frame with pirate corners */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner decorations */}
                  <div className="absolute top-0 left-0 w-16 h-16">
                    <div className="absolute top-2 left-2 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16">
                    <div className="absolute top-2 right-2 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-16 h-16">
                    <div className="absolute bottom-2 left-2 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-16 h-16">
                    <div className="absolute bottom-2 right-2 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />
                  </div>
                  
                  {/* Scanning line */}
                  <div className="absolute inset-x-4 top-1/3 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
                  <div className="absolute inset-x-4 bottom-1/3 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>

                {/* Success overlay */}
                {hasDetected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-900/90 to-emerald-900/90 backdrop-blur-sm">
                    <div className="text-center space-y-4 p-6">
                      <div className="relative inline-block">
                        <CheckCircle2 className="h-20 w-20 text-green-400 animate-bounce mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-10 w-10 text-amber-300 animate-pulse" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-black text-2xl mb-2">สแกนสำเร็จ! 🎉</p>
                        <p className="text-amber-200 text-sm font-semibold">กำลังประมวลผล...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-3 bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold">
                    1
                  </div>
                  <p className="text-sm font-semibold text-amber-900">วาง QR Code ให้อยู่ในกรอบ</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold">
                    2
                  </div>
                  <p className="text-sm font-semibold text-amber-900">รอให้ระบบสแกนอัตโนมัติ</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 font-bold">
                    3
                  </div>
                  <p className="text-sm font-semibold text-amber-900">รับคะแนนและร่วมกิจกรรม!</p>
                </div>
              </div>

              {/* Action button */}
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full border-2 border-amber-600 hover:bg-amber-50 font-semibold py-3"
              >
                <X className="h-4 w-4 mr-2" />
                ปิด
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
