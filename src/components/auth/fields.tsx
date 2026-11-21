import { useState, type ReactNode } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { authInputClass, authPrimaryButtonClass } from "./authStyles";

/** Text input with an optional icon on the left. */
export function AuthInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return (
    <div className="relative">
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <input {...props} className={cn(authInputClass, icon ? "pl-10" : "pl-4", "pr-4", className)} />
    </div>
  );
}

/** Password input with a show/hide button. */
export function AuthPasswordInput(props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        <Lock className="w-4 h-4" />
      </span>
      <input {...props} type={visible ? "text" : "password"} className={cn(authInputClass, "pl-10 pr-11")} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F172A] p-1 cursor-pointer"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

/** Dark primary submit button with a spinner while a request is running. */
export function AuthSubmitButton({
  loading,
  loadingLabel,
  disabled,
  children,
}: {
  loading: boolean;
  loadingLabel: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="submit" disabled={loading || disabled} className={authPrimaryButtonClass}>
      <span>{loading ? loadingLabel : children}</span>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
    </button>
  );
}
