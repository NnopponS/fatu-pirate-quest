import { FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { login } from "@/services/firebase";
import { Anchor, LogIn, Shield } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";

type Role = "participant" | "admin";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login: setAuthLogin, isAuthenticated, isParticipant, isAdmin } = useAuth();

  const [activeRole, setActiveRole] = useState<Role>("participant");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (isParticipant) {
        navigate("/dashboard", { replace: true });
      } else if (isAdmin) {
        navigate("/admin", { replace: true });
      }
    }
  }, [isAuthenticated, isParticipant, isAdmin, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await login(activeRole, formData.username.trim(), formData.password);

      if (result.role === "participant") {
        setAuthLogin({
          role: "participant",
          participantId: result.participantId,
          username: result.username,
          displayName: result.displayName,
        });

        toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: "ยินดีต้อนรับสู่การผจญภัย!",
        });

        // Check if there's a return URL (e.g., from checkin page)
        const returnUrl = sessionStorage.getItem("returnUrl");
        if (returnUrl) {
          sessionStorage.removeItem("returnUrl");
          navigate(returnUrl);
        } else {
          navigate("/dashboard");
        }
      } else {
        setAuthLogin({
          role: "admin",
          token: result.token,
          username: result.username,
        });

        toast({
          title: "เข้าสู่ระบบผู้ดูแล",
          description: "ยินดีต้อนรับสู่แดชบอร์ด",
        });
        navigate("/admin");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      toast({
        title: "เข้าสู่ระบบไม่สำเร็จ",
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
          "ฮาฮอย! เข้าสู่ระบบเพื่อเริ่มล่าสมบัติ! 🏴‍☠️",
          "ยินดีต้อนรับกลับมา! ⚓",
          "เตรียมพร้อมสำหรับการผจญภัย! 🗺️",
          "ลงชื่อเข้าใช้แล้วออกเดินทาง! 💎",
        ]}
      />
      <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8 animate-fade-in">
        {/* Header Section - Treasure Map Style */}
        <div className="relative">
          <div 
            className="relative overflow-hidden rounded-3xl border-8 border-amber-800 bg-[#f4e4c1] shadow-2xl"
            style={{
              backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(139, 115, 85, .05) 25%, rgba(139, 115, 85, .05) 26%, transparent 27%, transparent 74%, rgba(139, 115, 85, .05) 75%, rgba(139, 115, 85, .05) 76%, transparent 77%, transparent)
              `,
              backgroundSize: '50px 50px'
            }}
          >
            {/* Wax seal */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
              <div className="w-20 h-20 rounded-full bg-red-700 border-4 border-red-900 flex items-center justify-center shadow-xl">
                <div className="text-amber-200 text-3xl">🔑</div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-6 px-6 text-center relative z-10">
              <div className="mb-6">
                <LogIn className="h-12 w-12 text-amber-700 mx-auto animate-pulse mb-4" />
                <h1 className="text-4xl md:text-5xl font-black text-amber-900 mb-3" style={{ fontFamily: 'Pirata One, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                  เข้าสู่ระบบการผจญภัย
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-800/20 border-2 border-amber-700">
                  <span className="text-sm md:text-base font-bold text-amber-900">ลงชื่อเข้าใช้เพื่อเริ่มต้นการล่าสมบัติ! ⚓🗺️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="relative overflow-hidden rounded-2xl border-4 border-amber-700 bg-[#f9f1df] shadow-2xl p-8 space-y-6"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, rgba(139, 115, 85, 0.1) 2px, transparent 2px)`,
            backgroundSize: '40px 40px'
          }}
        >
        <Tabs
          value={activeRole}
          onValueChange={(value) => setActiveRole(value as Role)}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 bg-white/80">
            <TabsTrigger
              value="participant"
              className="gap-2 data-[state=active]:bg-primary/10 transition-all"
            >
              <Anchor className="h-4 w-4" />
              ลูกเรือ
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="gap-2 data-[state=active]:bg-secondary/15 transition-all"
            >
              <Shield className="h-4 w-4" />
              ผู้ดูแล
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participant">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="participant-username">ชื่อผู้ใช้ *</Label>
                <Input
                  id="participant-username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="กรอกชื่อผู้ใช้"
                  autoComplete="username"
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-password">รหัสผ่าน *</Label>
                <Input
                  id="participant-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full hover-scale"
                disabled={loading}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="admin-username">ชื่อผู้ดูแล *</Label>
                <Input
                  id="admin-username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="ชื่อผู้ดูแล"
                  autoComplete="username"
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">รหัสผ่านผู้ดูแล *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="รหัสผ่าน"
                  autoComplete="current-password"
                  className="transition-all focus:scale-[1.02]"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full hover-scale"
                disabled={loading}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        </div>

        <div className="text-center text-sm text-foreground/70">
          ยังไม่มีบัญชี?
          <Button
            type="button"
            variant="link"
            className="font-semibold text-primary story-link"
            onClick={() => navigate("/signup")}
          >
            ลงทะเบียน
          </Button>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Login;
