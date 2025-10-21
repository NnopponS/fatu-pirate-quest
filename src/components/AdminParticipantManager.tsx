import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Trash2, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParticipantRow {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  points: number;
  age: number | null;
  grade_level: string | null;
  school: string | null;
  program: string | null;
  created_at: string;
}

interface Props {
  participant: ParticipantRow;
  onUpdate: (id: string, updates: Partial<ParticipantRow>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAdjustPoints: (id: string, delta: number) => Promise<void>;
}

export const AdminParticipantManager = ({ participant, onUpdate, onDelete, onAdjustPoints }: Props) => {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pointsOpen, setPointsOpen] = useState(false);
  const [pointsDelta, setPointsDelta] = useState("");
  const [draft, setDraft] = useState(participant);

  const handleSave = async () => {
    try {
      await onUpdate(participant.id, {
        first_name: draft.first_name,
        last_name: draft.last_name,
        age: draft.age,
        grade_level: draft.grade_level,
        school: draft.school,
        program: draft.program,
      });
      setEditOpen(false);
      toast({ title: "อัปเดตข้อมูลสำเร็จ" });
    } catch (error) {
      toast({
        title: "อัปเดตไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(participant.id);
      setDeleteOpen(false);
      toast({ title: "ลบลูกเรือสำเร็จ" });
    } catch (error) {
      toast({
        title: "ลบไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const handleAdjustPoints = async () => {
    const delta = Number(pointsDelta);
    if (isNaN(delta) || delta === 0) {
      toast({
        title: "ข้อมูลไม่ถูกต้อง",
        description: "กรุณากรอกจำนวนคะแนนที่ต้องการเพิ่มหรือลด",
        variant: "destructive",
      });
      return;
    }

    try {
      await onAdjustPoints(participant.id, delta);
      setPointsOpen(false);
      setPointsDelta("");
      toast({ 
        title: delta > 0 ? "เพิ่มคะแนนสำเร็จ" : "ลดคะแนนสำเร็จ",
        description: `${delta > 0 ? '+' : ''}${delta} คะแนน`
      });
    } catch (error) {
      toast({
        title: "ปรับคะแนนไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <tr className="border-b transition-colors hover:bg-primary/5">
        <td className="p-3 text-sm">{participant.username}</td>
        <td className="p-3 text-sm">{participant.first_name}</td>
        <td className="p-3 text-sm">{participant.last_name}</td>
        <td className="p-3 text-center text-sm font-semibold text-primary">{participant.points}</td>
        <td className="p-3 text-sm">{participant.school || "-"}</td>
        <td className="p-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPointsOpen(true)}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              <Minus className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDraft(participant);
                setEditOpen(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </td>
      </tr>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลลูกเรือ</DialogTitle>
            <DialogDescription>
              Username: {participant.username} | สร้างเมื่อ: {new Date(participant.created_at).toLocaleString('th-TH')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อ *</Label>
                <Input
                  value={draft.first_name}
                  onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>นามสกุล *</Label>
                <Input
                  value={draft.last_name}
                  onChange={(e) => setDraft({ ...draft, last_name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>อายุ</Label>
                <Input
                  type="number"
                  value={draft.age ?? ""}
                  onChange={(e) => setDraft({ ...draft, age: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label>ระดับชั้น</Label>
                <Input
                  value={draft.grade_level ?? ""}
                  onChange={(e) => setDraft({ ...draft, grade_level: e.target.value || null })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>สถานศึกษา</Label>
              <Input
                value={draft.school ?? ""}
                onChange={(e) => setDraft({ ...draft, school: e.target.value || null })}
              />
            </div>

            <div className="space-y-2">
              <Label>โปรแกรม/คณะ</Label>
              <Input
                value={draft.program ?? ""}
                onChange={(e) => setDraft({ ...draft, program: e.target.value || null })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบลูกเรือ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบ <strong>{participant.first_name} {participant.last_name}</strong> ({participant.username})?
              <br />
              การกระทำนี้ไม่สามารถย้อนกลับได้ และจะลบข้อมูลเช็กอินและการหมุนวงล้อทั้งหมดด้วย
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={pointsOpen} onOpenChange={setPointsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปรับคะแนนลูกเรือ</DialogTitle>
            <DialogDescription>
              {participant.first_name} {participant.last_name} | คะแนนปัจจุบัน: {participant.points}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>จำนวนคะแนน (ใช้เครื่องหมาย - เพื่อลดคะแนน)</Label>
              <Input
                type="number"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                placeholder="เช่น 50 หรือ -20"
              />
              <p className="text-xs text-foreground/60">
                ตัวอย่าง: กรอก 50 เพื่อเพิ่มคะแนน, กรอก -20 เพื่อลดคะแนน
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAdjustPoints}>
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
