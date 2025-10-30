import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, Trophy, User, LogOut, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "ออกจากระบบสำเร็จ",
      description: "แล้วพบกันใหม่ในการผจญภัยครั้งหน้า!",
    });
    navigate("/");
  };

  const navItems = [
    { path: "/dashboard", icon: Home, label: "หน้าหลัก", color: "text-amber-700" },
    { path: "/map", icon: Map, label: "แผนที่", color: "text-blue-700" },
    { path: "/rewards", icon: Trophy, label: "รางวัล", color: "text-yellow-700" },
    { path: "/profile", icon: User, label: "โปรไฟล์", color: "text-purple-700" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navigation - Top */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b-4 border-amber-600 shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Compass className="h-8 w-8 text-amber-700" />
              <div>
                <h1 className="text-xl font-black text-amber-900" style={{ fontFamily: 'Pirata One, serif' }}>
                  FATU Quest
                </h1>
                <p className="text-xs text-amber-700">Pirates Adventure</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  variant={isActive(item.path) ? "default" : "outline"}
                  className={`gap-2 ${
                    isActive(item.path)
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white"
                      : "border-2 border-amber-500 hover:bg-amber-100"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              ))}
              
              <div className="h-8 w-px bg-amber-300 mx-2" />
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="gap-2 border-2 border-red-400 text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-t-4 border-amber-600 shadow-2xl">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all ${
                isActive(item.path)
                  ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg scale-105"
                  : "text-amber-700 hover:bg-amber-100"
              }`}
            >
              <item.icon className={`h-6 w-6 mb-1 ${isActive(item.path) ? "text-white" : item.color}`} />
              <span className={`text-xs font-bold ${isActive(item.path) ? "text-white" : "text-amber-900"}`}>
                {item.label}
              </span>
            </button>
          ))}
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-3 px-2 rounded-xl text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-6 w-6 mb-1" />
            <span className="text-xs font-bold">ออก</span>
          </button>
        </div>
      </div>

      {/* Spacer for desktop top nav */}
      <div className="hidden md:block h-20" />
      
      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-24" />
    </>
  );
};

