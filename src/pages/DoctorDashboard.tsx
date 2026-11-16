import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, CheckCircle, Clock, UserX } from "lucide-react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDate, formatTime, initials } from "@/lib/format";
import type { Appointment } from "@/types";

const APPOINTMENTS_KEY = ["doctor", "appointments"];
const PROFILE_KEY = ["doctor", "me"];

function PatientRow({ apt, actions }: { apt: Appointment; actions?: React.ReactNode }) {
  const openLabel = apt.status === "upcoming" ? "View patient" : apt.status === "past" ? "Write record" : "View record";
  return (
    <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-xl bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full gradient-medical flex items-center justify-center text-primary-foreground font-bold">
          {initials(apt.patient.fullName)}
        </div>
        <div>
          <p className="font-medium text-foreground">{apt.patient.fullName}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(apt.date)} at {formatTime(apt.time)}
            {apt.bookingType === "tatkal" && " · Tatkal"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {actions}
        <Button variant="outline" size="sm" asChild>
          <Link to={`/doctor/visit/${apt.id}`}>{openLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

const DoctorDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: PROFILE_KEY, queryFn: api.doctorMe });
  const appointmentsQuery = useQuery({ queryKey: APPOINTMENTS_KEY, queryFn: () => api.doctorAppointments() });

  const availability = useMutation({
    mutationFn: api.doctorSetAvailable,
    onSuccess: (doctor) => {
      queryClient.setQueryData(PROFILE_KEY, doctor);
      toast({ title: doctor.available ? "You're accepting bookings" : "Bookings paused" });
    },
    onError: (err) => toast({ title: "Couldn't update availability", description: err.message, variant: "destructive" }),
  });

  const close = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "completed" | "no_show" }) => api.doctorCloseAppointment(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY }),
    onError: (err) => {
      toast({ title: "Couldn't update the appointment", description: err.message, variant: "destructive" });
      void queryClient.invalidateQueries({ queryKey: APPOINTMENTS_KEY });
    },
  });

  const appointments = appointmentsQuery.data ?? [];
  const awaiting = appointments.filter((a) => a.status === "past");
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  const closed = appointments.filter((a) => a.status === "completed" || a.status === "no_show").reverse();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">{profile.data?.name ?? "My Schedule"}</h1>
          <p className="text-muted-foreground">
            {profile.data ? `${profile.data.specialization} · ${profile.data.location}` : "Your patients and appointments"}
          </p>
        </div>

        {profile.isError && (
          <ErrorState title="Couldn't load your profile" message={profile.error.message} onRetry={() => profile.refetch()} />
        )}

        {profile.data && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <Label htmlFor="accepting" className="text-base font-medium">
                  Accepting new bookings
                </Label>
                <p className="text-sm text-muted-foreground">
                  Turn this off to stop patients booking you. Existing appointments aren't affected.
                </p>
              </div>
              <Switch
                id="accepting"
                checked={profile.data.available}
                disabled={availability.isPending}
                onCheckedChange={(checked) => availability.mutate(checked)}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Upcoming" value={appointmentsQuery.isPending ? "–" : upcoming.length} icon={Calendar} variant="primary" />
          <StatCard
            title="Waiting for outcome"
            value={appointmentsQuery.isPending ? "–" : awaiting.length}
            icon={Clock}
            trend="Mark each visit as completed or missed"
            variant="secondary"
          />
          <StatCard
            title="Completed visits"
            value={appointmentsQuery.isPending ? "–" : appointments.filter((a) => a.status === "completed").length}
            icon={CheckCircle}
            variant="accent"
          />
        </div>

        {appointmentsQuery.isPending && <LoadingState label="Loading appointments..." />}
        {appointmentsQuery.isError && (
          <ErrorState
            title="Couldn't load appointments"
            message={appointmentsQuery.error.message}
            onRetry={() => appointmentsQuery.refetch()}
          />
        )}

        {appointmentsQuery.isSuccess && (
          <>
            {awaiting.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Waiting for outcome</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {awaiting.map((apt) => (
                    <PatientRow
                      key={apt.id}
                      apt={apt}
                      actions={
                        <>
                          <Button
                            size="sm"
                            disabled={close.isPending}
                            onClick={() => close.mutate({ id: apt.id, status: "completed" })}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={close.isPending}
                            onClick={() => close.mutate({ id: apt.id, status: "no_show" })}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            No-show
                          </Button>
                        </>
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Upcoming appointments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcoming.length === 0 && <p className="text-muted-foreground">No upcoming appointments.</p>}
                {upcoming.map((apt) => (
                  <PatientRow key={apt.id} apt={apt} />
                ))}
              </CardContent>
            </Card>

            {closed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {closed.map((apt) => (
                    <PatientRow
                      key={apt.id}
                      apt={apt}
                      actions={
                        apt.status === "completed" ? (
                          <Badge variant="secondary">Completed</Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive border-destructive/40">
                            No-show
                          </Badge>
                        )
                      }
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;
