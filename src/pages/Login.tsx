import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { apiError } from "@/lib/api";
import { toast } from "sonner";

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (e) { toast.error(apiError(e, "Login failed")); }
    finally { setBusy(false); }
  };

  const submitReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.password.length < 6) return toast.error("Password must be 6+ chars");
    setBusy(true);
    try {
      await register(regForm.name, regForm.email, regForm.password);
      toast.success("Account created");
      navigate("/");
    } catch (e) { toast.error(apiError(e, "Registration failed")); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container flex justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6 shadow-card">
          <Link to="/" className="mb-4 flex items-center gap-2 text-sm font-medium">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Bus className="h-4 w-4" />
            </span>
            BusNow
          </Link>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={submitLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" required value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="li-pass">Password</Label>
                  <Input id="li-pass" type="password" required value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-4">
              <form onSubmit={submitReg} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="r-name">Name</Label>
                  <Input id="r-name" required value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-email">Email</Label>
                  <Input id="r-email" type="email" required value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-pass">Password</Label>
                  <Input id="r-pass" type="password" required minLength={6} value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default Login;
