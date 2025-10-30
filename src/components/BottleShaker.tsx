import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Package } from "lucide-react";

// Add custom styles for animations
const customStyles = `
  @keyframes shake {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-10deg); }
    20%, 40%, 60%, 80% { transform: translateX(10px) rotate(10deg); }
  }
  
  @keyframes shake-intense {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    10% { transform: translateX(-20px) rotate(-15deg); }
    20% { transform: translateX(20px) rotate(15deg); }
    30% { transform: translateX(-20px) rotate(-15deg); }
    40% { transform: translateX(20px) rotate(15deg); }
    50% { transform: translateX(-20px) rotate(-15deg); }
    60% { transform: translateX(20px) rotate(15deg); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  @keyframes reveal-bottle {
    0% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
    100% { opacity: 1; transform: scale(1) rotate(360deg); }
  }
  
  @keyframes sparkle {
    0%, 100% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }
  
  @keyframes bubble-rise {
    0% { transform: translateY(0) scale(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-150px) scale(1); opacity: 0; }
  }
  
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
  
  .animate-shake-intense {
    animation: shake-intense 0.8s ease-in-out;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-reveal-bottle {
    animation: reveal-bottle 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .animate-sparkle {
    animation: sparkle 2s ease-in-out infinite;
  }
  
  .animate-bubble-rise {
    animation: bubble-rise linear;
  }
`;

interface PrizeItem {
  name: string;
  weight: number;
  stock: number;
}

interface BottleShakerProps {
  onShake: () => Promise<{ prize: string; claimCode: string }>;
  disabled: boolean;
  prizes: PrizeItem[];
}

