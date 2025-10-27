import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { useToast } from "@/hooks/use-toast";
import { verifyClaimCode, markPrizeClaimed } from "@/services/firebase";
import { Search, CheckCircle2, XCircle, Gift, User, ArrowLeft, AlertTriangle } from "lucide-react";

const PrizeVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claimCode, setClaimCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    participantId?: string;
    participantName?: string;
    prize?: string;
    claimed?: boolean;
    claimedAt?: string;
  } | null>(null);

  const handleSearch = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast({
        title: "ไม่มีสิทธิ์",
        description: "กรุณาเข้าสู่ระบบ Admin",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!claimCode.trim() || claimCode.length !== 4) {
      toast({
        title: "กรุณากรอกรหัส",
        description: "รหัสรับรางวัลต้องเป็นตัวเลข 4 หลัก",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setResult(null);

    try {
      const data = await verifyClaimCode(token, claimCode);
      
      if (!data.found) {
        toast({
          title: "ไม่พบรหัสนี้",
          description: "กรุณาตรวจสอบรหัสอีกครั้ง",
          variant: "destructive",
        });
        setResult({ found: false });
        return;
      }

      setResult(data);
      toast({
        title: "พบรางวัล!",
        description: `รางวัลของ ${data.participantName}`,
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

  const handleMarkClaimed = async () => {
    if (!result || !result.participantId) return;

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
      return;
    }

    setMarking(true);

    try {
      await markPrizeClaimed(token, result.participantId);
      
      // Update local result
      setResult({
        ...result,
        claimed: true,
        claimedAt: new Date().toISOString()
      });

      toast({
        title: "✅ ยืนยันการมอบรางวัลสำเร็จ",
        description: "ระบบบันทึกการมอบรางวัลแล้ว",
      });
    } catch (error) {
      console.error("Mark claimed error:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error instanceof Error ? error.message : "ไม่สามารถบันทึกได้",
        variant: "destructive",
      });
    } finally {
      setMarking(false);
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
              ใส่รหัสรับรางวัล 4 หลักเพื่อตรวจสอบและมอบรางวัล
            </p>
          </div>

          <div className="pirate-divider" />

          {/* Search Box */}
          <div className="space-y-4">
            <Label htmlFor="claimCode" className="text-lg">
              รหัสรับรางวัล (4 หลัก)
            </Label>
            <div className="flex gap-3">
              <Input
                id="claimCode"
                type="text"
                maxLength={4}
                placeholder="1234"
                value={claimCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setClaimCode(value);
                }}
                onKeyPress={handleKeyPress}
                className="text-3xl text-center font-mono tracking-widest"
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
                    ค้นหา
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    ตรวจสอบ
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="pirate-divider" />

              {result.found ? (
                <>
                  {/* Participant Info */}
                  <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-6 space-y-4">
                    <h3 className="text-2xl font-bold text-primary flex items-center gap-2">
                      <User className="h-6 w-6" />
                      ข้อมูลผู้รับรางวัล
                    </h3>
                    
                    <div className="grid gap-4">
                      <div>
                        <p className="text-sm text-foreground/60 mb-1">ชื่อ-นามสกุล</p>
                        <p className="text-2xl font-bold text-primary">
                          {result.participantName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prize Status */}
                  {result.claimed ? (
                    <div className="rounded-2xl border-2 border-red-400/50 bg-red-50 p-6 space-y-4">
                      <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        รางวัลนี้มอบไปแล้ว
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-white border border-red-300">
                          <p className="text-sm text-foreground/60 mb-2">รางวัลที่ได้รับ</p>
                          <p className="text-3xl font-bold text-red-600 flex items-center gap-2">
                            <Gift className="h-8 w-8" />
                            {result.prize}
                          </p>
                        </div>
                        
                        {result.claimedAt && (
                          <div>
                            <p className="text-sm text-foreground/60 mb-1">วันที่มอบรางวัล</p>
                            <p className="text-lg font-semibold text-foreground">
                              {new Date(result.claimedAt).toLocaleString('th-TH', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        )}

                        <div className="p-4 rounded-lg bg-red-100 border-2 border-red-400">
                          <p className="text-lg font-bold text-red-700 text-center">
                            ⚠️ รางวัลนี้ถูกรับไปแล้ว กรุณาตรวจสอบอีกครั้ง
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border-2 border-green-400/50 bg-green-50 p-6 space-y-4">
                      <h3 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6" />
                        พร้อมมอบรางวัล
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="p-6 rounded-lg bg-white border-2 border-green-400">
                          <p className="text-sm text-foreground/60 mb-2">รางวัล</p>
                          <p className="text-4xl font-bold text-green-600 flex items-center gap-3">
                            <Gift className="h-10 w-10" />
                            {result.prize}
                          </p>
                        </div>

                        <div className="p-6 rounded-lg bg-green-100 border-2 border-green-400 text-center space-y-4">
                          <p className="text-lg font-semibold text-green-800">
                            ✅ ยืนยันตัวตนสำเร็จ
                          </p>
                          <p className="text-sm text-green-700">
                            กรุณามอบรางวัลให้ผู้รับ แล้วกดปุ่มด้านล่างเพื่อยืนยันการมอบรางวัล
                          </p>
                          <Button
                            onClick={handleMarkClaimed}
                            disabled={marking}
                            size="lg"
                            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                          >
                            {marking ? (
                              <>
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                กำลังบันทึก...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-5 w-5" />
                                ยืนยันการมอบรางวัลแล้ว
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border-2 border-foreground/20 bg-foreground/5 p-8 text-center">
                  <XCircle className="h-16 w-16 text-foreground/40 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-foreground/80 mb-2">
                    ไม่พบรหัสนี้
                  </h3>
                  <p className="text-foreground/60">
                    กรุณาตรวจสอบรหัสและลองอีกครั้ง
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/admin")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับหน้า Admin
            </Button>
            
            {result && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setClaimCode("");
                  setResult(null);
                }}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                ตรวจสอบรหัสใหม่
              </Button>
            )}
          </div>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default PrizeVerification;
