import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PirateCharacterProps {
  messages?: string[];
  autoPlay?: boolean;
  interval?: number;
}

const defaultMessages = [
  "อาร์ร์! ยินดีต้อนรับสู่การผจญภัย! 🏴‍☠️",
  "เจ้าพร้อมล่าสมบัติหรือยัง? 💎",
  "อย่าลืมเช็กอินทุกจุดนะ! ⚓",
  "สะสมคะแนนให้ครบ แล้วหมุนวงล้อ! 🎰",
  "ผจญภัยอย่างปลอดภัยนะ! 🗺️",
];

export const PirateCharacter = ({ 
  messages = defaultMessages, 
  autoPlay = true,
  interval = 5000 
}: PirateCharacterProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!autoPlay || messages.length === 0) return;

    const timer = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 500);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, messages.length]);

  if (messages.length === 0) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 max-w-xs"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
    >
      <div className="relative">
        {/* Speech Bubble */}
        <AnimatePresence mode="wait">
          {isVisible && (
            <motion.div
              key={currentMessageIndex}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-full right-0 mb-4 max-w-xs"
            >
              <div className="relative rounded-2xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 px-4 py-3 shadow-2xl">
                <p className="text-sm font-semibold text-amber-900">
                  {messages[currentMessageIndex]}
                </p>
                
                {/* Triangle pointer */}
                <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pirate Character */}
        <motion.div
          className="relative"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 blur-2xl animate-pulse" />
            
            {/* Character */}
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 shadow-2xl">
              <motion.div
                className="text-5xl"
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                🏴‍☠️
              </motion.div>
            </div>

            {/* Sparkles */}
            <motion.div
              className="absolute -top-1 -right-1 text-2xl"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ✨
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

