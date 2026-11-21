import { useState } from "react";
import { Link } from "react-router-dom";
import { IdCard, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthLayout from "@/components/auth/AuthLayout";
import RoleTabs from "@/components/auth/RoleTabs";
import { AuthInput, AuthPasswordInput, AuthSubmitButton } from "@/components/auth/fields";
import { authLabelClass, authLinkButtonClass } from "@/components/auth/authStyles";
import { usePortalRole } from "@/components/auth/portalRole";

const USER_ID_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/;

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { role, setRole, linkState } = usePortalRole();
  const { register } = useAuth();
  const { toast } = useToast();

  const fail = (description: string) => toast({ title: "Can't register", description, variant: "destructive" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length < 2) return fail("Please enter your full name.");
    if (!USER_ID_PATTERN.test(userId.trim())) {
      return fail("User ID must be 3-32 characters: letters, numbers, dot, dash or underscore.");
    }
    if (password.length < 8) return fail("Password must be at least 8 characters.");
    if (password !== confirmPassword) return fail("Passwords don't match.");

    setIsLoading(true);
    try {
      // On success the route guard sends the new patient to the dashboard.
      await register(userId.trim(), fullName.trim(), password);
    } catch (err) {
      fail(err instanceof Error ? err.message : "Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">Create account</h2>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">Register as a patient to book and manage appointments</p>

      <div className="mt-5">
        <RoleTabs role={role} onChange={setRole} />
      </div>

      {role === "Patient" ? (
        <form onSubmit={handleRegister} className="mt-5 space-y-3.5" noValidate>
          <div>
            <label htmlFor="register-name" className={authLabelClass}>
              Full Name
            </label>
            <AuthInput
              id="register-name"
              icon={<User className="w-4 h-4" />}
              placeholder="e.g. Aarav Sharma"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="register-userid" className={authLabelClass}>
              Choose User ID
            </label>
            <AuthInput
              id="register-userid"
              icon={<IdCard className="w-4 h-4" />}
              placeholder="e.g. aarav26"
              autoComplete="username"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="register-password" className={authLabelClass}>
              Password
            </label>
            <AuthPasswordInput
              id="register-password"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="register-confirm" className={authLabelClass}>
              Confirm Password
            </label>
            <AuthPasswordInput
              id="register-confirm"
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <AuthSubmitButton loading={isLoading} loadingLabel="Creating Account...">
            Create Account
          </AuthSubmitButton>

          <p className="text-[11px] text-slate-500 text-center">
            You can add an email address later on your Health Profile page to get appointment notifications.
          </p>
        </form>
      ) : (
        <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-600 leading-relaxed" role="status">
          {role === "Doctor" ? "Doctor" : "Staff"} accounts can't be created here. An administrator creates them and gives you a
          User ID and password. Log in with those, or choose the Patient tab to register as a patient.
        </div>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
        Already have an account?
        <Link to="/" state={linkState} className={authLinkButtonClass}>
          Log in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default Register;
