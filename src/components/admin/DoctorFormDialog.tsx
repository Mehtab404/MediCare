import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { AdminDoctor, DoctorInput } from "@/types";

interface Props {
  /** The doctor to edit, or null to add a new one. */
  doctor: AdminDoctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  specialization: string;
  experience: string;
  location: string;
  fee: string;
  phone: string;
  email: string;
  bio: string;
  qualifications: string;
  loginUserId: string;
  loginPassword: string;
}

function initialState(doctor: AdminDoctor | null): FormState {
  return {
    name: doctor?.name ?? "",
    specialization: doctor?.specialization ?? "",
    experience: doctor ? String(doctor.experience) : "",
    location: doctor?.location ?? "",
    fee: doctor ? String(doctor.fee) : "",
    phone: doctor?.phone ?? "",
    email: doctor?.email ?? "",
    bio: doctor?.bio ?? "",
    qualifications: doctor?.qualifications ?? "",
    loginUserId: "",
    loginPassword: "",
  };
}

/** Add or edit a doctor. The parent remounts this (via `key`) so the form starts fresh each time. */
export default function DoctorFormDialog({ doctor, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => initialState(doctor));
  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const save = useMutation({
    mutationFn: () => {
      const input: DoctorInput = {
        name: form.name.trim(),
        specialization: form.specialization.trim(),
        experience: Number(form.experience),
        location: form.location.trim(),
        fee: Number(form.fee),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        bio: form.bio.trim() || null,
        qualifications: form.qualifications.trim() || null,
        available: doctor?.available ?? true,
      };
      if (doctor) return api.adminUpdateDoctor(doctor.id, input);
      const wantsLogin = form.loginUserId.trim() !== "" || form.loginPassword !== "";
      return api.adminCreateDoctor({
        ...input,
        account: wantsLogin ? { userId: form.loginUserId.trim(), password: form.loginPassword } : undefined,
      });
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
      toast({ title: doctor ? "Doctor updated" : "Doctor added", description: saved.name });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: "Couldn't save the doctor", description: err.message, variant: "destructive" }),
  });

  const isEdit = doctor !== null;
  const ready =
    form.name.trim() && form.specialization.trim() && form.location.trim() && form.experience !== "" && form.fee !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit doctor" : "Add doctor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Changes show up for patients straight away." : "Optionally create a login so the doctor can manage their own schedule."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="d-name">Name</Label>
            <Input id="d-name" value={form.name} onChange={set("name")} placeholder="Dr. Full Name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d-spec">Specialization</Label>
              <Input id="d-spec" value={form.specialization} onChange={set("specialization")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-exp">Experience (years)</Label>
              <Input id="d-exp" type="number" min={0} max={70} value={form.experience} onChange={set("experience")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d-loc">Location</Label>
              <Input id="d-loc" value={form.location} onChange={set("location")} placeholder="Block A, Room 101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-fee">Fee (₹)</Label>
              <Input id="d-fee" type="number" min={0} value={form.fee} onChange={set("fee")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="d-phone">Phone</Label>
              <Input id="d-phone" value={form.phone} onChange={set("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="d-email">Email</Label>
              <Input id="d-email" type="email" value={form.email} onChange={set("email")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="d-quals">Qualifications (one per line)</Label>
            <Textarea
              id="d-quals"
              rows={3}
              maxLength={800}
              placeholder="Shown on the doctor's page only if filled in"
              value={form.qualifications}
              onChange={set("qualifications")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="d-bio">About</Label>
            <Textarea
              id="d-bio"
              rows={3}
              maxLength={1500}
              placeholder="Shown on the doctor's page only if filled in"
              value={form.bio}
              onChange={set("bio")}
            />
          </div>

          {!isEdit && (
            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-2 text-sm font-medium">Doctor login (optional)</legend>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="d-login">User ID</Label>
                  <Input id="d-login" autoComplete="off" value={form.loginUserId} onChange={set("loginUserId")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-pass">Password</Label>
                  <Input
                    id="d-pass"
                    type="password"
                    autoComplete="new-password"
                    value={form.loginPassword}
                    onChange={set("loginPassword")}
                  />
                </div>
              </div>
            </fieldset>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || save.isPending}>
              {save.isPending ? "Saving..." : isEdit ? "Save changes" : "Add doctor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
