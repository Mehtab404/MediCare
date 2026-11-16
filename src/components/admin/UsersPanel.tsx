import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { AccountUser } from "@/types";

/** Sets a new password for a doctor or admin. Remounted via `key` so the field starts empty. */
function ResetPasswordDialog({ target, onClose }: { target: AccountUser; onClose: () => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const reset = useMutation({
    mutationFn: () => api.adminSetPassword(target.id, password),
    onSuccess: () => {
      toast({ title: "Password reset", description: `${target.fullName} was signed out everywhere. Share the new password with them.` });
      onClose();
    },
    onError: (err) => toast({ title: "Couldn't reset the password", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password for {target.fullName}</DialogTitle>
          <DialogDescription>
            They will be signed out on every device. Give them the new password in person, and ask them to change it
            from the Password link in the header.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            reset.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="reset-pass">New password (8+ characters)</Label>
            <Input
              id="reset-pass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={password.length < 8 || reset.isPending}>
              {reset.isPending ? "Saving..." : "Reset password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPanel() {
  const { user: me } = useAuth();
  const [target, setTarget] = useState<AccountUser | null>(null);
  const { data: users, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: api.adminUsers,
  });

  if (isPending) return <LoadingState label="Loading users..." />;
  if (isError) return <ErrorState title="Couldn't load users" message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You can reset passwords for doctors and other admins. Patients reset their own from the login page, so their
        health records stay private.
      </p>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-40" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.fullName}</TableCell>
                <TableCell className="font-mono text-sm">{u.userId}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "patient" ? "outline" : "secondary"} className="capitalize">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(u.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</TableCell>
                <TableCell>
                  {u.role !== "patient" && u.id !== me?.id && (
                    <Button variant="outline" size="sm" onClick={() => setTarget(u)} aria-label={`Reset password for ${u.fullName}`}>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset password
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {target && <ResetPasswordDialog key={target.id} target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
