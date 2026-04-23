import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus, MapPin, Sparkles, TrendingUp, Mail, Linkedin } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SearchBar } from "@/components/SearchBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { PopularRoute } from "@/types";

const Index = () => {
  const [routes, setRoutes] = useState<PopularRoute[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/buses/popular").then(({ data }) => setRoutes(data.routes || [])).catch(() => {});
  }, []);

  const [aboutOpen, setAboutOpen] = useState(false);

  const go = (from: string, to: string) =>
    navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="border-b border-border/60 bg-gradient-to-b from-primary-soft/40 to-background">
          <div className="container px-4 py-10 sm:py-16">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-soft">
                <Sparkles className="h-3 w-3 text-primary" /> Real-time intercity bus timings
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Catch the next bus, on time.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Search routes between cities. Clean, fast, and built for daily commuters.
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-3xl">
              <SearchBar />
            </div>

            <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-muted-foreground">
              Don't see your route?{" "}
              <Link to="/request-route" className="text-primary underline-offset-4 hover:underline">
                Request a new route
              </Link>
            </p>
          </div>
        </section>

        {/* Popular */}
        <section className="container px-4 py-10">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Popular routes</h2>
          </div>

          {routes.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No routes yet. {" "}
              <Link to="/request-route" className="text-primary underline-offset-4 hover:underline">
                Request the first one
              </Link>.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {routes.map((r) => (
                <button
                  key={`${r.from}-${r.to}`}
                  onClick={() => go(r.from, r.to)}
                  className="group rounded-xl border border-border bg-card p-4 text-left transition-shadow hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium">{r.from}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{r.to}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.count} bus{r.count > 1 ? "es" : ""}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Bus className="h-3.5 w-3.5" /> View timings
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => navigate("/request-route")}>
              Request a new route
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BusNow. Made for commuters.{" · "}
        <button onClick={() => setAboutOpen(true)} className="text-primary underline-offset-4 hover:underline">Contact</button>
      </footer>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <Bus className="h-4 w-4" />
              </span>
              About BusNow
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            BusNow is a mobile-first app for tracking intercity bus timings in real time. Search routes, save favourites, and never miss your next bus.
          </p>
          <div className="mt-2 space-y-2">
            <a
              href="mailto:kmnaveen1110@gmail.com"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              kmnaveen1110@gmail.com
            </a>
            <a
              href="https://www.linkedin.com/in/naveen-k-m-171109212"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Linkedin className="h-4 w-4 text-muted-foreground" />
              Naveen K M
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
