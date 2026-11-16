import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Activity className="h-8 w-8 text-primary animate-pulse" aria-label="Loading" />
    </div>
  );
}

/** Pages that need a logged-in patient. Others are sent to the login page and brought back after. */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullPageLoader />;
  if (status === "anonymous") return <Navigate to="/" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}

/** Login and register pages. Logged-in patients go to the page they asked for, or the dashboard. */
export function PublicOnlyRoute() {
  const { status } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === "loading") return <FullPageLoader />;
  if (status === "authenticated") return <Navigate to={from?.startsWith("/") ? from : "/dashboard"} replace />;
  return <Outlet />;
}
