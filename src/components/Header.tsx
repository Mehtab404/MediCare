import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, HeartPulse, Home, KeyRound, LayoutDashboard, LogOut, Users, type LucideIcon } from "lucide-react";
import MediCareLogo from "@/components/auth/MediCareLogo";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { homePath } from "@/lib/roles";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const NAV_ITEMS: Record<Role, { path: string; label: string; icon: LucideIcon }[]> = {
  patient: [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/doctors", label: "Doctors", icon: Users },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/profile", label: "Health Profile", icon: HeartPulse },
  ],
  doctor: [{ path: "/doctor", label: "My Schedule", icon: Calendar }],
  admin: [{ path: "/admin", label: "Administration", icon: LayoutDashboard }],
};

const actionButtonClass =
  "px-3.5 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 " +
  "flex items-center gap-1.5 transition-colors cursor-pointer";

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isLoginPage = location.pathname === "/";

  // Same query as the dashboard and appointments pages, so this costs no extra request there.
  const appointmentsQuery = useQuery({
    queryKey: ["appointments"],
    queryFn: api.appointments,
    enabled: user?.role === "patient",
  });
  const upcomingCount = (appointmentsQuery.data ?? []).filter((a) => a.status === "upcoming").length;

  // The route guard redirects to the login page once the session is cleared.
  const handleLogout = () => {
    void logout();
  };

  if (isLoginPage) {
    return null;
  }

  const navItems = user ? NAV_ITEMS[user.role] : [];

  return (
    <div className="relative z-50 container mx-auto px-4 pt-4">
      <header className="rounded-2xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-sm px-4 sm:px-6 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to={user ? homePath(user.role) : "/"}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#14807A] rounded-xl"
          >
            <div className="w-11 h-11 rounded-xl bg-[#1B2A2F] flex items-center justify-center shrink-0 p-1.5 shadow-sm group-hover:scale-[1.03] transition-transform">
              <MediCareLogo tone="light" />
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight text-slate-900 leading-none">MediCare</span>
              <span className="block text-[11px] font-medium text-slate-500 mt-1">Hospital Management</span>
            </div>
          </Link>

          {/* Navigation. On small screens it moves to its own row and scrolls sideways. */}
          <nav
            aria-label="Primary"
            className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 shrink-0",
                    isActive
                      ? "bg-[#1B2A2F] text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-[#E3F0F2]/60",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.path === "/appointments" && upcomingCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#14807A] text-white"
                      aria-label={`${upcomingCount} upcoming`}
                    >
                      {upcomingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Account */}
          <div className="order-2 lg:order-3 flex items-center gap-2 sm:gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E3F0F2]/85 border border-[#14807A]/20 text-xs font-semibold text-[#1B2A2F] max-w-[200px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">Welcome, {user?.fullName ?? "there"}</span>
            </div>

            <Link
              to="/change-password"
              aria-label="Change password"
              className={cn(actionButtonClass, "hover:bg-slate-50 hover:text-slate-900")}
            >
              <KeyRound className="w-3.5 h-3.5 text-[#14807A]" />
              <span className="hidden sm:inline">Password</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className={cn(actionButtonClass, "hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700")}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
