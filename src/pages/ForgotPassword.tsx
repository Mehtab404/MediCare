import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import AuthCard from "@/components/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState("");
  const send = useMutation({ mutationFn: () => api.forgotPassword(identifier.trim()) });

  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to choose a new one">
      {send.isSuccess ? (
        <div className="space-y-4 text-center" role="status">
          <CheckCircle className="h-10 w-10 mx-auto text-success" />
          <p className="text-foreground">{send.data.message}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Back to login</Link>
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="identifier">User ID or email</Label>
            <Input
              id="identifier"
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
          <Button type="submit" className="w-full" disabled={identifier.trim() === "" || send.isPending}>
            {send.isPending ? "Sending..." : "Send reset link"}
          </Button>
          <p className="text-sm text-muted-foreground">
            This works for accounts with a confirmed email address. Doctors and staff should ask an administrator to reset
            their password.
          </p>
          <div className="text-center">
            <Link to="/" className="text-sm text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;
