import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/providers/auth-provider";
import { usePermission } from "@/hooks/usePermission";

export function RequireAuth() {
  const { loading, sessionKind } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-secondary">
        Loading session…
      </div>
    );
  }
  if (!sessionKind) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequirePosPermission() {
  const { allowed, loading } = usePermission("pos", "edit");
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-secondary">
        Checking permissions…
      </div>
    );
  }
  if (!allowed) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
