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
          title: "????????????????????????????",
          description: "???????????????????????????????!",
        });
        navigate("/map");
      } else {
        localStorage.setItem("adminToken", result.token);
        localStorage.setItem("adminUsername", result.username);
        localStorage.setItem("authRole", "admin");
        localStorage.removeItem("participantId");
        localStorage.removeItem("participantUsername");
        localStorage.removeItem("participantDisplayName");

        toast({
          title: "????????????????????????",
          description: "??????????????????????????????",
        });
        navigate("/admin");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "?????????????? ????????????????????";
      toast({
        title: "???????????????????????",
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
            ????????????? FATU Pirate Quest
          </span>
          <h1 className="pirate-heading md:text-5xl">???????????????????????????????????</h1>
          <p className="pirate-subheading">
            ????????????????????????????????????????????????? ????????????????????????????????
          </p>
        </div>

        <Tabs value={activeRole} onValueChange={(value) => setActiveRole(value as Role)} className="pirate-card p-8 space-y-6">
          <TabsList className="grid grid-cols-2 bg-white/80">
            <TabsTrigger value="participant" className="gap-2 data-[state=active]:bg-primary/10">
              <Anchor className="h-4 w-4" />
              ??????????????????
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2 data-[state=active]:bg-secondary/15">
              <Shield className="h-4 w-4" />
              ???????????
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participant">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="participant-username">?????????? *</Label>
                <Input
                  id="participant-username"
                  required
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="??????????????????????????????????"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participant-password">???????? *</Label>
                <Input
                  id="participant-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="????????????"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "????????????????..." : "??????????????????????"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="admin-username">????????????????? *</Label>
                <Input
                  id="admin-username"
                  required
                  value={formData.username}
                  onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                  placeholder="????????????????????"
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">??????????????? *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="??????????????????"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "????????????????..." : "??????????????????"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-foreground/70">
          ??????????????
          <Button
            type="button"
            variant="link"
            className="font-semibold text-primary"
            onClick={() => navigate("/signup")}
          >
            ???????????????
          </Button>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Login;
