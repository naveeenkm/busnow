import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Locate, Search } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CityAutocomplete } from "./CityAutocomplete";
import { toast } from "sonner";

export const SearchBar = ({ initialFrom = "", initialTo = "" }: { initialFrom?: string; initialTo?: string }) => {
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [cities, setCities] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/buses/cities").then(({ data }) => setCities(data.cities || [])).catch(() => {});
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
          if (city) { setFrom(city); toast.success(`Detected: ${city}`); }
          else toast.error("Could not detect city");
        } catch (e) {
          toast.error(apiError(e, "Location lookup failed"));
        } finally { setLocating(false); }
      },
      () => { setLocating(false); toast.error("Location permission denied"); },
      { timeout: 8000 }
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) return toast.error("Enter both From and To");
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) return toast.error("From and To cities cannot be the same");
    const params = new URLSearchParams({ from: from.trim(), to: to.trim() });
    navigate(`/search?${params}`);
  };

  const sameCity = from && to && from.trim().toLowerCase() === to.trim().toLowerCase();

  return (
    <Card className="p-4 sm:p-6 shadow-card">
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <div className="space-y-1.5">
            <Label htmlFor="from" className="text-xs">From</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <CityAutocomplete id="from" value={from} onChange={setFrom} suggestions={cities} placeholder="Starting city" />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={detectLocation} disabled={locating} aria-label="Use my location">
                <Locate className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="to" className="text-xs">To</Label>
            <CityAutocomplete id="to" value={to} onChange={setTo} suggestions={cities} placeholder="Destination city" />
          </div>
          <Button type="submit" className="gap-2 sm:h-10 sm:mt-5">
            <Search className="h-4 w-4" /> Search
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {sameCity && (
          <p className="text-xs text-destructive">From and To cannot be the same.</p>
        )}
      </form>
    </Card>
  );
};
