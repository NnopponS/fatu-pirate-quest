import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, LogIn, Shield } from "lucide-react";
import { PirateBackdrop } from "@/components/PirateBackdrop";

type Role = "participant" | "admin";

interface LoginResponseParticipant {
  ok: boolean;
  role: "participant";
  participantId: string;
  username: string;
  displayName: string;
}

interface LoginResponseAdmin {
  ok: boolean;
  role: "admin";
  token: string;
  username: string;
  expiresAt: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeRole, setActiveRole] = useState<Role>("participant");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  useEffect(() => {
    setFormData({ username: "", password: "" });
  }, [activeRole]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<
        LoginResponseParticipant | LoginResponseAdmin
      >("login", {
        body: {
          username: formData.username.trim(),
          password: formData.password,
          role: activeRole,
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.ok) {
        throw new Error("invalid response");
      }

      if (data.role === "participant") {
        localStorage.setItem("participantId", data.participantId);
        localStorage.setItem("participantUsername", data.username);
        localStorage.setItem("participantDisplayName", data.displayName);
        localStorage.setItem("authRole", "participant");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUsername");

        toast({
          title: "ยินดีต้อนรับกลับ!",
          description: "เข้าสู่โหมดลูกเรือแล้ว พร้อมออกเรือต่อได้เลย",
        });
        navigate("/map");
      } else if (data.role === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUsername", data.username);
        localStorage.setItem("authRole", "admin");
        localStorage.removeItem("participantId");
        localStorage.removeItem("participantUsername");
        localStorage.removeItem("participantDisplayName");

        toast({
          title: "เปิดแดชบอร์ดผู้การเรือ",
          description: "พร้อมจัดการภารกิจและรางวัลทั้งหมด",
        });
        navigate("/admin");
      } else {
        throw new Error("unsupported role");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
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
      <div className="container mx-auto max-w-3xl px-4 py-16 space-y-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="pirate-highlight">
            <LogIn className="h-4 w-4 text-primary" />
            ประตูสู่เรือโจรสลัด
          </span>
          <h1 className="pirate-heading md:text-5xl">เข้าสู่ระบบลูกเรือ FATU</h1>
          <p className="pirate-subheading">
            เลือกโหมดลูกเรือหรือนายสถานี จากนั้นกรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับเพื่อพร้อมลุย
          </p>
        </div>

        <Tabs
          value={activeRole}
          onValueChange={(value) => setActiveRole(value as Role)}
          className="pirate-card px-6 py-8 shadow-2xl shadow-primary/10"
        >
          <TabsList className="mb-6 grid grid-cols-2 bg-transparent">
            <TabsTrigger value="participant" className="data-[state=active]:bg-primary/15">
              <Anchor className="mr-2 h-4 w-4" />
              ลูกเรือทั่วไป
            </TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-secondary/15">
              <Shield className="mr-2 h-4 w-4" />
              ผู้ควบคุมเรือ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participant">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="participant-username">ชื่อผู้ใช้</Label>
                <Input
                  id="participant-username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="กรอกชื่อผู้ใช้จากระบบสมัคร"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-password">รหัสผ่าน</Label>
                <Input
                  id="participant-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="กรอกรหัสผ่านที่ได้รับ"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "กำลังตรวจสอบ..." : "เข้าสู่เส้นทางล่าขุมทรัพย์"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="admin-username">ชื่อผู้ใช้ผู้ดูแล</Label>
                <Input
                  id="admin-username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, username: event.target.value }))
                  }
                  placeholder="admin หรือชื่อผู้ใช้ที่เปลี่ยนไว้"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">รหัสผ่านผู้ดูแล</Label>
                <Input
                  id="admin-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="กรอกรหัสผ่านผู้ดูแล"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "กำลังยืนยัน..." : "เข้าสู่แดชบอร์ดผู้ควบคุมเรือ"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-foreground/70">
          ยังไม่มีบัญชีลูกเรือ?{" "}
          <button
            type="button"
            className="font-semibold text-primary underline-offset-4 transition hover:underline"
            onClick={() => navigate("/signup")}
          >
            ลงทะเบียนที่นี่
          </button>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Login;
