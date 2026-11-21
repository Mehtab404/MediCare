import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Plus, Trash2, UserX } from "lucide-react";
import Header from "@/components/Header";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { ageFromDob, formatDate, formatTime } from "@/lib/format";
import type { DoctorVisit as DoctorVisitData, PatientProfile, PrescriptionItem, VisitRecordInput } from "@/types";

const EMPTY_ITEM: PrescriptionItem = { medicine: "", dosage: "", frequency: "", duration: "", instructions: "" };

function ProfileFact({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground whitespace-pre-wrap">{value || <span className="text-muted-foreground font-normal">Not provided</span>}</dd>
    </div>
  );
}

function PatientProfileCard({ profile }: { profile: PatientProfile }) {
  const basics = [
    profile.dateOfBirth ? `${ageFromDob(profile.dateOfBirth)} years` : null,
    profile.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : null,
    profile.bloodGroup ? `Blood group ${profile.bloodGroup}` : null,
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient health profile</CardTitle>
        <CardDescription>As entered by the patient. It may be out of date.</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid sm:grid-cols-2 gap-4">
          <ProfileFact label="About" value={basics.length > 0 ? basics.join(" · ") : null} />
          <ProfileFact label="Phone" value={profile.phone} />
          <ProfileFact label="Allergies" value={profile.allergies} />
          <ProfileFact label="Long-term conditions" value={profile.conditions} />
          <ProfileFact label="Current medicines" value={profile.currentMedications} />
          <ProfileFact
            label="Emergency contact"
            value={
              profile.emergencyContactName || profile.emergencyContactPhone
                ? [profile.emergencyContactName, profile.emergencyContactPhone].filter(Boolean).join(", ")
                : null
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}

/** Editor for the visit record. Remounted (via `key`) when the saved record changes. */
function RecordEditor({ visit }: { visit: DoctorVisitData }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const appointmentId = visit.appointment.id;
  const [diagnosis, setDiagnosis] = useState(visit.record?.diagnosis ?? "");
  const [notes, setNotes] = useState(visit.record?.notes ?? "");
  const [followUp, setFollowUp] = useState(visit.record?.followUp ?? "");
  const [items, setItems] = useState<PrescriptionItem[]>(visit.record?.prescriptions ?? []);

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) =>
    setItems((list) => list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["doctor", "visit", appointmentId] });
    void queryClient.invalidateQueries({ queryKey: ["doctor", "appointments"] });
  };

  const save = useMutation({
    mutationFn: () => {
      const input: VisitRecordInput = { diagnosis, notes, followUp, prescriptions: items };
      return api.doctorSaveRecord(appointmentId, input);
    },
    onSuccess: () => {
      refresh();
      toast({ title: "Record saved" });
    },
    onError: (err) => toast({ title: "Couldn't save the record", description: err.message, variant: "destructive" }),
  });

  const close = useMutation({
    mutationFn: (status: "completed" | "no_show") => api.doctorCloseAppointment(appointmentId, status),
    onSuccess: (apt) => {
      refresh();
      toast({ title: apt.status === "completed" ? "Visit marked as completed" : "Marked as a no-show" });
    },
    onError: (err) => toast({ title: "Couldn't update the visit", description: err.message, variant: "destructive" }),
  });

  const status = visit.appointment.status;
  const canWrite = status === "past" || status === "completed";

  if (status === "upcoming") {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          You can write the record once the appointment has started ({formatDate(visit.appointment.date)} at{" "}
          {formatTime(visit.appointment.time)}).
        </CardContent>
      </Card>
    );
  }
  if (status === "no_show") {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">This appointment was marked as a no-show, so it has no record.</CardContent>
      </Card>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Visit record</CardTitle>
          <CardDescription>
            {status === "completed"
              ? "The patient can see this. You can still correct it."
              : "The patient sees this only after you mark the visit as completed."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea id="diagnosis" rows={2} maxLength={1000} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={4} maxLength={4000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="followup">Follow-up advice</Label>
            <Textarea id="followup" rows={2} maxLength={1000} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Prescription</CardTitle>
            <CardDescription>{items.length === 0 ? "No medicines added." : `${items.length} of 20 medicines`}</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={items.length >= 20} onClick={() => setItems((l) => [...l, { ...EMPTY_ITEM }])}>
            <Plus className="h-4 w-4 mr-2" />
            Add medicine
          </Button>
        </CardHeader>
        {items.length > 0 && (
          <CardContent className="space-y-4">
            {items.map((item, i) => (
              <fieldset key={i} className="rounded-lg border p-4 space-y-3">
                <legend className="px-2 text-sm font-medium">Medicine {i + 1}</legend>
                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-4 space-y-1">
                    <Label htmlFor={`med-${i}`}>Name</Label>
                    <Input id={`med-${i}`} maxLength={120} value={item.medicine} onChange={(e) => updateItem(i, "medicine", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`dose-${i}`}>Dosage</Label>
                    <Input id={`dose-${i}`} maxLength={60} placeholder="500 mg" value={item.dosage} onChange={(e) => updateItem(i, "dosage", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`freq-${i}`}>How often</Label>
                    <Input id={`freq-${i}`} maxLength={60} placeholder="Twice daily" value={item.frequency} onChange={(e) => updateItem(i, "frequency", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`dur-${i}`}>For how long</Label>
                    <Input id={`dur-${i}`} maxLength={60} placeholder="5 days" value={item.duration} onChange={(e) => updateItem(i, "duration", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`ins-${i}`}>Instructions</Label>
                    <Input id={`ins-${i}`} maxLength={300} placeholder="After food" value={item.instructions} onChange={(e) => updateItem(i, "instructions", e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </fieldset>
            ))}
          </CardContent>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          {status === "past" && (
            <>
              <Button type="button" variant="outline" disabled={close.isPending} onClick={() => close.mutate("completed")}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark completed
              </Button>
              <Button type="button" variant="outline" disabled={close.isPending} onClick={() => close.mutate("no_show")}>
                <UserX className="h-4 w-4 mr-2" />
                No-show
              </Button>
            </>
          )}
        </div>
        <Button type="submit" disabled={!canWrite || save.isPending}>
          {save.isPending ? "Saving..." : "Save record"}
        </Button>
      </div>
    </form>
  );
}

const DoctorVisit = () => {
  const { id } = useParams();
  const appointmentId = Number(id);
  const validId = Number.isInteger(appointmentId) && appointmentId > 0;
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["doctor", "visit", appointmentId],
    queryFn: () => api.doctorVisit(appointmentId),
    enabled: validId,
  });

  if (!validId || isPending || isError) {
    const notFound = !validId || (error instanceof ApiError && (error.status === 404 || error.status === 409));
    return (
      <div className="min-h-screen app-bg">
        <Header />
        {validId && isPending ? (
          <LoadingState label="Loading appointment..." />
        ) : (
          <div className="container mx-auto px-4">
            <ErrorState
              title={notFound ? "Appointment not available" : "Couldn't load the appointment"}
              message={error instanceof ApiError ? error.message : undefined}
              onRetry={notFound ? undefined : () => refetch()}
              backTo={{ to: "/doctor", label: "My Schedule" }}
            />
          </div>
        )}
      </div>
    );
  }

  const { appointment } = data;
  // A new key makes the editor start from what the server saved. Status changes don't reset it,
  // so unsaved edits survive "Mark completed".
  const editorKey = data.record?.updatedAt ?? "none";

  return (
    <div className="min-h-screen app-bg">
      <Header />
      <main className="container mx-auto px-4 py-8 pb-32 max-w-3xl space-y-6">
        <Link to="/doctor" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          My Schedule
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{appointment.patient.fullName}</h1>
            <p className="text-muted-foreground">
              {formatDate(appointment.date, "long")} at {formatTime(appointment.time)}
              {appointment.bookingType === "tatkal" && " · Tatkal"}
            </p>
          </div>
          <Badge variant={appointment.status === "upcoming" ? "default" : "secondary"} className="capitalize">
            {appointment.status === "past" ? "Awaiting outcome" : appointment.status.replace("_", " ")}
          </Badge>
        </div>

        <PatientProfileCard profile={data.patientProfile} />
        <RecordEditor key={editorKey} visit={data} />
      </main>
    </div>
  );
};

export default DoctorVisit;
