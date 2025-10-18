import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

interface PrizeItem {
  name: string;
}

interface SpinWheelProps {
  onSpin: () => Promise<string>;
  disabled: boolean;
  prizes: PrizeItem[];
}

export const SpinWheel = ({ onSpin, disabled, prizes }: SpinWheelProps) => {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSpin = async () => {
    if (disabled || spinning) return;

    setSpinning(true);
    setResult(null);

    try {
      const prize = await onSpin();
      setTimeout(() => {
        setResult(prize);
        setSpinning(false);
      }, 2800);
    } catch {
      setSpinning(false);
    }
  };

  const displayPrizes =
    prizes.length > 0 ? prizes : [{ name: "ยังไม่มีการตั้งค่ารางวัล โปรดลองใหม่อีกครั้ง" }];

  return (
    <div className="text-center space-y-8">
      <div className="relative mx-auto h-56 w-56">
        <div
          className={`absolute inset-0 rounded-full border-[10px] border-accent/60 bg-gradient-to-br from-accent/40 via-accent/20 to-transparent transition-transform duration-[2600ms] ease-out ${
            spinning ? "animate-spin-slow" : ""
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-36 w-36 rounded-full border-4 border-accent/60 bg-white/80 backdrop-blur-sm shadow-inner">
            <Gift className="mx-auto h-full w-full p-6 text-accent" />
          </div>
        </div>
      </div>

      {result && (
        <div className="pirate-card mx-auto max-w-xl px-6 py-6 animate-in fade-in-50 zoom-in-90 space-y-2">
          <h3 className="text-2xl font-semibold text-primary">สมบัติที่ได้</h3>
          <p className="text-3xl font-bold text-accent">{result}</p>
        </div>
      )}

      {!result && !disabled && (
        <Button
          size="lg"
          className="px-12 py-6 text-lg shadow-lg shadow-accent/40"
          onClick={handleSpin}
          disabled={spinning}
        >
          {spinning ? "กำลังหมุน..." : "หมุนวงล้อสมบัติ"}
        </Button>
      )}

      {disabled && !result && (
        <p className="text-sm text-foreground/70">
          สะสมคะแนนให้ครบก่อน จึงจะสามารถหมุนวงล้อสมบัติได้
        </p>
      )}

      <div className="pirate-card mx-auto max-w-xl px-4 py-4">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/60">
          รางวัลที่ซ่อนอยู่ในวงล้อ
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {displayPrizes.map((prize) => (
            <div
              key={prize.name}
              className="rounded-xl border border-rope/40 bg-white/70 px-4 py-3 text-sm text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              {prize.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
