import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

/**
 * Landing page for the link in the confirmation email. Open to anyone: the link itself is the proof,
 * and people often open it on a different device than the one they signed up on.
 */
const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const started = useRef(false);

  const verify = useMutation({
    mutationFn: () => api.verifyEmail(token),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["account"] }),
  });

  // The link works once, so send it exactly one time.
  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      verify.mutate();
    }
  }, [token, verify]);

  const missing = token === "";
  const done = verify.isSuccess;
  const failed = missing || verify.isError;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 gradient-medical rounded-xl">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MediCare</h1>
        </div>

        <Card>
          <CardContent className="p-8 text-center space-y-4" role="status">
            {!done && !failed && (
              <>
                <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Confirming your email...</p>
              </>
            )}
            {done && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-success" />
                <h2 className="text-xl font-semibold text-foreground">Email confirmed</h2>
                <p className="text-muted-foreground">
                  {verify.data.email} will now get appointment confirmations and reminders.
                </p>
              </>
            )}
            {failed && (
              <>
                <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
                <h2 className="text-xl font-semibold text-foreground">Couldn't confirm your email</h2>
                <p className="text-muted-foreground">
                  {missing ? "This link is incomplete. Please use the full link from the email." : verify.error?.message}
                </p>
              </>
            )}
            {(done || failed) && (
              <Button asChild>
                {status === "authenticated" ? <Link to="/profile">Go to my profile</Link> : <Link to="/">Log in</Link>}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
