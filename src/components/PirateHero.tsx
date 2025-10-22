import { Anchor, Compass, Gift, LogIn, Map } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PirateBackdrop } from "@/components/PirateBackdrop";

export const PirateHero = () => {
  const navigate = useNavigate();

  return (
    <PirateBackdrop>
      <div className="container mx-auto px-4 py-16 lg:py-24 relative">
        <div className="absolute top-12 right-6 hidden lg:block pirate-coin">
          <Gift className="h-16 w-16 text-accent/80" />
        </div>
        <div className="absolute bottom-12 left-8 hidden lg:block pirate-floating">
          <Compass className="h-16 w-16 text-secondary/70" />
        </div>

        <div className="pirate-card pirate-grid px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="pirate-highlight pirate-scroll">
              <Anchor className="h-4 w-4 text-primary" />
              FATU Treasure Quest
            </span>
            <h1 className="pirate-heading md:text-6xl">🚢 Pirates of The FATUnian</h1>
            <p className="text-xl md:text-2xl font-semibold text-foreground/80 uppercase tracking-[0.3em]">
              Fatu Open House 2025
            </p>
            <p className="pirate-chip">
              7-8 พฤศจิกายน 2568 • คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์
            </p>
            <p className="pirate-subheading">
              ออกล่าสมบัติท่ามกลางบรรยากาศโจรสลัดสุดขอบฟ้า สำรวจ 4 จุดกิจกรรม เช็กอิน QR
              สะสมคะแนน แลกของรางวัลล้ำค่า และร่วมภารกิจเฉพาะลูกเรือ FATU!
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-12">
            <div className="rounded-2xl border border-rope/50 bg-white/70 p-6 text-center shadow-lg backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 pirate-floating">
                <Map className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-primary">4 จุดล่าสมบัติ</h3>
              <p className="mt-2 text-sm text-foreground/70">
                ท่องดินแดน FATU เช็กอินด้วย QR เพื่อปลดล็อกจากจุดหมายสำคัญ
              </p>
            </div>

            <div className="rounded-2xl border border-rope/50 bg-white/70 p-6 text-center shadow-lg backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 pirate-floating-delayed">
                <Gift className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-primary">400 คะแนน</h3>
              <p className="mt-2 text-sm text-foreground/70">
                สะสมครบเพื่อหมุนวงล้อสมบัติ ลุ้นรับของรางวัลพิเศษเฉพาะงานนี้เท่านั้น
              </p>
            </div>

            <div className="rounded-2xl border border-rope/50 bg-white/70 p-6 text-center shadow-lg backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 pirate-floating">
                <Anchor className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary">ขุมทรัพย์โจรสลัด</h3>
              <p className="mt-2 text-sm text-foreground/70">
                สติ๊กเกอร์, พวงกุญแจ, ของสะสม และอีกมากมายรอให้คุณครอบครอง
              </p>
            </div>
          </div>

          <div className="pirate-divider my-10" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-lg shadow-primary/30"
              onClick={() => navigate("/signup")}
            >
              🏴‍☠️ ลงทะเบียนเข้าร่วม
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6 shadow-lg shadow-secondary/30"
              onClick={() => navigate("/map")}
            >
              🗺️ ดูแผนที่สมบัติ
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 shadow-lg shadow-foreground/10"
              onClick={() => navigate("/login")}
            >
              <LogIn className="h-5 w-5" />
              เข้าสู่ระบบลูกเรือ
            </Button>
          </div>
        </div>
      </div>
    </PirateBackdrop>
  );
};
