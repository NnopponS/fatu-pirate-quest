import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, QrCode, Loader2, Download } from "lucide-react";
import QRCode from "qrcode";
import { signCheckin, todayStr } from "@/lib/crypto";
import { CHECKIN_SECRET } from "@/lib/constants";

interface LocationRecord {
  id: number;
  name: string;
  points: number;
  map_url?: string;
  image_url?: string;
  description?: string;
  qr_code_version?: number;
}

interface Props {
  location: LocationRecord;
  onSave: (location: LocationRecord) => Promise<void>;
  onGenerateQR: (locationId: number) => Promise<void>;
}

export const AdminLocationManager = ({ location, onSave, onGenerateQR }: Props) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState(location);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Sync draft state when location prop changes (after save/refresh)
  useEffect(() => {
    setDraft(location);
  }, [location]);

  // Generate QR code when component mounts or version changes
  useEffect(() => {
    const generateCurrentQR = async () => {
      try {
        const currentVersion = location.qr_code_version ?? 1;
        const secret = CHECKIN_SECRET;
        const dateStr = todayStr();
        const sig = await signCheckin(location.id, dateStr, secret, currentVersion);
        
        // Use relative path (works everywhere - no domain needed)
        // Format: CHECKIN|loc|sig|version
        const checkinData = `CHECKIN|${location.id}|${sig}|${currentVersion}`;
        
        const qrDataUrl = await QRCode.toDataURL(checkinData, {
          width: 512,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        
        setQrDataUrl(qrDataUrl);
      } catch (error) {
        console.error("Failed to generate QR code preview:", error);
      }
    };

    generateCurrentQR();
  }, [location.id, location.qr_code_version]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "ไฟล์ใหญ่เกินไป",
        description: "กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `location-${location.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("location-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("location-images")
        .getPublicUrl(filePath);

      setDraft({ ...draft, image_url: data.publicUrl });
      
      toast({
        title: "อัปโหลดรูปภาพสำเร็จ",
        description: "อย่าลืมบันทึกการเปลี่ยนแปลง",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "อัปโหลดไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    try {
      // Regenerate QR version first (this will trigger useEffect to update the displayed QR)
      await onGenerateQR(location.id);
      
      toast({
        title: "สร้าง QR Code ใหม่สำเร็จ",
        description: "QR code เวอร์ชันเก่าจะใช้ไม่ได้แล้ว",
      });
    } catch (error) {
      console.error("QR generation error:", error);
      toast({
        title: "สร้าง QR ไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `qr-location-${location.id}-v${location.qr_code_version ?? 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "ดาวน์โหลดสำเร็จ",
      description: "QR code ถูกบันทึกลงเครื่องแล้ว",
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          จุดที่ {location.id}: {location.name}
        </h3>
        <span className="text-sm text-foreground/60">QR v{draft.qr_code_version ?? 1}</span>
      </div>

      {/* QR Code Display */}
      {qrDataUrl && (
        <div className="space-y-3">
          <Label>QR Code ปัจจุบัน (เวอร์ชัน {location.qr_code_version ?? 1})</Label>
          <div className="flex flex-col items-center gap-3 rounded-lg border border-primary/10 bg-white p-4">
            <img 
              src={qrDataUrl} 
              alt={`QR Code for ${location.name}`} 
              className="h-64 w-64 rounded-lg shadow-md"
            />
            <p className="text-center text-xs text-foreground/60">
              สแกน QR code นี้เพื่อเช็กอินที่ {location.name}
            </p>
            
            {/* Debug info */}
            <details className="w-full text-xs">
              <summary className="cursor-pointer text-foreground/60 hover:text-foreground text-center">
                🔍 ดูข้อมูล QR Code
              </summary>
              <div className="mt-2 space-y-2 rounded border border-primary/10 bg-primary/5 p-3">
                <div>
                  <strong>Format:</strong> CHECKIN|loc|sig|version
                </div>
                <div>
                  <strong>Location ID:</strong> {location.id}
                </div>
                <div>
                  <strong>Version:</strong> {location.qr_code_version ?? 1}
                </div>
                <div className="pt-2 border-t border-primary/10">
                  <strong>วิธีทดสอบ:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-1 text-foreground/70">
                    <li>เปิดหน้า /map บนมือถือ</li>
                    <li>กดปุ่ม "เปิดกล้องสแกน QR"</li>
                    <li>สแกน QR code นี้</li>
                    <li>ตรวจสอบ Console (F12) เพื่อดู debug logs</li>
                  </ol>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}

      {draft.image_url && (
        <div className="space-y-2">
          <Label>รูปภาพปกสถานที่</Label>
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <img src={draft.image_url} alt={draft.name} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ชื่อสถานที่ *</Label>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="ชื่อสถานที่"
          />
        </div>

        <div className="space-y-2">
          <Label>คะแนน *</Label>
          <Input
            type="number"
            value={draft.points}
            onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
            placeholder="คะแนน"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Google Maps Link</Label>
        <Input
          value={draft.map_url ?? ""}
          onChange={(e) => setDraft({ ...draft, map_url: e.target.value })}
          placeholder="https://maps.app.goo.gl/..."
        />
      </div>

      <div className="space-y-2">
        <Label>รายละเอียดสถานที่</Label>
        <Textarea
          value={draft.description ?? ""}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="อธิบายสถานที่..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>รูปภาพปก</Label>
        <div className="flex gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="flex-1"
          />
          {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          บันทึกการเปลี่ยนแปลง
        </Button>
        <Button
          onClick={handleGenerateQR}
          disabled={generatingQR}
          variant="secondary"
          className="gap-2"
        >
          {generatingQR ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
          สร้าง QR ใหม่
        </Button>
        <Button
          onClick={handleDownloadQR}
          disabled={!qrDataUrl}
          variant="outline"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          ดาวน์โหลด QR
        </Button>
      </div>
    </div>
  );
};
