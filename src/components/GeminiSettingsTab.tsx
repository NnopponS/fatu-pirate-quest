import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getGeminiSettings, saveGeminiSettings } from "@/services/gemini";
import { Save, Loader2, Bot, ExternalLink } from "lucide-react";

interface GeminiSettingsTabProps {
  token: string | null;
}

export const GeminiSettingsTab = ({ token }: GeminiSettingsTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getGeminiSettings();
      if (settings) {
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

    setSaving(true);
    try {
      await saveGeminiSettings(token, {
        knowledgeBase: knowledgeBase.trim() || undefined,
      });

      toast({
        title: "บันทึกสำเร็จ",
        description: "ตั้งค่า AI Chatbot สำเร็จแล้ว (ใช้ Puter.js ฟรี!)",
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
            ใช้ <a href="https://developer.puter.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Puter.js</a> - ฟรี ไม่ต้อง API Key!
          </p>
        </div>
      </div>

      <div className="pirate-divider" />

      {/* Puter.js Info */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-start gap-2">
            <div className="text-green-600 text-xl">✨</div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-green-900 font-semibold">
                ตอนนี้ใช้ Puter.js - AI ฟรี!
              </p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>ไม่ต้องมี API Key</li>
                <li>ไม่มีค่าใช้จ่าย (Free Forever)</li>
                <li>รองรับ Gemini, Claude, GPT และอีกมากมาย</li>
                <li>พัฒนาโดย <a 
                  href="https://puter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold inline-flex items-center gap-1"
                >
                  Puter.com
                  <ExternalLink className="h-3 w-3" />
                </a></li>
              </ul>
            </div>
          </div>
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
          disabled={saving}
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

