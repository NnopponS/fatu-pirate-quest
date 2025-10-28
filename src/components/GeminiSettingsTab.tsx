import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getGeminiSettings, saveGeminiSettings } from "@/services/gemini";
import { Save, Loader2, Bot, ExternalLink, Plus, Trash2 } from "lucide-react";

interface GeminiSettingsTabProps {
  token: string | null;
}

export const GeminiSettingsTab = ({ token }: GeminiSettingsTabProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geminiApiKeys, setGeminiApiKeys] = useState<string[]>(['']);
  const [knowledgeBase, setKnowledgeBase] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settings = await getGeminiSettings();
      if (settings) {
        setGeminiApiKeys(settings.geminiApiKeys && settings.geminiApiKeys.length > 0 ? settings.geminiApiKeys : ['']);
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
      // Filter out empty keys
      const validKeys = geminiApiKeys.filter(key => key.trim());
      
      await saveGeminiSettings(token, {
        geminiApiKeys: validKeys.length > 0 ? validKeys : undefined,
        knowledgeBase: knowledgeBase.trim() || undefined,
      });

      toast({
        title: "บันทึกสำเร็จ",
        description: `ตั้งค่า AI Chatbot สำเร็จแล้ว (${validKeys.length} API Keys)`,
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
            ใช้ <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Gemini</a> Direct API
          </p>
        </div>
      </div>

      <div className="pirate-divider" />

      {/* Google Gemini API Key */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-start gap-2">
            <div className="text-green-600 text-xl">✨</div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-green-900 font-semibold">
                ใช้ Google Gemini Direct API
              </p>
              <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                <li>Model: <strong>Gemini 2.0 Flash Experimental</strong> - เร็ว ฉลาด</li>
                <li>Free tier - 60 requests/min สำหรับ production</li>
                <li>ไม่มี rate limit issues เหมือน OpenRouter</li>
                <li>ได้ API Key ฟรีจาก <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold inline-flex items-center gap-1"
                >
                  Google AI Studio
                  <ExternalLink className="h-3 w-3" />
                </a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Google Gemini API Keys (จำเป็น)</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setGeminiApiKeys([...geminiApiKeys, ''])}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              เพิ่ม Key
            </Button>
          </div>

          <div className="space-y-3">
            {geminiApiKeys.map((key, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground/70 w-16">
                      Key {index + 1}:
                    </span>
                    <Input
                      type="password"
                      value={key}
                      onChange={(e) => {
                        const newKeys = [...geminiApiKeys];
                        newKeys[index] = e.target.value;
                        setGeminiApiKeys(newKeys);
                      }}
                      placeholder="AIza..."
                      className="flex-1"
                    />
                    {geminiApiKeys.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setGeminiApiKeys(geminiApiKeys.filter((_, i) => i !== index));
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {index === 0 && (
                    <p className="text-xs text-foreground/60 ml-16">
                      ⭐ Key หลัก - จะลองอันนี้ก่อน
                    </p>
                  )}
                  {index > 0 && (
                    <p className="text-xs text-orange-600 ml-16">
                      🔄 Fallback Key {index} - ใช้ถ้า key ก่อนหน้าหมด
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900 font-semibold mb-1">
              💡 วิธีใช้งาน Multiple API Keys:
            </p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside ml-2">
              <li>ใส่หลาย keys เพื่อป้องกัน rate limit</li>
              <li>ระบบจะลอง Key 1 ก่อน ถ้าหมดจะไปใช้ Key 2, 3, ... อัตโนมัติ</li>
              <li>สมัคร API Key ฟรีได้ที่{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-semibold"
                >
                  Google AI Studio
                </a>
              </li>
              <li>Free tier: 60 requests/min - เพียงพอสำหรับใช้งาน</li>
            </ul>
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

