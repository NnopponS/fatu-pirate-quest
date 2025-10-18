import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PRIZES } from "@/lib/constants";
import { Gift } from "lucide-react";

interface SpinWheelProps {
  onSpin: () => Promise<string>;
  disabled: boolean;
}

export const SpinWheel = ({ onSpin, disabled }: SpinWheelProps) => {
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
      }, 3000);
    } catch (error) {
      setSpinning(false);
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className={`inline-block p-12 rounded-full border-8 border-accent transition-transform duration-3000 ${
          spinning ? 'animate-spin' : ''
        }`}>
          <Gift className="w-32 h-32 text-accent" />
        </div>
      </div>

      {result && (
        <div className="mb-6 p-6 bg-accent/20 rounded-xl border-2 border-accent animate-in fade-in zoom-in">
          <h3 className="text-2xl font-bold text-accent mb-2">คุณได้รับ:</h3>
          <p className="text-3xl font-bold">{result}</p>
        </div>
      )}

      {!result && !disabled && (
        <Button
          size="lg"
          className="text-xl px-12 py-6"
          onClick={handleSpin}
          disabled={spinning || disabled}
        >
          {spinning ? '🎰 กำลังหมุน...' : '🎰 หมุนวงล้อ'}
        </Button>
      )}

      {disabled && !result && (
        <p className="text-muted-foreground">คุณหมุนวงล้อไปแล้ว</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 max-w-md mx-auto">
        {PRIZES.map((prize) => (
          <div key={prize.name} className="p-3 bg-card rounded-lg border text-sm">
            {prize.name}
          </div>
        ))}
      </div>
    </div>
  );
};
