import { MapPin, CheckCircle2, Circle } from "lucide-react";
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
      className={`p-6 rounded-xl border-2 transition-all ${
        checkedIn ? "bg-primary/10 border-primary/50" : "bg-card border-rope"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {checkedIn ? (
            <CheckCircle2 className="w-8 h-8 text-primary" />
          ) : (
            <Circle className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{name}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            +{points} points {checkedIn && "(already checked in)"}
          </p>

          <Button variant="secondary" size="sm" className="gap-2" asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="w-4 h-4" />
              Open in Google Maps
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};
