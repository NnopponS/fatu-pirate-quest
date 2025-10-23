import { useState, useEffect } from "react";
import { Anchor, LogIn, ChevronLeft, ChevronRight, ExternalLink, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { getHeroCards, type HeroCardRecord } from "@/services/firebase";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export const PirateHero = () => {
  const navigate = useNavigate();
  const [heroCards, setHeroCards] = useState<HeroCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await getHeroCards();
        setHeroCards(cards.filter(c => c.is_active));
      } catch (error) {
        console.error("Failed to load hero cards:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCards();
  }, []);

  return (
    <PirateBackdrop>
      <PirateCharacter 
        messages={[
          "อาร์ร์! ยินดีต้อนรับสู่ FATU Pirate Quest! 🏴‍☠️",
          "พร้อมออกล่าสมบัติหรือยัง? 💎",
          "ลงทะเบียนเข้าร่วมกันเถอะ! ⚓",
          "เช็กอิน 4 จุด แล้วหมุนวงล้อลุ้นรางวัล! 🎰",
          "ผจญภัยอย่างปลอดภัยนะ! 🗺️",
        ]}
      />
      <div className="container mx-auto px-4 py-8 lg:py-16 relative">
        {/* Decorative Elements */}
        <div className="absolute top-12 right-6 hidden lg:block pirate-coin">
          <div className="text-6xl animate-spin-slow">💎</div>
        </div>
        <div className="absolute bottom-12 left-8 hidden lg:block pirate-floating">
          <div className="text-6xl">🗺️</div>
        </div>
        <div className="absolute top-32 left-12 hidden lg:block pirate-floating-delayed">
          <div className="text-5xl">⚓</div>
        </div>

        {/* Main Hero Card */}
        <div className="pirate-card px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-16 space-y-12">
          {/* Header Section */}
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="pirate-highlight pirate-scroll">
              <Anchor className="h-4 w-4 text-primary" />
              FATU Treasure Quest
            </span>
            
            <div className="space-y-4">
              <h1 className="pirate-heading md:text-6xl lg:text-7xl">
                🏴‍☠️ Pirates of The FATUnian ⚓
              </h1>
              <p className="text-2xl md:text-3xl font-bold text-primary uppercase tracking-wider drop-shadow-lg">
                Fatu Open House 2025
              </p>
            </div>

            <div className="pirate-chip text-lg md:text-xl">
              📅 7-8 พฤศจิกายน 2568 <br className="md:hidden" />
              <span className="hidden md:inline">•</span> 🏛️ คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์
            </div>

            <p className="text-lg md:text-xl text-foreground/90 max-w-4xl leading-relaxed">
              <span className="font-semibold text-primary">⛵ ออกล่าสมบัติ</span>
              ท่ามกลางบรรยากาศโจรสลัดสุดขอบฟ้า 
              <span className="font-semibold text-secondary"> 🗺️ สำรวจ 4 จุดกิจกรรม</span> 
              เช็กอิน QR สะสมคะแนน 
              <span className="font-semibold text-accent"> 🎁 แลกของรางวัลล้ำค่า</span> 
              และร่วมภารกิจเฉพาะลูกเรือ FATU!
            </p>
          </div>

          <div className="pirate-divider" />

          {/* Hero Cards Carousel */}
          {loading ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-foreground/70">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-center text-primary">🎯 ไฮไลท์กิจกรรม</h2>
              
              <Carousel 
                className="w-full"
                setApi={setApi}
                plugins={[
                  Autoplay({
                    delay: 3000,
                    stopOnInteraction: true,
                    stopOnMouseEnter: true,
                  })
                ]}
                opts={{
                  loop: true,
                  align: "start",
                }}
              >
                <CarouselContent>
                  {heroCards.map((card) => (
                    <CarouselItem key={card.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-2">
                        <div 
                          className="group rounded-2xl border-2 border-rope/50 bg-gradient-to-br from-white/90 to-white/70 p-6 text-center shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-primary/50 cursor-pointer h-full flex flex-col"
                          onClick={() => {
                            if (!card.link_url) return;
                            // Check if external link
                            if (card.link_url.startsWith('http://') || card.link_url.startsWith('https://')) {
                              window.open(card.link_url, '_blank', 'noopener,noreferrer');
                            } else {
                              navigate(card.link_url);
                            }
                          }}
                        >
                          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-5xl pirate-floating group-hover:bg-primary/20 transition-colors">
                            {card.icon}
                          </div>
                          
                          <h3 className="text-2xl font-bold text-primary mb-3 group-hover:text-secondary transition-colors">
                            {card.title}
                          </h3>
                          
                          <p className="text-sm text-foreground/80 leading-relaxed flex-grow">
                            {card.description}
                          </p>
                          
                          {card.image_url && (
                            <div className="mt-4 rounded-lg overflow-hidden">
                              <img 
                                src={card.image_url} 
                                alt={card.title}
                                className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </div>
                          )}
                          
                          {card.link_url && card.link_text && (
                            <div className="mt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  if (card.link_url.startsWith('http://') || card.link_url.startsWith('https://')) {
                                    window.open(card.link_url, '_blank', 'noopener,noreferrer');
                                  } else {
                                    navigate(card.link_url);
                                  }
                                }}
                              >
                                {card.link_text}
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </Carousel>
            </div>
          )}

          <div className="pirate-divider" />

          {/* How to Play Section */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-primary flex items-center justify-center gap-3">
                <Info className="h-8 w-8" />
                วิธีการเล่น
              </h2>
              <p className="text-lg text-foreground/80">ทำตามขั้นตอนง่ายๆ เพื่อรับสมบัติโจรสลัด</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "1",
                  icon: "👤",
                  title: "ลงทะเบียน",
                  description: "สมัครสมาชิกลูกเรือ FATU รับ Username และ Password",
                  color: "from-blue-500 to-blue-600",
                },
                {
                  step: "2", 
                  icon: "🗺️",
                  title: "สำรวจแผนที่",
                  description: "ดูจุดเช็กอิน 4 จุด ตามแผนที่สมบัติ",
                  color: "from-green-500 to-green-600",
                },
                {
                  step: "3",
                  icon: "📱",
                  title: "สแกน QR Code",
                  description: "เช็กอินที่จุดต่างๆ เพื่อสะสมคะแนน (100 คะแนน/จุด)",
                  color: "from-yellow-500 to-yellow-600",
                },
                {
                  step: "4",
                  icon: "🎰",
                  title: "หมุนวงล้อ",
                  description: "สะสมครบ 400 คะแนน แล้วหมุนวงล้อลุ้นรางวัล!",
                  color: "from-red-500 to-red-600",
                },
              ].map((item, index) => (
                <div 
                  key={index}
                  className="relative group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="rounded-2xl border-2 border-rope/40 bg-white/90 p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 h-full">
                    {/* Step Number Badge */}
                    <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${item.color} text-white font-bold text-xl flex items-center justify-center shadow-lg`}>
                      {item.step}
                    </div>
                    
                    <div className="text-6xl mb-4 text-center animate-bounce-slow">
                      {item.icon}
                    </div>
                    
                    <h3 className="text-xl font-bold text-primary mb-2 text-center">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-foreground/80 text-center leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pirate-divider" />

          {/* Important Notes */}
          <div className="rounded-2xl border-2 border-accent/30 bg-accent/10 p-8 space-y-4">
            <h3 className="text-2xl font-bold text-accent flex items-center gap-2">
              ⚠️ ข้อควรรู้
            </h3>
            <ul className="space-y-3 text-foreground/90">
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>หมุนวงล้อได้เพียง <strong className="text-accent">1 ครั้งต่อคน</strong> เท่านั้น</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>สะสมคะแนนได้จนถึงวันสุดท้ายของงาน</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>เช็กอินได้ตลอดเวลาในช่วงงาน <strong className="text-accent">7-8 พฤศจิกายน 2568</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <span>ติดต่อทีมงานหากพบปัญหา หรือต้องการความช่วยเหลือ</span>
              </li>
            </ul>
          </div>

          <div className="pirate-divider" />

          {/* Action Buttons - Enhanced */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-primary">🚀 เริ่มต้นการผจญภัย</h3>
              <p className="text-foreground/70">เลือกด้านล่างเพื่อเข้าร่วมกิจกรรม</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {/* ลงทะเบียน */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100" />
                <Button
                  size="lg"
                  className="relative w-full h-auto flex-col gap-4 py-8 px-6 text-lg shadow-2xl shadow-primary/50 hover:shadow-primary/70 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-primary to-primary/90 rounded-2xl"
                  onClick={() => navigate("/signup")}
                >
                  <span className="text-6xl animate-bounce">🏴‍☠️</span>
                  <div className="space-y-1">
                    <div className="font-bold text-xl">ลงทะเบียนเข้าร่วม</div>
                    <div className="text-xs text-white/80 font-normal">สมัครสมาชิกลูกเรือ</div>
                  </div>
                </Button>
              </div>

              {/* ดูแผนที่ */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/40 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100" />
                <Button
                  size="lg"
                  variant="secondary"
                  className="relative w-full h-auto flex-col gap-4 py-8 px-6 text-lg shadow-2xl shadow-secondary/50 hover:shadow-secondary/70 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-secondary to-secondary/90 rounded-2xl"
                  onClick={() => navigate("/map")}
                >
                  <span className="text-6xl animate-bounce" style={{ animationDelay: '0.1s' }}>🗺️</span>
                  <div className="space-y-1">
                    <div className="font-bold text-xl">ดูแผนที่สมบัติ</div>
                    <div className="text-xs text-white/80 font-normal">สำรวจจุดเช็กอิน</div>
                  </div>
                </Button>
              </div>

              {/* เข้าสู่ระบบ */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-accent/40 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-70 group-hover:opacity-100" />
                <Button
                  size="lg"
                  className="relative w-full h-auto flex-col gap-4 py-8 px-6 text-lg shadow-2xl shadow-accent/50 hover:shadow-accent/70 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-accent to-accent/90 rounded-2xl"
                  onClick={() => navigate("/login")}
                >
                  <span className="text-6xl animate-bounce" style={{ animationDelay: '0.2s' }}>⚓</span>
                  <div className="space-y-1">
                    <div className="font-bold text-xl flex items-center justify-center gap-2">
                      <LogIn className="h-5 w-5" />
                      เข้าสู่ระบบ
                    </div>
                    <div className="text-xs text-white/80 font-normal">สำหรับลูกเรือ</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </PirateBackdrop>
  );
};
