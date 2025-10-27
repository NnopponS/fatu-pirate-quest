import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface OpeningAnimationProps {
  onComplete: () => void;
}

export const OpeningAnimation = ({ onComplete }: OpeningAnimationProps) => {
  const [phase, setPhase] = useState<"waves" | "ship" | "ship-out" | "pirate" | "pirate-out" | "welcome" | "complete">("waves");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) return;

    const timers = [
      setTimeout(() => setPhase("ship"), 1500),        // 1.5s: Show ship
      setTimeout(() => setPhase("ship-out"), 3500),    // 3.5s: Ship fades out
      setTimeout(() => setPhase("pirate"), 4000),      // 4s: Show pirate
      setTimeout(() => setPhase("pirate-out"), 6000),  // 6s: Pirate fades out  
      setTimeout(() => setPhase("welcome"), 6500),     // 6.5s: Show welcome
      setTimeout(() => setPhase("complete"), 11000),   // 11s: Complete
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

      {/* Sun with rays */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-300 rounded-full shadow-2xl animate-pulse-slow">
        <div className="absolute inset-0 rounded-full bg-yellow-200 animate-ping opacity-20" />
        {/* Sun rays rotating */}
        <div className="absolute inset-0 animate-spin-slow">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-8 bg-yellow-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transformOrigin: 'center',
                transform: `rotate(${i * 45}deg) translate(-50%, -140%)`,
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Stars twinkling */}
      <div className="absolute top-5 left-5 text-2xl animate-twinkle-1">⭐</div>
      <div className="absolute top-20 left-[30%] text-xl animate-twinkle-2">✨</div>
      <div className="absolute top-10 right-[20%] text-2xl animate-twinkle-3">💫</div>

      {/* Clouds - More dynamic */}
      <div className="absolute top-20 left-10 w-32 h-12 bg-white/80 rounded-full blur-sm animate-float-cloud-1 shadow-lg" />
      <div className="absolute top-32 right-1/4 w-40 h-16 bg-white/70 rounded-full blur-sm animate-float-cloud-2 shadow-lg" />
      <div className="absolute top-16 left-1/3 w-24 h-10 bg-white/60 rounded-full blur-sm animate-float-cloud-3 shadow-lg" />
      <div className="absolute top-28 right-1/3 w-36 h-14 bg-white/75 rounded-full blur-sm animate-float-cloud-4 shadow-lg" />
      <div className="absolute top-40 left-1/4 w-28 h-10 bg-white/65 rounded-full blur-sm animate-float-cloud-5 shadow-lg" />

      {/* Ocean Waves - Always Visible */}
      <div className="absolute bottom-0 left-0 right-0">
        {/* Wave 1 - Front */}
        <div
          className="absolute bottom-0 w-[200%] h-40 bg-gradient-to-t from-blue-700 to-blue-500 opacity-90"
          style={{
            clipPath: "polygon(0 50%, 5% 45%, 10% 50%, 15% 45%, 20% 50%, 25% 40%, 30% 50%, 35% 45%, 40% 50%, 45% 40%, 50% 50%, 55% 45%, 60% 50%, 65% 45%, 70% 50%, 75% 40%, 80% 50%, 85% 45%, 90% 50%, 95% 45%, 100% 50%, 100% 100%, 0 100%)",
            animation: "wave1 12s linear infinite",
          }}
        />
        
        {/* Wave 2 - Middle */}
        <div
          className="absolute bottom-0 w-[200%] h-32 bg-gradient-to-t from-blue-600 to-blue-400 opacity-70"
          style={{
            clipPath: "polygon(0 60%, 5% 55%, 10% 60%, 15% 58%, 20% 60%, 25% 50%, 30% 60%, 35% 55%, 40% 60%, 45% 52%, 50% 60%, 55% 55%, 60% 60%, 65% 58%, 70% 60%, 75% 50%, 80% 60%, 85% 55%, 90% 60%, 95% 58%, 100% 60%, 100% 100%, 0 100%)",
            animation: "wave2 8s linear infinite",
          }}
        />
        
        {/* Wave 3 - Back */}
        <div
          className="absolute bottom-0 w-[200%] h-24 bg-gradient-to-t from-blue-500 to-blue-300 opacity-50"
          style={{
            clipPath: "polygon(0 70%, 5% 68%, 10% 70%, 15% 69%, 20% 70%, 25% 65%, 30% 70%, 35% 68%, 40% 70%, 45% 67%, 50% 70%, 55% 68%, 60% 70%, 65% 69%, 70% 70%, 75% 65%, 80% 70%, 85% 68%, 90% 70%, 95% 69%, 100% 70%, 100% 100%, 0 100%)",
            animation: "wave3 15s linear infinite",
          }}
        />
      </div>

      {/* Seagulls - More birds flying */}
      <div className="absolute top-40 left-1/4 text-2xl animate-fly-bird-1">🦅</div>
      <div className="absolute top-60 right-1/3 text-xl animate-fly-bird-2">🦅</div>
      <div className="absolute top-32 right-1/2 text-2xl animate-fly-bird-3">🦅</div>
      
      {/* Dolphins jumping */}
      <div className="absolute bottom-32 left-[10%] text-4xl animate-dolphin-jump-1">🐬</div>
      <div className="absolute bottom-28 right-[15%] text-4xl animate-dolphin-jump-2">🐬</div>
      
      {/* Floating fish */}
      <div className="absolute bottom-40 left-[30%] text-2xl animate-fish-swim-1">🐟</div>
      <div className="absolute bottom-48 right-[40%] text-2xl animate-fish-swim-2">🐠</div>
      
      {/* Treasure coins falling during ship phase */}
      {(phase === "ship" || phase === "ship-out") && (
        <>
          <div className="absolute top-0 left-[20%] text-3xl animate-coin-fall-1">🪙</div>
          <div className="absolute top-0 left-[40%] text-3xl animate-coin-fall-2">💰</div>
          <div className="absolute top-0 right-[30%] text-3xl animate-coin-fall-3">🪙</div>
          <div className="absolute top-0 right-[10%] text-3xl animate-coin-fall-4">💎</div>
        </>
      )}

      {/* Ship Animation - Only show in ship phase */}
      {(phase === "ship" || phase === "ship-out") && (
        <div
          className={`absolute transition-all duration-1000 ${
            phase === "ship" 
              ? "left-[10%] opacity-100 animate-in slide-in-from-left-full duration-2000" 
              : "left-[120%] opacity-0"
          }`}
          style={{
            top: "calc(50% - 100px)",
          }}
        >
          <div className="relative scale-150">
            {/* Ship Body */}
            <div className="w-40 h-24 bg-gradient-to-b from-amber-800 to-amber-900 rounded-b-[50px] border-4 border-amber-950 shadow-2xl relative overflow-hidden animate-ship-rock">
              {/* Wood Texture */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-2 left-0 right-0 h-0.5 bg-amber-950" />
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-amber-950" />
                <div className="absolute top-10 left-0 right-0 h-0.5 bg-amber-950" />
              </div>
              
              {/* Ship Deck */}
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-lg border-b-2 border-amber-950" />
              
              {/* Cannons */}
              <div className="absolute top-8 left-2 w-3 h-8 bg-gray-800 rounded-full rotate-45" />
              <div className="absolute top-8 right-2 w-3 h-8 bg-gray-800 rounded-full rotate-45" />
              
              {/* Windows */}
              <div className="absolute top-10 left-6 w-8 h-8 bg-yellow-300 rounded-full border-2 border-amber-950 opacity-80 animate-pulse" />
              <div className="absolute top-10 right-6 w-8 h-8 bg-yellow-300 rounded-full border-2 border-amber-950 opacity-80 animate-pulse" />
              
              {/* Anchor */}
              <div className="absolute bottom-2 right-4 text-xs">⚓</div>
              
              {/* Ship Bottom Wave Effect */}
              <div className="absolute -bottom-3 left-0 right-0 h-6 bg-white/40 rounded-full blur-md animate-pulse" />
            </div>

            {/* Mast */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-32 w-3 h-36 bg-gradient-to-b from-amber-950 to-amber-900 shadow-lg" />

            {/* Main Sail */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-28 w-24 h-20 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 border-2 border-gray-400 shadow-2xl animate-sail-billow"
              style={{
                clipPath: "polygon(0 0, 100% 5%, 95% 100%, 5% 100%)",
              }}
            >
              {/* Skull and Crossbones - Larger */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl animate-pulse">
                ☠️
              </div>
            </div>

            {/* Secondary Sail */}
            <div className="absolute left-1/2 translate-x-4 -top-24 w-16 h-14 bg-gradient-to-br from-gray-200 to-gray-400 border-2 border-gray-500 shadow-xl opacity-80"
              style={{
                clipPath: "polygon(0 0, 100% 10%, 90% 100%, 10% 100%)",
              }}
            />

            {/* Pirate Flag */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-32 w-12 h-10 bg-black animate-wave-flag shadow-lg"
              style={{
                transformOrigin: "left center",
              }}
            >
              <span className="absolute top-1 left-2 text-white text-lg">🏴‍☠️</span>
            </div>

            {/* Rope Details */}
            <div className="absolute left-1/2 -top-28 w-0.5 h-24 bg-amber-900 rotate-45" />
            <div className="absolute left-1/2 -top-28 w-0.5 h-24 bg-amber-900 -rotate-45" />
          </div>

          {/* Water Splash Effect */}
          <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
            <div className="w-4 h-4 bg-white/60 rounded-full animate-splash-1" />
            <div className="w-6 h-6 bg-white/40 rounded-full animate-splash-2" />
            <div className="w-4 h-4 bg-white/60 rounded-full animate-splash-3" />
          </div>
        </div>
      )}

      {/* Pirate Character - Only show in pirate phase */}
      {(phase === "pirate" || phase === "pirate-out") && (
        <div className={`absolute transition-all duration-1000 ${
          phase === "pirate"
            ? "right-[10%] top-[30%] opacity-100 scale-100 animate-in slide-in-from-right-full duration-1500"
            : "right-[-20%] opacity-0 scale-50"
        }`}>
          <div className="relative">
            {/* Pirate Character - Larger */}
            <div className="text-[200px] animate-wave-hand drop-shadow-2xl">🏴‍☠️</div>
            
            {/* Sparkles around pirate */}
            <div className="absolute -top-10 -left-10 text-5xl animate-sparkle-1">✨</div>
            <div className="absolute -top-5 -right-10 text-4xl animate-sparkle-2">⭐</div>
            <div className="absolute -bottom-5 left-10 text-5xl animate-sparkle-3">💫</div>
            
            {/* Speech Bubble - Larger and more prominent */}
            <div className="absolute -top-32 -left-48 bg-white rounded-3xl px-8 py-4 shadow-2xl border-4 border-primary animate-in zoom-in duration-500">
              <p className="text-3xl font-bold text-primary whitespace-nowrap animate-text-glow">
                อาฮอย! ลูกเรือ! ⚓
              </p>
              {/* Bubble Tail */}
              <div className="absolute bottom-0 right-16 translate-y-1/2 w-0 h-0 border-l-12 border-l-transparent border-r-12 border-r-transparent border-t-16 border-t-white" 
                style={{
                  borderWidth: "16px 12px 0 12px"
                }}
              />
              <div className="absolute bottom-0 right-16 translate-y-1/2 w-0 h-0 border-l-10 border-l-transparent border-r-10 border-r-transparent border-t-14 border-t-primary -translate-y-1"
                style={{
                  borderWidth: "14px 10px 0 10px"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message - Only show in welcome phase */}
      {phase === "welcome" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-8 animate-in zoom-in duration-1000">
            <div className="relative">
              {/* Treasure Chest with glow */}
              <div className="relative inline-block">
                <div className="text-9xl animate-treasure-bounce drop-shadow-2xl">💰</div>
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-50 animate-pulse" />
              </div>
              
              {/* Main Title */}
              <h1 className="text-6xl md:text-8xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-in slide-in-from-bottom duration-500 mt-6">
                ยินดีต้อนรับสู่
              </h1>
              
              {/* FATU Title with gradient and effects */}
              <div className="relative mt-4">
                <h2 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl animate-in slide-in-from-bottom duration-700 animate-gradient-x">
                  🏴‍☠️ FATU Treasure Quest ⚓
                </h2>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 blur-2xl opacity-30 animate-pulse" />
              </div>
              
              {/* Subtitle */}
              <p className="text-3xl md:text-4xl text-white font-semibold mt-6 drop-shadow-lg animate-in slide-in-from-bottom duration-1000 animate-text-shimmer">
                Pirates of The FATUnian
              </p>

              {/* Decorative Elements with better positioning */}
              <div className="absolute top-0 left-[15%] text-5xl animate-spin-slow-reverse">⭐</div>
              <div className="absolute top-0 right-[15%] text-6xl animate-ping-slow">✨</div>
              <div className="absolute -bottom-8 left-[25%] text-4xl animate-bounce-slow">🎯</div>
              <div className="absolute -bottom-10 right-[25%] text-5xl animate-pulse-slow">🎁</div>
              <div className="absolute top-20 left-[5%] text-4xl animate-float-diagonal-1">💎</div>
              <div className="absolute top-20 right-[5%] text-4xl animate-float-diagonal-2">🏆</div>
            </div>

            {/* Particle Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {["waves", "ship", "pirate", "welcome"].map((p, i) => {
          const currentIndex = ["waves", "ship", "ship-out", "pirate", "pirate-out", "welcome"].indexOf(phase);
          const isActive = i <= Math.floor(currentIndex / 2);
          return (
            <div
              key={p}
              className={`h-3 rounded-full transition-all duration-500 ${
                isActive ? "w-20 bg-white shadow-lg" : "w-12 bg-white/30"
              }`}
            />
          );
        })}
      </div>

      {/* Enhanced CSS Animations */}
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
        
        @keyframes wave-flag {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(15deg); }
        }
        
        @keyframes wave-hand {
          0%, 100% { transform: rotate(-10deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.05); }
        }
        
        @keyframes treasure-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-20px) rotate(-5deg) scale(1.1); }
          75% { transform: translateY(-10px) rotate(5deg) scale(1.05); }
        }
        
        @keyframes splash-1 {
          0% { transform: translateY(0) scale(0); opacity: 1; }
          100% { transform: translateY(-40px) scale(2); opacity: 0; }
        }
        
        @keyframes splash-2 {
          0% { transform: translateY(0) scale(0); opacity: 1; }
          100% { transform: translateY(-50px) scale(2.5); opacity: 0; }
        }
        
        @keyframes splash-3 {
          0% { transform: translateY(0) scale(0); opacity: 1; }
          100% { transform: translateY(-35px) scale(1.8); opacity: 0; }
        }
        
        @keyframes sparkle-1 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
        }
        
        @keyframes sparkle-2 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(-180deg); opacity: 1; }
        }
        
        @keyframes sparkle-3 {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.4) rotate(90deg); opacity: 1; }
        }
        
        @keyframes float-cloud-1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(30px); }
        }
        
        @keyframes float-cloud-2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-40px); }
        }
        
        @keyframes float-cloud-3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        
        @keyframes fly-bird-1 {
          0% { transform: translateX(-100px) translateY(0); }
          100% { transform: translateX(100vw) translateY(-50px); }
        }
        
        @keyframes fly-bird-2 {
          0% { transform: translateX(-150px) translateY(0); }
          100% { transform: translateX(100vw) translateY(-30px); }
        }
        
        @keyframes fly-bird-3 {
          0% { transform: translateX(-200px) translateY(0) scale(1); }
          50% { transform: translateX(50vw) translateY(-40px) scale(1.2); }
          100% { transform: translateX(100vw) translateY(-20px) scale(1); }
        }
        
        @keyframes dolphin-jump-1 {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(-120px) rotate(360deg); }
        }
        
        @keyframes dolphin-jump-2 {
          0%, 100% { transform: translateY(0) rotate(0deg) scaleX(1); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(-100px) rotate(-360deg) scaleX(-1); }
        }
        
        @keyframes fish-swim-1 {
          0%, 100% { transform: translateX(0) translateY(0) scaleX(1); }
          50% { transform: translateX(100px) translateY(-20px) scaleX(-1); }
        }
        
        @keyframes fish-swim-2 {
          0%, 100% { transform: translateX(0) translateY(0) scaleX(-1); }
          50% { transform: translateX(-80px) translateY(20px) scaleX(1); }
        }
        
        @keyframes coin-fall-1 {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        @keyframes coin-fall-2 {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(-720deg) scale(1.5); opacity: 0; }
        }
        
        @keyframes coin-fall-3 {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        
        @keyframes coin-fall-4 {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(100vh) rotate(-540deg) scale(0.8); opacity: 0; }
        }
        
        @keyframes twinkle-1 {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
        }
        
        @keyframes twinkle-2 {
          0%, 100% { transform: scale(0.8) rotate(0deg); opacity: 0.3; }
          50% { transform: scale(1.3) rotate(-180deg); opacity: 1; }
        }
        
        @keyframes twinkle-3 {
          0%, 100% { transform: scale(1.2) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.8) rotate(360deg); opacity: 1; }
        }
        
        @keyframes float-cloud-4 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(-50px) translateY(10px); }
        }
        
        @keyframes float-cloud-5 {
          0%, 100% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(40px) translateY(-10px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes ship-rock {
          0%, 100% { transform: rotate(-2deg) translateY(0); }
          50% { transform: rotate(2deg) translateY(-5px); }
        }
        
        @keyframes sail-billow {
          0%, 100% { transform: translateX(-50%) scaleX(1); }
          50% { transform: translateX(-50%) scaleX(1.05); }
        }
        
        @keyframes float-diagonal-1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -20px) rotate(180deg); }
        }
        
        @keyframes float-diagonal-2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-20px, -20px) rotate(-180deg); }
        }
        
        @keyframes particle {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(0); opacity: 0; }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes text-glow {
          0%, 100% { text-shadow: 0 0 10px rgba(var(--primary), 0.5); }
          50% { text-shadow: 0 0 20px rgba(var(--primary), 1); }
        }
        
        @keyframes text-shimmer {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes ping-slow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        .animate-wave-flag {
          animation: wave-flag 1.5s ease-in-out infinite;
        }
        
        .animate-wave-hand {
          animation: wave-hand 2s ease-in-out infinite;
        }
        
        .animate-treasure-bounce {
          animation: treasure-bounce 2s ease-in-out infinite;
        }
        
        .animate-splash-1 {
          animation: splash-1 1s ease-out infinite;
        }
        
        .animate-splash-2 {
          animation: splash-2 1.2s ease-out infinite 0.2s;
        }
        
        .animate-splash-3 {
          animation: splash-3 1s ease-out infinite 0.4s;
        }
        
        .animate-sparkle-1 {
          animation: sparkle-1 2s ease-in-out infinite;
        }
        
        .animate-sparkle-2 {
          animation: sparkle-2 2s ease-in-out infinite 0.3s;
        }
        
        .animate-sparkle-3 {
          animation: sparkle-3 2s ease-in-out infinite 0.6s;
        }
        
        .animate-float-cloud-1 {
          animation: float-cloud-1 8s ease-in-out infinite;
        }
        
        .animate-float-cloud-2 {
          animation: float-cloud-2 10s ease-in-out infinite;
        }
        
        .animate-float-cloud-3 {
          animation: float-cloud-3 7s ease-in-out infinite;
        }
        
        .animate-fly-bird-1 {
          animation: fly-bird-1 20s linear infinite;
        }
        
        .animate-fly-bird-2 {
          animation: fly-bird-2 25s linear infinite 5s;
        }
        
        .animate-float-diagonal-1 {
          animation: float-diagonal-1 4s ease-in-out infinite;
        }
        
        .animate-float-diagonal-2 {
          animation: float-diagonal-2 4s ease-in-out infinite 0.5s;
        }
        
        .animate-particle {
          animation: particle linear infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% auto;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-text-glow {
          animation: text-glow 2s ease-in-out infinite;
        }
        
        .animate-text-shimmer {
          animation: text-shimmer 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 8s linear infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-fly-bird-3 {
          animation: fly-bird-3 18s linear infinite 2s;
        }
        
        .animate-dolphin-jump-1 {
          animation: dolphin-jump-1 4s ease-in-out infinite;
        }
        
        .animate-dolphin-jump-2 {
          animation: dolphin-jump-2 5s ease-in-out infinite 1s;
        }
        
        .animate-fish-swim-1 {
          animation: fish-swim-1 6s ease-in-out infinite;
        }
        
        .animate-fish-swim-2 {
          animation: fish-swim-2 7s ease-in-out infinite 1s;
        }
        
        .animate-coin-fall-1 {
          animation: coin-fall-1 3s ease-in infinite;
        }
        
        .animate-coin-fall-2 {
          animation: coin-fall-2 3.5s ease-in infinite 0.5s;
        }
        
        .animate-coin-fall-3 {
          animation: coin-fall-3 4s ease-in infinite 1s;
        }
        
        .animate-coin-fall-4 {
          animation: coin-fall-4 3.2s ease-in infinite 1.5s;
        }
        
        .animate-twinkle-1 {
          animation: twinkle-1 2s ease-in-out infinite;
        }
        
        .animate-twinkle-2 {
          animation: twinkle-2 2.5s ease-in-out infinite 0.5s;
        }
        
        .animate-twinkle-3 {
          animation: twinkle-3 3s ease-in-out infinite 1s;
        }
        
        .animate-float-cloud-4 {
          animation: float-cloud-4 12s ease-in-out infinite;
        }
        
        .animate-float-cloud-5 {
          animation: float-cloud-5 9s ease-in-out infinite;
        }
        
        .animate-ship-rock {
          animation: ship-rock 3s ease-in-out infinite;
        }
        
        .animate-sail-billow {
          animation: sail-billow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
