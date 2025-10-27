import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getMapData } from "@/services/firebase";
import { firebaseDb } from "@/integrations/firebase/database";
import { Button } from "@/components/ui/button";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { PirateChatbot } from "@/components/PirateChatbot";
import { BottleQuestModal } from "@/components/BottleQuestModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Anchor, 
  Trophy, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Clock,
  User,
  LogOut,
  Gift,
  Target,
  Calendar,
  QrCode,
  Ticket
} from "lucide-react";

interface Location {
  id: number;
  name: string;
  points: number;
  imageUrl?: string;
}

interface CheckinRecord {
  location_id: number;
  created_at: string;
}

interface SubEventCheckin {
  sub_event_id: string;
  location_id: number;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const participantId = useMemo(() => localStorage.getItem("participantId"), []);
  
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [pointsRequired, setPointsRequired] = useState(400);
  const [locations, setLocations] = useState<Location[]>([]);
  const [checkins, setCheckins] = useState<number[]>([]);
  const [checkinsData, setCheckinsData] = useState<CheckinRecord[]>([]);
  const [subEventCheckins, setSubEventCheckins] = useState<SubEventCheckin[]>([]);
  const [participantName, setParticipantName] = useState("");
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [prizeInfo, setPrizeInfo] = useState<{prize: string; claimCode: string; claimed: boolean} | null>(null);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [questLocation, setQuestLocation] = useState<any>(null);

