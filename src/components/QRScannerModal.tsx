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
  const isActiveRef = useRef(false);

  const stopScanning = useCallback(() => {
    isActiveRef.current = false;
    
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;

    try {
      setError(null);
      setScanning(true);
      setHasDetected(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const scanQRCode = () => {
        if (!isActiveRef.current || !videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.readyState >= 2) {
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code?.data) {
              console.log('✅ QR Code detected:', code.data);
              setHasDetected(true);
              isActiveRef.current = false;
              stopScanning();
              
              // Call onScan immediately, then close modal
              console.log('📤 Calling onScan callback...');
              onScan(code.data);
              
              // Close modal after showing success animation
              setTimeout(() => {
                onClose();
              }, 1500);
              return;
            }
          }
        }

        if (isActiveRef.current) {
          scanLoopRef.current = requestAnimationFrame(scanQRCode);
        }
      };

      setTimeout(() => {
        if (isActiveRef.current) {
          scanLoopRef.current = requestAnimationFrame(scanQRCode);
        }
      }, 300);

    } catch (err: any) {
      isActiveRef.current = false;
      const errorName = err.name;
      
      if (errorName === 'NotAllowedError') {
        setError('ไม่ได้รับอนุญาตให้เข้าถึงกล้อง');
      } else if (errorName === 'NotFoundError') {
        setError('ไม่พบกล้อง');
      } else {
        setError('ไม่สามารถเปิดกล้องได้');
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
  }, [isOpen]);

  const handleRetry = () => {
    isActiveRef.current = false;
    stopScanning();
    setError(null);
    setTimeout(() => startScanning(), 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0 border-4 border-amber-800 bg-[#f9f1df]">
        <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-6 border-b-4 border-amber-600">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-amber-900 flex items-center gap-2">
              <Camera className="h-6 w-6" />
              สแกน QR Code
            </DialogTitle>
            <DialogDescription className="text-amber-800">
              ชี้กล้องไปยัง QR Code
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1 bg-amber-600">
                  ลองอีกครั้ง
                </Button>
                <Button variant="outline" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="relative aspect-square bg-black rounded-2xl border-4 border-amber-700 overflow-hidden">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {scanning && !hasDetected && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
                    <div className="absolute inset-x-4 top-1/3 h-1 bg-amber-400/50 animate-pulse" />
                  </div>
                )}

                {hasDetected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-900/90">
                    <div className="text-center">
                      <CheckCircle2 className="h-20 w-20 text-green-400 mx-auto animate-bounce" />
                      <p className="text-white font-black text-xl mt-4">สแกนสำเร็จ!</p>
                    </div>
                  </div>
                )}
              </div>

              <Button variant="outline" onClick={onClose} className="w-full">
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

