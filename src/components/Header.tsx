import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, LogOut, User, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === "/";

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("patientName");
    navigate("/");
  };

  if (isLoginPage) {
    return null;
  }

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/doctors", label: "Doctors", icon: User },
    { path: "/appointments", label: "Appointments", icon: Calendar },
  ];

  return (
    <header className="gradient-medical text-primary-foreground shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
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
              Welcome, {localStorage.getItem("patientName") || "Patient"}
            </span>
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
