import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { AdminDoctor } from "@/types";

interface Props {
  doctor: AdminDoctor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Creates a login for a doctor who doesn't have one. The parent remounts this via `key`. */
export default function DoctorLoginDialog({ doctor, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const create = useMutation({
    mutationFn: () => api.adminCreateDoctorAccount(doctor.id, { userId: userId.trim(), password }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Login created", description: `${doctor.name} can now log in as ${userId.trim().toLowerCase()}.` });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: "Couldn't create the login", description: err.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create login for {doctor.name}</DialogTitle>
          <DialogDescription>Share the User ID and password with the doctor. They can't change it yet.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="l-user">User ID</Label>
            <Input id="l-user" autoComplete="off" value={userId} onChange={(e) => setUserId(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="l-pass">Password (8+ characters)</Label>
            <Input
              id="l-pass"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!userId.trim() || password.length < 8 || create.isPending}>
              {create.isPending ? "Creating..." : "Create login"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
