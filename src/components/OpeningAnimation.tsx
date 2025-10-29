import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface OpeningAnimationProps {
  onComplete: () => void;
}

export const OpeningAnimation = ({ onComplete }: OpeningAnimationProps) => {
  const [phase, setPhase] = useState<"map" | "ship" | "pirate" | "bottle" | "treasure" | "complete">("map");
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (skipped) return;

    const timers = [
      setTimeout(() => setPhase("ship"), 1800),       // 1.8s: แผนที่ -> เรือ
      setTimeout(() => setPhase("pirate"), 4000),     // 4s: เรือ -> โจรสลัด
      setTimeout(() => setPhase("bottle"), 6500),     // 6.5s: โจรสลัด -> ขวด
      setTimeout(() => setPhase("treasure"), 8500),   // 8.5s: ขวด -> สมบัติ
      setTimeout(() => setPhase("complete"), 11500),  // 11.5s: จบ
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
    <motion.div 
      className="fixed inset-0 z-50 overflow-hidden bg-[#f4e4c1] relative"
      style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Skip Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          onClick={handleSkip}
          variant="ghost"
          size="sm"
          className="absolute top-6 right-6 z-50 bg-amber-800/80 backdrop-blur-sm hover:bg-amber-900 text-white gap-2 border-2 border-amber-600 shadow-xl"
        >
          <X className="h-4 w-4" />
          ข้าม
        </Button>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating coins */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`coin-${i}`}
            className="absolute text-4xl"
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: -50,
              rotate: 0 
            }}
            animate={{ 
              y: window.innerHeight + 50,
              rotate: 360 * (Math.random() > 0.5 ? 1 : -1)
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          >
            {i % 2 === 0 ? '🪙' : '💰'}
          </motion.div>
        ))}

        {/* Stars */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-3xl"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 30}%`
            }}
            animate={{
              scale: [1, 1.5, 1],
              rotate: [0, 180, 360],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex items-center justify-center min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          {/* Phase 1: Treasure Map Unfolding */}
          {phase === "map" && (
            <motion.div
              key="map"
              className="text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.div
                className="relative inline-block"
                animate={{ 
                  rotateY: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Map Paper */}
                <div className="relative">
                  <motion.div
                    className="text-[200px] drop-shadow-2xl"
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    🗺️
                  </motion.div>
                  
                  {/* Sparkles around map */}
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute text-5xl"
                      style={{
                        left: i % 2 === 0 ? '-20%' : '110%',
                        top: i < 2 ? '-10%' : '90%'
                      }}
                      animate={{
                        scale: [0, 1.5, 0],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                    >
                      ⭐
                    </motion.div>
                  ))}
                </div>

                <motion.h1 
                  className="mt-8 text-5xl font-black text-amber-900"
                  style={{ fontFamily: 'Pirata One, serif' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  การผจญภัยกำลังเริ่มต้น...
                </motion.h1>
              </motion.div>
            </motion.div>
          )}

          {/* Phase 2: Pirate Ship Sailing */}
          {phase === "ship" && (
            <motion.div
              key="ship"
              className="text-center"
              initial={{ x: -window.innerWidth }}
              animate={{ x: 0 }}
              exit={{ x: window.innerWidth, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <motion.div
                className="relative inline-block"
                animate={{
                  y: [0, -15, 0],
                  rotate: [-2, 2, -2]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Ship with all details */}
                <div className="relative scale-150">
                  {/* Ship emoji as base */}
                  <motion.div
                    className="text-[180px] drop-shadow-2xl"
                    animate={{
                      scale: [1, 1.02, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  >
                    ⛵
                  </motion.div>

                  {/* Pirate flag on top */}
                  <motion.div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl"
                    animate={{
                      rotate: [-5, 5, -5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity
                    }}
                  >
                    🏴‍☠️
                  </motion.div>

                  {/* Water splash */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-3xl"
                      style={{
                        left: `${20 + i * 15}%`,
                        bottom: '-20%'
                      }}
                      animate={{
                        y: [0, -30, -60],
                        x: [(i - 2) * 5, (i - 2) * 10],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.3]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    >
                      💦
                    </motion.div>
                  ))}

                  {/* Seagulls */}
                  {[0, 1].map((i) => (
                    <motion.div
                      key={`seagull-${i}`}
                      className="absolute text-4xl"
                      style={{
                        left: i === 0 ? '-30%' : '120%',
                        top: '-40%'
                      }}
                      animate={{
                        x: [0, (i === 0 ? 1 : -1) * 100],
                        y: [0, -20, -10, -30, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 2
                      }}
                    >
                      🦅
                    </motion.div>
                  ))}

                  {/* Treasure chest on deck */}
                  <motion.div
                    className="absolute top-1/3 left-1/2 -translate-x-1/2 text-3xl"
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity
                    }}
                  >
                    💰
                  </motion.div>
                </div>

                <motion.h1 
                  className="mt-12 text-5xl font-black text-amber-900"
                  style={{ fontFamily: 'Pirata One, serif' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  เรือโจรสลัดกำลังมา...
                </motion.h1>
              </motion.div>
            </motion.div>
          )}

          {/* Phase 3: Pirate Captain Greeting */}
          {phase === "pirate" && (
            <motion.div
              key="pirate"
              className="text-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
            >
              <motion.div className="relative inline-block">
                {/* Pirate Captain */}
                <motion.div
                  className="text-[200px] drop-shadow-2xl"
                  animate={{
                    rotate: [-5, 5, -5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  🏴‍☠️
                </motion.div>

                {/* Speech bubble with "อาฮอย!" */}
                <motion.div
                  className="absolute -top-20 -left-40 bg-white rounded-3xl px-8 py-4 shadow-2xl border-4 border-amber-700"
                  initial={{ scale: 0, x: -50 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                >
                  <motion.p 
                    className="text-5xl font-black text-amber-900 whitespace-nowrap"
                    style={{ fontFamily: 'Pirata One, serif' }}
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity
                    }}
                  >
                    อาฮอย! ⚓
                  </motion.p>
                  {/* Bubble tail */}
                  <div 
                    className="absolute bottom-0 right-12 translate-y-full w-0 h-0"
                    style={{
                      borderLeft: '20px solid transparent',
                      borderRight: '20px solid transparent',
                      borderTop: '20px solid white'
                    }}
                  />
                </motion.div>

                {/* Sparkles around pirate */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-5xl"
                    style={{
                      left: `${Math.cos((i / 6) * Math.PI * 2) * 120 + 50}%`,
                      top: `${Math.sin((i / 6) * Math.PI * 2) * 120 + 50}%`
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  >
                    ✨
                  </motion.div>
                ))}

                {/* Coins falling around */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={`coin-${i}`}
                    className="absolute text-4xl"
                    style={{
                      left: `${10 + i * 10}%`,
                      top: '-10%'
                    }}
                    animate={{
                      y: [0, 200],
                      rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  >
                    🪙
                  </motion.div>
                ))}
              </motion.div>

              <motion.h1 
                className="mt-12 text-5xl font-black text-amber-900"
                style={{ fontFamily: 'Pirata One, serif' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                กัปตันฟาตูต้อนรับเจ้า!
              </motion.h1>
            </motion.div>
          )}

          {/* Phase 4: Message in Bottle */}
          {phase === "bottle" && (
            <motion.div
              key="bottle"
              className="text-center"
              initial={{ x: -window.innerWidth, rotate: -720 }}
              animate={{ x: 0, rotate: 0 }}
              exit={{ x: window.innerWidth, rotate: 720, opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.div
                className="relative inline-block"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {/* Bottle with glow */}
                <div className="relative">
                  <motion.div
                    className="text-[200px] drop-shadow-2xl"
                    animate={{
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity
                    }}
                  >
                    🍾
                  </motion.div>
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-amber-400 rounded-full blur-3xl"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                  />

                  {/* Bubbles */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-3xl"
                      style={{
                        left: `${20 + i * 15}%`,
                        bottom: '10%'
                      }}
                      animate={{
                        y: [-50, -150],
                        x: [(i - 2) * 10, (i - 2) * -10],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    >
                      💧
                    </motion.div>
                  ))}
                </div>

                <motion.h1 
                  className="mt-8 text-5xl font-black text-amber-900"
                  style={{ fontFamily: 'Pirata One, serif' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  เปิดขวดสมบัติ...
                </motion.h1>
              </motion.div>
            </motion.div>
          )}

          {/* Phase 5: Treasure Reveal + Welcome */}
          {phase === "treasure" && (
            <motion.div
              key="treasure"
              className="text-center space-y-8"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {/* Treasure Chest */}
              <motion.div
                className="relative inline-block"
                animate={{
                  y: [0, -15, 0],
                  rotateY: [0, 360]
                }}
                transition={{
                  y: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  rotateY: {
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }
                }}
              >
                <div className="text-[180px] drop-shadow-2xl">
                  💎
                </div>

                {/* Explosion of coins */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-4xl"
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                    initial={{ x: 0, y: 0, scale: 0 }}
                    animate={{
                      x: Math.cos((i / 12) * Math.PI * 2) * 150,
                      y: Math.sin((i / 12) * Math.PI * 2) * 150,
                      scale: [0, 1.5, 1],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "easeOut"
                    }}
                  >
                    🪙
                  </motion.div>
                ))}

                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    scale: [0.8, 1.5, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>

              {/* Welcome Text */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-4"
              >
                <motion.h1 
                  className="text-6xl md:text-7xl font-black text-amber-900"
                  style={{ fontFamily: 'Pirata One, serif' }}
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(217, 119, 6, 0.5)',
                      '0 0 40px rgba(217, 119, 6, 0.8)',
                      '0 0 20px rgba(217, 119, 6, 0.5)'
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  ยินดีต้อนรับ!
                </motion.h1>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                >
                  <h2 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                    FATU Treasure Quest
                  </h2>
                </motion.div>

                <motion.div
                  className="flex items-center justify-center gap-3 text-5xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <motion.span
                    animate={{ rotate: [0, 20, -20, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🏴‍☠️
                  </motion.span>
                  <motion.span
                    animate={{ rotate: [0, -15, 15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    ⚓
                  </motion.span>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    💰
                  </motion.span>
                </motion.div>

                <motion.p
                  className="text-2xl font-bold text-amber-800"
                  style={{ fontFamily: 'Pirata One, serif' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  Pirates of The FATUnian
                </motion.p>
              </motion.div>

              {/* Particle effects */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`
                    }}
                    animate={{
                      y: [0, -100, -200],
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {["map", "ship", "pirate", "bottle", "treasure"].map((p, i) => {
          const currentIndex = ["map", "ship", "pirate", "bottle", "treasure"].indexOf(phase);
          const isActive = i <= currentIndex;
          return (
            <motion.div
              key={p}
              className={`h-3 rounded-full transition-all duration-500 ${
                isActive 
                  ? "w-16 bg-amber-700 shadow-lg" 
                  : "w-8 bg-amber-300"
              }`}
              animate={{
                scale: isActive ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 0.5,
                repeat: isActive ? Infinity : 0
              }}
            />
          );
        })}
      </motion.div>

      {/* Compass decoration */}
      <motion.div
        className="absolute top-10 left-10 text-6xl"
        animate={{ rotate: 360 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        🧭
      </motion.div>

      {/* Anchor decoration */}
      <motion.div
        className="absolute bottom-20 right-10 text-5xl"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity
        }}
      >
        ⚓
      </motion.div>
    </motion.div>
  );
};
