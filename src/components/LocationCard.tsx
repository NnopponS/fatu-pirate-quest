import { MapPin, CheckCircle2, Clock, Calendar, ChevronDown, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import QRCode from "react-qr-code";

interface SubEvent {
  id: string;
  name: string;
  location_id: number;
  qr_code_version?: number;
}

interface LocationCardProps {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
  checkedIn: boolean;
  mapUrl?: string;
  imageUrl?: string;
  description?: string;
  subEvents?: SubEvent[];
}

export const LocationCard = ({ name, lat, lng, points, checkedIn, mapUrl, imageUrl, description, subEvents }: LocationCardProps) => {
  const mapsUrl = mapUrl ?? `https://www.google.com/maps?q=${lat},${lng}`;
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [selectedSubEvent, setSelectedSubEvent] = useState<SubEvent | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
        checkedIn
          ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg shadow-green-500/20"
          : "border-amber-400 bg-gradient-to-br from-orange-50 to-amber-100 shadow-md hover:shadow-xl hover:shadow-amber-400/20"
      }`}
    >
      {imageUrl && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 pointer-events-none" />
      <div className="relative p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className={`text-lg font-bold mb-1 ${checkedIn ? 'text-green-800' : 'text-amber-900'}`}>
              {name}
            </h3>
            {description && (
              <p className={`text-xs ${checkedIn ? 'text-green-700' : 'text-amber-800'}`}>{description}</p>
            )}
          </div>
          <span
            className={`pirate-chip flex-shrink-0 ${
              checkedIn 
                ? "bg-green-600 text-white border-green-700" 
                : "bg-amber-600 text-white border-amber-700"
            }`}
          >
            {checkedIn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            <span className="text-xs">{checkedIn ? "เช็กอินแล้ว" : "ยังไม่ได้เช็กอิน"}</span>
          </span>
        </div>

        {subEvents && subEvents.length > 0 && (
          <Collapsible open={isEventsOpen} onOpenChange={setIsEventsOpen}>
            <CollapsibleTrigger 
              className={`w-full flex items-center justify-between rounded-lg border-2 px-4 py-2.5 transition-all hover:shadow-md ${
                checkedIn 
                  ? 'border-green-400 bg-green-50 hover:bg-green-100' 
                  : 'border-amber-400 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${checkedIn ? 'text-green-700' : 'text-amber-800'}`} />
                <span className={`text-sm font-semibold ${checkedIn ? 'text-green-900' : 'text-amber-900'}`}>
                  🏴‍☠️ กิจกรรมในจุดนี้ ({subEvents.length})
                </span>
              </div>
              <ChevronDown 
                className={`h-4 w-4 transition-transform duration-200 ${
                  isEventsOpen ? 'rotate-180' : ''
                } ${checkedIn ? 'text-green-700' : 'text-amber-800'}`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={`mt-2 rounded-lg border ${
                checkedIn 
                  ? 'border-green-300 bg-green-50/50' 
                  : 'border-amber-300 bg-amber-50/50'
              } p-3 space-y-2`}>
                <p className="text-xs text-amber-800 font-semibold mb-2">
                  💎 ร่วมกิจกรรม 1 อันเพื่อรับคะแนนเพิ่ม +100
                </p>
                <div className="space-y-2">
                  {subEvents.map((subEvent) => (
                    <div 
                      key={subEvent.id} 
                      className={`flex items-center justify-between rounded-lg border p-2 ${
                        checkedIn 
                          ? 'border-green-200 bg-white/50' 
                          : 'border-amber-200 bg-white/50'
                      }`}
                    >
                      <span className={`text-sm ${checkedIn ? 'text-green-900' : 'text-amber-900'}`}>
                        ⚓ {subEvent.name}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setSelectedSubEvent(subEvent);
                          setQrDialogOpen(true);
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          checkedIn ? 'bg-green-100 border border-green-300' : 'bg-amber-100 border border-amber-300'
        }`}>
          <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
            checkedIn ? 'bg-green-600' : 'bg-amber-600'
          }`}>
            <span className="text-white font-bold text-sm">⚓ +{points}</span>
          </div>
          <span className={`text-sm font-semibold ${checkedIn ? 'text-green-900' : 'text-amber-900'}`}>
            คะแนนเมื่อเช็กอิน
          </span>
        </div>

        <Button 
          variant="secondary" 
          size="sm" 
          className={`w-full gap-2 ${
            checkedIn 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
          asChild
        >
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-4 w-4" />
            เปิดใน Google Maps
          </a>
        </Button>
      </div>

      {/* QR Dialog for Sub-Events */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">🏴‍☠️ QR Code กิจกรรม</DialogTitle>
          </DialogHeader>
          {selectedSubEvent && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900 mb-2">
                  ⚓ {selectedSubEvent.name}
                </p>
                <p className="text-xs text-amber-800">
                  สแกน QR Code นี้เพื่อรับคะแนนเพิ่ม +100 (ครั้งแรกต่อสถานที่)
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-xl border-2 border-amber-300 flex items-center justify-center">
                <QRCode
                  value={`SUBEVENT|${selectedSubEvent.id}|${selectedSubEvent.qr_code_version || 1}`}
                  size={200}
                  level="H"
                />
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setQrDialogOpen(false)}
                  className="border-amber-300"
                >
                  ปิด
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
