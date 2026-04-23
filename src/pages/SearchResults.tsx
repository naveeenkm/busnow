import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BusFront, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { BusCard } from "@/components/BusCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/api";
import type { Bus } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NearbyBus extends Bus {
  fromDist: number;
  toDist: number;
}

const SearchResults = () => {
  const [params] = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const [buses, setBuses] = useState<Bus[]>([]);
  const [nearby, setNearby] = useState<NearbyBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [favoritedRoutes, setFavoritedRoutes] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load existing favorites to show red hearts
  useEffect(() => {
    if (!user) return;
    api.get("/users/me/favorites").then(({ data }) => {
      const keys = (data.favorites || []).map((f: { from: string; to: string }) => `${f.from}|${f.to}`);
      setFavoritedRoutes(new Set(keys));
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    setLoading(true);
    setNearby([]);
    api.post("/buses/search", { from, to })
      .then(({ data }) => {
        const result = data.buses || [];
        setBuses(result);
        if (result.length === 0 && from && to) {
          setLoadingNearby(true);
          api.post("/buses/nearby", { from, to })
            .then(({ data }) => setNearby(data.suggestions || []))
            .catch(() => {})
            .finally(() => setLoadingNearby(false));
        }
      })
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  }, [from, to]);

  const takeBus = async (busId: string) => {
    if (!user) return toast.info("Login to save your ride history");
    try { await api.post("/users/me/history", { busId }); toast.success("Saved to history"); }
    catch (e) { toast.error(apiError(e)); }
  };

  const favorite = async () => {
    if (!user) return toast.info("Login to save favorites");
    const key = `${from}|${to}`;
    const isFav = favoritedRoutes.has(key);
    try {
      if (isFav) {
        const { data } = await api.get("/users/me/favorites");
        const fav = (data.favorites || []).find((f: { from: string; to: string; _id: string }) => f.from === from && f.to === to);
        if (fav) await api.delete(`/users/me/favorites/${fav._id}`);
        setFavoritedRoutes(prev => { const s = new Set(prev); s.delete(key); return s; });
        toast.success("Removed from favorites");
      } else {
        await api.post("/users/me/favorites", { from, to });
        setFavoritedRoutes(prev => new Set(prev).add(key));
        toast.success("Added to favorites");
      }
    } catch (e) { toast.error(apiError(e)); }
  };

  const isFavorited = favoritedRoutes.has(`${from}|${to}`);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-6">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mt-4">
          <SearchBar initialFrom={from} initialTo={to} />
        </div>

        <div className="mt-6 mb-3 flex items-baseline justify-between">
          <h1 className="text-lg font-semibold">
            {from || to ? <>Buses <span className="text-muted-foreground font-normal">{from} → {to}</span></> : "All buses"}
          </h1>
          {!loading && buses.length > 0 && (
            <span className="text-xs text-muted-foreground">{buses.length} found</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />)}
          </div>
        ) : buses.length > 0 ? (
          <div className="space-y-3">
            {buses.map((b) => (
              <BusCard key={b._id} bus={b} highlightNext isFavorited={isFavorited} onSave={() => takeBus(b._id)} onFavorite={favorite} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* No exact match */}
            <Card className="p-8 text-center">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted">
                <BusFront className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="font-medium">No buses found for {from} → {to}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Try a different route, or request this one.</p>
              <Button asChild className="mt-4">
                <Link to={`/request-route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`}>
                  Request this route
                </Link>
              </Button>
            </Card>

            {/* Nearby suggestions */}
            {loadingNearby && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Looking for nearby routes…</p>
                {[0, 1].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />)}
              </div>
            )}

            {!loadingNearby && nearby.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-semibold">Nearby routes</h2>
                  <span className="text-xs text-muted-foreground">within 50 km of your route</span>
                </div>
                <div className="space-y-3">
                  {nearby.map((b) => (
                    <div key={b._id} className="space-y-1">
                      <div className="flex flex-wrap gap-2 px-1">
                        {b.fromDist > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <MapPin className="h-3 w-3" /> {b.fromCity} is ~{b.fromDist} km from {from}
                          </Badge>
                        )}
                        {b.toDist > 0 && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <MapPin className="h-3 w-3" /> {b.toCity} is ~{b.toDist} km from {to}
                          </Badge>
                        )}
                      </div>
                      <BusCard bus={b} onSave={() => takeBus(b._id)} onFavorite={favorite} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;
