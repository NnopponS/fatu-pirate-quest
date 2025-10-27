import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Package } from "lucide-react";

// Add custom styles for animations
const customStyles = `
  @keyframes gradient {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse-slow {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
  .animate-pulse-slow {
    animation: pulse-slow 2s ease-in-out infinite;
  }
`;

interface PrizeItem {
  name: string;
  weight: number;
  stock: number;
}

interface SpinWheelProps {
  onSpin: () => Promise<string>;
  disabled: boolean;
  prizes: PrizeItem[];
}

export const SpinWheel = ({ onSpin, disabled, prizes }: SpinWheelProps) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [showClaim, setShowClaim] = useState(false); // ✅ Show claim button instead of immediate result
  const [claimed, setClaimed] = useState(false); // ✅ Track if prize has been claimed

  const handleSpin = async () => {
    if (disabled || spinning) return;

    setSpinning(true);
    setResult(null);

    try {
      // ✅ Get the prize first
      const prize = await onSpin();
      
      // ✅ Find which segment this prize is in
      const prizeIndex = prizes.findIndex(p => p.name === prize);
      
      if (prizeIndex === -1) {
        // Prize not found in list, use random rotation
        const spins = 3 + Math.random() * 2;
        const randomAngle = Math.random() * 360;
        const totalRotation = rotation + (spins * 360) + randomAngle;
        setRotation(totalRotation);
      } else {
        // ✅ Calculate the angle for this prize
        const segmentAngle = 360 / prizes.length;
        const prizeAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2); // Center of segment
        
        // ✅ The pointer is at the top (0°), so we need to rotate the wheel
        // so that the prize segment is at the top
        // We rotate counter-clockwise, so we need to subtract the angle
        const targetAngle = 360 - prizeAngle;
        
        // ✅ Add multiple full rotations for effect (5-7 spins)
        const spins = 5 + Math.random() * 2;
        const totalRotation = rotation + (spins * 360) + targetAngle;
        
        setRotation(totalRotation);
      }

      // Show claim button after animation completes  
      setTimeout(() => {
        setResult(prize);
        setSpinning(false);
        setShowClaim(true); // ✅ Show claim button, don't mark as received yet
      }, 8000); // ✅ Increased to 8 seconds for spectacular effect
    } catch {
      setSpinning(false);
      // Don't reset rotation on error to show what was spun
    }
  };

  // Generate wheel colors
  const colors = [
    "from-red-400 to-red-600",
    "from-blue-400 to-blue-600", 
    "from-yellow-400 to-yellow-600",
    "from-green-400 to-green-600",
    "from-purple-400 to-purple-600",
    "from-orange-400 to-orange-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
  ];

  const displayPrizes = prizes.length > 0 ? prizes : [{ name: "ยังไม่มีการตั้งค่ารางวัล", weight: 1, stock: 0 }];
  
  // Calculate segment angle
  const segmentAngle = 360 / displayPrizes.length;

  return (
    <>
      <style>{customStyles}</style>
      <div className="text-center space-y-8">
      {/* Wheel Container with Enhanced Effects */}
      <div className="relative mx-auto h-80 w-80">
        {/* Glow Effect when Spinning */}
        {spinning && (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-blue-500 opacity-50 blur-3xl animate-spin-slow" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-30 blur-2xl animate-pulse" />
          </>
        )}
        
        {/* Sparkle Particles when Spinning */}
        {spinning && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const radius = 150;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '1s'
                  }}
                />
              );
            })}
          </div>
        )}
        {/* Pointer/Arrow - Enhanced */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-2">
          <div className={`h-0 w-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-2xl ${spinning ? 'animate-pulse' : ''}`} />
          {spinning && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-red-500 rounded-full blur-md animate-ping" />
          )}
        </div>

        {/* Wheel - Enhanced with Effects */}
        <div className="relative h-full w-full">
          {/* Outer Glow Ring */}
          <div className={`absolute inset-0 rounded-full ${spinning ? 'animate-ping' : ''}`} style={{
            boxShadow: spinning ? '0 0 60px rgba(234, 179, 8, 0.8), 0 0 100px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(234, 179, 8, 0.4)'
          }} />
          
          <div
            className="absolute inset-0 rounded-full border-8 border-yellow-600 shadow-2xl transition-transform duration-[8000ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(${displayPrizes.map((_, idx) => {
                const startAngle = (idx * segmentAngle);
                const endAngle = ((idx + 1) * segmentAngle);
                const color = idx % 2 === 0 ? '#f59e0b' : '#ef4444'; // Orange and Red alternating
                return `${color} ${startAngle}deg ${endAngle}deg`;
              }).join(', ')})`,
              boxShadow: spinning ? '0 0 40px rgba(234, 179, 8, 0.8), inset 0 0 20px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.3)'
            }}
          >
            {/* Center circle - Enhanced */}
            <div className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-inner ${spinning ? 'animate-pulse' : ''}`}>
              <Gift className={`mx-auto h-full w-full p-3 text-white drop-shadow-md ${spinning ? 'animate-spin-slow' : ''}`} />
            </div>

            {/* Prize labels on wheel */}
            {displayPrizes.map((prize, idx) => {
              const angle = (idx * segmentAngle) + (segmentAngle / 2);
              const radius = 100; // Distance from center
              const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
              const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
              
              return (
                <div
                  key={idx}
                  className="absolute left-1/2 top-1/2 text-white font-bold text-xs drop-shadow-md"
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg)`,
                    transformOrigin: 'center',
                    width: '80px',
                    textAlign: 'center',
                  }}
                >
                  <span className="block" style={{ transform: 'rotate(90deg)' }}>
                    {prize.name.length > 15 ? prize.name.substring(0, 15) + '...' : prize.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spinning indicator */}
        {spinning && (
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 animate-pulse">
            <p className="text-lg font-semibold text-primary">🎰 กำลังหมุน...</p>
          </div>
        )}
      </div>

      {/* Result Display with Claim Button */}
      {result && !claimed && showClaim && (
        <div className="pirate-card mx-auto max-w-xl px-6 py-8 animate-in fade-in-50 zoom-in-90 space-y-6 relative overflow-hidden">
          {/* Celebration Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '0s'}} />
            <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-red-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}} />
            <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}} />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}} />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Gift className="h-10 w-10 text-accent animate-bounce" />
            <h3 className="text-3xl font-bold text-primary">ยินดีด้วย! 🎉</h3>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg text-foreground/80">คุณได้รับรางวัล</p>
            <p className="text-5xl font-black text-transparent bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text animate-gradient">{result}</p>
          </div>
          
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
            <p className="text-sm text-amber-900 font-semibold mb-2">⚠️ สำคัญ!</p>
            <p className="text-sm text-amber-800">กดปุ่ม "รับรางวัล" ด้านล่าง แล้วนำหน้าจอนี้ไปแสดงที่จุดรับรางวัล</p>
          </div>

          <Button
            size="lg"
            className="w-full py-6 text-xl font-bold shadow-2xl shadow-accent/50 bg-gradient-to-r from-accent via-primary to-secondary hover:scale-105 transition-all animate-pulse-slow"
            onClick={() => setClaimed(true)}
          >
            <Gift className="h-6 w-6 mr-2" />
            รับรางวัล
          </Button>
        </div>
      )}

      {/* After Claimed - Show QR/Code for Verification */}
      {claimed && result && (
        <div className="pirate-card mx-auto max-w-xl px-6 py-8 animate-in fade-in-50 zoom-in-90 space-y-6 border-4 border-green-500">
          <div className="flex items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
              <Gift className="h-10 w-10 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-green-600">✅ พร้อมรับรางวัล</h3>
            <p className="text-4xl font-black text-primary">{result}</p>
          </div>
          
          <div className="rounded-xl border-2 border-green-400 bg-green-50 p-6 space-y-4">
            <p className="text-lg font-semibold text-green-900">📍 นำหน้าจอนี้ไปแสดงที่จุดรับรางวัล</p>
            <div className="bg-white rounded-lg p-4 border-2 border-green-300">
              <p className="text-sm text-gray-600 mb-2">รหัสรับรางวัล:</p>
              <p className="text-3xl font-mono font-bold text-green-600 tracking-wider">
                {Math.random().toString(36).substring(2, 8).toUpperCase()}
              </p>
            </div>
            <p className="text-sm text-green-700">
              💡 เจ้าหน้าที่จะตรวจสอบและมอบรางวัลให้คุณ
            </p>
          </div>
        </div>
      )}

      {/* Spin Button - Enhanced */}
      {!result && !disabled && prizes.length > 0 && (
        <div className="relative">
          {!spinning && (
            <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-primary/30 to-secondary/30 rounded-full blur-xl animate-pulse" />
          )}
          <Button
            size="lg"
            className="relative px-12 py-6 text-xl font-bold shadow-2xl shadow-accent/40 hover:shadow-2xl hover:scale-110 transition-all bg-gradient-to-r from-accent via-primary to-secondary animate-gradient"
            onClick={handleSpin}
            disabled={spinning}
          >
            {spinning ? (
              <>
                <div className="inline-block mr-2 h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent" />
                กำลังหมุน...
              </>
            ) : (
              <>
                <span className="text-3xl mr-2 animate-bounce inline-block">🎰</span>
                หมุนวงล้อสมบัติ
              </>
            )}
          </Button>
        </div>
      )}

      {disabled && !result && (
        <p className="text-sm text-foreground/70">
          สะสมคะแนนให้ครบก่อน จึงจะสามารถหมุนวงล้อสมบัติได้
        </p>
      )}

      {prizes.length === 0 && (
        <div className="pirate-card mx-auto max-w-xl px-6 py-4">
          <p className="text-foreground/70">😔 ขออภัย รางวัลหมดแล้วทั้งหมด</p>
          <p className="text-sm text-foreground/60 mt-2">กรุณาติดต่อทีมงานเพื่อเพิ่มรางวัล</p>
        </div>
      )}

      {/* Prizes List with Stock */}
      {prizes.length > 0 && (
        <div className="pirate-card mx-auto max-w-xl px-4 py-4">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60 flex items-center justify-center gap-2">
            <Package className="h-4 w-4" />
            รางวัลที่มีในวงล้อ
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {prizes.map((prize) => (
              <div
                key={prize.name}
                className="rounded-xl border border-rope/40 bg-white/70 px-4 py-3 text-sm text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-primary">{prize.name}</span>
                  <span className="flex-shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
                    {prize.stock} ชิ้น
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  );
};
