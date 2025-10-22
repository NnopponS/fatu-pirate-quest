import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { login } from "@/services/firebase";
import { Anchor, LogIn, Shield } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";

type Role = "participant" | "admin";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeRole, setActiveRole] = useState<Role>("participant");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const result = await login(activeRole, formData.username.trim(), formData.password);

      if (result.role === "participant") {
        localStorage.setItem("participantId", result.participantId);
        localStorage.setItem("participantUsername", result.username);
        localStorage.setItem("participantDisplayName", result.displayName);
        localStorage.setItem("authRole", "participant");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUsername");

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
          navigate("/map");
        }
      } else {
        localStorage.setItem("adminToken", result.token);
        localStorage.setItem("adminUsername", result.username);
        localStorage.setItem("authRole", "admin");
        localStorage.removeItem("participantId");
        localStorage.removeItem("participantUsername");
        localStorage.removeItem("participantDisplayName");

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
      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-10 animate-fade-in">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight animate-scale-in">
            <LogIn className="h-4 w-4 text-primary" />
            ยินดีต้อนรับสู่ FATU Pirate Quest
          </span>
          <h1 className="pirate-heading md:text-5xl">เข้าสู่ระบบการผจญภัย</h1>
          <p className="pirate-subheading">
            ลงชื่อเข้าใช้เพื่อเริ่มต้นการล่าสมบัติ
          </p>
        </div>

        <Tabs
          value={activeRole}
          onValueChange={(value) => setActiveRole(value as Role)}
          className="pirate-card p-8 space-y-6 animate-slide-in"
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
