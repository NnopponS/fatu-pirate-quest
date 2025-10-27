import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Send, Loader2, MessageCircle } from "lucide-react";
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
      content: "อาฮอย! ข้าคือโจรสลัดประจำการของ FATU Treasure Quest เจ้ามีคำถามอะไรสำหรับข้าบ้างหรือไร? ข้าพร้อมช่วยเหลือเจ้าในการผจญภัยครั้งนี้! 🏴‍☠️",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user context when chatbot opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserContext();
    }
  }, [isOpen, user]);

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
      const response = await chatWithPirate(input.trim(), userContext);
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "ไม่สามารถติดต่อข้าได้ในขณะนี้";
      
      // Check if it's an API key issue
      if (errorMessage.includes("API") || errorMessage.includes("configured")) {
        toast({
          title: "ข้าไม่สามารถตอบได้",
          description: "ท่านผู้ดูแลยังไม่ได้ตั้งค่า API Key สำหรับข้า กรุณาติดต่อผู้ดูแลระบบ",
          variant: "destructive"
        });
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: errorMessage,
          variant: "destructive"
        });
      }

      const errorMsg: Message = {
        role: "assistant",
        content: "โทษทีเจ้า... ข้ากำลังมีปัญหาในการตอบคำถามขณะนี้ ลองถามข้าใหม่อีกครั้งได้ไหม? 🏴‍☠️",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="ถามข้าสิ... (เช่น มีอะไรน่าทำบ้าง?)"
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="pirate-button"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-foreground/50 mt-2">
          ⚠️ ข้าอาจตอบผิดพลาดได้ กรุณาตรวจสอบข้อมูลอีกครั้ง
        </p>
      </div>
    </div>
  );
};

