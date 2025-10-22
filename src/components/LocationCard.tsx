import { MapPin, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

export const LocationCard = ({ name, lat, lng, points, checkedIn, mapUrl, imageUrl, description }: LocationCardProps) => {
  const mapsUrl = mapUrl ?? `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
        checkedIn
          ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/15"
          : "border-rope/40 bg-white/70 shadow-md hover:shadow-xl hover:shadow-secondary/10"
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
      <div className="relative p-6 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold text-primary">{name}</h3>
          <span
            className={`pirate-chip ${
              checkedIn ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-foreground/70"
            }`}
          >
            {checkedIn ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
            {checkedIn ? "เช็กอินแล้ว" : "ยังไม่ได้เช็กอิน"}
          </span>
        </div>

        {description && (
          <p className="text-sm text-foreground/80">{description}</p>
        )}

        <p className="text-sm text-foreground/70">
          คะแนนเมื่อเช็กอิน: <span className="font-semibold text-primary">{points} แต้ม</span>
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4" />
              เปิดใน Google Maps
            </a>
          </Button>
          <p className="text-xs text-foreground/60">พิกัด: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
        </div>
      </div>
    </div>
  );
};
