import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Checkin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [pointsAdded, setPointsAdded] = useState(0);

  useEffect(() => {
    const performCheckin = async () => {
      const participantId = localStorage.getItem('participantId');
      if (!participantId) {
        toast({
          title: "กรุณาลงทะเบียนก่อน",
          variant: "destructive",
        });
        navigate('/signup');
        return;
      }

      const loc = searchParams.get('loc');
      const sig = searchParams.get('sig');

      if (!loc || !sig) {
        setStatus('error');
        setMessage('QR Code ไม่ถูกต้อง');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('checkin', {
          body: { participantId, locationId: parseInt(loc), signature: sig }
        });

        if (error) throw error;

        if (data?.ok) {
          setStatus('success');
          setPointsAdded(data.pointsAdded || 0);
          setMessage(data.pointsAdded > 0 
            ? `เช็กอินสำเร็จ! +${data.pointsAdded} คะแนน` 
            : 'คุณเคยเช็กอินจุดนี้แล้ว');
          
          toast({
            title: "เช็กอินสำเร็จ! 🎉",
            description: data.pointsAdded > 0 ? `+${data.pointsAdded} คะแนน` : undefined,
          });

          setTimeout(() => navigate('/map'), 2000);
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'เกิดข้อผิดพลาด');
        toast({
          title: "เกิดข้อผิดพลาด",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    performCheckin();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg">กำลังตรวจสอบ...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-card p-8 rounded-2xl border-2 border-primary shadow-xl">
            <CheckCircle2 className="w-20 h-20 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">สำเร็จ!</h2>
            <p className="text-lg mb-4">{message}</p>
            {pointsAdded > 0 && (
              <div className="text-4xl font-bold text-accent mb-4">+{pointsAdded}</div>
            )}
            <Button onClick={() => navigate('/map')}>
              ไปที่แผนที่
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-card p-8 rounded-2xl border-2 border-destructive shadow-xl">
            <XCircle className="w-20 h-20 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-destructive mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-lg mb-4">{message}</p>
            <Button variant="outline" onClick={() => navigate('/map')}>
              กลับไปแผนที่
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkin;
