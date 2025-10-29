import { motion } from "framer-motion";
import { ReactNode, useEffect } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  // Scroll to top เมื่อเปลี่ยนหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.2,
        ease: "easeInOut"
      }}
      style={{ width: '100%', minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
};

// Loading component สำหรับ Suspense fallback
export const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
    {/* Parchment background */}
    <div 
      className="absolute inset-0 bg-[#f4e4c1]"
      style={{
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: '50px 50px'
      }}
    />
    
    {/* Animated elements */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Floating treasure coins */}
      <motion.div
        className="absolute top-1/4 left-1/4 text-6xl"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        💰
      </motion.div>
      
      <motion.div
        className="absolute top-1/3 right-1/4 text-5xl"
        animate={{
          y: [0, 15, 0],
          rotate: [0, -360],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        ⚓
      </motion.div>
      
      <motion.div
        className="absolute bottom-1/4 left-1/3 text-5xl"
        animate={{
          y: [0, -15, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        🗺️
      </motion.div>
    </div>

    {/* Main content */}
    <div className="relative z-10 text-center space-y-6">
      {/* Treasure chest animation */}
      <motion.div
        className="text-8xl mx-auto"
        animate={{
          scale: [1, 1.1, 1],
          rotateY: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        🏴‍☠️
      </motion.div>
      
      {/* Loading text with typewriter effect */}
      <div className="space-y-2">
        <motion.h2 
          className="text-3xl font-black text-amber-900"
          style={{ fontFamily: 'Pirata One, serif' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          กำลังเตรียมการผจญภัย...
        </motion.h2>
        
        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-amber-600 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Compass spinning */}
      <motion.div
        className="text-4xl"
        animate={{ rotate: 360 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        🧭
      </motion.div>
    </div>
  </div>
);

