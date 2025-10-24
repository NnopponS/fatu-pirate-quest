import { MapPin, CheckCircle2, Clock, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

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
  events?: string[];
}

export const LocationCard = ({ name, lat, lng, points, checkedIn, mapUrl, imageUrl, description, events }: LocationCardProps) => {
  const mapsUrl = mapUrl ?? `https://www.google.com/maps?q=${lat},${lng}`;
  const [isEventsOpen, setIsEventsOpen] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-500 ${
        checkedIn
          ? "border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg shadow-green-500/20"
          : "border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md hover:shadow-xl hover:shadow-blue-400/20"
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
            <h3 className={`text-lg font-bold mb-1 ${checkedIn ? 'text-green-800' : 'text-blue-800'}`}>
              {name}
            </h3>
            {description && (
              <p className={`text-xs ${checkedIn ? 'text-green-700' : 'text-blue-700'}`}>{description}</p>
            )}
          </div>
          <span
            className={`pirate-chip flex-shrink-0 ${
              checkedIn 
                ? "bg-green-600 text-white border-green-700" 
                : "bg-blue-500 text-white border-blue-600"
            }`}
          >
            {checkedIn ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            <span className="text-xs">{checkedIn ? "เช็กอินแล้ว" : "ยังไม่ได้เช็กอิน"}</span>
          </span>
        </div>

        {events && events.length > 0 && (
          <Collapsible open={isEventsOpen} onOpenChange={setIsEventsOpen}>
            <CollapsibleTrigger 
              className={`w-full flex items-center justify-between rounded-lg border-2 px-4 py-2.5 transition-all hover:shadow-md ${
                checkedIn 
                  ? 'border-green-400 bg-green-50 hover:bg-green-100' 
                  : 'border-blue-400 bg-blue-50 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${checkedIn ? 'text-green-700' : 'text-blue-700'}`} />
                <span className={`text-sm font-semibold ${checkedIn ? 'text-green-900' : 'text-blue-900'}`}>
                  กิจกรรมในจุดนี้ ({events.length})
                </span>
              </div>
              <ChevronDown 
                className={`h-4 w-4 transition-transform duration-200 ${
                  isEventsOpen ? 'rotate-180' : ''
                } ${checkedIn ? 'text-green-700' : 'text-blue-700'}`} 
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className={`mt-2 rounded-lg border ${
                checkedIn 
                  ? 'border-green-300 bg-green-50/50' 
                  : 'border-blue-300 bg-blue-50/50'
              } p-4`}>
                <ul className={`space-y-2 ${checkedIn ? 'text-green-800' : 'text-blue-800'}`}>
                  {events.map((event, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <span className={`flex-shrink-0 mt-1 h-1.5 w-1.5 rounded-full ${
                        checkedIn ? 'bg-green-600' : 'bg-blue-600'
                      }`} />
                      <span className="leading-relaxed">{event}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
          checkedIn ? 'bg-green-100 border border-green-300' : 'bg-blue-100 border border-blue-300'
        }`}>
          <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
            checkedIn ? 'bg-green-600' : 'bg-blue-600'
          }`}>
            <span className="text-white font-bold text-sm">+{points}</span>
          </div>
          <span className={`text-sm font-semibold ${checkedIn ? 'text-green-900' : 'text-blue-900'}`}>
            คะแนนเมื่อเช็กอิน
          </span>
        </div>

        <Button 
          variant="secondary" 
          size="sm" 
          className={`w-full gap-2 ${
            checkedIn 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          asChild
        >
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <MapPin className="h-4 w-4" />
            เปิดใน Google Maps
          </a>
        </Button>
      </div>
    </div>
  );
};
