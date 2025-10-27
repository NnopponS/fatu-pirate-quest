import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PirateCharacterProps {
  messages?: string[];
  autoPlay?: boolean;
  interval?: number;
  onChatbotOpen?: () => void;
}

const defaultMessages = [
  "ฮาฮอย! ยินดีต้อนรับสู่การผจญภัย! 🏴‍☠️",
  "เจ้าพร้อมล่าสมบัติหรือยัง? 💎",
  "อย่าลืมเช็กอินทุกจุดนะ! ⚓",
  "สะสมคะแนนให้ครบ แล้วหมุนวงล้อ! 🎰",
  "ผจญภัยอย่างปลอดภัยนะ! 🗺️",
];

export const PirateCharacter = ({ 
  messages = defaultMessages, 
  autoPlay = true,
  interval = 5000,
  onChatbotOpen
}: PirateCharacterProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isHidden, setIsHidden] = useState(false); // ✅ Track scroll visibility

  // ✅ Hide character when scrolling
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsHidden(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsHidden(false);
      }, 1000); // Show again after 1 second of no scrolling
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (!autoPlay || messages.length === 0) return;

    const timer = setInterval(() => {
      setIsVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
        
        // ✅ Hide message after 2 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 2000);
      }, 500);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, messages.length]);

  if (messages.length === 0) return null;

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50 max-w-xs"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: isHidden ? 0 : 1, x: isHidden ? 100 : 0 }} // ✅ Hide when scrolling
      transition={{ duration: 0.3 }}
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
              className="absolute bottom-full right-0 mb-2 max-w-[200px]" // ✅ Smaller max-width
            >
              <div className="relative rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100 px-3 py-2 shadow-xl"> {/* ✅ Smaller padding */}
                <p className="text-xs font-semibold text-amber-900"> {/* ✅ Smaller text */}
                  {messages[currentMessageIndex]}
                </p>
                
                {/* Triangle pointer */}
                <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b-2 border-r-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pirate Character */}
        <motion.div
          className="relative cursor-pointer"
          onClick={onChatbotOpen}
          animate={{
            y: [0, -8, 0], // ✅ Smaller bounce
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/30 blur-xl animate-pulse" /> {/* ✅ Smaller blur */}
            
            {/* Character - ✅ Smaller size */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-3 border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 shadow-xl">
              <motion.div
                className="text-3xl" // ✅ Smaller emoji
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
              className="absolute -top-0.5 -right-0.5 text-lg" // ✅ Smaller sparkle
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

