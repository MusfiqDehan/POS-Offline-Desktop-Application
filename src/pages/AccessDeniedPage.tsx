import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";

export function AccessDeniedPage() {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your account does not have POS edit permission. Contact a tenant administrator.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/login" onClick={logout}>
                Back to login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
