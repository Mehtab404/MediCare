import { useState } from "react";
import { Link } from "react-router-dom";
import { User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import RoleTabs from "@/components/auth/RoleTabs";
import { AuthInput, AuthPasswordInput, AuthSubmitButton } from "@/components/auth/fields";
import { authLabelClass, authLinkButtonClass } from "@/components/auth/authStyles";
import { ROLE_DESCRIPTIONS, usePortalRole } from "@/components/auth/portalRole";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { role, setRole, linkState } = usePortalRole();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim() || !password) {
      toast({
        title: "Error",
        description: "Please enter both User ID and Password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // On success the route guard sends the user to the dashboard (or the page they asked for).
      await login(userId.trim(), password);
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">Log in</h2>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">Patients, doctors and staff log in here</p>

      <div className="mt-6">
        <RoleTabs role={role} onChange={setRole} />
        <p className="text-[11px] text-slate-500 mt-2 px-1">{ROLE_DESCRIPTIONS[role]}</p>
      </div>

      <form onSubmit={handleLogin} className="mt-5 space-y-4" noValidate>
        <div>
          <label htmlFor="login-userid" className={authLabelClass}>
            User ID
          </label>
          <AuthInput
            id="login-userid"
            icon={<User className="w-4 h-4" />}
            placeholder="Enter your User ID"
            autoComplete="username"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-bold text-[#0F172A]">
              Password
            </label>
            <Link
              to="/forgot-password"
              state={linkState}
              className="text-xs font-semibold text-[#1E4E5F] hover:text-[#0F172A] hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <AuthPasswordInput
            id="login-password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <AuthSubmitButton loading={isLoading} loadingLabel="Signing in...">
          Login
        </AuthSubmitButton>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-600">
        Don't have an account?
        <Link to="/register" state={linkState} className={authLinkButtonClass}>
          Register
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Login;
