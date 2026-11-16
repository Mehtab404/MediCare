import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

/** Landing page for the link in the reset email. The link is the proof, so no login is needed. */
const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const reset = useMutation({ mutationFn: () => api.resetPassword(token, password) });

  const mismatch = confirm !== "" && password !== confirm;
  const tooShort = password !== "" && password.length < 8;

  if (token === "") {
    return (
      <AuthCard title="Link incomplete" subtitle="Please use the full link from the email.">
        <Button asChild className="w-full">
          <Link to="/forgot-password">Ask for a new link</Link>
        </Button>
      </AuthCard>
    );
  }

  if (reset.isSuccess) {
    return (
      <AuthCard title="Password changed">
        <div className="space-y-4 text-center" role="status">
          <CheckCircle className="h-10 w-10 mx-auto text-success" />
          <p className="text-foreground">Your password has been changed and you were signed out everywhere. Log in with the new one.</p>
          <Button asChild className="w-full">
            <Link to="/">Go to login</Link>
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          reset.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="new-password">New password (8+ characters)</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {tooShort && <p className="text-sm text-destructive">Use at least 8 characters.</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {mismatch && <p className="text-sm text-destructive">The passwords don't match.</p>}
        </div>
        {reset.isError && (
          <div className="space-y-2" role="alert">
            <p className="text-sm text-destructive">{reset.error.message}</p>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Ask for a new link
            </Link>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={password.length < 8 || password !== confirm || reset.isPending}>
          {reset.isPending ? "Saving..." : "Change password"}
        </Button>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
