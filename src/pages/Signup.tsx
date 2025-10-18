import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Anchor } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gradeLevel: "",
    school: "",
    program: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('signup', {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          age: formData.age ? parseInt(formData.age) : null,
          gradeLevel: formData.gradeLevel || null,
          school: formData.school || null,
          program: formData.program || null,
        }
      });

      if (error) throw error;

      if (data?.participantId) {
        localStorage.setItem('participantId', data.participantId);
        toast({
          title: "ลงทะเบียนสำเร็จ! 🏴‍☠️",
          description: `ยินดีต้อนรับ ${formData.firstName}!`,
        });
        navigate('/map');
      }
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment p-4">
      <div className="container max-w-2xl mx-auto py-8">
        <div className="text-center mb-8">
          <Anchor className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-primary mb-2">ลงทะเบียนเข้าร่วม</h1>
          <p className="text-muted-foreground">กรอกข้อมูลเพื่อเริ่มการผจญภัย</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-2xl border-2 border-rope shadow-xl">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">ชื่อ *</Label>
                <Input
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">นามสกุล *</Label>
                <Input
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">อายุ</Label>
                <Input
                  id="age"
                  type="number"
                  min="5"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gradeLevel">ระดับชั้น</Label>
                <Input
                  id="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
                  className="mt-1"
                  placeholder="เช่น ม.6"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="school">โรงเรียน</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({...formData, school: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="program">แผนการเรียน</Label>
              <Input
                id="program"
                value={formData.program}
                onChange={(e) => setFormData({...formData, program: e.target.value})}
                className="mt-1"
                placeholder="เช่น วิทย์-คณิต"
              />
            </div>

            <Button type="submit" className="w-full text-lg" size="lg" disabled={loading}>
              {loading ? "กำลังลงทะเบียน..." : "🏴‍☠️ เริ่มการผจญภัย"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
