import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, Loader2, MapPin, Calendar, Plus, Trash2, QrCode, Download } from "lucide-react";
import QRCode from "qrcode";
import { signSubEventCheckin, todayStr } from "@/lib/crypto";
import { CHECKIN_SECRET } from "@/lib/constants";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SubEvent {
  id: string;
  name: string;
  location_id: number;
  description?: string;
  image_url?: string;
  time?: string;
  qr_code_version?: number;
  points_awarded?: number;
}

interface LocationRecord {
  id: number;
  name: string;
  points: number;
  map_url?: string;
  image_url?: string;
  description?: string;
  qr_code_version?: number;
  display_order?: number;
  sub_events?: SubEvent[];
}

interface Props {
  location: LocationRecord;
  onSave: (location: LocationRecord) => Promise<void>;
  onSaveSubEvents?: (locationId: number, subEvents: SubEvent[]) => Promise<void>;
}

export const AdminLocationManager = ({ location, onSave, onSaveSubEvents }: Props) => {
  const { toast } = useToast();
  const [draft, setDraft] = useState(location);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Sub-events management
  const [subEvents, setSubEvents] = useState<SubEvent[]>(location.sub_events || []);
  const [editingSubEvents, setEditingSubEvents] = useState<{ [key: string]: Partial<SubEvent> }>({});
  const [uploadingSubEvent, setUploadingSubEvent] = useState<string | null>(null);
  const [savingSubEvent, setSavingSubEvent] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [showAddSubEvent, setShowAddSubEvent] = useState(false);
  const [newSubEvent, setNewSubEvent] = useState({
    name: "",
    description: "",
    time: "",
    image_url: "",
    points_awarded: "100"
  });

  // Sync draft state when location prop changes (after save/refresh)
  useEffect(() => {
    setDraft(location);
    setSubEvents(location.sub_events || []);
  }, [location]);

  // Generate QR codes for sub-events
  useEffect(() => {
    const generateQRCodes = async () => {
      const codes: { [key: string]: string } = {};
      
      for (const subEvent of subEvents) {
        try {
          const currentVersion = subEvent.qr_code_version ?? 1;
          const dateStr = todayStr();
          const sig = await signSubEventCheckin(subEvent.id, dateStr, CHECKIN_SECRET, currentVersion);
          
          const checkinData = `SUBEVENT|${subEvent.id}|${sig}|${currentVersion}`;
          
          const qrDataUrl = await QRCode.toDataURL(checkinData, {
            width: 512,
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
          });
          
          codes[subEvent.id] = qrDataUrl;
        } catch (error) {
          console.error(`Failed to generate QR for ${subEvent.id}:`, error);
        }
      }
      
      setQrCodes(codes);
    };

    generateQRCodes();
  }, [subEvents]);

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

  // Sub-event management functions
  const handleSubEventFieldChange = (subEventId: string, field: keyof SubEvent, value: string | number) => {
    setEditingSubEvents((prev) => ({
      ...prev,
      [subEventId]: {
        ...prev[subEventId],
        [field]: value,
      },
    }));
  };

  const handleAddSubEvent = async () => {
    if (!newSubEvent.name.trim()) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณากรอกชื่อกิจกรรม",
        variant: "destructive",
      });
      return;
    }

    const newSubEventData: SubEvent = {
      id: `subevent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newSubEvent.name.trim(),
      location_id: location.id,
      description: newSubEvent.description.trim() || undefined,
      image_url: newSubEvent.image_url || undefined,
      time: newSubEvent.time.trim() || undefined,
      points_awarded: Number(newSubEvent.points_awarded) || 100,
      qr_code_version: 1,
    };

    const updatedSubEvents = [...subEvents, newSubEventData];
    setSubEvents(updatedSubEvents);

    if (onSaveSubEvents) {
      try {
        await onSaveSubEvents(location.id, updatedSubEvents);
        toast({ title: "เพิ่มกิจกรรมสำเร็จ" });
        setNewSubEvent({ name: "", description: "", time: "", image_url: "", points_awarded: "100" });
        setShowAddSubEvent(false);
      } catch (error) {
        toast({
          title: "เพิ่มกิจกรรมไม่สำเร็จ",
          description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveSubEvent = async (subEventId: string) => {
    const changes = editingSubEvents[subEventId];
    if (!changes) return;

    setSavingSubEvent(subEventId);
    try {
      const updatedSubEvents = subEvents.map((se) =>
        se.id === subEventId ? { ...se, ...changes } : se
      );
      setSubEvents(updatedSubEvents);

      if (onSaveSubEvents) {
        await onSaveSubEvents(location.id, updatedSubEvents);
      }

      setEditingSubEvents((prev) => {
        const newState = { ...prev };
        delete newState[subEventId];
        return newState;
      });

      toast({ title: "บันทึกกิจกรรมสำเร็จ" });
    } catch (error) {
      toast({
        title: "บันทึกกิจกรรมไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setSavingSubEvent(null);
    }
  };

  const handleDeleteSubEvent = async (subEventId: string) => {
    if (!confirm("ยืนยันการลบกิจกรรมนี้?")) return;

    try {
      const updatedSubEvents = subEvents.filter((se) => se.id !== subEventId);
      setSubEvents(updatedSubEvents);

      if (onSaveSubEvents) {
        await onSaveSubEvents(location.id, updatedSubEvents);
      }

      toast({ title: "ลบกิจกรรมสำเร็จ" });
    } catch (error) {
      toast({
        title: "ลบกิจกรรมไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const handleSubEventImageUpload = async (subEventId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingSubEvent(subEventId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `subevent-${subEventId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("location-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("location-images").getPublicUrl(fileName);

      handleSubEventFieldChange(subEventId, "image_url", data.publicUrl);
      toast({ title: "อัปโหลดรูปภาพสำเร็จ" });
    } catch (error) {
      toast({
        title: "อัปโหลดไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setUploadingSubEvent(null);
    }
  };

  const downloadSubEventQR = (subEventId: string, subEventName: string) => {
    const qrDataUrl = qrCodes[subEventId];
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-${subEventName}-${subEventId}.png`;
    link.href = qrDataUrl;
    link.click();

    toast({ title: "ดาวน์โหลด QR Code สำเร็จ" });
  };

  const handleRemoveSubEventImage = (subEventId: string) => {
    handleSubEventFieldChange(subEventId, "image_url", "");
    toast({ title: "ลบรูปภาพสำเร็จ", description: "อย่าลืมบันทึกเพื่อยืนยันการเปลี่ยนแปลง" });
  };

  return (
    <div className="space-y-4 rounded-lg border border-primary/20 bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          จุดที่ {location.id}: {location.name}
        </h3>
      </div>

      {draft.image_url && (
        <div className="space-y-2">
          <Label>รูปภาพปกสถานที่</Label>
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <img src={draft.image_url} alt={draft.name} className="h-full w-full object-cover" />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
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

        <div className="space-y-2">
          <Label>ลำดับการแสดง</Label>
          <Input
            type="number"
            value={draft.display_order ?? location.id}
            onChange={(e) => setDraft({ ...draft, display_order: Number(e.target.value) })}
            placeholder="1, 2, 3..."
          />
          <p className="text-xs text-gray-500">เล็ก → ใหญ่ (แสดงก่อน → หลัง)</p>
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
      </div>

      {/* Sub-Events Section */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between border-t pt-4">
          <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            กิจกรรมย่อย ({subEvents.length})
          </h4>
          {!showAddSubEvent && (
            <Button variant="outline" size="sm" onClick={() => setShowAddSubEvent(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มกิจกรรม
            </Button>
          )}
        </div>

        {/* Add New Sub-Event Form */}
        {showAddSubEvent && (
          <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold text-primary">เพิ่มกิจกรรมใหม่</h5>
              <Button variant="ghost" size="sm" onClick={() => setShowAddSubEvent(false)}>ยกเลิก</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="ชื่อกิจกรรม *"
                value={newSubEvent.name}
                onChange={(e) => setNewSubEvent({ ...newSubEvent, name: e.target.value })}
              />
              <Input
                placeholder="เวลา (เช่น 10:00-11:30)"
                value={newSubEvent.time}
                onChange={(e) => setNewSubEvent({ ...newSubEvent, time: e.target.value })}
              />
              <div className="md:col-span-2">
                <Textarea
                  placeholder="คำอธิบาย"
                  value={newSubEvent.description}
                  onChange={(e) => setNewSubEvent({ ...newSubEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Input
                type="number"
                placeholder="คะแนน (ค่าเริ่มต้น 100)"
                value={newSubEvent.points_awarded}
                onChange={(e) => setNewSubEvent({ ...newSubEvent, points_awarded: e.target.value })}
              />
              <Input
                type="url"
                placeholder="URL รูปภาพ"
                value={newSubEvent.image_url}
                onChange={(e) => setNewSubEvent({ ...newSubEvent, image_url: e.target.value })}
              />
            </div>
            <Button onClick={handleAddSubEvent} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มกิจกรรม
            </Button>
          </div>
        )}

        {/* Sub-Events List */}
        {subEvents.length > 0 && (
          <Accordion type="single" collapsible className="space-y-2">
            {subEvents.map((subEvent) => {
              const draft = editingSubEvents[subEvent.id] || subEvent;
              const hasChanges = Boolean(editingSubEvents[subEvent.id]);

              return (
                <AccordionItem key={subEvent.id} value={subEvent.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 text-left w-full">
                      <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold">{draft.name}</p>
                        {draft.time && <p className="text-xs text-foreground/60">🕐 {draft.time}</p>}
                      </div>
                      {hasChanges && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">มีการแก้ไข</span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <Label>ชื่อกิจกรรม</Label>
                          <Input
                            value={draft.name || ""}
                            onChange={(e) => handleSubEventFieldChange(subEvent.id, "name", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>เวลา</Label>
                          <Input
                            value={draft.time || ""}
                            onChange={(e) => handleSubEventFieldChange(subEvent.id, "time", e.target.value)}
                            placeholder="เช่น 10:00-11:30"
                          />
                        </div>
                        <div>
                          <Label>คะแนนที่ได้รับ</Label>
                          <Input
                            type="number"
                            value={draft.points_awarded || 100}
                            onChange={(e) => handleSubEventFieldChange(subEvent.id, "points_awarded", Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>รายละเอียด</Label>
                          <Textarea
                            value={draft.description || ""}
                            onChange={(e) => handleSubEventFieldChange(subEvent.id, "description", e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label>รูปภาพ</Label>
                          {draft.image_url && (
                            <div className="relative mb-2">
                              <img src={draft.image_url} alt={draft.name} className="h-32 w-full object-cover rounded-lg border-2" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveSubEventImage(subEvent.id)}
                                className="absolute top-2 right-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleSubEventImageUpload(subEvent.id, e)}
                              disabled={uploadingSubEvent === subEvent.id}
                              className="flex-1"
                            />
                            {uploadingSubEvent === subEvent.id && <Loader2 className="h-5 w-5 animate-spin" />}
                          </div>
                          <Input
                            type="url"
                            placeholder="หรือใส่ URL รูปภาพ"
                            value={draft.image_url || ""}
                            onChange={(e) => handleSubEventFieldChange(subEvent.id, "image_url", e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveSubEvent(subEvent.id)}
                            disabled={savingSubEvent === subEvent.id || !hasChanges}
                            className="flex-1 gap-2"
                          >
                            {savingSubEvent === subEvent.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4" />
                                บันทึก
                              </>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteSubEvent(subEvent.id)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            ลบ
                          </Button>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="space-y-4">
                        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <QrCode className="h-5 w-5" />
                            QR Code กิจกรรม
                          </h4>
                          {qrCodes[subEvent.id] ? (
                            <>
                              <div className="bg-white p-4 rounded-lg border-2 flex items-center justify-center">
                                <img src={qrCodes[subEvent.id]} alt="QR Code" className="w-full max-w-[200px]" />
                              </div>
                              <Button
                                onClick={() => downloadSubEventQR(subEvent.id, subEvent.name)}
                                variant="outline"
                                className="w-full mt-3"
                                size="sm"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                ดาวน์โหลด QR Code
                              </Button>
                              <div className="text-xs bg-blue-50 rounded p-2 border border-blue-200 mt-2">
                                <p className="font-semibold mb-1">ℹ️ ข้อมูล:</p>
                                <p>• ID: {subEvent.id}</p>
                                <p>• Version: {subEvent.qr_code_version || 1}</p>
                                <p>• คะแนน: +{subEvent.points_awarded ?? 100}</p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-48">
                              <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
};
