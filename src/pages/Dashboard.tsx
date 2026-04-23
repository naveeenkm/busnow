import { useEffect, useState } from "react";
import { Heart, History, Trash2, ArrowLeft, MapPin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Favorite, RideHistoryEntry, RouteRequest } from "@/types";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { fmt12h } from "@/components/BusForm";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [history, setHistory] = useState<RideHistoryEntry[]>([]);
  const [requests, setRequests] = useState<RouteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [f, h, r] = await Promise.all([
        api.get("/users/me/favorites"),
        api.get("/users/me/history"),
        api.get("/users/me/requests"),
      ]);
      setFavorites(f.data.favorites || []);
      setHistory(h.data.history || []);
      setRequests(r.data.requests || []);
    } catch (e) { toast.error(apiError(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const removeFav = async (id: string) => {
    try {
      const { data } = await api.delete(`/users/me/favorites/${id}`);
      setFavorites(data.favorites);
    } catch (e) { toast.error(apiError(e)); }
  };

  const statusColor = (s: string) =>
    s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-semibold">Hi, {user?.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your routes and recent rides.</p>

        {/* Favorites */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <h2 className="text-base font-semibold">Favorite routes</h2>
          </div>
          {loading ? <div className="h-20 animate-pulse rounded-xl bg-muted/60" /> :
            favorites.length === 0 ? (
              <Card className="p-5 text-sm text-muted-foreground">No favorites yet. Save a route from search results.</Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {favorites.map(f => (
                  <Card key={f._id} className="flex items-center justify-between p-4">
                    <Link to={`/search?from=${encodeURIComponent(f.from)}&to=${encodeURIComponent(f.to)}`}
                      className="text-sm font-medium hover:text-primary flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {f.from} → {f.to}
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => removeFav(f._id)} aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
        </section>

        {/* My Requests */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">My route requests</h2>
          </div>
          {loading ? <div className="h-20 animate-pulse rounded-xl bg-muted/60" /> :
            requests.length === 0 ? (
              <Card className="p-5 text-sm text-muted-foreground">
                No requests yet.{" "}
                <Link to="/request-route" className="text-primary underline-offset-4 hover:underline">Request a route</Link>
              </Card>
            ) : (
              <div className="space-y-2">
                {requests.map(r => (
                  <Card key={r._id} className={`flex items-start justify-between p-4 ${r.status === "rejected" ? "border-destructive/40 bg-destructive/5" : ""}`}>
                    <div>
                      <div className="text-sm font-medium">{r.fromCity} → {r.toCity}</div>
                      {r.name && <div className="text-xs font-medium text-primary">{r.name}</div>}
                      <div className="text-xs text-muted-foreground">
                        {r.arrivalTime && <>arr {fmt12h(r.arrivalTime)} · </>}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                      {r.notes && <div className="text-xs text-muted-foreground mt-0.5">{r.notes}</div>}
                      {r.status === "rejected" && r.rejectionReason && (
                        <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                          <p className="text-xs font-medium text-destructive">Reason for rejection</p>
                          <p className="text-xs text-destructive/80 mt-0.5">{r.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                    <Badge variant={statusColor(r.status)}>{r.status}</Badge>
                  </Card>
                ))}
              </div>
            )}
        </section>

        {/* Ride History */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Ride history</h2>
          </div>
          {loading ? <div className="h-20 animate-pulse rounded-xl bg-muted/60" /> :
            history.length === 0 ? (
              <Card className="p-5 text-sm text-muted-foreground">No rides yet.</Card>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <Card key={h._id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-medium">
                        {h.bus?.name || "Bus"} · {h.fromCity} → {h.toCity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {h.bus?.arrivalTime && (
                      <span className="text-xs text-muted-foreground">arr {fmt12h(h.bus.arrivalTime)}</span>
                    )}
                  </Card>
                ))}
              </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