export const BottleShaker = ({ onShake, disabled, prizes }: BottleShakerProps) => {
  const [shaking, setShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [showClaim, setShowClaim] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const lastAccel = useRef<{ x: number; y: number; z: number; t: number } | null>(null);
  const shakeCooldownRef = useRef<number>(0);

  const handleShake = async () => {
    if (disabled || shaking || shakeCount >= 5) return;
    
    setShaking(true);
    
    // Shake animation
    setTimeout(() => {
      setShaking(false);
      setShakeCount(prev => prev + 1);
      
      // If this is the 5th shake, reveal result
      if (shakeCount === 4) {
        revealPrize();
      }
    }, 800);
  };
  
  const revealPrize = async () => {
    try {
      setAnimating(true);
      setRevealing(true);
      
      // Get the prize result
      const { prize, claimCode: code } = await onShake();
      setClaimCode(code);
      
      // Wait for reveal animation
      setTimeout(() => {
        setResult(prize);
        setAnimating(false);
        setShowClaim(true);
      }, 1500);
    } catch (error) {
      setAnimating(false);
      setRevealing(false);
    }
  };

  const displayPrizes = prizes.length > 0 ? prizes : [{ name: "ยังไม่มีการตั้งค่ารางวัล", weight: 1, stock: 0 }];
  const canShake = shakeCount < 5 && !disabled && !result;
  const shakeProgress = (shakeCount / 5) * 100;

  // Device motion shake support
  useEffect(() => {
    if (!motionEnabled || !canShake) return;

    const threshold = 15; // m/s^2 approximate
    const minIntervalMs = 400;

    const onMotion = (e: DeviceMotionEvent) => {
      const now = Date.now();
      if (now - shakeCooldownRef.current < minIntervalMs) return;
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const ax = acc.x || 0;
      const ay = acc.y || 0;
      const az = acc.z || 0;
      const magnitude = Math.sqrt(ax * ax + ay * ay + az * az);
      // Basic high-pass via diff
      const prev = lastAccel.current;
      lastAccel.current = { x: ax, y: ay, z: az, t: now };
      if (magnitude > threshold) {
        shakeCooldownRef.current = now;
        // fire one shake
        handleShake();
      }
    };

    window.addEventListener('devicemotion', onMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', onMotion as any);
  }, [motionEnabled, canShake]);

  const requestMotionPermission = async () => {
    // iOS 13+
    try {
      const anyWindow = window as any;
      if (typeof anyWindow.DeviceMotionEvent !== 'undefined' && typeof anyWindow.DeviceMotionEvent.requestPermission === 'function') {
        const res = await anyWindow.DeviceMotionEvent.requestPermission();
        if (res === 'granted') setMotionEnabled(true);
      } else {
        // Android or desktop
        setMotionEnabled(true);
      }
    } catch {
      setMotionEnabled(false);
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      <div className="text-center space-y-8">
        {/* Bottle Container */}
        <div className="relative mx-auto h-96 w-64 flex flex-col items-center justify-center">
          {/* Background sparkles */}
          {(shaking || revealing) && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-yellow-400 rounded-full animate-sparkle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${1 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Bubbles rising when shaking */}
          {shaking && [...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-6 h-6 bg-white/60 rounded-full animate-bubble-rise"
              style={{
                left: `${30 + Math.random() * 40}%`,
                bottom: '20%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random() * 1}s`
              }}
            />
          ))}
          
          {/* The Bottle */}
          <div 
            className={`relative transition-all duration-300 cursor-pointer select-none ${
              canShake ? 'hover:scale-110' : 'opacity-50 cursor-not-allowed'
            } ${shaking ? 'animate-shake-intense' : ''} ${revealing ? 'animate-reveal-bottle' : 'animate-float'}`}
            onClick={handleShake}
          >
            <div className="text-9xl filter drop-shadow-2xl">
              {shakeCount >= 5 || revealing ? '🍾' : '🥃'}
            </div>
            
            {/* Liquid level indicator */}
            {shakeCount > 0 && shakeCount < 5 && (
              <div 
                className="absolute bottom-8 left-1/2 -translate-x-1/2 w-20 h-24 bg-gradient-to-t from-blue-500/60 to-transparent rounded-bl-full rounded-br-full transition-all duration-300"
                style={{ height: `${100 - shakeProgress}%` }}
              />
            )}
          </div>
          
          {/* Shake count indicator */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xs">
            {shakeCount < 5 ? (
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-amber-900">
                  เขย่าขวด ({shakeCount}/5 ครั้ง)
                </p>
                <div className="w-full h-4 bg-amber-200 rounded-full overflow-hidden border-2 border-amber-600">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${shakeProgress}%` }}
                  />
                </div>
              </div>
            ) : revealing ? (
              <p className="text-2xl font-bold text-amber-900 animate-pulse">
                🎁 กำลังเปิดขวด...
              </p>
            ) : null}
          </div>
        </div>

        {/* Result Display */}
        {result && !claimed && showClaim && (
          <div className="mx-auto max-w-xl px-6 py-8 animate-in fade-in-50 zoom-in-90 space-y-6 relative overflow-hidden bg-[#f4e4c1] border-4 border-amber-700 rounded-2xl">
            {/* Celebration Effects */}
            <div className="absolute inset-0分担-events-none">
              <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '0s'}} />
              <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-red-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}} />
              <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}} />
              <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}} />
            </div>

            <div className="flex items-center justify-center gap-3">
              <Gift className="h-10 w-10 text-amber-700 animate-bounce" />
              <h3 className="text-3xl font-bold text-amber-900">ยินดีด้วย! 🎉</h3>
            </div>
            
            <div className="space-y-2">
              <p className="text-lg text-amber-800">คุณได้รับรางวัล</p>
              <p className="text-5xl font-black text-transparent bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text">
                {result}
              </p>
            </div>
            
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
              <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ สำคัญ!</p>
              <p className="text-sm text-amber-800">กดปุ่ม "รับรางวัล" ด้านล่าง แล้วนำหน้าจอนี้ไปแสดงที่จุดรับรางวัล</p>
            </div>

            <Button
              size="lg"
              className="w-full py-6 text-xl font-bold shadow-2xl shadow-amber-600/50 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:scale-105 transition-all animate-pulse"
              onClick={() => setClaimed(true)}
            >
              <Gift className="h-6 w-6 mr-2" />
              รับรางวัล
            </Button>
          </div>
        )}

        {/* After Claimed - Show QR/Code */}
        {claimed && result && (
          <div className="mx-auto max-w-xl px-6 py-8 animate-in fade-in-50 zoom-in-90 space-y-6 border-4 border-green-500 bg-[#f4e4c1] rounded-2xl">
            <div className="flex items-center justify-center gap-3">
              <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                <Gift className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-green-700">✅ พร้อมรับรางวัล</h3>
              <p className="text-4xl font-black text-amber-900">{result}</p>
            </div>
            
            <div className="rounded-xl border-2 border-green-400 bg-green-50 p-6 space-y-4">
              <p className="text-lg font-semibold text-green-900">📍 นำหน้าจอนี้ไปแสดงที่จุดรับรางวัล</p>
              <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                <p className="text-sm text-gray-600 mb-2">รหัสรับรางวัล:</p>
                <p className="text-5xl font-mono font-bold text-green-600 tracking-widest">
                  {claimCode || "----"}
                </p>
              </div>
              <p className="text-sm text-green-700">
                💡 เจ้าหน้าที่จะตรวจสอบและมอบรางวัลให้คุณ
              </p>
            </div>
          </div>
        )}

        {/* Shake Button */}
        {!result && !disabled && prizes.length > 0 && canShake && (
          <div className="relative">
            <Button
              size="lg"
              className="px-12 py-6 text-xl font-bold shadow-2xl shadow-amber-600/40 hover:shadow-2xl hover:scale-110 transition-all bg-gradient-to-r from-amber-600 via-orange-600 to-red-600"
              onClick={handleShake}
              disabled={shaking}
            >
              {shaking ? (
                <>
                  <span className="mr-2">🧴</span>
                  กำลังเขย่า...
                </>
              ) : (
                <>
                  <span className="text-3xl mr-2 animate-bounce inline-block">🏴‍☠️</span>
                  เขย่าขวด
                </>
              )}
            </Button>
          </div>
        )}

        {disabled && !result && (
          <p className="text-sm text-foreground/70">
            สะสมคะแนนให้ครบก่อน จึงจะสามารถเขย่าขวดได้
          </p>
        )}

        {prizes.length === 0 && (
          <div className="mx-auto max-w-xl px-6 py-4 bg-[#f4e4c1] border-4 border-amber-700 rounded-2xl">
            <p className="text-foreground/70">😔 ขออภัย รางวัลหมดแล้วทั้งหมด</p>
            <p className="text-sm text-foreground/60 mt-2">กรุณาติดต่อทีมงานเพื่อเพิ่มรางวัล</p>
          </div>
        )}

        {/* Prizes List */}
        {prizes.length > 0 && (
          <div className="mx-auto max-w-xl px-4 py-4 bg-[#f4e4c1] border-4 border-amber-700 rounded-2xl">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-amber-900 flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              รางวัลที่มีในขวด
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {prizes.map((prize) => (
                <div
                  key={prize.name}
                  className="rounded-xl border border-amber-600/40 bg-white/70 px-4 py-3 text-sm text-left shadow-sm transition hover:border-amber-600 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-amber-900">{prize.name}</span>
                    <span className="flex-shrink-0 rounded-full bg-amber-600/20 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      🎁
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motion tip and enable */}
        {!result && canShake && (
          <div className="mx-auto max-w-xl px-4 py-3 text-xs text-amber-900/80">
            <p>💡 คุณสามารถเขย่ามือถือเพื่อเขย่าขวดได้</p>
            {!motionEnabled && (
              <div className="mt-2">
                <Button size="sm" variant="outline" onClick={requestMotionPermission}>
                  เปิดใช้งานการเขย่ามือถือ
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
