import { useEffect, useState } from "react";
import { ArrowLeft, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BusForm, BusFormData, fmt12h, isSameCity } from "@/components/BusForm";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Bus, RouteRequest, User } from "@/types";
import { toast } from "sonner";

const empty: BusFormData = { name: "", fromCity: "", toCity: "", arrivalTime: "", frequency: "Every day" };

const Admin = () => {
  const navigate = useNavigate();
  const { refreshPending } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [requests, setRequests] = useState<RouteRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [form, setForm] = useState<BusFormData>({ ...empty });
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [b, r, u] = await Promise.all([
        api.get("/buses"),
        api.get("/route-requests"),
        api.get("/admin/users"),
      ]);
      setBuses(b.data.buses || []);
      setRequests(r.data.requests || []);
      setUsers(u.data.users || []);
    } catch (e) { toast.error(apiError(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...empty }); setOpen(true); };
  const openEdit = (b: Bus) => {
    setEditing(b);
    setForm({ name: b.name || "", fromCity: b.fromCity, toCity: b.toCity, arrivalTime: b.arrivalTime, frequency: b.frequency || "Every day" });
    setOpen(true);
  };

  const saveBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromCity || !form.toCity || !form.arrivalTime) return toast.error("From, To and Arrival time required");
    if (isSameCity(form.fromCity, form.toCity)) return toast.error("From and To cities cannot be the same");
    try {
      if (editing) await api.put(`/buses/${editing._id}`, form);
      else await api.post("/buses", form);
      toast.success(editing ? "Bus updated" : "Bus added");
      setOpen(false);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const deleteBus = async (id: string) => {
    if (!confirm("Delete this bus?")) return;
    try { await api.delete(`/buses/${id}`); load(); toast.success("Deleted"); }
    catch (e) { toast.error(apiError(e)); }
  };

  const decideRequest = async (id: string, status: "approved" | "rejected", reason = "") => {
    try {
      await api.patch(`/route-requests/${id}`, { status, rejectionReason: reason });
      load(); refreshPending();
      toast.success(`Request ${status}`);
    } catch (e) { toast.error(apiError(e)); }
  };

  const handleReject = (id: string) => { setRejectId(id); setRejectReason(""); };
  const confirmReject = async () => {
    if (!rejectId) return;
    await decideRequest(rejectId, "rejected", rejectReason);
    setRejectId(null);
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try { await api.delete(`/admin/users/${id}`); load(); toast.success("User deleted"); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container px-4 py-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Admin dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage buses, route requests and users.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add bus</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? "Edit bus" : "Add bus"}</DialogTitle></DialogHeader>
              <form onSubmit={saveBus} className="space-y-4">
                <BusForm value={form} onChange={setForm} />
                <DialogFooter>
                  <Button type="submit">{editing ? "Save changes" : "Add bus"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="buses" className="mt-6">
          <TabsList>
            <TabsTrigger value="buses">Buses ({buses.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Requests{requests.filter(r => r.status === "pending").length > 0 &&
                <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {requests.filter(r => r.status === "pending").length}
                </span>}
            </TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="buses" className="mt-4">
            {loading ? <div className="h-20 animate-pulse rounded-xl bg-muted/60" /> :
              buses.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">No buses yet.</Card> :
              <div className="space-y-2">
                {buses.map(b => (
                  <Card key={b._id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{b.name || "Bus"} · {b.fromCity} → {b.toCity}</div>
                      <div className="text-xs text-muted-foreground">
                        arr {fmt12h(b.arrivalTime)}{b.frequency && <> · {b.frequency}</>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteBus(b._id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            }
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            {requests.length === 0 ? <Card className="p-5 text-sm text-muted-foreground">No requests.</Card> :
              <div className="space-y-2">
                {requests.map(r => (
                  <Card key={r._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{r.fromCity} → {r.toCity}</div>
                        {r.arrivalTime && <div className="text-xs text-muted-foreground">arr {fmt12h(r.arrivalTime)}</div>}
                        {r.notes && <div className="mt-1 text-sm text-muted-foreground">{r.notes}</div>}
                        {r.status === "rejected" && r.rejectionReason && (
                          <div className="mt-1 text-xs text-destructive">Reason: {r.rejectionReason}</div>
                        )}
                        <div className="mt-1 text-xs text-muted-foreground">
                          {r.requestedBy?.name || r.contactEmail || "Anonymous"} · {new Date(r.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={r.status === "pending" ? "secondary" : r.status === "approved" ? "default" : "destructive"}>
                          {r.status}
                        </Badge>
                        {r.status === "pending" && (
                          <>
                            <Button size="icon" variant="outline" onClick={() => decideRequest(r._id, "approved")}><Check className="h-4 w-4 text-green-500" /></Button>
                            <Button size="icon" variant="outline" onClick={() => handleReject(r._id)}><X className="h-4 w-4 text-destructive" /></Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            }
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <div className="space-y-2">
              {users.map(u => (
                <Card key={u._id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="font-medium">
                      {u.name}
                      {u.role === "admin" && <Badge className="ml-2">admin</Badge>}
                      {u.isDemo && <Badge variant="secondary" className="ml-2">demo</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  {u.role !== "admin" && (
                    <Button variant="ghost" size="icon" onClick={() => deleteUser(u._id)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Rejection reason dialog */}
      <Dialog open={!!rejectId} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject request</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Provide a reason for rejection (optional but helpful for the user).</p>
            <Textarea
              rows={3}
              placeholder="e.g. Route already covered, insufficient demand..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
