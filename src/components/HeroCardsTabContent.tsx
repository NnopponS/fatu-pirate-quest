// Hero Cards Tab Content for Admin Dashboard
// วางไฟล์นี้ก่อน <TabsContent value="settings"> ใน AdminDashboard.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdminHeroCardManager } from "./AdminHeroCardManager";
import {
  getHeroCards,
  createHeroCard,
  saveHeroCard,
  deleteHeroCard,
  type HeroCardRecord,
} from "@/services/firebase";

interface HeroCardsTabProps {
  token: string | null;
}

export const HeroCardsTab = ({ token }: HeroCardsTabProps) => {
  const { toast } = useToast();
  const [heroCards, setHeroCards] = useState<HeroCardRecord[]>([]);
  const [heroCardDrafts, setHeroCardDrafts] = useState<HeroCardRecord[]>([]);
  const [newHeroCard, setNewHeroCard] = useState({
    title: "",
    description: "",
    icon: "🎯",
    order: "1",
  });
  const [loading, setLoading] = useState(true);

  const fetchHeroCards = async () => {
    try {
      const cards = await getHeroCards();
      setHeroCards(cards);
      setHeroCardDrafts(cards.map((card) => ({ ...card })));
    } catch (error) {
      console.error("Failed to fetch hero cards:", error);
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroCards();
  }, []);

  const handleSaveCard = async (card: HeroCardRecord) => {
    if (!token) return;
    await saveHeroCard(token, card);
    fetchHeroCards();
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!token) return;
    await deleteHeroCard(token, cardId);
    fetchHeroCards();
  };

  const handleMoveCard = async (index: number, direction: "up" | "down") => {
    if (!token) return;
    
    const cards = [...heroCardDrafts];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    // Swap orders
    const temp = cards[index].order;
    cards[index].order = cards[targetIndex].order;
    cards[targetIndex].order = temp;

    // Save both cards
    try {
      await Promise.all([
        saveHeroCard(token, cards[index]),
        saveHeroCard(token, cards[targetIndex]),
      ]);
      toast({ title: "เรียงลำดับสำเร็จ" });
      fetchHeroCards();
    } catch (error) {
      toast({
        title: "เรียงลำดับไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const handleAddCard = async () => {
    if (!token) return;

    const trimmedTitle = newHeroCard.title.trim();
    const trimmedDescription = newHeroCard.description.trim();
    const orderValue = Number(newHeroCard.order);

    if (!trimmedTitle || !trimmedDescription || Number.isNaN(orderValue)) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณากรอกชื่อและรายละเอียด",
        variant: "destructive",
      });
      return;
    }

    try {
      await createHeroCard(token, {
        title: trimmedTitle,
        description: trimmedDescription,
        icon: newHeroCard.icon,
        order: orderValue,
        is_active: true,
      });
      toast({ title: "เพิ่ม Hero Card สำเร็จ" });
      setNewHeroCard({ title: "", description: "", icon: "🎯", order: String(heroCards.length + 1) });
      fetchHeroCards();
    } catch (error) {
      toast({
        title: "เพิ่ม Hero Card ไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-foreground/70">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="pirate-card px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-primary">จัดการ Hero Cards</h2>
          <p className="text-sm text-foreground/70">
            ปรับแต่งการ์ดที่แสดงบนหน้าหลัก
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {heroCardDrafts.map((card, index) => (
          <AdminHeroCardManager
            key={card.id}
            card={card}
            onSave={handleSaveCard}
            onDelete={handleDeleteCard}
            onMoveUp={index > 0 ? () => handleMoveCard(index, "up") : undefined}
            onMoveDown={index < heroCardDrafts.length - 1 ? () => handleMoveCard(index, "down") : undefined}
            canMoveUp={index > 0}
            canMoveDown={index < heroCardDrafts.length - 1}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-rope/40 bg-white/60 px-6 py-6 shadow-inner">
        <h3 className="text-lg font-semibold text-primary mb-4">เพิ่ม Hero Card ใหม่</h3>
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>ชื่อ Card</Label>
              <Input
                placeholder="เช่น 4 จุดล่าสมบัติ"
                value={newHeroCard.title}
                onChange={(e) => setNewHeroCard((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>ไอคอน</Label>
                <Input
                  placeholder="🎯"
                  value={newHeroCard.icon}
                  onChange={(e) => setNewHeroCard((prev) => ({ ...prev, icon: e.target.value }))}
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label>ลำดับ</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={newHeroCard.order}
                  onChange={(e) => setNewHeroCard((prev) => ({ ...prev, order: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>รายละเอียด</Label>
            <Textarea
              placeholder="อธิบายรายละเอียด..."
              value={newHeroCard.description}
              onChange={(e) => setNewHeroCard((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <Button className="gap-2" onClick={handleAddCard}>
            <Plus className="h-4 w-4" />
            เพิ่ม Hero Card
          </Button>
        </div>
      </div>
    </div>
  );
};

