import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { signupParticipant } from "@/services/firebase";
import { Anchor, Check, Copy, Sparkles } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";

type Credentials = { username: string; password: string } | null;

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credentials>(null);
  const [autoGenerate, setAutoGenerate] = useState(false); // ✅ เปลี่ยนเป็น false = กรอกเอง (manual) เป็น default
  const [manualUsername, setManualUsername] = useState("");
  const [manualPassword, setManualPassword] = useState("");
  const [isAdminSignup, setIsAdminSignup] = useState(false);
  const [adminSecretCode, setAdminSecretCode] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gradeLevel: "",
    school: "",
    program: "",
    phoneNumber: "", // ✅ เพิ่มเบอร์โทร
  });

  const handleCopy = async (field: "username" | "password", value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1800);
      toast({
        title: "คัดลอกข้อมูลเรียบร้อยแล้ว",
        description: field === "username" ? "ชื่อผู้ใช้ถูกคัดลอกไปยังคลิปบอร์ด" : "รหัสผ่านถูกคัดลอกไปยังคลิปบอร์ด",
      });
    } catch (error) {
      toast({
        title: "ไม่สามารถคัดลอกข้อมูลได้",
        description: "กรุณาลองใหม่อีกครั้งหรือลองคัดลอกด้วยตัวเอง",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!autoGenerate) {
        if (!manualUsername.trim()) {
          throw new Error("กรุณากรอกชื่อผู้ใช้");
        }
        if (!manualPassword.trim()) {
          throw new Error("กรุณากรอกรหัสผ่าน");
        }
        if (manualPassword.trim().length < 6) {
          throw new Error("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
        }
      }

      if (isAdminSignup && adminSecretCode !== "AdMin_FaTu-openhouse 2025") {
        throw new Error("รหัสสมัคร Admin ไม่ถูกต้อง");
      }

      const result = await signupParticipant({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age ? parseInt(formData.age, 10) : null,
        gradeLevel: formData.gradeLevel || null,
        school: formData.school || null,
        program: formData.program || null,
        phoneNumber: formData.phoneNumber || null, // ✅ ส่งเบอร์โทร
        username: autoGenerate ? null : manualUsername,
        password: autoGenerate ? null : manualPassword,
        autoGenerateCredentials: autoGenerate,
        isAdmin: isAdminSignup,
      });

      if (!result?.participantId || !result.username || !result.password) {
        throw new Error("ระบบไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่");
      }

      if (isAdminSignup) {
        localStorage.setItem("adminToken", result.participantId);
        localStorage.setItem("adminUsername", result.username);
        localStorage.setItem("authRole", "admin");
      } else {
        localStorage.setItem("participantId", result.participantId);
        localStorage.setItem("participantUsername", result.username);
        localStorage.setItem("authRole", "participant");
      }

      setCredentials({ username: result.username, password: result.password });

      // Check if there's a return URL (e.g., from checkin page)
      const returnUrl = sessionStorage.getItem("returnUrl");
      if (returnUrl && !isAdminSignup) {
        sessionStorage.removeItem("returnUrl");
        // Delay navigation to show credentials first
        setTimeout(() => navigate(returnUrl), 3000);
      }

      toast({
        title: "สมัครสมาชิกสำเร็จ",
        description: "บันทึกข้อมูลไว้ให้เรียบร้อย อย่าลืมเก็บชื่อผู้ใช้และรหัสผ่านของคุณ",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
      toast({
        title: "ไม่สามารถสมัครสมาชิกได้",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PirateBackdrop>
      <PirateCharacter 
        messages={[
          "อาร์ร์! มาร่วมลูกเรือกันเถอะ! 🏴‍☠️",
          "ลงทะเบียนง่ายๆ แล้วเริ่มผจญภัย! ⚓",
          "อย่าลืมบันทึก Username และ Password! 📝",
          "เตรียมตัวล่าสมบัติให้พร้อม! 💎",
        ]}
      />
      <div className="container mx-auto max-w-4xl px-4 py-16 space-y-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight">
            <Sparkles className="h-4 w-4 text-accent" />
            สมัครสมาชิกนักผจญภัย FATU
          </span>
          <h1 className="pirate-heading md:text-5xl">สร้างบัญชีใหม่และออกเดินทางไปกับเรา</h1>
          <p className="pirate-subheading">
            กรอกข้อมูลพื้นฐานเพื่อสร้างบัญชีผู้เข้าร่วม คุณสามารถเลือกให้ระบบสร้างชื่อผู้ใช้และรหัสผ่านให้อัตโนมัติ
            หรือกำหนดเองตามที่ต้องการได้
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="pirate-card px-8 py-10 space-y-8 shadow-2xl shadow-primary/10"
        >
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-semibold text-primary">ข้อมูลผู้สมัคร</h2>
            <p className="text-sm text-foreground/70">
              ใช้สำหรับติดตามคะแนนและรับของรางวัลในงาน FATU Pirate Quest
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">ชื่อ *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={updateField("firstName")}
                placeholder="ชื่อจริง"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">นามสกุล *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={updateField("lastName")}
                placeholder="นามสกุล"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">
              เบอร์โทรศัพท์ <span className="text-xs text-foreground/60"></span>
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={updateField("phoneNumber")}
              placeholder="เช่น 08x-xxx-xxxx"
            />
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
                onChange={updateField("age")}
                placeholder="เช่น 17"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gradeLevel">ชั้นปี / ระดับการศึกษา</Label>
              <Input
                id="gradeLevel"
                value={formData.gradeLevel}
                onChange={updateField("gradeLevel")}
                placeholder="เช่น ม.6 / ปี 1"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="school">สถานศึกษา</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={updateField("school")}
                placeholder="ชื่อโรงเรียนหรือมหาวิทยาลัย"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program">คณะ/หลักสูตร (ถ้ามี)</Label>
              <Input
                id="program"
                value={formData.program}
                onChange={updateField("program")}
                placeholder="เช่น วิทย์-คณิต, ศิลป์-คำนวณ"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-rope/40 bg-white/70 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">การตั้งค่าบัญชีผู้ใช้</h3>
                <p className="text-sm text-foreground/70">
                  เลือกได้ว่าจะให้ระบบสร้างชื่อผู้ใช้และรหัสผ่านให้อัตโนมัติ หรือกำหนดเอง
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-credentials" className="text-sm text-foreground/70">
                  สร้างให้อัตโนมัติ
                </Label>
                <Switch
                  id="auto-credentials"
                  checked={autoGenerate}
                  onCheckedChange={setAutoGenerate}
                />
              </div>
            </div>

            {!autoGenerate && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="manual-username">ชื่อผู้ใช้ที่ต้องการ *</Label>
                  <Input
                    id="manual-username"
                    value={manualUsername}
                    onChange={(event) => setManualUsername(event.target.value)}
                    placeholder="เช่น pirate2024"
                    autoComplete="new-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-password">รหัสผ่าน *</Label>
                  <Input
                    id="manual-password"
                    type="password"
                    value={manualPassword}
                    onChange={(event) => setManualPassword(event.target.value)}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-primary">สมัครเป็น Admin</h3>
                <p className="text-sm text-foreground/70">
                  ต้องการสิทธิ์ Admin ให้กรอกรหัสพิเศษด้านล่าง
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="admin-signup" className="text-sm text-foreground/70">
                  สมัครเป็น Admin
                </Label>
                <Switch
                  id="admin-signup"
                  checked={isAdminSignup}
                  onCheckedChange={setIsAdminSignup}
                />
              </div>
            </div>

            {isAdminSignup && (
              <div className="space-y-2">
                <Label htmlFor="admin-secret">รหัสพิเศษสำหรับ Admin *</Label>
                <Input
                  id="admin-secret"
                  type="password"
                  value={adminSecretCode}
                  onChange={(event) => setAdminSecretCode(event.target.value)}
                  placeholder="กรอกรหัสพิเศษ"
                  autoComplete="off"
                />
                <p className="text-xs text-foreground/60">
                  ติดต่อทีมงานเพื่อขอรหัสพิเศษสำหรับสมัคร Admin
                </p>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full !mt-4" disabled={loading}>
            {loading ? "กำลังสร้างบัญชี..." : "สมัครสมาชิก"}
          </Button>
        </form>

        {/* ✅ ย้าย credentials popup มาไว้ด้านล่างสุด */}
        {credentials && (
          <div className="pirate-card px-6 py-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Check className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-accent">🎉 สมัครสมาชิกสำเร็จ!</h2>
                <p className="text-sm text-foreground/70">
                  เก็บชื่อผู้ใช้และรหัสผ่านไว้ให้ดี คุณสามารถคัดลอกเพื่อนำไปเข้าระบบได้ทันที
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>ชื่อผู้ใช้</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly value={credentials.username} className="bg-white" />
                  <Button
                    type="button"
                    variant="outline"
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
              <div className="space-y-2">
                <Label>รหัสผ่าน</Label>
                <div className="flex items-center gap-2">
                  <Input readOnly type="text" value={credentials.password} className="bg-white" />
                  <Button
                    type="button"
                    variant="outline"
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

            <div className="rounded-lg border-2 border-accent/30 bg-accent/10 p-4">
              <p className="text-sm font-semibold text-accent text-center">
                ⚠️ สำคัญมาก: กรุณาถ่ายรูปหรือบันทึกข้อมูลนี้ไว้ เพื่อใช้เข้าสู่ระบบในครั้งถัดไป
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" onClick={() => navigate("/map")}>
                ไปแผนที่ภารกิจ
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => navigate("/login")}>
                ไปหน้าเข้าสู่ระบบ
              </Button>
            </div>
          </div>
        )}
      </div>
    </PirateBackdrop>
  );
};

export default Signup;
