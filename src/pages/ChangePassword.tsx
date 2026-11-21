import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

/** For any logged-in account. Other devices are signed out when the password changes. */
const ChangePassword = () => {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = useMutation({
    mutationFn: () => api.changePassword(current, next),
    onSuccess: () => {
      setCurrent("");
      setNext("");
      setConfirm("");
      toast({ title: "Password changed", description: "You were signed out on your other devices." });
    },
    onError: (err) => toast({ title: "Couldn't change your password", description: err.message, variant: "destructive" }),
  });

  const mismatch = confirm !== "" && next !== confirm;
  const tooShort = next !== "" && next.length < 8;

  return (
    <div className="min-h-screen app-bg">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-32 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Change password
            </CardTitle>
            <CardDescription>You'll stay signed in here and be signed out everywhere else.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                change.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password (8+ characters)</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
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
              <Button type="submit" disabled={!current || next.length < 8 || next !== confirm || change.isPending}>
                {change.isPending ? "Saving..." : "Change password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ChangePassword;
