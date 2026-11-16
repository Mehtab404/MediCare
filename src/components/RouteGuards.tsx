import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { homePath } from "@/lib/roles";
import type { Role } from "@/types";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Activity className="h-8 w-8 text-primary animate-pulse" aria-label="Loading" />
    </div>
  );
}

/**
 * Pages for one kind of account. Anonymous visitors are sent to the login page and brought back after.
 * Someone logged in with another role is sent to their own home page.
 */
export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "anonymous" || !user) {
    return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  }
  if (!roles.includes(user.role)) return <Navigate to={homePath(user.role)} replace />;
  return <Outlet />;
}

/** Login and register pages. Logged-in users go to the page they asked for, or their home page. */
export function PublicOnlyRoute() {
  const { status, user } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated" && user) {
    return <Navigate to={from?.startsWith("/") ? from : homePath(user.role)} replace />;
  }
  return <Outlet />;
}
