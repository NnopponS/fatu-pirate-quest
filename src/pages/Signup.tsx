import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signupParticipant } from "@/services/firebase";
import { Anchor, Check, Copy, Sparkles } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(
    null,
  );

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gradeLevel: "",
    school: "",
    program: "",
  });

  const handleCopy = async (field: "username" | "password", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
      toast({
        title: "คัดลอกแล้ว",
        description: field === "username" ? "คัดลอกชื่อผู้ใช้เรียบร้อย" : "คัดลอกรหัสผ่านเรียบร้อย",
      });
    } catch (error) {
      toast({
        title: "คัดลอกไม่สำเร็จ",
        description: "กรุณาเลือกข้อความและคัดลอกด้วยตนเอง",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await signupParticipant({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gradeLevel: formData.gradeLevel || null,
        school: formData.school || null,
        program: formData.program || null,
      });

      if (result?.participantId && result.username && result.password) {
        localStorage.setItem("participantId", result.participantId);
        localStorage.setItem("participantUsername", result.username);
        localStorage.setItem("authRole", "participant");

        setCredentials({ username: result.username, password: result.password });

        toast({
          title: "ลงทะเบียนสำเร็จ",
          description: "ระบบสร้างชื่อผู้ใช้และรหัสผ่านให้แล้ว โปรดเก็บรักษาไว้ให้ดี",
        });
      } else {
        throw new Error("Unexpected response from signup service.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "ลงทะเบียนไม่สำเร็จ",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight">
            <Sparkles className="h-4 w-4 text-accent" />
            ลูกเรือใหม่
          </span>
          <h1 className="pirate-heading md:text-5xl">ลงทะเบียนเป็นลูกเรือโจรสลัด</h1>
          <p className="pirate-subheading">
            กรอกข้อมูลสั้น ๆ แล้วรับชื่อผู้ใช้และรหัสผ่านที่ระบบสร้างให้ทันที
            ใช้เข้าสู่ระบบสำหรับเช็กอินสะสมคะแนนและหมุนวงล้อสมบัติ
          </p>
        </div>

        {credentials && (
          <div className="pirate-card px-6 py-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Anchor className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-primary">ข้อมูลสำหรับเข้าสู่ระบบ</h2>
                <p className="text-sm text-foreground/70">
                  เก็บคู่นี้ไว้ให้ดี ระบบจะแสดงเพียงครั้งเดียว จำเป็นสำหรับการล็อกอินและรับรางวัล
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-rope/50 bg-white/70 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-foreground/60">Username</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xl font-semibold text-primary">{credentials.username}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy("username", credentials.username)}
                    aria-label="คัดลอกชื่อผู้ใช้"
                  >
                    {copiedField === "username" ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-rope/50 bg-white/70 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-foreground/60">Password</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-xl font-semibold text-primary">{credentials.password}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy("password", credentials.password)}
                    aria-label="คัดลอกรหัสผ่าน"
                  >
                    {copiedField === "password" ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" onClick={() => navigate("/map")}>
                ไปยังแผนที่ขุมทรัพย์
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => navigate("/login")}>
                ไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="pirate-card px-8 py-10 space-y-8 shadow-2xl shadow-primary/10"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold text-primary">ข้อมูลลูกเรือ</h2>
            <p className="text-sm text-foreground/70">
              ข้อมูลใช้เพื่อระบุตัวตนเวลารับคะแนน ไม่เผยแพร่สู่สาธารณะ
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">ชื่อ (First name) *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                }
                placeholder="เช่น นที"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">นามสกุล (Last name) *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                }
                placeholder="เช่น ทะเลทอง"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="age">อายุ</Label>
              <Input
                id="age"
                type="number"
                min="5"
                max="100"
                value={formData.age}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, age: event.target.value }))
                }
                placeholder="เช่น 17"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">ระดับชั้น / ปีการศึกษา</Label>
              <Input
                id="gradeLevel"
                value={formData.gradeLevel}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, gradeLevel: event.target.value }))
                }
                placeholder="เช่น ม.6 หรือ ปี 1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">สถานศึกษา</Label>
            <Input
              id="school"
              value={formData.school}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, school: event.target.value }))
              }
              placeholder="โรงเรียน / มหาวิทยาลัย"
            />
          </div>
          
          <Button type="submit" className="w-full !mt-10" disabled={loading}>
            {loading ? "กำลังสร้างบัญชี..." : "ลงทะเบียนและรับรหัส"}
          </Button>
        </form>
      </div>
    </PirateBackdrop>
  );
};

export default Signup;
