import { useState } from "react";
import { Pencil, Lock, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type View = "main" | "name" | "password" | "delete";

export const ProfileSheet = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("main");
  const [name, setName] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);

  const close = () => { setView("main"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); onClose(); };

  const saveName = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty");
    setBusy(true);
    try {
      await api.patch("/users/me", { name });
      await refreshUser();
      toast.success("Name updated");
      setView("main");
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const savePassword = async () => {
    if (newPw !== confirmPw) return toast.error("Passwords do not match");
    if (newPw.length < 6) return toast.error("Password must be 6+ chars");
    setBusy(true);
    try {
      await api.patch("/users/me", { currentPassword: currentPw, newPassword: newPw });
      toast.success("Password updated");
      setView("main");
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const deleteAccount = async () => {
    setBusy(true);
    try {
      await api.delete("/users/me");
      await logout();
      navigate("/");
      toast.success("Account deleted");
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm">

        {/* Main */}
        {view === "main" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle>{user.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{user.role}</Badge>
                </div>
              </div>
            </DialogHeader>
            <Separator />
            <div className="flex flex-col gap-1">
              <button onClick={() => { setName(user.name); setView("name"); }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit name
              </button>
              <button onClick={() => setView("password")}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors text-left">
                <Lock className="h-4 w-4 text-muted-foreground" /> Change password
              </button>
              <Separator className="my-1" />
              <button onClick={() => setView("delete")}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors text-left text-destructive">
                <Trash2 className="h-4 w-4" /> Delete account
              </button>
            </div>
          </>
        )}

        {/* Edit name */}
        {view === "name" && (
          <>
            <DialogHeader>
              <button onClick={() => setView("main")} className="text-xs text-muted-foreground hover:text-foreground text-left mb-1">← Back</button>
              <DialogTitle>Edit name</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button onClick={saveName} disabled={busy} className="w-full">{busy ? "Saving…" : "Save"}</Button>
          </>
        )}

        {/* Change password */}
        {view === "password" && (
          <>
            <DialogHeader>
              <button onClick={() => setView("main")} className="text-xs text-muted-foreground hover:text-foreground text-left mb-1">← Back</button>
              <DialogTitle>Change password</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Current password</Label>
                <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>New password</Label>
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm new password</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              </div>
            </div>
            <Button onClick={savePassword} disabled={busy} className="w-full">{busy ? "Saving…" : "Update password"}</Button>
          </>
        )}

        {/* Delete account */}
        {view === "delete" && (
          <>
            <DialogHeader>
              <button onClick={() => setView("main")} className="text-xs text-muted-foreground hover:text-foreground text-left mb-1">← Back</button>
              <DialogTitle className="text-destructive">Delete account</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Type <span className="font-semibold text-foreground">{user.name}</span> to confirm deletion.</p>
            <DeleteConfirm username={user.name} onConfirm={deleteAccount} busy={busy} onCancel={() => setView("main")} />
          </>
        )}

      </DialogContent>
    </Dialog>
  );
};

const DeleteConfirm = ({ username, onConfirm, busy, onCancel }: { username: string; onConfirm: () => void; busy: boolean; onCancel: () => void }) => {
  const [typed, setTyped] = useState("");
  return (
    <div className="space-y-3">
      <Input placeholder={username} value={typed} onChange={(e) => setTyped(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button variant="destructive" onClick={onConfirm} disabled={busy || typed !== username} className="flex-1">
          {busy ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </div>
  );
};
