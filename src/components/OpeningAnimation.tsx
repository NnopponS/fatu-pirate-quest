import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ShipWheel } from "lucide-react";

interface OpeningAnimationProps {
  onComplete: () => void;
}

export const OpeningAnimation = ({ onComplete }: OpeningAnimationProps) => {
  const [phase, setPhase] = useState<"waves" | "ship" | "pirate" | "welcome" | "complete">("waves");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) return;

    const timers = [
      setTimeout(() => setPhase("ship"), 2000),      // 2s: Show ship
      setTimeout(() => setPhase("pirate"), 4000),    // 4s: Show pirate
      setTimeout(() => setPhase("welcome"), 6000),   // 6s: Show welcome message
      setTimeout(() => setPhase("complete"), 10000), // 10s: Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, [skipped]);

  useEffect(() => {
    if (phase === "complete" || skipped) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [phase, skipped, onComplete]);

  const handleSkip = () => {
    setSkipped(true);
    onComplete();
  };

  if (skipped || phase === "complete") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-blue-500">
      {/* Skip Button */}
      <Button
        onClick={handleSkip}
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 z-50 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white gap-2 animate-in fade-in"
      >
        <X className="h-4 w-4" />
        ข้ามแอนิเมชัน
      </Button>

      {/* Ocean Waves - Bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Wave 1 - Front */}
        <div
          className="absolute bottom-0 w-[200%] h-32 bg-gradient-to-t from-blue-600 to-blue-400 opacity-90 animate-wave-1"
          style={{
            clipPath: "polygon(0 50%, 10% 40%, 20% 50%, 30% 45%, 40% 50%, 50% 40%, 60% 50%, 70% 45%, 80% 50%, 90% 40%, 100% 50%, 100% 100%, 0 100%)",
            animation: "wave1 8s linear infinite",
          }}
        />
        
        {/* Wave 2 - Middle */}
        <div
          className="absolute bottom-0 w-[200%] h-24 bg-gradient-to-t from-blue-500 to-blue-300 opacity-70"
          style={{
            clipPath: "polygon(0 60%, 10% 50%, 20% 60%, 30% 55%, 40% 60%, 50% 50%, 60% 60%, 70% 55%, 80% 60%, 90% 50%, 100% 60%, 100% 100%, 0 100%)",
            animation: "wave2 6s linear infinite",
          }}
        />
        
        {/* Wave 3 - Back */}
        <div
          className="absolute bottom-0 w-[200%] h-20 bg-gradient-to-t from-blue-400 to-blue-200 opacity-50"
          style={{
            clipPath: "polygon(0 70%, 10% 65%, 20% 70%, 30% 68%, 40% 70%, 50% 65%, 60% 70%, 70% 68%, 80% 70%, 90% 65%, 100% 70%, 100% 100%, 0 100%)",
            animation: "wave3 10s linear infinite",
          }}
        />
      </div>

      {/* Ship Animation */}
      {(phase === "ship" || phase === "pirate" || phase === "welcome") && (
        <div
          className="absolute left-0 top-1/3 animate-in slide-in-from-left duration-2000"
          style={{
            animation: "shipSail 8s ease-in-out forwards",
          }}
        >
          <div className="relative">
            {/* Ship Body */}
            <div className="w-32 h-20 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-3xl border-4 border-amber-950 shadow-2xl">
              {/* Ship Deck */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-amber-700 rounded-t-lg" />
              
              {/* Windows */}
              <div className="absolute top-6 left-4 w-6 h-6 bg-yellow-300 rounded-full border-2 border-amber-950 opacity-80" />
              <div className="absolute top-6 right-4 w-6 h-6 bg-yellow-300 rounded-full border-2 border-amber-950 opacity-80" />
              
              {/* Ship Bottom Wave Effect */}
              <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white/30 rounded-full blur-sm" />
            </div>

            {/* Mast */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-20 w-2 h-24 bg-amber-950" />

            {/* Sail */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-16 w-16 h-14 bg-gradient-to-br from-gray-100 to-gray-300 border-2 border-gray-400 shadow-lg"
              style={{
                clipPath: "polygon(0 0, 100% 10%, 90% 100%, 10% 100%)",
              }}
            >
              {/* Skull and Crossbones */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">
                ☠️
              </div>
            </div>

            {/* Flag */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-20 w-8 h-6 bg-black animate-wave-flag"
              style={{
                transformOrigin: "left center",
              }}
            >
              <span className="absolute top-0 left-1 text-white text-xs">🏴‍☠️</span>
            </div>
          </div>
        </div>
      )}

      {/* Pirate Character */}
      {(phase === "pirate" || phase === "welcome") && (
        <div className="absolute right-10 top-1/4 animate-in slide-in-from-right duration-1000">
          <div className="relative">
            {/* Pirate Character */}
            <div className="text-9xl animate-wave-hand">🏴‍☠️</div>
            
            {/* Speech Bubble */}
            <div className="absolute -top-20 -left-32 bg-white rounded-2xl px-6 py-3 shadow-xl border-2 border-primary animate-in zoom-in duration-500">
              <p className="text-xl font-bold text-primary whitespace-nowrap">
                อาฮอย! ลูกเรือ! ⚓
              </p>
              {/* Bubble Tail */}
              <div className="absolute bottom-0 right-8 translate-y-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white" />
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message */}
      {phase === "welcome" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-in zoom-in duration-1000 space-y-6">
            <div className="relative">
              {/* Treasure Chest */}
              <div className="text-8xl mb-4 animate-bounce">💰</div>
              
              <h1 className="text-6xl md:text-7xl font-bold text-white drop-shadow-2xl animate-in slide-in-from-bottom duration-500">
                ยินดีต้อนรับสู่
              </h1>
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl animate-in slide-in-from-bottom duration-700">
                🏴‍☠️ FATU Treasure Quest ⚓
              </h2>
              <p className="text-2xl md:text-3xl text-white font-semibold mt-4 drop-shadow-lg animate-in slide-in-from-bottom duration-1000">
                Pirates of The FATUnian
              </p>

              {/* Decorative Elements */}
              <div className="absolute -top-4 left-1/4 text-4xl animate-spin-slow">⭐</div>
              <div className="absolute -top-8 right-1/4 text-5xl animate-ping">✨</div>
              <div className="absolute -bottom-4 left-1/3 text-3xl animate-bounce">🎯</div>
              <div className="absolute -bottom-6 right-1/3 text-4xl animate-pulse">🎁</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Treasures */}
      <div className="absolute top-10 left-10 text-4xl animate-float-slow">💎</div>
      <div className="absolute top-20 right-20 text-5xl animate-float-medium">⚓</div>
      <div className="absolute bottom-40 left-1/4 text-3xl animate-float-fast">🏴‍☠️</div>
      <div className="absolute bottom-60 right-1/3 text-4xl animate-float-slow">🎁</div>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {["waves", "ship", "pirate", "welcome"].map((p, i) => (
          <div
            key={p}
            className={`h-2 w-16 rounded-full transition-all duration-500 ${
              phase === p || (i < ["waves", "ship", "pirate", "welcome"].indexOf(phase))
                ? "bg-white"
                : "bg-white/30"
            }`}
          />
        ))}
      </div>

      {/* Custom CSS for Animations */}
      <style>{`
        @keyframes wave1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes wave2 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes wave3 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes shipSail {
          0% { transform: translateX(-200px); }
          50% { transform: translateX(45vw); }
          100% { transform: translateX(45vw); }
        }
        
        @keyframes wave-flag {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(10deg); }
        }
        
        @keyframes wave-hand {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(90deg); }
        }
        
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-wave-flag {
          animation: wave-flag 1s ease-in-out infinite;
        }
        
        .animate-wave-hand {
          animation: wave-hand 2s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-float-medium {
          animation: float-medium 4s ease-in-out infinite;
        }
        
        .animate-float-fast {
          animation: float-fast 3s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

