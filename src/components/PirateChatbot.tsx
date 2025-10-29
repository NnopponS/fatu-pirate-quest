import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { chatWithPirate } from "@/services/gemini";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface PirateChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PirateChatbot = ({ isOpen, onClose }: PirateChatbotProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "อาฮอย! ข้าคือ กัปตันฟาตู โจรสลัดผู้เฒ่าแต่ฉลาด! 🏴‍☠️\n\nข้ามาช่วยเจ้าในการผจญภัย FATU Treasure Quest นี้! เจ้าสามารถถามข้าได้ทุกเรื่อง:\n\n⚓ เกี่ยวกับงานและกิจกรรม\n🗺️ สถานที่และแผนที่\n💎 คะแนนและรางวัล\n🎓 คณะศิลปกรรมศาสตร์ มธ.\n🎨 หลักสูตรและการเรียน\n\nอย่าอาย ถามมาเลย! ข้าตอบได้หมดทุกเรื่อง! 💪⚓",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [showAiStatus, setShowAiStatus] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user context when chatbot opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserContext();
    }
  }, [isOpen, user]);

  // OpenRouter AI is always ready (no loading needed)
  useEffect(() => {
    if (isOpen) {
      setAiReady(true);
      setShowAiStatus(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowAiStatus(false), 3000);
    }
  }, [isOpen]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadUserContext = async () => {
    if (!user) return;

    try {
      const { getMapData } = await import("@/services/firebase");
      const { firebaseDb } = await import("@/integrations/firebase/database");
      
      const [mapData, spinData, participant] = await Promise.all([
        getMapData(user.id),
        firebaseDb.get<any>(`spins/${user.id}`),
        firebaseDb.get<any>(`participants/${user.id}`)
      ]);

      const locationNames = mapData.locations.map((loc: any) => loc.name);
      const checkedInLocationNames = mapData.locations
        .filter((loc: any) => mapData.checkins.includes(loc.id))
        .map((loc: any) => loc.name);

      const userName = participant 
        ? `${participant.first_name || ""} ${participant.last_name || ""}`.trim() 
        : undefined;

      setUserContext({
        name: userName,
        points: mapData.points,
        pointsRequired: mapData.pointsRequired,
        checkedInLocations: checkedInLocationNames,
        totalLocations: mapData.locations.length,
        completedSubEvents: mapData.subEventCheckins?.length || 0,
        hasSpun: Boolean(spinData),
        prize: spinData?.prize
      });
    } catch (error) {
      console.error("Failed to load user context:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      console.log('[Chatbot] Sending message to AI...', { input: input.trim(), hasContext: !!userContext });
      const response = await chatWithPirate(input.trim(), userContext);
      console.log('[Chatbot] Received response from AI');
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[Chatbot] Chat error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถติดต่อข้าได้ในขณะนี้";
      
      // Show detailed error in toast
      toast({
        title: "ข้าไม่สามารถตอบได้",
        description: errorMessage,
        variant: "destructive"
      });

      // Show user-friendly error in chat
      let chatErrorMessage = "โทษทีเจ้า... ข้ากำลังมีปัญหาในการตอบคำถามขณะนี้";
      
      if (errorMessage.includes("โหลด") || errorMessage.includes("load")) {
        chatErrorMessage = "ระบบ AI ยังโหลดไม่เสร็จ กรุณารอสักครู่แล้วลองใหม่ หรือรีเฟรชหน้าเว็บ 🔄";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("คิดนาน")) {
        chatErrorMessage = "ข้าคิดนานเกินไป! ลองถามใหม่อีกครั้งนะ หรือลองทำให้คำถามสั้นลงดู 🤔";
      } else if (errorMessage.includes("network") || errorMessage.includes("อินเทอร์เน็ต")) {
        chatErrorMessage = "ข้าติดต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตของเจ้าดูนะ 📶";
      }
      
      const errorMsg: Message = {
        role: "assistant",
        content: chatErrorMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border-4 border-primary z-50 animate-in slide-in-from-bottom-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary to-secondary text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="text-3xl">🏴‍☠️</div>
          <div>
            <h3 className="font-bold text-lg">โจรสลัด FATU</h3>
            <p className="text-xs text-white/80">พร้อมช่วยเหลือเจ้า</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-br-none"
                    : "bg-amber-50 text-foreground border-2 border-amber-200 rounded-bl-none"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="text-xl mb-1">🏴‍☠️</div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-white/70" : "text-foreground/50"}`}>
                  {msg.timestamp.toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start animate-in fade-in">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-foreground/70">ข้ากำลังคิด...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-xl">
        {/* AI Status Indicator */}
        {showAiStatus && aiReady === null && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังเตรียมระบบ AI...</span>
            </div>
          </div>
        )}
        {showAiStatus && aiReady === false && (
          <div className="mb-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg animate-in fade-in">
            <div className="text-sm text-red-700">
              <p className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                ⚠️ ระบบ AI ไม่พร้อมใช้งาน
              </p>
              <p className="text-xs mt-1">กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          </div>
        )}
        {showAiStatus && aiReady === true && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg animate-in fade-in">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span>✅ ระบบ AI พร้อมแล้ว!</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={aiReady === false ? "ระบบ AI ไม่พร้อม..." : "ถามข้าสิ... (เช่น มีกิจกรรมอะไรบ้าง? ได้คะแนนยังไง?)"}
            disabled={loading || aiReady === false}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading || aiReady === false}
            className="pirate-button"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="text-xs text-center text-foreground/50 mt-2 space-y-1">
          <p>⚠️ AI อาจตอบผิดพลาด ตรวจสอบกับเจ้าหน้าที่อีกครั้ง</p>
          <p className="text-[10px]">💡 ลองถาม: "มีกิจกรรมอะไรบ้าง?" "ได้คะแนนยังไง?" "คณะมีหลักสูตรอะไร?"</p>
        </div>
      </div>
    </div>
  );
};

