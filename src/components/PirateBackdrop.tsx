import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PirateBackdropProps {
  children: ReactNode;
  className?: string;
}

export const PirateBackdrop = ({ children, className }: PirateBackdropProps) => (
  <div className={cn("pirate-page", className)}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(255,209,148,0.25),transparent_60%)] pointer-events-none" />
    <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-accent/30 blur-3xl pirate-floating pointer-events-none" />
    <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-secondary/30 blur-3xl pirate-floating-delayed pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-primary/10 via-transparent to-transparent pirate-wave pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);
