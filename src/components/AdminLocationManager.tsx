import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, QrCode, Loader2 } from "lucide-react";
import QRCode from "qrcode";

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
      await onGenerateQR(location.id);
      
      // Generate QR code image for download
      const checkinUrl = `${window.location.origin}/checkin?locationId=${location.id}&v=${(draft.qr_code_version ?? 1) + 1}`;
      const qrDataUrl = await QRCode.toDataURL(checkinUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Download QR code
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `qr-location-${location.id}-v${(draft.qr_code_version ?? 1) + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDraft({ ...draft, qr_code_version: (draft.qr_code_version ?? 1) + 1 });
      
      toast({
        title: "สร้าง QR Code สำเร็จ",
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

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          จุดที่ {location.id}: {location.name}
        </h3>
        <span className="text-sm text-foreground/60">QR v{draft.qr_code_version ?? 1}</span>
      </div>

      {draft.image_url && (
        <div className="aspect-video w-full overflow-hidden rounded-lg">
          <img src={draft.image_url} alt={draft.name} className="h-full w-full object-cover" />
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

      <div className="flex gap-2">
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
          สร้าง QR Code
        </Button>
      </div>
    </div>
  );
};
