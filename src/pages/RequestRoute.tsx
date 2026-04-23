import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BusForm, BusFormData, isSameCity } from "@/components/BusForm";
import { api, apiError } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const RequestRoute = () => {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<BusFormData>({
    name: "",
    fromCity: params.get("from") || "",
    toCity: params.get("to") || "",
    arrivalTime: "",
    frequency: "Every day",
    notes: "",
  });
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromCity.trim() || !form.toCity.trim()) return toast.error("From and To required");
    if (isSameCity(form.fromCity, form.toCity)) return toast.error("From and To cities cannot be the same");
    if (!form.arrivalTime) return toast.error("Arrival time required");
    setBusy(true);
    try {
      await api.post("/route-requests", { ...form, contactEmail });
      toast.success("Request submitted! Admin will review it.");
      navigate("/");
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-xl px-4 py-8">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-semibold">Request a new route</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tell us where you need to go. We'll review and add it.</p>

        <Card className="mt-5 p-5">
          <form onSubmit={submit} className="space-y-3">
            <BusForm value={form} onChange={setForm} showNotes />
            <div className="space-y-1.5">
              <Label>Contact email <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default RequestRoute;
