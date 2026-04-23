import { useState } from "react";
import { Bus as BusIcon, Clock, Heart, MapPin, X, CalendarDays, ArrowRight } from "lucide-react";
import type { Bus } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Props {
  bus: Bus;
  highlightNext?: boolean;
  isFavorited?: boolean;
  onSave?: () => void;
  onFavorite?: () => void;
}

const fmt12h = (val: string) => {
  if (!val) return "";
  const [hStr, mStr] = val.split(":");
  const h24 = parseInt(hStr);
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
};

const minutesUntil = (time: string) => {
  if (!time) return null;
  const now = new Date();
  const [h, m] = time.split(":").map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);
  return Math.round((target.getTime() - now.getTime()) / 60000);
};

export const BusCard = ({ bus, highlightNext, isFavorited, onSave, onFavorite }: Props) => {
  const [open, setOpen] = useState(false);
  const mins = minutesUntil(bus.arrivalTime);
  const isNext = highlightNext && mins !== null && mins <= 60;

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className={`p-4 transition-shadow hover:shadow-card cursor-pointer ${isNext ? "ring-1 ring-primary/40 bg-primary-soft/40" : ""}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
              <BusIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium truncate">{bus.name?.trim() || "Bus"}</h3>
                {isNext && mins !== null && (
                  <Badge className="bg-green-500 text-white hover:bg-green-500">
                    Next in {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{bus.fromCity} → {bus.toCity}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">{fmt12h(bus.arrivalTime)}</span>
                  <span className="text-muted-foreground">arrival</span>
                </span>
                {bus.frequency && <span className="text-muted-foreground">· {bus.frequency}</span>}
              </div>
            </div>
          </div>

          {(onSave || onFavorite) && (
            <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
              {onFavorite && (
                <Button variant="ghost" size="icon" onClick={onFavorite} aria-label="Save route">
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              )}
              {onSave && (
                <Button variant="outline" size="sm" onClick={onSave}>Take it</Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Detail popup */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <BusIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-base">{bus.name?.trim() || "Bus"}</h2>
              {isNext && mins !== null && (
                <Badge className="bg-green-500 text-white hover:bg-green-500 mt-1">
                  Next in {mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4" /> From</span>
              <span className="font-medium">{bus.fromCity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><ArrowRight className="h-4 w-4" /> To</span>
              <span className="font-medium">{bus.toCity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> Arrival</span>
              <span className="font-medium">{fmt12h(bus.arrivalTime) || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Frequency</span>
              <span className="font-medium">{bus.frequency || "—"}</span>
            </div>
          </div>

          {(onSave || onFavorite) && (
            <>
              <Separator />
              <div className="flex gap-2">
                {onFavorite && (
                  <Button variant="outline" className="flex-1 gap-2" onClick={() => { onFavorite(); }}>
                    <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
                    {isFavorited ? "Unfavorite" : "Favorite"}
                  </Button>
                )}
                {onSave && (
                  <Button className="flex-1" onClick={() => { onSave(); setOpen(false); }}>Take it</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
