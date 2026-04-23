import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { api } from "@/lib/api";

// ── helpers ────────────────────────────────────────────────────────────
export const to24h = (h: string, m: string, ampm: string) => {
  let h24 = parseInt(h) || 12;
  if (ampm === "PM" && h24 !== 12) h24 += 12;
  if (ampm === "AM" && h24 === 12) h24 = 0;
  return `${String(h24).padStart(2, "0")}:${m.padStart(2, "0")}`;
};

export const to12h = (val: string) => {
  if (!val) return { h: "12", m: "00", ampm: "AM" };
  const [hStr, mStr] = val.split(":");
  const h24 = parseInt(hStr);
  return {
    h: String(h24 % 12 || 12),
    m: mStr?.padStart(2, "0") || "00",
    ampm: h24 >= 12 ? "PM" : "AM",
  };
};

export const fmt12h = (val: string) => {
  if (!val) return "";
  const { h, m, ampm } = to12h(val);
  return `${h}:${m} ${ampm}`;
};

// ── TimePicker ─────────────────────────────────────────────────────────
export const TimePicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [confirmed, setConfirmed] = useState(!!value);
  const { h, m, ampm } = to12h(value);

  const setH = (raw: string) => {
    const n = parseInt(raw);
    if (raw === "") { onChange(to24h("12", m, ampm)); return; }
    if (isNaN(n) || n < 1 || n > 12) return;
    onChange(to24h(String(n), m, ampm));
  };

  const setM = (raw: string) => {
    const n = parseInt(raw);
    if (raw === "") { onChange(to24h(h, "00", ampm)); return; }
    if (isNaN(n) || n < 0 || n > 59) return;
    onChange(to24h(h, String(n).padStart(2, "0"), ampm));
  };

  const toggleAmpm = () => onChange(to24h(h, m, ampm === "AM" ? "PM" : "AM"));

  if (!confirmed) {
    return (
      <button
        type="button"
        onClick={() => { setConfirmed(true); onChange(to24h("12", "00", "AM")); }}
        className="inline-flex items-center gap-2 rounded-md border border-dashed border-input px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
      >
        <span>🕐</span> Click to set arrival time
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number" min={1} max={12}
        value={h}
        onChange={(e) => setH(e.target.value)}
        className="w-14 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="12"
      />
      <span className="text-muted-foreground font-bold">:</span>
      <input
        type="number" min={0} max={59}
        value={m}
        onChange={(e) => setM(e.target.value)}
        className="w-14 rounded-md border border-input bg-background px-2 py-1.5 text-center text-sm font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="00"
      />
      <button
        type="button"
        onClick={toggleAmpm}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors min-w-[52px]"
      >
        {ampm}
      </button>
      <button
        type="button"
        onClick={() => { setConfirmed(false); onChange(""); }}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-1"
      >
        ✕
      </button>
    </div>
  );
};

// ── FrequencyPicker ───────────────────────────────────────────────────
const FREQ_OPTIONS = ["Every day", "Every 2 days", "Every 3 days", "Every 5 days", "Weekdays only", "Weekends only"];

const FrequencyPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const isCustom = !FREQ_OPTIONS.includes(value);
  const [custom, setCustom] = useState(isCustom);

  const select = (v: string) => {
    if (v === "__custom__") { setCustom(true); onChange(""); return; }
    setCustom(false);
    onChange(v);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {FREQ_OPTIONS.map((o) => (
          <button
            key={o} type="button"
            onClick={() => select(o)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
              ${ !custom && value === o
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"}`}
          >
            {o}
          </button>
        ))}
        <button
          type="button"
          onClick={() => select("__custom__")}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors
            ${custom ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"}`}
        >
          Custom
        </button>
      </div>
      {custom && (
        <Input
          autoFocus
          placeholder="e.g. Every Monday"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
};

export const isSameCity = (a: string, b: string) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// ── BusForm ────────────────────────────────────────────────────────────
export interface BusFormData {
  name: string;
  fromCity: string;
  toCity: string;
  arrivalTime: string;
  frequency: string;
  notes?: string;
}

interface BusFormProps {
  value: BusFormData;
  onChange: (v: BusFormData) => void;
  showNotes?: boolean;
}

export const BusForm = ({ value, onChange, showNotes = false }: BusFormProps) => {
  const [cities, setCities] = useState<string[]>([]);
  const set = (k: keyof BusFormData, v: string) => onChange({ ...value, [k]: v });

  useEffect(() => {
    api.get("/buses/cities").then(({ data }) => setCities(data.cities || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Bus name <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Input placeholder="e.g. KSRTC Express" value={value.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>From *</Label>
          <CityAutocomplete value={value.fromCity} onChange={(v) => set("fromCity", v)} suggestions={cities} placeholder="Starting city" />
        </div>
        <div className="space-y-1.5">
          <Label>To *</Label>
          <CityAutocomplete value={value.toCity} onChange={(v) => set("toCity", v)} suggestions={cities} placeholder="Destination city" />
        </div>
      </div>
      {value.fromCity && value.toCity && value.fromCity.trim().toLowerCase() === value.toCity.trim().toLowerCase() && (
        <p className="text-xs text-destructive -mt-1">From and To cities cannot be the same.</p>
      )}

      <div className="space-y-1.5">
        <Label>Arrival time *</Label>
        <TimePicker value={value.arrivalTime} onChange={(v) => set("arrivalTime", v)} />
      </div>

      <div className="space-y-1.5">
        <Label>Frequency</Label>
        <FrequencyPicker value={value.frequency} onChange={(v) => set("frequency", v)} />
      </div>

      {showNotes && (
        <div className="space-y-1.5">
          <Label>Notes <span className="text-xs text-muted-foreground">(optional)</span></Label>
          <Textarea rows={3} maxLength={500} value={value.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Stops, preferred timings, etc." />
        </div>
      )}
    </div>
  );
};
