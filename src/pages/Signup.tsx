import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, Copy, Check } from "lucide-react";

interface SignupResponse {
  ok: boolean;
  participantId: string;
  username: string;
  password: string;
}

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gradeLevel: "",
    school: "",
    program: "",
  });

  const handleCopy = async (label: "username" | "password", value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      toast({
        title: "Unable to copy",
        description: "Please copy the value manually.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<SignupResponse>("signup", {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age ? parseInt(formData.age, 10) : null,
          gradeLevel: formData.gradeLevel || null,
          school: formData.school || null,
          program: formData.program || null,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.participantId && data.username && data.password) {
        localStorage.setItem("participantId", data.participantId);
        localStorage.setItem("participantUsername", data.username);
        localStorage.setItem("authRole", "participant");

        setCredentials({
          username: data.username,
          password: data.password,
        });

        toast({
          title: "Registration completed",
          description: "Keep your username and password safe for future logins.",
        });
      } else {
        throw new Error("Unexpected response from signup service.");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Registration failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-3xl mx-auto py-8 space-y-8">
        <div className="text-center">
          <Anchor className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-primary mb-2">Join the Crew</h1>
          <p className="text-muted-foreground">
            Register for the treasure hunt and receive your personal login details.
          </p>
        </div>

        {credentials && (
          <div className="bg-card p-6 rounded-2xl border-2 border-rope shadow-xl space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-primary mb-1">Credentials generated</h2>
              <p className="text-sm text-muted-foreground">
                Save these details now. You will need them to log in again or to claim rewards.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Username</p>
                  <p className="text-lg font-semibold">{credentials.username}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy("username", credentials.username)}
                  aria-label="Copy username"
                >
                  {copiedField === "username" ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-xl border bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Password</p>
                  <p className="text-lg font-semibold">{credentials.password}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopy("password", credentials.password)}
                  aria-label="Copy password"
                >
                  {copiedField === "password" ? <Check className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => navigate("/map")}>
                Continue to the map
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => navigate("/login")}>
                Go to login page
              </Button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-card p-8 rounded-2xl border-2 border-rope shadow-xl space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, lastName: event.target.value }))
                }
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="5"
                max="100"
                value={formData.age}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, age: event.target.value }))
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="gradeLevel">Grade level</Label>
              <Input
                id="gradeLevel"
                value={formData.gradeLevel}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, gradeLevel: event.target.value }))
                }
                className="mt-1"
                placeholder="e.g. M.6"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="school">School</Label>
            <Input
              id="school"
              value={formData.school}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, school: event.target.value }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="program">Program / faculty</Label>
            <Input
              id="program"
              value={formData.program}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, program: event.target.value }))
              }
              className="mt-1"
              placeholder="e.g. Digital art"
            />
          </div>

          <Button type="submit" className="w-full text-lg" size="lg" disabled={loading}>
            {loading ? "Submitting..." : "Register now"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
