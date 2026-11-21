import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import EmailCard from "@/components/EmailCard";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import type { PatientProfile, PatientProfileInput } from "@/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];
const NOT_SET = "not-set";

interface FormState {
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  phone: string;
  allergies: string;
  conditions: string;
  currentMedications: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

function toForm(p: PatientProfile): FormState {
  return {
    dateOfBirth: p.dateOfBirth ?? "",
    gender: p.gender ?? NOT_SET,
    bloodGroup: p.bloodGroup ?? NOT_SET,
    phone: p.phone ?? "",
    allergies: p.allergies ?? "",
    conditions: p.conditions ?? "",
    currentMedications: p.currentMedications ?? "",
    emergencyContactName: p.emergencyContactName ?? "",
    emergencyContactPhone: p.emergencyContactPhone ?? "",
  };
}

function toInput(f: FormState): PatientProfileInput {
  return {
    dateOfBirth: f.dateOfBirth || null,
    gender: f.gender === NOT_SET ? null : (f.gender as PatientProfileInput["gender"]),
    bloodGroup: f.bloodGroup === NOT_SET ? null : f.bloodGroup,
    phone: f.phone.trim() || null,
    allergies: f.allergies.trim() || null,
    conditions: f.conditions.trim() || null,
    currentMedications: f.currentMedications.trim() || null,
    emergencyContactName: f.emergencyContactName.trim() || null,
    emergencyContactPhone: f.emergencyContactPhone.trim() || null,
  };
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ["profile"], queryFn: api.profile });
  const [form, setForm] = useState<FormState | null>(null);

  // Fill the form once the saved profile arrives.
  useEffect(() => {
    if (data && form === null) setForm(toForm(data));
  }, [data, form]);

  const save = useMutation({
    mutationFn: (f: FormState) => api.saveProfile(toInput(f)),
    onSuccess: (saved) => {
      queryClient.setQueryData(["profile"], saved);
      setForm(toForm(saved));
      toast({ title: "Profile saved" });
    },
    onError: (err) => toast({ title: "Couldn't save your profile", description: err.message, variant: "destructive" }),
  });

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => (f ? { ...f, [field]: e.target.value } : f));
  const setSelect = (field: keyof FormState) => (value: string) => setForm((f) => (f ? { ...f, [field]: value } : f));

  return (
    <div className="min-h-screen app-bg">
      <Header />
      <main className="container mx-auto px-4 pt-10 pb-32 max-w-3xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A] mb-1">
            My Health{" "}
            <span className="font-display italic font-normal text-4xl sm:text-5xl text-[#14807A]">Profile</span>
          </h1>
          <p className="text-sm text-slate-600">
            {user?.fullName}. Your doctor can see this when you have an appointment with them. Administrators can't.
          </p>
        </div>

        {isPending && <LoadingState label="Loading your profile..." />}
        {isError && <ErrorState title="Couldn't load your profile" message={error.message} onRetry={() => refetch()} />}

        <div className="mb-6">
          <EmailCard />
        </div>

        {form && (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(form);
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>About you</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" type="date" min="1900-01-01" value={form.dateOfBirth} onChange={set("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={form.gender} onValueChange={setSelect("gender")}>
                    <SelectTrigger id="gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_SET}>Not set</SelectItem>
                      {GENDERS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood">Blood group</Label>
                  <Select value={form.bloodGroup} onValueChange={setSelect("bloodGroup")}>
                    <SelectTrigger id="blood">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_SET}>Not set</SelectItem>
                      {BLOOD_GROUPS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Medical history</CardTitle>
                <CardDescription>Keep this up to date. It helps your doctor treat you safely.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    rows={2}
                    maxLength={1000}
                    placeholder="For example: penicillin, peanuts"
                    value={form.allergies}
                    onChange={set("allergies")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conditions">Long-term conditions</Label>
                  <Textarea
                    id="conditions"
                    rows={2}
                    maxLength={1000}
                    placeholder="For example: asthma, diabetes"
                    value={form.conditions}
                    onChange={set("conditions")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meds">Medicines you take now</Label>
                  <Textarea id="meds" rows={2} maxLength={1000} value={form.currentMedications} onChange={set("currentMedications")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency contact</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ec-name">Name</Label>
                  <Input id="ec-name" maxLength={80} value={form.emergencyContactName} onChange={set("emergencyContactName")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ec-phone">Phone</Label>
                  <Input id="ec-phone" type="tel" value={form.emergencyContactPhone} onChange={set("emergencyContactPhone")} />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-muted-foreground">
                {data?.updatedAt ? `Last saved ${formatTimestamp(data.updatedAt)}` : "You haven't saved a profile yet."}
              </p>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default Profile;
