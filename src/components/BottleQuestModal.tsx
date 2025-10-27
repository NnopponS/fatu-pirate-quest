import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SubEvent {
  id: string;
  name: string;
  description?: string;
  time?: string;
  points_awarded?: number;
}

interface BottleQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  subEvents: SubEvent[];
  alreadyCheckedIn: boolean;
  completedSubEvents: string[];
}

export const BottleQuestModal = ({
  isOpen,
  onClose,
  locationName,
  subEvents,
  alreadyCheckedIn,
  completedSubEvents
}: BottleQuestModalProps) => {
  const [phase, setPhase] = useState<"water" | "bottle" | "opening" | "scroll">("water");

  useEffect(() => {
    if (isOpen) {
      setPhase("water");
      
      // Animation sequence
      setTimeout(() => setPhase("bottle"), 500);
      setTimeout(() => setPhase("opening"), 2000);
      setTimeout(() => setPhase("scroll"), 3000);
    } else {
      setPhase("water");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop with water effect */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 animate-in fade-in"
        onClick={onClose}
      >
        {/* Animated waves */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-32 bg-gradient-to-b from-blue-400/30 to-transparent rounded-full blur-xl"
              style={{
                bottom: `${i * 15}%`,
                animation: `wave ${3 + i}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            />
          ))}
        </div>

        {/* Bubbles */}
        {phase === "water" && [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/40 rounded-full animate-bubble"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      </Button>

      {/* Bottle floating */}
      {phase === "bottle" && (
        <div className="relative z-10 animate-in zoom-in fade-in duration-1000">
          <div className="text-9xl animate-float filter drop-shadow-2xl">
            🍾
          </div>
        </div>
      )}

      {/* Bottle opening and scroll appearing */}
      {(phase === "opening" || phase === "scroll") && (
        <div className="relative z-10 max-w-md sm:max-w-2xl md:max-w-3xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-auto">
          <div
            className={`relative bg-[#f4e4c1] rounded-xl sm:rounded-2xl shadow-2xl border-4 sm:border-6 md:border-8 border-[#8b7355] p-4 sm:p-6 md:p-10 ${
              phase === "scroll" ? "animate-in zoom-in-90 fade-in duration-700" : "scale-50 opacity-0"
            }`}
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent)
              `,
              backgroundSize: '50px 50px'
            }}
          >
            {/* Torn edges effect */}
            <div className="absolute -top-4 left-0 right-0 h-8 bg-[#f4e4c1] opacity-50" style={{
              clipPath: "polygon(0 50%, 5% 0, 10% 50%, 15% 20%, 20% 50%, 25% 10%, 30% 50%, 35% 30%, 40% 50%, 45% 20%, 50% 50%, 55% 10%, 60% 50%, 65% 30%, 70% 50%, 75% 20%, 80% 50%, 85% 10%, 90% 50%, 95% 30%, 100% 50%, 100% 100%, 0 100%)"
            }} />
            <div className="absolute -bottom-4 left-0 right-0 h-8 bg-[#f4e4c1] opacity-50" style={{
              clipPath: "polygon(0 0, 100% 0, 100% 50%, 95% 80%, 90% 50%, 85% 70%, 80% 50%, 75% 90%, 70% 50%, 65% 70%, 60% 50%, 55% 80%, 50% 50%, 45% 70%, 40% 50%, 35% 90%, 30% 50%, 25% 70%, 20% 50%, 15% 80%, 10% 50%, 5% 70%, 0 50%)"
            }} />

            {/* Wax seal */}
            <div className="absolute -top-4 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-700 border-2 sm:border-4 border-red-900 flex items-center justify-center shadow-xl animate-in zoom-in duration-500 delay-300">
              <div className="text-yellow-200 text-lg sm:text-2xl font-bold">🏴‍☠️</div>
            </div>

            {/* Content */}
            <div className="space-y-3 sm:space-y-4 md:space-y-6 text-[#3d2817]" style={{ fontFamily: 'Georgia, serif' }}>
              {/* Header */}
              <div className="text-center space-y-2 sm:space-y-3 border-b-2 border-[#8b7355]/30 pb-3 sm:pb-4 md:pb-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
                  ⚓ บันทึกภารกิจ ⚓
                </h1>
                <div className="text-lg sm:text-xl md:text-2xl font-semibold text-[#8b4513]">
                  {locationName}
                </div>
              </div>

              {/* Greeting in old pirate style */}
              <div className="p-3 sm:p-4 md:p-6 bg-[#e8d4a8] rounded-lg border-2 border-[#8b7355]/40 shadow-inner">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed italic">
                  ถึงท่านผู้กล้าหาญผู้มาเยือน,
                </p>
                <p className="mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
                  ข้าขอต้อนรับเจ้าสู่ <span className="font-bold text-[#8b4513]">{locationName}</span> เกาะแห่งหนึ่งในแผนที่สมบัติของข้า
                  {alreadyCheckedIn ? (
                    <span className="inline-block ml-2 px-3 py-1 bg-green-100 border-2 border-green-600 rounded-full text-green-800 text-sm font-bold">
                      ✓ เช็กอินแล้ว
                    </span>
                  ) : (
                    <span className="inline-block ml-2 px-3 py-1 bg-amber-100 border-2 border-amber-600 rounded-full text-amber-800 text-sm font-bold">
                      ! ยังไม่ได้เช็กอิน
                    </span>
                  )}
                </p>
              </div>

              {/* Quest description */}
              <div className="space-y-2 sm:space-y-3">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                  📜 ภารกิจพิเศษ
                </h2>
                <div className="p-3 sm:p-4 md:p-5 bg-amber-50/80 rounded-lg border-2 border-amber-800/30">
                  <p className="text-sm sm:text-base leading-relaxed">
                    ณ ที่แห่งนี้ มี<span className="font-bold text-[#8b4513]"> {subEvents.length} ภารกิจ</span>รอเจ้าอยู่
                    หากเจ้าร่วมกิจกรรมแม้เพียง<span className="font-bold text-green-700"> ๑ ภารกิจ</span> 
                    ท่านจักได้รับ<span className="text-lg sm:text-xl font-bold text-yellow-600"> +๑๐๐ </span>
                    <span className="font-bold text-yellow-600">คะแนน</span>เป็นรางวัล!
                  </p>
                </div>
              </div>

              {/* Quest list */}
              {subEvents.length > 0 ? (
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">🗺️ รายการภารกิจ:</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {subEvents.map((subEvent, idx) => {
                      const isCompleted = completedSubEvents.includes(subEvent.id);
                      
                      return (
                        <div
                          key={subEvent.id}
                          className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                            isCompleted
                              ? 'bg-green-50/80 border-green-600'
                              : 'bg-white/60 border-[#8b7355]/40 hover:border-[#8b7355] hover:shadow-lg'
                          }`}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold ${
                              isCompleted
                                ? 'bg-green-600 text-white'
                                : 'bg-[#8b7355] text-[#f4e4c1]'
                            }`}>
                              {isCompleted ? '✓' : idx + 1}
                            </div>
                            <div className="flex-1 space-y-1 sm:space-y-2">
                              <h4 className="text-base sm:text-lg font-bold text-[#3d2817]">
                                {subEvent.name}
                                {isCompleted && (
                                  <span className="ml-2 text-xs sm:text-sm text-green-600">(สำเร็จแล้ว)</span>
                                )}
                              </h4>
                              {subEvent.description && (
                                <p className="text-xs sm:text-sm text-[#5d4e37]">
                                  {subEvent.description}
                                </p>
                              )}
                              {subEvent.time && (
                                <p className="text-xs sm:text-sm text-[#8b7355] flex items-center gap-1">
                                  🕐 <span className="font-semibold">{subEvent.time}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6 bg-gray-50 rounded-lg border-2 border-gray-300 text-center">
                  <p className="text-base sm:text-lg text-gray-600">
                    ณ บัดนี้ ยังไม่มีภารกิจเฉพาะเจาะจง...
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    แต่เจ้าสามารถสำรวจพื้นที่นี้ได้เสมอ!
                  </p>
                </div>
              )}

              {/* Footer message */}
              <div className="pt-3 sm:pt-4 md:pt-6 border-t-2 border-[#8b7355]/30">
                <p className="text-center text-sm sm:text-base leading-relaxed italic">
                  จงออกเดินทางด้วยความกล้าหาญ และขอให้โชคดีมีแก่เจ้า!
                </p>
                <p className="text-center text-lg sm:text-xl mt-2 sm:mt-3 font-bold">
                  🏴‍☠️ ⚓ 🗺️
                </p>
                <p className="text-center text-sm text-[#8b7355] mt-4">
                  ~ ลงนามโดยกัปตันแห่งเรือโจรสลัด FATU ~
                </p>
              </div>

              {/* Close button */}
              <div className="flex justify-center pt-3 sm:pt-4">
                <Button
                  onClick={onClose}
                  size="lg"
                  className="pirate-button text-sm sm:text-base md:text-lg px-6 sm:px-8"
                >
                  รับทราบแล้ว ⚓
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes bubble {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) scale(1); opacity: 0; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-bubble {
          animation: bubble linear infinite;
        }
      `}</style>
    </div>
  );
};