  const handleLogout = useCallback(() => {
    logout();
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "แล้วพบกันใหม่ในการผจญภัยครั้งหน้า!",
    });
    navigate("/");
  }, [logout, toast, navigate]);

  const loadData = useCallback(async () => {
    if (!participantId) return;
    
    setLoading(true);
    try {
      const data = await getMapData(participantId);
      
      setLocations(data.locations || []);
      setCheckins(data.checkins || []);
      setPoints(data.points || 0);
      setPointsRequired(data.pointsRequired || 400);
      setParticipantName(data.participantName || "ลูกเรือ");
      
      // Get detailed checkin data with timestamps
      if (data.checkinsData) {
        setCheckinsData(data.checkinsData);
      }
      
      if (data.subEventCheckins) {
        setSubEventCheckins(data.subEventCheckins);
      }

      // Load prize info (claim code)
      try {
        const spin = await firebaseDb.get<{prize: string; claim_code: string; claimed: boolean}>(`spins/${participantId}`);
        if (spin && spin.claim_code) {
          setPrizeInfo({
            prize: spin.prize,
            claimCode: spin.claim_code,
            claimed: spin.claimed || false
          });
        }
      } catch (err) {
        console.log("No prize yet");
      }
    } catch (error) {
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [participantId, toast]);

  useEffect(() => {
    if (!participantId) {
      toast({
        title: "ท่านต้องเข้าสู่ระบบก่อน",
        description: "กรุณาเข้าสู่ระบบเพื่อดู Dashboard",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    loadData();
  }, [participantId, navigate, loadData, toast]);

  // Calculate progress
  const completedLocations = locations.filter(loc => checkins.includes(loc.id));
  const progressPercentage = locations.length > 0 ? (completedLocations.length / locations.length) * 100 : 0;
  const canSpin = points >= pointsRequired;

  // Sort timeline by date (most recent first)
  const timeline = useMemo(() => {
    const events: Array<{
      type: 'checkin' | 'subevent';
      locationId: number;
      locationName: string;
      timestamp: string;
      subEventId?: string;
    }> = [];

    // Add checkins
    checkinsData.forEach(checkin => {
      const location = locations.find(l => l.id === checkin.location_id);
      if (location) {
        events.push({
          type: 'checkin',
          locationId: checkin.location_id,
          locationName: location.name,
          timestamp: checkin.created_at
        });
      }
    });

    // Add sub-event checkins
    subEventCheckins.forEach(subEvent => {
      const location = locations.find(l => l.id === subEvent.location_id);
      if (location) {
        events.push({
          type: 'subevent',
          locationId: subEvent.location_id,
          locationName: location.name,
          timestamp: subEvent.created_at,
          subEventId: subEvent.sub_event_id
        });
      }
    });

    // Sort by timestamp (newest first)
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [checkinsData, subEventCheckins, locations]);

  if (loading) {
    return (
      <PirateBackdrop>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-xl text-foreground/70">กำลังโหลดข้อมูลท่าน...</p>
          </div>
        </div>
      </PirateBackdrop>
    );
  }

  return (
    <PirateBackdrop>
      <PirateCharacter 
        messages={[
          `อาฮอย ${participantName}! ข้าต้อนรับเจ้ากลับมายังท่าเรือ! 🏴‍☠️`,
          "เจ้าได้สำรวจเกาะสมบัติไปแล้วเท่าไหร่แล้ว? 🗺️",
          "คลิกที่ข้าได้ถ้าอยากคุยนะ! 💬",
          "อย่าลืมเช็กอินครบทุกจุดนะ! ⚓",
          "ยังมีสมบัติอีกมากรออยู่เจ้า! 💎",
        ]}
        onChatbotOpen={() => setChatbotOpen(true)}
      />
      
      {/* AI Chatbot */}
      <PirateChatbot 
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
      />
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="pirate-card px-6 py-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  ยินดีต้อนรับกลับ, {participantName}
                </h1>
                <p className="text-sm text-foreground/70">ท่าเรือโจรสลัด FATU</p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>

          {/* Claim Code Display - Only show if user has won a prize */}
          {prizeInfo && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-amber-300 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="h-5 w-5 text-amber-600" />
                    <h3 className="font-bold text-amber-900">
                      {prizeInfo.claimed ? '✅ รางวัลที่ได้รับ' : '🎁 รหัสรับรางวัล'}
                    </h3>
                  </div>
                  <p className="text-lg font-bold text-amber-700 mb-1">{prizeInfo.prize}</p>
                  <div className="flex items-center gap-3">
                    <code className="text-3xl font-mono font-bold text-amber-900 bg-white px-4 py-2 rounded-lg border-2 border-amber-400">
                      {prizeInfo.claimCode}
                    </code>
                    {prizeInfo.claimed ? (
                      <span className="px-3 py-1 bg-green-100 border-2 border-green-500 rounded-full text-green-800 text-sm font-bold">
                        รับแล้ว ✓
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 border-2 border-red-500 rounded-full text-red-800 text-sm font-bold animate-pulse">
                        ยังไม่ได้รับ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    {prizeInfo.claimed 
                      ? '✨ เจ้าได้รับรางวัลนี้ไปแล้ว' 
                      : '💡 แสดงรหัสนี้กับเจ้าหน้าที่เพื่อรับรางวัล'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <Target className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">{points}</p>
              <p className="text-xs text-foreground/70">คะแนนสะสม</p>
            </div>
            
            <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
              <MapPin className="h-5 w-5 text-accent mb-2" />
              <p className="text-2xl font-bold text-accent">{completedLocations.length}/{locations.length}</p>
              <p className="text-xs text-foreground/70">สถานที่เช็กอิน</p>
            </div>
            
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
              <CheckCircle2 className="h-5 w-5 text-secondary mb-2" />
              <p className="text-2xl font-bold text-secondary">{subEventCheckins.length}</p>
              <p className="text-xs text-foreground/70">กิจกรรมที่ร่วม</p>
            </div>
            
            <div className={`p-4 rounded-xl border ${canSpin ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
              <Trophy className={`h-5 w-5 mb-2 ${canSpin ? 'text-green-600' : 'text-gray-400'}`} />
              <p className={`text-2xl font-bold ${canSpin ? 'text-green-600' : 'text-gray-400'}`}>
                {canSpin ? '✓' : '✗'}
              </p>
              <p className="text-xs text-foreground/70">หมุนวงล้อ</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pirate-card px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Target className="h-5 w-5" />
              ความคืบหน้าการสำรวจ
            </h2>
            <span className="text-sm font-semibold text-primary">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-foreground/70 mt-2">
            เช็กอินแล้ว {completedLocations.length} จาก {locations.length} สถานที่
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/map")}
            className="h-auto py-6 flex-col gap-2 pirate-button"
          >
            <MapPin className="h-6 w-6" />
            <span>แผนที่สมบัติ</span>
          </Button>
          
          <Button
            size="lg"
            onClick={() => navigate("/rewards")}
            className={`h-auto py-6 flex-col gap-2 ${canSpin ? 'pirate-button' : 'opacity-50'}`}
            disabled={!canSpin}
          >
            <Trophy className="h-6 w-6" />
            <span>หมุนวงล้อ</span>
          </Button>
          
          <Button
            size="lg"
            onClick={() => navigate("/profile")}
            variant="outline"
            className="h-auto py-6 flex-col gap-2"
          >
            <User className="h-6 w-6" />
            <span>ข้อมูลข้า</span>
          </Button>
        </div>

        {/* Locations Progress */}
        <div className="pirate-card px-6 py-6 space-y-4">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            สถานที่ทั้งหมด
          </h2>

          <div className="grid gap-4">
            {locations.map(location => {
              const isCheckedIn = checkins.includes(location.id);
              const locationSubEvents = subEventCheckins.filter(se => se.location_id === location.id);
              
              return (
                <div 
                  key={location.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isCheckedIn 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isCheckedIn ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <h3 className={`text-lg font-bold ${isCheckedIn ? 'text-green-700' : 'text-gray-700'}`}>
                          {location.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className={isCheckedIn ? 'text-green-600' : 'text-gray-500'}>
                          <Gift className="inline h-4 w-4 mr-1" />
                          {location.points} คะแนน
                        </span>
                        
                        {locationSubEvents.length > 0 && (
                          <span className="text-secondary">
                            <CheckCircle2 className="inline h-4 w-4 mr-1" />
                            {locationSubEvents.length} กิจกรรม
                          </span>
                        )}
                      </div>
                      
                      {!isCheckedIn && (
                        <p className="text-sm text-gray-600 mt-2">
                          ⚠️ ท่านยังไม่ได้เช็กอินที่นี่
                        </p>
                      )}
                    </div>
                    
                    {location.imageUrl && (
                      <img 
                        src={location.imageUrl} 
                        alt={location.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="pirate-card px-6 py-6 space-y-4">
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            เส้นทางการผจญภัยของเจ้า
          </h2>

          {timeline.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg text-gray-500">ท่านยังไม่ได้เริ่มการผจญภัย</p>
              <p className="text-sm text-gray-400 mt-2">ออกเดินทางไปยังแผนที่เพื่อเริ่มต้น!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeline.map((event, idx) => (
                <div 
                  key={`${event.type}-${event.locationId}-${idx}`}
                  className="flex gap-4 animate-in fade-in slide-in-from-left"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      event.type === 'checkin' 
                        ? 'bg-primary text-white' 
                        : 'bg-secondary text-white'
                    }`}>
                      {event.type === 'checkin' ? (
                        <MapPin className="h-5 w-5" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-300" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pb-4">
                    <div className="p-4 rounded-xl border bg-white shadow-sm">
                      <p className="font-semibold text-foreground">
                        {event.type === 'checkin' ? '⚓ เช็กอินที่' : '🎯 ร่วมกิจกรรมที่'} {event.locationName}
                      </p>
                      <p className="text-sm text-foreground/60 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(event.timestamp).toLocaleString('th-TH', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/map")}
            className="pirate-button gap-2 h-20"
          >
            <MapPin className="h-6 w-6" />
            <div className="text-left">
              <p className="font-bold">แผนที่</p>
              <p className="text-xs opacity-90">ไปหาสมบัติ</p>
            </div>
          </Button>

          <Button
            size="lg"
            onClick={() => navigate("/map")}
            variant="secondary"
            className="gap-2 h-20"
          >
            <QrCode className="h-6 w-6" />
            <div className="text-left">
              <p className="font-bold">สแกน QR</p>
              <p className="text-xs opacity-90">เช็กอิน/กิจกรรม</p>
            </div>
          </Button>

          <Button
            size="lg"
            onClick={() => navigate("/rewards")}
            className={`gap-2 h-20 ${canSpin ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 hover:bg-gray-500'}`}
          >
            <Trophy className="h-6 w-6" />
            <div className="text-left">
              <p className="font-bold">หมุนวงล้อ</p>
              <p className="text-xs opacity-90">
                {canSpin ? 'พร้อมหมุนแล้ว!' : `อีก ${pointsRequired - points} คะแนน`}
              </p>
            </div>
          </Button>
        </div>

        {/* Call to Action */}
        {!canSpin && (
          <div className="pirate-card px-6 py-8 text-center bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
            <Trophy className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-amber-900 mb-2">
              เจ้าใกล้จะได้หมุนวงล้อแล้ว!
            </h3>
            <p className="text-amber-800 mb-4">
              ต้องการอีก <span className="font-bold text-2xl">{pointsRequired - points}</span> คะแนน
            </p>
            <p className="text-sm text-amber-700">
              สแกน QR code เพื่อเช็กอินและร่วมกิจกรรมเพื่อรับคะแนน!
            </p>
          </div>
        )}
      </div>

      {/* Quest Modal */}
      <BottleQuestModal
        isOpen={questModalOpen}
        onClose={() => setQuestModalOpen(false)}
        locationName={questLocation?.name || ""}
        subEvents={questLocation?.subEvents || []}
        alreadyCheckedIn={questLocation?.alreadyCheckedIn || false}
        completedSubEvents={questLocation?.completedSubEvents || []}
      />
    </PirateBackdrop>
  );
};

export default Dashboard;

