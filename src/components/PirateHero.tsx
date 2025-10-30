import { useState, useEffect } from "react";
import { Anchor, LogIn, ChevronLeft, ChevronRight, ExternalLink, Info, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { PirateChatbot } from "@/components/PirateChatbot";
import { getHeroCards, getPrizes, type HeroCardRecord, type PrizeRecord } from "@/services/firebase";
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
  const [prizes, setPrizes] = useState<PrizeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cards, availablePrizes] = await Promise.all([
          getHeroCards(),
          getPrizes()
        ]);
        setHeroCards(cards.filter(c => c.is_active));
        setPrizes(availablePrizes);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <PirateBackdrop>
      <PirateCharacter 
        messages={[
          "ฮาฮอย! ยินดีต้อนรับสู่ FATU Pirate Quest! 🏴‍☠️",
          "💬 คลิกที่ข้าได้เลยถ้าอยากคุยหรือถามอะไร!",
          "พร้อมออกล่าสมบัติหรือยัง? 💎",
          "ลงทะเบียนเข้าร่วมกันเถอะ! ⚓",
          "เช็กอิน 4 จุด แล้วหมุนวงล้อลุ้นรางวัล! 🎰",
          "ผจญภัยอย่างปลอดภัยนะ! 🗺️",
        ]}
        onChatbotOpen={() => setChatbotOpen(true)}
      />
      
      {/* AI Chatbot */}
      <PirateChatbot 
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />
      <div className="container mx-auto px-3 py-4 md:py-8 lg:py-16 relative">
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
        <div className="pirate-card px-4 py-6 md:px-12 md:py-14 lg:px-16 lg:py-16 space-y-6 md:space-y-12">
          {/* Header Section - Compact for Mobile */}
          <div className="flex flex-col items-center gap-3 md:gap-6 text-center">
            <span className="pirate-highlight pirate-scroll text-sm md:text-base">
              <Anchor className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              FATU Treasure Quest
            </span>
            
            <div className="space-y-2 md:space-y-4">
              <h1 className="text-3xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient">
                🏴‍☠️ Pirates of The FATUnian ⚓
              </h1>
              <p className="text-lg md:text-3xl font-bold text-primary uppercase tracking-wider drop-shadow-lg">
                Fatu Open House 2025
              </p>
            </div>

            <div className="pirate-chip text-sm md:text-lg">
              📅 7-8 พ.ย. 68 • 🏛️ คณะศิลปกรรมศาสตร์ ม.ธรรมศาสตร์
            </div>

            <p className="text-sm md:text-xl text-foreground/90 max-w-4xl leading-relaxed">
              <span className="font-semibold text-primary">⛵ ออกล่าสมบัติ</span> 
              <span className="font-semibold text-secondary"> 🗺️ สำรวจ 4 จุด</span> 
              เช็กอิน QR สะสมคะแนน 
              <span className="font-semibold text-accent"> 🎁 แลกของรางวัล</span>!
            </p>
          </div>

          <div className="pirate-divider" />

          {/* Hero Cards Carousel - Enhanced & Prominent */}
          {loading ? (
            <div className="text-center py-8 md:py-12">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-foreground/70">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {/* ✨ Enhanced Title with Animations */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 border-2 border-primary/30 shadow-lg animate-pulse-slow">
                  <span className="text-4xl md:text-5xl animate-bounce-slow">🎯</span>
                  <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    ไฮไลท์กิจกรรม
                  </h2>
                  <span className="text-4xl md:text-5xl animate-bounce-slow" style={{animationDelay: '0.5s'}}>✨</span>
                </div>
                <p className="text-sm md:text-base text-foreground/70">กิจกรรมสุดพิเศษที่ท่านไม่ควรพลาด!</p>
                <div className="flex items-center justify-center gap-2 text-sm text-primary/80 animate-pulse">
                  <span className="hidden md:inline">👉</span>
                  <span className="font-semibold">เลื่อนขวาเพื่อดูกิจกรรมอื่นๆ</span>
                  <span className="animate-bounce">👉</span>
                </div>
              </div>
              
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
                  {heroCards.map((card, idx) => (
                    <CarouselItem key={card.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-1 md:p-2">
                        <div 
                          className="group rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-amber-50 via-white to-blue-50 p-4 md:p-6 text-center shadow-2xl backdrop-blur-sm transition-all duration-500 hover:shadow-[0_20px_50px_rgba(8,_112,_184,_0.4)] hover:scale-110 hover:border-primary hover:-translate-y-2 cursor-pointer h-full flex flex-col relative overflow-hidden"
                          style={{animationDelay: `${idx * 150}ms`}}
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
                          {/* ✨ Shimmer Effect */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                          
                          <div className="mx-auto mb-3 md:mb-4 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 text-4xl md:text-5xl pirate-floating group-hover:from-primary/40 group-hover:to-secondary/40 transition-all shadow-lg">
                            {card.icon}
                          </div>
                          
                          <h3 className="text-lg md:text-2xl font-black text-primary mb-2 md:mb-3 group-hover:text-secondary transition-colors">
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

          {/* 🎁 Prizes Showcase - New Section */}
          {!loading && prizes.length > 0 && (
            <>
              <div className="pirate-divider" />
              <div className="space-y-4 md:space-y-6">
                {/* Title */}
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-yellow-400/20 via-amber-400/20 to-orange-400/20 border-2 border-yellow-500/30 shadow-lg animate-pulse-slow">
                    <span className="text-4xl md:text-5xl animate-bounce-slow">🏆</span>
                    <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                      รางวัลพิเศษมากมาย
                    </h2>
                    <span className="text-4xl md:text-5xl animate-bounce-slow" style={{animationDelay: '0.5s'}}>🎁</span>
                  </div>
                  <p className="text-sm md:text-base text-foreground/70">เช็กอินครบ 4 จุด หมุนวงล้อลุ้นรางวัลสุดพิเศษ!</p>
                </div>

                {/* Prizes Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {prizes.map((prize, idx) => (
                    <div
                      key={prize.id}
                      className="group rounded-2xl border-2 border-yellow-400/50 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-3 md:p-4 text-center shadow-xl backdrop-blur-sm transition-all duration-500 hover:shadow-[0_20px_50px_rgba(245,_158,_11,_0.5)] hover:scale-110 hover:border-yellow-500 hover:-translate-y-2 cursor-pointer relative overflow-hidden animate-in fade-in"
                      style={{animationDelay: `${idx * 100}ms`}}
                    >
                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent" />
                      
                      {/* Prize Image or Icon */}
                      {prize.image_url ? (
                        <div className="mb-3 rounded-lg overflow-hidden bg-white/80 p-2 shadow-inner">
                          <img 
                            src={prize.image_url} 
                            alt={prize.name}
                            className="w-full h-24 md:h-32 object-contain group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="mx-auto mb-3 flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400/30 to-amber-400/30 text-4xl md:text-5xl animate-pulse-slow">
                          <Gift className="h-10 w-10 md:h-12 md:w-12 text-amber-600" />
                        </div>
                      )}
                      
                      {/* Prize Name */}
                      <h3 className="text-base md:text-lg font-bold text-amber-900 mb-1 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {prize.name}
                      </h3>
                      
                      {/* Prize Description */}
                      {prize.description && (
                        <p className="text-xs md:text-sm text-foreground/70 line-clamp-2 mb-2">
                          {prize.description}
                        </p>
                      )}
                      
                      {/* Prize Badge */}
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 border border-green-300 text-xs font-semibold text-green-700">
                        <span>🎁</span>
                        <span>รางวัล</span>
                      </div>
                      
                      {/* Decorative Sparkles */}
                      <div className="absolute top-2 right-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity animate-ping-slow">✨</div>
                      <div className="absolute bottom-2 left-2 text-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity animate-bounce-slow">⭐</div>
                    </div>
                  ))}
                </div>

                {/* Call to Action */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 shadow-lg">
                    <span className="text-2xl animate-spin-slow">🎰</span>
                    <p className="text-sm md:text-base font-semibold text-amber-900">
                      เช็กอินครบทุกจุด หมุนวงล้อรับรางวัลทันที!
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="pirate-divider" />

          {/* How to Play Section - Compact */}
          <div className="space-y-4 md:space-y-8">
            <div className="text-center space-y-1 md:space-y-2">
              <h2 className="text-2xl md:text-4xl font-bold text-primary flex items-center justify-center gap-2 md:gap-3">
                <Info className="h-5 w-5 md:h-8 md:w-8" />
                วิธีการเล่น
              </h2>
              <p className="text-sm md:text-lg text-foreground/80">ทำตามขั้นตอนง่ายๆ เพื่อรับสมบัติโจรสลัด</p>
            </div>

            <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-5">
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
                  description: "ไปยัง 4 สถานที่ (ไม่ต้องเช็กอิน)",
                  color: "from-green-500 to-green-600",
                },
                {
                  step: "3",
                  icon: "📱",
                  title: "สแกน QR Code",
                  description: "ทำกิจกรรมย่อย 1 กิจกรรม/สถานที่ (+100 คะแนน)",
                  color: "from-yellow-500 to-yellow-600",
                },
                {
                  step: "4",
                  icon: "🎰",
                  title: "หมุนวงล้อ",
                  description: "สะสมครบ 300 คะแนน แล้วหมุนวงล้อลุ้นรางวัล!",
                  color: "from-red-500 to-red-600",
                },
                {
                  step: "💡",
                  icon: "🤖",
                  title: "AI โจรสลัด",
                  description: "คลิกตัวโจรสลัดเพื่อคุยและถามคำถามเกี่ยวกับงาน!",
                  color: "from-purple-500 to-purple-600",
                  highlight: true,
                },
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`relative group ${item.highlight ? 'col-span-2 lg:col-span-1' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`rounded-xl md:rounded-2xl border-2 p-3 md:p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 h-full ${
                    item.highlight 
                      ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50 animate-pulse-slow' 
                      : 'border-rope/40 bg-white/90'
                  }`}>
                    {/* Step Number Badge */}
                    <div className={`absolute -top-2 -left-2 md:-top-4 md:-left-4 w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${item.color} text-white font-bold text-sm md:text-xl flex items-center justify-center shadow-lg ${item.highlight ? 'animate-bounce' : ''}`}>
                      {item.step}
                    </div>
                    
                    <div className="text-4xl md:text-6xl mb-2 md:mb-4 text-center animate-bounce-slow">
                      {item.icon}
                    </div>
                    
                    <h3 className="text-sm md:text-xl font-bold text-primary mb-1 md:mb-2 text-center">
                      {item.title}
                    </h3>
                    
                    <p className="text-xs md:text-sm text-foreground/80 text-center leading-relaxed hidden md:block">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pirate-divider" />

          {/* Important Notes - Compact */}
          <div className="rounded-xl md:rounded-2xl border-2 border-accent/30 bg-accent/10 p-4 md:p-8 space-y-2 md:space-y-4">
            <h3 className="text-lg md:text-2xl font-bold text-accent flex items-center gap-2">
              ⚠️ ข้อควรรู้
            </h3>
            <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-foreground/90">
              <li className="flex items-start gap-2 md:gap-3">
                <span className="text-lg md:text-2xl">✅</span>
                <span>หมุนวงล้อได้เพียง <strong className="text-accent">1 ครั้งต่อคน</strong></span>
              </li>
              <li className="flex items-start gap-2 md:gap-3">
                <span className="text-lg md:text-2xl">✅</span>
                <span>เช็กอินตลอดงาน <strong className="text-accent">7-8 พ.ย. 68</strong></span>
              </li>
              <li className="flex items-start gap-2 md:gap-3 hidden md:flex">
                <span className="text-2xl">✅</span>
                <span>สะสมคะแนนได้จนถึงวันสุดท้ายของงาน</span>
              </li>
            </ul>
          </div>

          <div className="pirate-divider" />

          {/* Action Area - compact, non-buttony CTA with AI tip */}
          <div className="space-y-6 md:space-y-8">
            {/* Compact Info Banner */}
            <div className="max-w-3xl mx-auto">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-50/60 px-4 py-3 md:px-6 md:py-4 text-center shadow">
                <p className="text-sm md:text-base text-amber-900 font-semibold">
                  เริ่มต้นการผจญภัยได้จากเมนูด้านล่าง หรือไปที่แผนที่เพื่อสำรวจจุดเช็กอิน
                </p>
                <p className="mt-2 text-xs md:text-sm text-amber-800">
                  💡 มี AI ผู้ช่วยโจรสลัดอยู่มุมขวาล่าง คลิกตัวโจรสลัดเพื่อถามเส้นทาง วิธีเล่น หรือข้อมูลงานได้เลย
                </p>
              </div>
            </div>

            {/* Start Onboarding - compact button */}
            <div className="text-center">
              <Button
                size="xl"
                className="inline-flex items-center justify-center gap-3 w-full max-w-md px-8 py-5 md:px-10 md:py-7 rounded-2xl bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white hover:from-yellow-400 hover:via-amber-400 hover:to-orange-400 shadow-2xl hover:scale-105 transition-transform text-xl md:text-3xl font-black"
                onClick={() => navigate("/onboarding")}
              >
                <span className="text-3xl md:text-4xl">🏴‍☠️</span>
                เริ่มต้นใช้งาน
              </Button>
            </div>

            {/* 📱 ปุ่มย่อย 3 ปุ่ม (แนวนอน) */}
            <div className="max-w-3xl mx-auto">
              <div className="grid gap-3 md:gap-4 grid-cols-3">
                {/* แผนที่ */}
                <div className="group relative">
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative w-full h-auto flex-col gap-2 md:gap-3 py-5 md:py-8 px-3 md:px-4 text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-white/90 hover:bg-gradient-to-br hover:from-green-50 hover:to-blue-50 rounded-xl md:rounded-2xl border-2 hover:border-green-500"
                    onClick={() => navigate("/map")}
                  >
                    <span className="text-4xl md:text-5xl animate-bounce-slow">🗺️</span>
                    <div className="space-y-0.5 text-center">
                      <div className="font-bold text-sm md:text-lg text-gray-900">แผนที่</div>
                      <div className="text-xs text-gray-600 hidden md:block">สำรวจจุดเช็กอิน</div>
                    </div>
                  </Button>
                </div>

                {/* เข้าสู่ระบบ */}
                <div className="group relative">
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative w-full h-auto flex-col gap-2 md:gap-3 py-5 md:py-8 px-3 md:px-4 text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-white/90 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 rounded-xl md:rounded-2xl border-2 hover:border-amber-500"
                    onClick={() => navigate("/login")}
                  >
                    <span className="text-4xl md:text-5xl animate-bounce-slow" style={{ animationDelay: '0.2s' }}>⚓</span>
                    <div className="space-y-0.5 text-center">
                      <div className="font-bold text-sm md:text-lg text-gray-900 flex items-center justify-center gap-1">
                        <LogIn className="h-3 w-3 md:h-4 md:w-4" />
                        เข้าสู่ระบบ
                      </div>
                      <div className="text-xs text-gray-600 hidden md:block">สำหรับลูกเรือ</div>
                    </div>
                  </Button>
                </div>

                {/* เกมส์มินิ */}
                <div className="group relative">
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative w-full h-auto flex-col gap-2 md:gap-3 py-5 md:py-8 px-3 md:px-4 text-base md:text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-white/90 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 rounded-xl md:rounded-2xl border-2 hover:border-purple-500"
                    onClick={() => navigate("/game")}
                  >
                    <span className="text-4xl md:text-5xl animate-bounce-slow" style={{ animationDelay: '0.4s' }}>🎮</span>
                    <div className="space-y-0.5 text-center">
                      <div className="font-bold text-sm md:text-lg text-gray-900">เกมส์มินิ</div>
                      <div className="text-xs text-gray-600 hidden md:block">Pirate Flyer</div>
                    </div>
                  </Button>
                </div>
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
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
      `}</style>
    </PirateBackdrop>
  );
};
