import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, Shield } from "lucide-react";

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
        throw new Error("Invalid response from login service.");
      }

      if (data.role === "participant") {
        localStorage.setItem("participantId", data.participantId);
        localStorage.setItem("participantUsername", data.username);
        localStorage.setItem("participantDisplayName", data.displayName);
        localStorage.setItem("authRole", "participant");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUsername");

        toast({ title: "Welcome back!", description: "Participant mode activated." });
        navigate("/map");
      } else if (data.role === "admin") {
        localStorage.setItem("adminToken", data.token);
        localStorage.setItem("adminUsername", data.username);
        localStorage.setItem("authRole", "admin");
        localStorage.removeItem("participantId");
        localStorage.removeItem("participantUsername");
        localStorage.removeItem("participantDisplayName");

        toast({ title: "Admin mode enabled", description: "Dashboard is ready." });
        navigate("/admin");
      } else {
        throw new Error("Unsupported role response.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-xl mx-auto py-8 space-y-8">
        <div className="text-center">
          <Anchor className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-primary mb-2">Log in to embark</h1>
          <p className="text-muted-foreground">
            Use your generated username and password, or switch to the admin console.
          </p>
        </div>

        <Tabs
          value={activeRole}
          onValueChange={(value) => setActiveRole(value as Role)}
          className="bg-card p-6 rounded-2xl border-2 border-rope shadow-xl"
        >
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="participant">Participant</TabsTrigger>
            <TabsTrigger value="admin">
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="participant" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="participant-username">Username</Label>
                <Input
                  id="participant-username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, username: event.target.value }))
                  }
                  className="mt-1"
                  autoComplete="username"
                />
              </div>

              <div>
                <Label htmlFor="participant-password">Password</Label>
                <Input
                  id="participant-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="mt-1"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full text-lg" size="lg" disabled={loading}>
                {loading ? "Signing in..." : "Enter participant portal"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="admin-username">Admin username</Label>
                <Input
                  id="admin-username"
                  required
                  value={formData.username}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, username: event.target.value }))
                  }
                  className="mt-1"
                  autoComplete="username"
                />
              </div>

              <div>
                <Label htmlFor="admin-password">Admin password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, password: event.target.value }))
                  }
                  className="mt-1"
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full text-lg" size="lg" disabled={loading}>
                {loading ? "Verifying..." : "Open admin dashboard"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account yet?
            <Button variant="link" className="px-2" onClick={() => navigate("/signup")}>
              Register here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
