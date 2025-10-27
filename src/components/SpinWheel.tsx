import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift, Package } from "lucide-react";

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

      // Show result after animation completes
      setTimeout(() => {
        setResult(prize);
        setSpinning(false);
      }, 6000); // ✅ Increased to 6 seconds for better effect
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
    <div className="text-center space-y-8">
      {/* Wheel Container */}
      <div className="relative mx-auto h-80 w-80">
        {/* Pointer/Arrow */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-2">
          <div className="h-0 w-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-lg" />
        </div>

        {/* Wheel */}
        <div className="relative h-full w-full">
          <div
            className="absolute inset-0 rounded-full border-8 border-yellow-600 shadow-2xl transition-transform duration-[6000ms] ease-out"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(${displayPrizes.map((_, idx) => {
                const startAngle = (idx * segmentAngle);
                const endAngle = ((idx + 1) * segmentAngle);
                const color = idx % 2 === 0 ? '#f59e0b' : '#ef4444'; // Orange and Red alternating
                return `${color} ${startAngle}deg ${endAngle}deg`;
              }).join(', ')})`,
            }}
          >
            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-inner">
              <Gift className="mx-auto h-full w-full p-3 text-white drop-shadow-md" />
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

      {/* Result Display */}
      {result && (
        <div className="pirate-card mx-auto max-w-xl px-6 py-8 animate-in fade-in-50 zoom-in-90 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Gift className="h-8 w-8 text-accent animate-bounce" />
            <h3 className="text-2xl font-semibold text-primary">ยินดีด้วย! คุณได้รับ</h3>
          </div>
          <p className="text-4xl font-bold text-accent">{result}</p>
          <p className="text-sm text-foreground/70">กรุณาติดต่อทีมงานเพื่อรับรางวัล</p>
        </div>
      )}

      {/* Spin Button */}
      {!result && !disabled && prizes.length > 0 && (
        <Button
          size="lg"
          className="px-12 py-6 text-lg shadow-lg shadow-accent/40 hover:shadow-xl hover:scale-105 transition-all"
          onClick={handleSpin}
          disabled={spinning}
        >
          {spinning ? "กำลังหมุน..." : "🎰 หมุนวงล้อสมบัติ"}
        </Button>
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
  );
};
