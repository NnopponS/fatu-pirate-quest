import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getGeminiSettings, saveGeminiSettings } from "@/services/gemini";
import { Save, Eye, EyeOff, Loader2, Bot, ExternalLink } from "lucide-react";

interface GeminiSettingsTabProps {
  token: string | null;
}

export const GeminiSettingsTab = ({ token }: GeminiSettingsTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [knowledgeBase, setKnowledgeBase] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getGeminiSettings();
      if (settings) {
        setApiKey(settings.apiKey || "");
        setKnowledgeBase(settings.knowledgeBase || "");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      toast({
        title: "ไม่สามารถบันทึกได้",
        description: "กรุณาเข้าสู่ระบบใหม่",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "กรุณากรอก API Key",
        description: "ต้องมี Gemini API Key เพื่อใช้งาน Chatbot",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await saveGeminiSettings(token, {
        apiKey: apiKey.trim(),
        knowledgeBase: knowledgeBase.trim() || undefined,
      });

      toast({
        title: "บันทึกสำเร็จ",
        description: "ตั้งค่า Gemini AI Chatbot สำเร็จแล้ว",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pirate-card px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">ตั้งค่า AI Chatbot โจรสลัด</h2>
          <p className="text-sm text-foreground/70">
            กำหนดค่า Gemini API และข้อมูลสำหรับ Chatbot
          </p>
        </div>
      </div>

      <div className="pirate-divider" />

      {/* API Key Section */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-blue-900 font-semibold">
                วิธีการรับ Gemini API Key:
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>ไปที่ <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold inline-flex items-center gap-1"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a></li>
                <li>เข้าสู่ระบบด้วย Google Account</li>
                <li>คลิก "Create API Key"</li>
                <li>คัดลอก API Key มาวางด้านล่าง</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">Gemini API Key *</Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="flex-1 font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-foreground/60">
            API Key จะถูกเก็บไว้อย่างปลอดภัยใน Firebase
          </p>
        </div>
      </div>

      <div className="pirate-divider" />

      {/* Knowledge Base Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="knowledgeBase">ฐานความรู้ / Context (ไม่บังคับ)</Label>
          <p className="text-sm text-foreground/60 mt-1 mb-3">
            ใส่ข้อมูลเพิ่มเติมเกี่ยวกับงาน เช่น รายละเอียดกิจกรรม, หลักสูตร, สถานที่ต่างๆ
          </p>
        </div>
        
        <Textarea
          id="knowledgeBase"
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          placeholder={`ตัวอย่าง:

คณะศิลปกรรมศาสตร์ มธ. มีหลักสูตร:
- ทัศนศิลป์
- ดนตรี
- การออกแบบ
- ศิลปะการแสดง

สถานที่ในงาน:
1. อาคารเรียนรวม - Workshop ศิลปะ
2. หอแสดงผลงาน - นิทรรศการ
3. ห้องดนตรี - คอนเสิร์ตมินิ
4. สตูดิโอ - การแสดง

กิจกรรมพิเศษ:
- Talk กับศิษย์เก่า เวลา 10:00-12:00
- Workshop ทำงานศิลป์ เวลา 13:00-15:00
...`}
          rows={15}
          className="font-mono text-sm"
        />
        
        <p className="text-xs text-foreground/60">
          💡 ข้อมูลนี้จะถูกใช้เพื่อช่วย AI ตอบคำถามเกี่ยวกับงานได้แม่นยำขึ้น
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          onClick={loadSettings}
          variant="outline"
          disabled={saving}
        >
          รีเซ็ต
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !apiKey.trim()}
          className="gap-2 pirate-button"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              บันทึกการตั้งค่า
            </>
          )}
        </Button>
      </div>

      {/* Warning */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-sm text-amber-900">
          <strong>⚠️ คำเตือน:</strong> AI อาจตอบผิดพลาดได้ ควรแจ้งผู้ใช้ให้ตรวจสอบข้อมูลกับเจ้าหน้าที่อีกครั้ง
        </p>
      </div>
    </div>
  );
};

