import { Anchor, Map, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const PirateHero = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iYmxhY2siIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-center mb-6">
            <Anchor className="w-20 h-20 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-pirate-ink text-shadow-pirate mb-4">
            🚢 Pirates of The FATUnian
          </h1>
          <p className="text-2xl md:text-3xl text-pirate-wood mb-2">
            Fatu Open House 2025
          </p>
          <p className="text-lg text-muted-foreground">
            7-8 พฤศจิกายน 2568
          </p>
        </div>

        <div className="max-w-4xl mx-auto bg-card/80 backdrop-blur rounded-2xl border-2 border-rope p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">
              ออกล่าสมบัติกับเรา! ⚓
            </h2>
            <p className="text-lg text-foreground/80">
              สำรวจ 4 จุดล่าสมบัติ รับคะแนน และลุ้นรับรางวัลจากวงล้อ!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-secondary/10 rounded-xl border border-secondary/30">
              <Map className="w-12 h-12 mx-auto mb-3 text-secondary" />
              <h3 className="font-bold text-lg mb-2">4 จุดล่าสมบัติ</h3>
              <p className="text-sm text-muted-foreground">
                เที่ยวชมและเช็กอินด้วย QR
              </p>
            </div>
            
            <div className="text-center p-6 bg-accent/10 rounded-xl border border-accent/30">
              <Gift className="w-12 h-12 mx-auto mb-3 text-accent" />
              <h3 className="font-bold text-lg mb-2">300 คะแนน</h3>
              <p className="text-sm text-muted-foreground">
                สะสมแล้วหมุนวงล้อลุ้นรางวัล
              </p>
            </div>
            
            <div className="text-center p-6 bg-primary/10 rounded-xl border border-primary/30">
              <Anchor className="w-12 h-12 mx-auto mb-3 text-primary" />
              <h3 className="font-bold text-lg mb-2">ของรางวัล</h3>
              <p className="text-sm text-muted-foreground">
                สติ๊กเกอร์ พวงกุญแจ และอื่น ๆ
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg"
              onClick={() => navigate('/signup')}
            >
              🏴‍☠️ ลงทะเบียนเข้าร่วม
            </Button>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg"
              onClick={() => navigate('/map')}
            >
              🗺️ ดูแผนที่สมบัติ
            </Button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>ติดต่อสอบถาม: คณะศิลปกรรมศาสตร์ มหาวิทยาลัยธรรมศาสตร์</p>
        </div>
      </div>
    </div>
  );
};
