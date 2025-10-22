import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { useToast } from "@/hooks/use-toast";
import { firebaseDb } from "@/integrations/firebase/database";
import { Search, CheckCircle2, XCircle, Gift, User, Phone, Calendar, ArrowLeft } from "lucide-react";
import type { ParticipantRecord, SpinRecord } from "@/services/firebase";

const PrizeVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<{
    participant: ParticipantRecord;
    spin: SpinRecord | null;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "กรุณากรอกข้อมูล",
        description: "กรอกชื่อ, เบอร์โทร หรือ Username เพื่อค้นหา",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setResult(null);

    try {
      const participants = await firebaseDb.get<Record<string, ParticipantRecord>>("participants");
      
      if (!participants) {
        throw new Error("ไม่พบข้อมูลผู้เข้าร่วม");
      }

      const query = searchQuery.toLowerCase().trim();
      
      // ค้นหาจาก: ชื่อ, นามสกุล, เบอร์โทร, หรือ username
      const found = Object.values(participants).find((p) => {
        const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
        const phone = p.phone_number?.replace(/\D/g, '') || '';
        const queryPhone = query.replace(/\D/g, '');
        
        return (
          fullName.includes(query) ||
          p.first_name.toLowerCase().includes(query) ||
          p.last_name.toLowerCase().includes(query) ||
          p.username.toLowerCase().includes(query) ||
          (phone && queryPhone && phone.includes(queryPhone))
        );
      });

      if (!found) {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่พบผู้เข้าร่วมที่ตรงกับข้อมูลที่ค้นหา",
          variant: "destructive",
        });
        return;
      }

      // ดึงข้อมูลรางวัล (spins เก็บเป็น object ที่ key คือ participant_id)
      const allSpins = await firebaseDb.get<Record<string, SpinRecord>>("spins");
      const userSpin = allSpins ? Object.values(allSpins).find(
        (spin) => spin.participant_id === found.id
      ) : null;

      setResult({
        participant: found,
        spin: userSpin || null,
      });

      toast({
        title: "พบข้อมูล",
        description: `พบข้อมูลของ ${found.first_name} ${found.last_name}`,
      });
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถค้นหาได้",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="pirate-card px-8 py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Gift className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold text-primary">ตรวจสอบรางวัล</h1>
            </div>
            <p className="text-lg text-foreground/80">
              ค้นหาด้วยชื่อ, เบอร์โทร หรือ Username เพื่อตรวจสอบสถานะรางวัล
            </p>
          </div>

          <div className="pirate-divider" />

          {/* Search Box */}
          <div className="space-y-4">
            <Label htmlFor="search" className="text-lg">
              ค้นหาผู้เข้าร่วม
            </Label>
            <div className="flex gap-3">
              <Input
                id="search"
                type="text"
                placeholder="ชื่อ, เบอร์โทร, หรือ Username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-lg"
              />
              <Button
                onClick={handleSearch}
                disabled={searching}
                size="lg"
                className="gap-2"
              >
                {searching ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    กำลังค้นหา
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    ค้นหา
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="pirate-divider" />

              {/* Participant Info */}
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
                <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                  <User className="h-6 w-6" />
                  ข้อมูลผู้เข้าร่วม
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">ชื่อ-นามสกุล</p>
                    <p className="text-lg font-semibold text-primary">
                      {result.participant.first_name} {result.participant.last_name}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Username</p>
                    <p className="text-lg font-semibold text-foreground">
                      {result.participant.username}
                    </p>
                  </div>
                  
                  {result.participant.phone_number && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1 flex items-center gap-1">
                        <Phone className="h-4 w-4" /> เบอร์โทรศัพท์
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {result.participant.phone_number}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">คะแนนสะสม</p>
                    <p className="text-lg font-semibold text-accent">
                      {result.participant.points} คะแนน
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-sm text-foreground/60 mb-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> วันที่ลงทะเบียน
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {new Date(result.participant.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Prize Status */}
              <div className={`rounded-2xl border-2 p-6 space-y-4 ${
                result.spin
                  ? "border-accent/30 bg-accent/10"
                  : "border-foreground/20 bg-foreground/5"
              }`}>
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  {result.spin ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-accent" />
                      <span className="text-accent">ได้รับรางวัลแล้ว</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-foreground/60" />
                      <span className="text-foreground/80">ยังไม่ได้รับรางวัล</span>
                    </>
                  )}
                </h3>

                {result.spin ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-lg bg-white/80 border border-accent/20">
                      <p className="text-sm text-foreground/60 mb-2">รางวัลที่ได้รับ</p>
                      <p className="text-3xl font-bold text-accent flex items-center gap-2">
                        <Gift className="h-8 w-8" />
                        {result.spin.prize}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">วันที่หมุนวงล้อ</p>
                      <p className="text-lg font-semibold text-foreground">
                        {new Date(result.spin.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-accent/20 border border-accent/30">
                      <p className="text-sm font-semibold text-accent">
                        ✅ สามารถรับรางวัลได้ - แสดงหน้านี้กับทีมงานเพื่อรับรางวัล
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-foreground/70">
                      ผู้เข้าร่วมยังไม่ได้หมุนวงล้อ
                    </p>
                    
                    {result.participant.points >= 400 ? (
                      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <p className="text-sm font-semibold text-primary">
                          💡 มีคะแนนเพียงพอแล้ว สามารถไปหมุนวงล้อได้ที่หน้า "วงล้อสมบัติ"
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-foreground/5 border border-foreground/10">
                        <p className="text-sm text-foreground/70">
                          ต้องสะสมเพิ่มอีก {400 - result.participant.points} คะแนน เพื่อหมุนวงล้อ
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้าแรก
            </Button>
            
            {result && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setSearchQuery("");
                  setResult(null);
                }}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                ค้นหาใหม่
              </Button>
            )}
          </div>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default PrizeVerification;

