import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, Loader2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { HeroCardRecord } from "@/services/firebase";

interface Props {
  card: HeroCardRecord;
  onSave: (card: HeroCardRecord) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const AdminHeroCardManager = ({ 
  card, 
  onSave, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown 
}: Props) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState(card);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      const fileName = `hero-card-${card.id}-${Date.now()}.${fileExt}`;
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
      toast({
        title: "บันทึกสำเร็จ",
        description: "อัปเดต card แล้ว",
      });
    } catch (error) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("คุณแน่ใจว่าต้องการลบ card นี้?")) return;
    
    setDeleting(true);
    try {
      await onDelete(card.id);
      toast({
        title: "ลบสำเร็จ",
        description: "ลบ card แล้ว",
      });
    } catch (error) {
      toast({
        title: "ลบไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">
          {card.title || "Card ใหม่"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground/60">ลำดับ: {card.order}</span>
          <Switch
            checked={draft.is_active}
            onCheckedChange={(checked) => setDraft({ ...draft, is_active: checked })}
          />
          <span className="text-sm">{draft.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
        </div>
      </div>

      {draft.image_url && (
        <div className="space-y-2">
          <Label>รูปภาพ Card</Label>
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <img src={draft.image_url} alt={draft.title} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ชื่อ Card *</Label>
          <Input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="เช่น 4 จุดล่าสมบัติ"
          />
        </div>

        <div className="space-y-2">
          <Label>ไอคอน (Emoji) *</Label>
          <Input
            value={draft.icon}
            onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
            placeholder="🗺️"
            maxLength={10}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>รายละเอียด *</Label>
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="อธิบายรายละเอียด..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ลิงก์ที่เชื่อมโยง</Label>
          <Input
            value={draft.link_url || ""}
            onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
            placeholder="/map หรือ /rewards"
          />
        </div>

        <div className="space-y-2">
          <Label>ข้อความปุ่ม</Label>
          <Input
            value={draft.link_text || ""}
            onChange={(e) => setDraft({ ...draft, link_text: e.target.value })}
            placeholder="ดูแผนที่"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>ลำดับการแสดง</Label>
          <Input
            type="number"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label>อัปโหลดรูปภาพ</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex-1 gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          บันทึกการเปลี่ยนแปลง
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            variant="outline"
            size="icon"
            title="เลื่อนขึ้น"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            variant="outline"
            size="icon"
            title="เลื่อนลง"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <Button
          onClick={handleDelete}
          disabled={deleting}
          variant="destructive"
          className="gap-2"
        >
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          ลบ Card
        </Button>
      </div>
    </div>
  );
};

