import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, QrCode, Loader2, Download, Calendar, MapPin } from "lucide-react";
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
}

interface LocationRecord {
  id: number;
  name: string;
  sub_events?: SubEvent[];
}

interface Props {
  locations: LocationRecord[];
  onSave: (locationId: number, subEvents: SubEvent[]) => Promise<void>;
}

export const AdminSubEventManager = ({ locations, onSave }: Props) => {
  const { toast } = useToast();
  const [editingSubEvent, setEditingSubEvent] = useState<{ [key: string]: SubEvent }>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [qrDataUrls, setQrDataUrls] = useState<{ [key: string]: string }>({});

  // Generate QR codes for all sub-events
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const urls: { [key: string]: string } = {};
      
      for (const location of locations) {
        if (location.sub_events) {
          for (const subEvent of location.sub_events) {
            try {
              const currentVersion = subEvent.qr_code_version ?? 1;
              const dateStr = todayStr();
              const sig = await signSubEventCheckin(subEvent.id, dateStr, CHECKIN_SECRET, currentVersion);
              
              // Format: SUBEVENT|subEventId|version
              const checkinData = `SUBEVENT|${subEvent.id}|${currentVersion}`;
              
              const qrDataUrl = await QRCode.toDataURL(checkinData, {
                width: 512,
                margin: 2,
                color: {
                  dark: "#000000",
                  light: "#FFFFFF",
                },
              });
              
              urls[subEvent.id] = qrDataUrl;
            } catch (error) {
              console.error(`Failed to generate QR for ${subEvent.id}:`, error);
            }
          }
        }
      }
      
      setQrDataUrls(urls);
    };

    generateAllQRCodes();
  }, [locations]);

  const handleFieldChange = (subEventId: string, field: keyof SubEvent, value: string) => {
    setEditingSubEvent((prev) => ({
      ...prev,
      [subEventId]: {
        ...getSubEventById(subEventId),
        ...prev[subEventId],
        [field]: value,
      },
    }));
  };

  const getSubEventById = (subEventId: string): SubEvent | null => {
    for (const location of locations) {
      if (location.sub_events) {
        const subEvent = location.sub_events.find((se) => se.id === subEventId);
        if (subEvent) return subEvent;
      }
    }
    return null;
  };

  const getLocationBySubEventId = (subEventId: string): LocationRecord | null => {
    for (const location of locations) {
      if (location.sub_events?.some((se) => se.id === subEventId)) {
        return location;
      }
    }
    return null;
  };

  const handleImageUpload = async (subEventId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(subEventId);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `subevent-${subEventId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("location-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("location-images")
        .getPublicUrl(filePath);

      handleFieldChange(subEventId, "image_url", data.publicUrl);

      toast({
        title: "อัปโหลดรูปภาพสำเร็จ",
        description: "กรุณากดบันทึกเพื่อบันทึกการเปลี่ยนแปลง",
      });
    } catch (error) {
      toast({
        title: "อัปโหลดรูปภาพไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (subEventId: string) => {
    const location = getLocationBySubEventId(subEventId);
    if (!location || !location.sub_events) return;

    setSaving(subEventId);
    try {
      const updatedSubEvents = location.sub_events.map((se) =>
        se.id === subEventId && editingSubEvent[subEventId]
          ? { ...se, ...editingSubEvent[subEventId] }
          : se
      );

      await onSave(location.id, updatedSubEvents);

      // Clear editing state for this sub-event
      setEditingSubEvent((prev) => {
        const newState = { ...prev };
        delete newState[subEventId];
        return newState;
      });

      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลกิจกรรมถูกบันทึกเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "บันทึกข้อมูลไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const downloadQRCode = (subEventId: string, subEventName: string) => {
    const qrDataUrl = qrDataUrls[subEventId];
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-${subEventId}.png`;
    link.href = qrDataUrl;
    link.click();

    toast({
      title: "ดาวน์โหลด QR Code สำเร็จ",
      description: `QR Code สำหรับ "${subEventName}" ถูกบันทึกแล้ว`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏴‍☠️ จัดการกิจกรรมย่อย (Sub-Events)</h2>
          <p className="text-sm text-gray-600 mt-1">แก้ไขรายละเอียด อัปโหลดรูป และดาวน์โหลด QR Code</p>
        </div>
      </div>

      {locations.map((location) => {
        if (!location.sub_events || location.sub_events.length === 0) return null;

        return (
          <div key={location.id} className="pirate-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="h-6 w-6 text-amber-600" />
              <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
              <span className="text-sm text-gray-600">({location.sub_events.length} กิจกรรม)</span>
            </div>

            <Accordion type="single" collapsible className="space-y-2">
              {location.sub_events.map((subEvent) => {
                const draft = editingSubEvent[subEvent.id] || subEvent;
                const hasChanges = Boolean(editingSubEvent[subEvent.id]);

                return (
                  <AccordionItem key={subEvent.id} value={subEvent.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">⚓ {subEvent.name}</p>
                          {subEvent.time && (
                            <p className="text-xs text-gray-600 mt-0.5">🕐 {subEvent.time}</p>
                          )}
                        </div>
                        {hasChanges && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            มีการแก้ไข
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-4 space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Left Column - Form */}
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor={`name-${subEvent.id}`}>ชื่อกิจกรรม</Label>
                            <Input
                              id={`name-${subEvent.id}`}
                              value={draft.name}
                              onChange={(e) => handleFieldChange(subEvent.id, "name", e.target.value)}
                              placeholder="ชื่อกิจกรรม"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`time-${subEvent.id}`}>เวลา</Label>
                            <Input
                              id={`time-${subEvent.id}`}
                              value={draft.time || ""}
                              onChange={(e) => handleFieldChange(subEvent.id, "time", e.target.value)}
                              placeholder="เช่น 10:00-11:30"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`desc-${subEvent.id}`}>คำอธิบาย</Label>
                            <Textarea
                              id={`desc-${subEvent.id}`}
                              value={draft.description || ""}
                              onChange={(e) => handleFieldChange(subEvent.id, "description", e.target.value)}
                              placeholder="คำอธิบายกิจกรรม"
                              rows={4}
                            />
                          </div>

                          <div>
                            <Label>รูปภาพกิจกรรม</Label>
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(subEvent.id, e)}
                                disabled={uploading === subEvent.id}
                              />
                              {uploading === subEvent.id && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                            {draft.image_url && (
                              <div className="mt-2">
                                <img
                                  src={draft.image_url}
                                  alt={draft.name}
                                  className="h-32 w-full object-cover rounded-lg border-2 border-amber-300"
                                />
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => handleSave(subEvent.id)}
                            disabled={saving === subEvent.id || !hasChanges}
                            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                          >
                            {saving === subEvent.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                กำลังบันทึก...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                บันทึกการเปลี่ยนแปลง
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Right Column - QR Code */}
                        <div className="space-y-4">
                          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
                            <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                              <QrCode className="h-5 w-5" />
                              QR Code กิจกรรม
                            </h4>
                            {qrDataUrls[subEvent.id] ? (
                              <>
                                <div className="bg-white p-4 rounded-lg border-2 border-amber-300 flex items-center justify-center">
                                  <img
                                    src={qrDataUrls[subEvent.id]}
                                    alt={`QR Code for ${subEvent.name}`}
                                    className="w-full max-w-[200px]"
                                  />
                                </div>
                                <div className="mt-3 space-y-2">
                                  <Button
                                    onClick={() => downloadQRCode(subEvent.id, subEvent.name)}
                                    variant="outline"
                                    className="w-full border-amber-300"
                                    size="sm"
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    ดาวน์โหลด QR Code
                                  </Button>
                                  <div className="text-xs text-amber-800 bg-yellow-50 rounded p-2 border border-yellow-300">
                                    <p className="font-semibold mb-1">ℹ️ ข้อมูล:</p>
                                    <p>• ID: {subEvent.id}</p>
                                    <p>• Version: {subEvent.qr_code_version || 1}</p>
                                    <p>• คะแนน: +100 (ครั้งแรกต่อสถานที่)</p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center justify-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
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
          </div>
        );
      })}
    </div>
  );
};

