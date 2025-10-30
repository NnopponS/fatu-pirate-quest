import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { PirateCharacter } from "@/components/PirateCharacter";
import { PirateChatbot } from "@/components/PirateChatbot";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Phone, 
  School, 
  Calendar, 
  Award, 
  Gift, 
  LogOut,
  Home,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  age: number | null;
  grade_level: string | null;
  school: string | null;
  program: string | null;
  phone_number?: string;
  points: number;
}

interface PrizeInfo {
  prize: string;
  claimed_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { toast } = useToast();
  
  // Extract user from auth for easier access
  const user = auth?.role === 'participant' ? {
    id: auth.participantId,
    username: auth.username,
    displayName: auth.displayName
  } : null;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prize, setPrize] = useState<PrizeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<UserProfile>>({});
  const [chatbotOpen, setChatbotOpen] = useState(false);
  
  // สำหรับแก้ไข Username/Password
  const [editingCredentials, setEditingCredentials] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load profile data from Firebase
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load from Firebase
      const { firebaseDb } = await import("@/integrations/firebase/database");
      
      // Load participant data
      const participant = await firebaseDb.get<any>(`participants/${user.id}`);
      
      if (!participant) {
        throw new Error("ไม่พบข้อมูลผู้ใช้");
      }

      const profileData: UserProfile = {
        id: user.id,
        username: user.username,
        first_name: participant.first_name || "",
        last_name: participant.last_name || "",
        age: participant.age || null,
        grade_level: participant.grade_level || null,
        school: participant.school || null,
        program: participant.program || null,
        phone_number: participant.phone_number || "",
        points: participant.points || 0,
      };
      
      setProfile(profileData);
      setDraft(profileData);

      // Check for prize
      const spinData = await firebaseDb.get<any>(`spins/${user.id}`);
      if (spinData) {
        setPrize({
          prize: spinData.prize,
          claimed_at: spinData.created_at,
        });
      }
    } catch (error) {
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      // Update Firebase
      const { firebaseDb } = await import("@/integrations/firebase/database");
      
      // Update participant data
      await firebaseDb.update(`participants/${user.id}`, {
        first_name: draft.first_name,
        last_name: draft.last_name,
        age: draft.age,
        grade_level: draft.grade_level,
        school: draft.school,
        program: draft.program,
        phone_number: draft.phone_number,
      });

      // Update local state
      setProfile({ ...profile, ...draft });
      setEditing(false);
      
      toast({
        title: "บันทึกข้อมูลสำเร็จ",
        description: "ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว",
      });
    } catch (error) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    }
  };

  const handleSaveCredentials = async () => {
    if (!user || !profile) return;

    // Validate
    if (!currentPassword) {
      toast({
        title: "กรุณากรอกรหัสผ่านปัจจุบัน",
        variant: "destructive",
      });
      return;
    }

    if (newUsername && newUsername.length < 3) {
      toast({
        title: "Username ต้องมีความยาวอย่างน้อย 3 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast({
        title: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "รหัสผ่านใหม่ไม่ตรงกัน",
        variant: "destructive",
      });
      return;
    }

    setSavingCredentials(true);
    try {
      const { firebaseDb } = await import("@/integrations/firebase/database");
      const { hashPassword, verifyPassword } = await import("@/services/firebase");
      
      // Load current participant data
      const participant = await firebaseDb.get<any>(`participants/${user.id}`);
      
      // Verify current password
      const isPasswordCorrect = await verifyPassword(currentPassword, participant.password_hash);
      
      if (!isPasswordCorrect) {
        toast({
          title: "รหัสผ่านปัจจุบันไม่ถูกต้อง",
          variant: "destructive",
        });
        setSavingCredentials(false);
        return;
      }

      // Update Firebase
      const updates: any = {};
      
      if (newUsername && newUsername !== profile.username) {
        updates.username = newUsername;
      }
      
      if (newPassword) {
        updates.password_hash = await hashPassword(newPassword);
      }

      if (Object.keys(updates).length > 0) {
        await firebaseDb.update(`participants/${user.id}`, updates);
        
        // Update localStorage and auth context
        if (newUsername && newUsername !== profile.username) {
          localStorage.setItem('participantUsername', newUsername);
          setProfile({ ...profile, username: newUsername });
        }
        
        toast({
          title: "บันทึกข้อมูลสำเร็จ",
          description: "Username/Password ถูกอัปเดตแล้ว",
        });
        
        // Reset form
        setEditingCredentials(false);
        setCurrentPassword("");
        setNewUsername("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast({
          title: "ไม่มีการเปลี่ยนแปลง",
          description: "กรุณาแก้ไขข้อมูลก่อนบันทึก",
        });
      }
    } catch (error) {
      toast({
        title: "บันทึกไม่สำเร็จ",
        description: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        variant: "destructive",
      });
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "พบกันใหม่นะลูกเรือ!",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <PirateBackdrop>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
            <p className="text-lg text-foreground/70">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </PirateBackdrop>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <PirateBackdrop>
      <BottomNav />
      <PirateCharacter
        messages={[
          "สวัสดีครับลูกเรือ! 👋",
          "คลิกที่ข้าได้ถ้าอยากคุยนะ! 💬",
          "นี่คือโปรไฟล์ของคุณ 🏴‍☠️",
          "แก้ไขข้อมูลได้ตามสบาย! ⚓",
          "อย่าลืมเช็กสถานะรางวัลด้วยนะ! 🎁",
        ]}
        onChatbotOpen={() => setChatbotOpen(true)}
      />
      
      {/* AI Chatbot */}
      <PirateChatbot 
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
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
                <div className="text-amber-200 text-3xl">🆔</div>
              </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-6 px-6 text-center relative z-10">
              <div className="mb-6">
                <User className="h-12 w-12 text-amber-700 mx-auto animate-pulse mb-4" />
                <h1 className="text-4xl md:text-5xl font-black text-amber-900 mb-3" style={{ fontFamily: 'Pirata One, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
                  โปรไฟล์ลูกเรือ
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-800/20 border-2 border-amber-700">
                  <span className="text-sm md:text-base font-bold text-amber-900">จัดการข้อมูลส่วนตัวและดูสถานะรางวัล! ⚓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap justify-center">
          <Button variant="outline" onClick={() => navigate("/map")} className="gap-2">
            <Home className="h-4 w-4" />
            กลับหน้าหลัก
          </Button>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Info Card - Column 1 */}
          <Card className="pirate-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  ข้อมูลส่วนตัว
                </span>
                {!editing ? (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    แก้ไข
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave} className="gap-2">
                      <Save className="h-4 w-4" />
                      บันทึก
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditing(false);
                      setDraft(profile);
                    }} className="gap-2">
                      <X className="h-4 w-4" />
                      ยกเลิก
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>Username: {profile.username}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ชื่อ</Label>
                      <Input
                        value={draft.first_name ?? ""}
                        onChange={(e) => setDraft({ ...draft, first_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>นามสกุล</Label>
                      <Input
                        value={draft.last_name ?? ""}
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
                        onChange={(e) => setDraft({ ...draft, grade_level: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>สถานศึกษา</Label>
                    <Input
                      value={draft.school ?? ""}
                      onChange={(e) => setDraft({ ...draft, school: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>โปรแกรม/แผนการเรียน</Label>
                    <Input
                      value={draft.program ?? ""}
                      onChange={(e) => setDraft({ ...draft, program: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>เบอร์โทรศัพท์</Label>
                    <Input
                      type="tel"
                      value={draft.phone_number ?? ""}
                      onChange={(e) => setDraft({ ...draft, phone_number: e.target.value })}
                      placeholder="08x-xxx-xxxx"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-foreground/60">ชื่อ-นามสกุล</p>
                      <p className="font-semibold">{profile.first_name} {profile.last_name}</p>
                    </div>
                  </div>

                  {profile.age && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                      <Calendar className="h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm text-foreground/60">อายุ</p>
                        <p className="font-semibold">{profile.age} ปี</p>
                      </div>
                    </div>
                  )}

                  {profile.grade_level && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                      <Award className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm text-foreground/60">ระดับชั้น</p>
                        <p className="font-semibold">{profile.grade_level}</p>
                      </div>
                    </div>
                  )}

                  {profile.school && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                      <School className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-foreground/60">สถานศึกษา</p>
                        <p className="font-semibold">{profile.school}</p>
                      </div>
                    </div>
                  )}

                  {profile.program && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5">
                      <Award className="h-5 w-5 text-secondary" />
                      <div>
                        <p className="text-sm text-foreground/60">โปรแกรม/แผนการเรียน</p>
                        <p className="font-semibold">{profile.program}</p>
                      </div>
                    </div>
                  )}

                  {profile.phone_number && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5">
                      <Phone className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm text-foreground/60">เบอร์โทรศัพท์</p>
                        <p className="font-semibold">{profile.phone_number}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Username/Password Card - Column 2 */}
          <Card className="pirate-card lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Username & Password
                </span>
                {!editingCredentials ? (
                  <Button size="sm" variant="outline" onClick={() => setEditingCredentials(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    แก้ไข
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveCredentials} disabled={savingCredentials} className="gap-2">
                      <Save className="h-4 w-4" />
                      บันทึก
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditingCredentials(false);
                      setCurrentPassword("");
                      setNewUsername("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }} className="gap-2">
                      <X className="h-4 w-4" />
                      ยกเลิก
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>จัดการ Username และรหัสผ่าน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingCredentials ? (
                <>
                  <div className="space-y-2">
                    <Label>Username ปัจจุบัน</Label>
                    <Input value={profile.username} disabled className="bg-gray-100" />
                  </div>

                  <div className="space-y-2">
                    <Label>Username ใหม่ (ไม่บังคับ)</Label>
                    <Input
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="ถ้าต้องการเปลี่ยน Username"
                      disabled={savingCredentials}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>รหัสผ่านปัจจุบัน *</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านปัจจุบัน"
                      disabled={savingCredentials}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>รหัสผ่านใหม่ (ไม่บังคับ)</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="ถ้าต้องการเปลี่ยนรหัสผ่าน"
                      disabled={savingCredentials}
                    />
                  </div>

                  {newPassword && (
                    <div className="space-y-2">
                      <Label>ยืนยันรหัสผ่านใหม่</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        disabled={savingCredentials}
                      />
                    </div>
                  )}

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs text-amber-800">
                      💡 <strong>หมายเหตุ:</strong> ต้องกรอกรหัสผ่านปัจจุบันเสมอ หากต้องการเปลี่ยน Username ต้องกรอกรหัสผ่านปัจจุบันด้วย
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                    <User className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-foreground/60">Username</p>
                      <p className="font-semibold font-mono">{profile.username}</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      🔒 รหัสผ่านของคุณปลอดภัย หากต้องการเปลี่ยนกรุณากดปุ่ม "แก้ไข"
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Points & Prize Cards - Column 3 */}
          <div className="space-y-6 lg:col-span-1">
            {/* Points Card */}
            <Card className="pirate-card border-2 border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  คะแนนของคุณ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <div className="text-6xl font-black text-primary mb-2">
                    {profile.points}
                  </div>
                  <p className="text-foreground/60">คะแนนสะสม</p>
                  
                  {profile.points >= 400 ? (
                    <div className="mt-4 p-4 rounded-xl bg-green-100 border-2 border-green-400">
                      <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        พร้อมหมุนวงล้อแล้ว!
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 rounded-xl bg-amber-100 border-2 border-amber-400">
                      <p className="text-amber-800 font-semibold">
                        ต้องการอีก {400 - profile.points} คะแนน
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prize Status Card */}
            <Card className="pirate-card border-2 border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-accent" />
                  สถานะรางวัล
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prize ? (
                  <div className="space-y-4">
                    <div className="text-center py-4 rounded-xl bg-green-100 border-2 border-green-400">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-semibold mb-1">คุณได้รับรางวัล</p>
                      <p className="text-2xl font-bold text-green-900">{prize.prize}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-sm text-amber-900">
                        📍 นำหน้าจอนี้ไปแลกที่จุดรับรางวัล
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-foreground/30 mx-auto mb-3" />
                    <p className="text-foreground/60">ยังไม่ได้หมุนวงล้อ</p>
                    {profile.points >= 400 && (
                      <Button
                        className="mt-4"
                        onClick={() => navigate("/rewards")}
                      >
                        ไปหมุนวงล้อ
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Profile;

