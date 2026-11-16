import { Link, useLocation } from "react-router-dom";
import { Activity, LogOut, User, Calendar, Home, LayoutDashboard, HeartPulse, KeyRound, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { homePath } from "@/lib/roles";
import type { Role } from "@/types";

const NAV_ITEMS: Record<Role, { path: string; label: string; icon: LucideIcon }[]> = {
  patient: [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/doctors", label: "Doctors", icon: User },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/profile", label: "Health Profile", icon: HeartPulse },
  ],
  doctor: [{ path: "/doctor", label: "My Schedule", icon: Calendar }],
  admin: [{ path: "/admin", label: "Administration", icon: LayoutDashboard }],
};

const Header = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isLoginPage = location.pathname === "/";

  // The route guard redirects to the login page once the session is cleared.
  const handleLogout = () => {
    void logout();
  };

  if (isLoginPage) {
    return null;
  }

  const navItems = user ? NAV_ITEMS[user.role] : [];

  return (
    <header className="gradient-medical text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? homePath(user.role) : "/"} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MediCare</h1>
              <p className="text-xs opacity-80">Hospital Management</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-primary-foreground/20 font-medium"
                      : "hover:bg-primary-foreground/10"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm opacity-90">
              Welcome, {user?.fullName ?? "there"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Link to="/change-password" aria-label="Change password">
                <KeyRound className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Password</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
