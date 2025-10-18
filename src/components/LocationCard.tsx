import { MapPin, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationCardProps {
  id: number;
  name: string;
  lat: number;
  lng: number;
  points: number;
  checkedIn: boolean;
}

export const LocationCard = ({ name, lat, lng, points, checkedIn }: LocationCardProps) => {
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
        checkedIn
          ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/15"
          : "border-rope/40 bg-white/70 shadow-md hover:shadow-xl hover:shadow-secondary/10"
      }`}
    >
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
            {checkedIn ? "เช็กอินแล้ว" : "ยังไม่เช็กอิน"}
          </span>
        </div>

        <p className="text-sm text-foreground/70">
          สถานีนี้มอบ{" "}
          <span className="font-semibold text-primary">{points} คะแนน</span>{" "}
          เมื่อเช็กอินสำเร็จ
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4" />
              เปิดใน Google Maps
            </a>
          </Button>
          <p className="text-xs text-foreground/60">
            พิกัด: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
};
