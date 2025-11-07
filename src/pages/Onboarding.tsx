import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PirateBackdrop } from "@/components/PirateBackdrop";
import { 
  MapPin, 
  QrCode, 
  Trophy, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Map
} from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: "🎯",
      title: "สวัสดีลูกเรือ!",
      description: "ยินดีต้อนรับสู่การผจญภัยล่าสมบัติแห่ง FATU",
      content: (
        <div className="space-y-4 text-center">
          <p className="text-lg text-foreground/80">
            เจ้าจะต้องทำอะไรบ้าง?
          </p>
          <div className="grid gap-3 mt-6">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <span className="text-2xl">1️⃣</span>
              <span className="text-left">สมัครสมาชิก</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <span className="text-2xl">2️⃣</span>
              <span className="text-left">ไปยัง 4 สถานที่</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <span className="text-2xl">3️⃣</span>
              <span className="text-left">ทำ Workshop 1 ใน 4 สถานที่</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl">
              <span className="text-2xl">4️⃣</span>
              <span className="text-left">หมุนวงล้อรับรางวัล!</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: "🗺️",
      title: "สำรวจสถานที่",
      description: "ไปยัง 4 สถานที่ในแผนที่",
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-blue-50 rounded-xl border-2 border-blue-300">
            <div className="flex items-start gap-4">
              <MapPin className="h-12 w-12 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">คำแนะนำ</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>ไปที่หน้า <strong>"แผนที่"</strong> เพื่อดูสถานที่ทั้งหมด</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>แตะที่ <strong>"เปิดแผนที่"</strong> เพื่อนำทางไปด้วย Google Maps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>ไปถึงสถานที่แล้ว เตรียมสแกน QR Code!</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: "📱",
      title: "สแกน QR Code",
      description: "กดปุ่มสแกน QR และสแกนโค้ดที่สถานที่",
      content: (
        <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border-2 border-green-300 mb-4">
                <QrCode className="h-12 w-12 text-green-600" />
                <div className="text-left">
                  <p className="font-bold text-green-900">สแกนเพื่อเช็กอินกิจกรรม</p>
                  <p className="text-sm text-green-700">QR Code จะอยู่ในแต่ละสถานที่</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="font-semibold text-yellow-900 mb-2">💡 ทริค!</p>
                  <p className="text-sm text-yellow-800">
                    สแกน QR Code เพื่อเข้าร่วม <strong>กิจกรรมย่อย</strong> และรับคะแนนพิเศษ!
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-2">💡 ทริค!</p>
                  <p className="text-sm text-blue-800">
                    แต่ละสถานที่มี Workshopหลายกิจกรรม ทำ Workshop <strong>1 ใน 4 สถานที่</strong> เพื่อรับรางวัล
                  </p>
                </div>
              </div>
          )
        </div>
      )
    },
    {
      icon: "🎯",
      title: "ทำกิจกรรมย่อย",
      description: "ทำกิจกรรมอย่างน้อย 1 กิจกรรมต่อสถานที่",
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-purple-50 rounded-xl border-2 border-purple-300">
            <h3 className="text-xl font-bold text-purple-900 mb-4">กิจกรรมย่อยคืออะไร?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-900">ตัวอย่างกิจกรรม:</p>
                  <p className="text-sm text-purple-800">ทุก Workshop ทั้ง 4 สถานที่</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-purple-900">จะได้คะแนน:</p>
                  <p className="text-sm text-purple-800">+100 คะแนนต่อสถานที่ (ทำ 1 กิจกรรมต่อสถานที่)</p>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-300">
                <p className="text-sm text-yellow-900 font-semibold">⚠️ สิ่งสำคัญ</p>
                <p className="text-sm text-yellow-800">
                  ทำกิจกรรมในสถานที่เดียวกันหลายกิจกรรม จะได้คะแนนแค่ <strong>ครั้งแรกเท่านั้น</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: "🎰",
      title: "หมุนวงล้อรับรางวัล",
      description: "เมื่อสะสมคะแนนครบ 200 คะแนน",
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-amber-50 rounded-xl border-2 border-amber-300">
            <div className="flex items-start gap-4">
              <Trophy className="h-12 w-12 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">หมุนวงล้อได้เมื่อไหร่?</h3>
                <div className="space-y-2 text-amber-800">
                  <p>✓ เมื่อทำกิจกรรม 1 ใน 4 สถานที่</p>
                  <p>✓ เมื่อสะสมคะแนนได้ <strong className="text-amber-900">200 คะแนน</strong></p>
                  <p>✓ กดปุ่ม "หมุนวงล้อ" ในหน้า Dashboard</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-900 font-semibold">🎁 รางวัลมีอะไรบ้าง?</p>
            <p className="text-sm text-green-800 mt-2">
              มีรางวัลมากมายรอคุณอยู่! ไปดูในหน้า Hero หรือหน้า Rewards
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to signup after completing onboarding
      navigate("/signup");
    }
  };

  const handleSkip = () => {
    navigate("/signup");
  };

  const currentStepData = steps[currentStep];

  return (
    <PirateBackdrop>
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-16">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-foreground/70 mb-2">
            <span>ขั้นตอนที่ {currentStep + 1} จาก {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="pirate-card px-6 py-8 md:px-12 md:py-14 space-y-8">
          {/* Icon and Title */}
          <div className="text-center space-y-4">
            <div className="text-7xl md:text-8xl animate-bounce">
              {currentStepData.icon}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">
              {currentStepData.title}
            </h1>
            <p className="text-lg text-foreground/70">
              {currentStepData.description}
            </p>
          </div>

          {/* Content */}
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                ย้อนกลับ
              </Button>
            )}
            
            <Button
              onClick={handleSkip}
              variant="ghost"
              className={currentStep > 0 ? "" : "ml-auto"}
              size={currentStep > 0 ? "default" : "lg"}
            >
              ข้าม
            </Button>

            <Button
              onClick={handleNext}
              className="flex-1 pirate-button gap-2"
            >
              {currentStep < steps.length - 1 ? "ถัดไป" : "เริ่มต้นเลย!"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center mt-8 gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? "w-8 bg-primary" 
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </PirateBackdrop>
  );
};

export default Onboarding;
