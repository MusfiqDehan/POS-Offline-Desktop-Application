import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import favicon from "@/assets/brand/favicon.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collectErrorMessages } from "@/lib/api";
import {
  getStoredSubdomain,
  setStoredSubdomain,
  shouldRememberSubdomain,
} from "@/lib/app-store";
import { saveSession } from "@/lib/auth-session";
import { fetchTenantPermissions } from "@/lib/access";
import { hasPermission } from "@/lib/permissions";
import { tenantLogin } from "@/lib/tenant-auth";
import { setTenantSubdomain } from "@/lib/tenant-headers";
import { useAuth } from "@/providers/auth-provider";

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshAccess } = useAuth();
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const remember = await shouldRememberSubdomain();
      setRememberMe(remember);
      if (remember) {
        setSubdomain(await getStoredSubdomain());
      }
    })();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const cleanedSubdomain = subdomain.trim().toLowerCase();
    if (!cleanedSubdomain || !email.trim() || !password) {
      setErrors(["Subdomain, email, and password are required."]);
      return;
    }

    setErrors([]);
    setLoading(true);
    setTenantSubdomain(cleanedSubdomain);

    try {
      const loginRes = await tenantLogin(email.trim(), password, cleanedSubdomain);
      if (!loginRes.ok || !loginRes.body.data) {
        setErrors(collectErrorMessages(loginRes.body));
        return;
      }

      const { access, refresh } = loginRes.body.data;
      saveSession({ access, refresh, kind: "tenant" });
      await setStoredSubdomain(cleanedSubdomain, rememberMe);

      const permRes = await fetchTenantPermissions(access);
      if (!permRes.ok || !permRes.body.data) {
        setErrors(collectErrorMessages(permRes.body));
        return;
      }

      const allowed = hasPermission(
        permRes.body.data.permissions ?? {},
        "pos",
        "edit",
        Boolean(permRes.body.data.is_tenant_admin),
      );

      await refreshAccess();

      if (!allowed) {
        navigate("/access-denied", { replace: true });
        return;
      }

      navigate("/pos", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col items-center justify-center bg-secondary p-10 text-white lg:flex">
        <img src={favicon} alt="Sortorium" className="mb-6 h-20 w-20 rounded-xl" />
        <h1 className="text-3xl font-bold">Sortorium POS</h1>
        <p className="mt-3 max-w-sm text-center text-white/80">
          Offline-ready point of sale for tenant cashiers. Sell with or without internet.
        </p>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in to POS</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your tenant subdomain and credentials.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Tenant subdomain</Label>
                <Input
                  id="subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="jubayer"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-secondary">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(v) => setRememberMe(Boolean(v))}
                />
                Remember subdomain
              </label>
              {errors.length > 0 && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
