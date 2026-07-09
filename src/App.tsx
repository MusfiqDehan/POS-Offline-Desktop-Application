import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth, RequirePosPermission } from "@/components/auth/guards";
import { AccessDeniedPage } from "@/pages/AccessDeniedPage";
import { LoginPage } from "@/pages/LoginPage";
import { PosPage } from "@/pages/PosPage";
import { AuthProvider } from "@/providers/auth-provider";
import { BranchProvider } from "@/providers/branch-provider";
import { SyncProvider } from "@/providers/sync-provider";
import { Toaster } from "sonner";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<RequirePosPermission />}>
            <Route
              path="/pos"
              element={
                <BranchProvider>
                  <SyncProvider>
                    <PosPage />
                  </SyncProvider>
                </BranchProvider>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
