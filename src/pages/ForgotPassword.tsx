import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, User } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import RoleTabs from "@/components/auth/RoleTabs";
import { AuthInput, AuthSubmitButton } from "@/components/auth/fields";
import { authLabelClass, authPrimaryButtonClass } from "@/components/auth/authStyles";
import { usePortalRole } from "@/components/auth/portalRole";
import { api } from "@/lib/api";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const { role, setRole, linkState } = usePortalRole();
  const send = useMutation({ mutationFn: () => api.forgotPassword(identifier.trim()) });

  return (
    <AuthLayout>
      <Link
        to="/"
        state={linkState}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#0F172A] mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Log in</span>
      </Link>

      <h2 className="text-2xl sm:text-[28px] font-bold tracking-tight">Reset password</h2>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">We'll email you a link to choose a new one</p>

      <div className="mt-5">
        <RoleTabs role={role} onChange={setRole} />
      </div>

      {role !== "Patient" ? (
        <div className="mt-5 p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-slate-600 leading-relaxed" role="status">
          {role === "Doctor" ? "Doctor" : "Staff"} accounts have no email address on file, so they can't get a reset link. Ask an
          administrator to set a new password for you from the Users tab.
        </div>
      ) : send.isSuccess ? (
        <div className="mt-6 space-y-4 text-center" role="status">
          <CheckCircle className="h-10 w-10 mx-auto text-emerald-600" />
          <p className="text-sm text-[#0F172A]">{send.data.message}</p>
          <Link to="/" state={linkState} className={authPrimaryButtonClass}>
            Back to Log in
          </Link>
        </div>
      ) : (
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <div>
            <label htmlFor="forgot-identifier" className={authLabelClass}>
              User ID or Email
            </label>
            <AuthInput
              id="forgot-identifier"
              icon={<User className="w-4 h-4" />}
              placeholder="e.g. aarav26 or you@example.com"
              autoComplete="username"
              maxLength={254}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />
          </div>

          {send.isError && (
            <p className="text-sm text-destructive" role="alert">
              {send.error.message}
            </p>
          )}

          <AuthSubmitButton
            loading={send.isPending}
            loadingLabel="Sending Reset Link..."
            disabled={identifier.trim() === ""}
          >
            Send Reset Link
          </AuthSubmitButton>

          <p className="text-[11px] text-slate-500">
            This works for patient accounts with a confirmed email address.
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
