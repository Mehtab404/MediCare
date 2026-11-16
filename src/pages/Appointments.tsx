import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import RescheduleDialog from "@/components/RescheduleDialog";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDate, formatTime, initials } from "@/lib/format";
import type { Appointment } from "@/types";

const Appointments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [toReschedule, setToReschedule] = useState<Appointment | null>(null);

  const { data: appointments = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ["appointments"],
    queryFn: api.appointments,
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.cancel(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots", updated.doctor.id] });
      toast({ title: "Appointment cancelled", description: `${updated.doctor.name}, ${formatDate(updated.date)}.` });
    },
    onError: (err) => toast({ title: "Couldn't cancel", description: err.message, variant: "destructive" }),
    onSettled: () => setToCancel(null),
  });

  // The API returns appointments oldest first.
  const upcomingAppointments = appointments.filter((apt) => apt.status === "upcoming");
  const pastAppointments = appointments.filter((apt) => apt.status !== "upcoming").reverse();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
            <p className="text-muted-foreground">
              View and manage your appointments
            </p>
          </div>
          <Button asChild>
            <Link to="/doctors">Book New Appointment</Link>
          </Button>
        </div>

        {isPending && <LoadingState label="Loading appointments..." />}
        {isError && <ErrorState title="Couldn't load appointments" message={error.message} onRetry={() => refetch()} />}

        {!isPending && !isError && (
          <>
            {/* Upcoming Appointments */}
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Appointments ({upcomingAppointments.length})
              </h2>

              {upcomingAppointments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {upcomingAppointments.map((apt, index) => (
                    <Card
                      key={apt.id}
                      className="card-hover animate-fade-in"
                      style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full gradient-medical flex items-center justify-center text-primary-foreground font-bold">
                              {initials(apt.doctor.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{apt.doctor.name}</p>
                              <p className="text-sm text-primary">{apt.doctor.specialization}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-primary">Upcoming</Badge>
                            {apt.bookingType === "tatkal" && <Badge variant="secondary">Tatkal</Badge>}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(apt.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(apt.time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{apt.doctor.location}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2">
                          <span className="font-semibold text-foreground">₹{apt.amount}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/confirmation/${apt.id}`}>Details</Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setToReschedule(apt)}>
                              Reschedule
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setToCancel(apt)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <Button className="mt-4" asChild>
                      <Link to="/doctors">Book an Appointment</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Past Appointments */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Past & Cancelled ({pastAppointments.length})
              </h2>

              {pastAppointments.length === 0 ? (
                <p className="text-muted-foreground">Nothing here yet.</p>
              ) : (
                <div className="space-y-3">
                  {pastAppointments.map((apt, index) => (
                    <Card
                      key={apt.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${0.1 * (index + 3)}s` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                              {initials(apt.doctor.name)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{apt.doctor.name}</p>
                              <p className="text-sm text-muted-foreground">{apt.doctor.specialization}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm flex-wrap">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(apt.date)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(apt.time)}</span>
                            </div>
                            {apt.status === "cancelled" ? (
                              <Badge variant="outline" className="text-destructive border-destructive/40">
                                Cancelled
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Past</Badge>
                            )}
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/confirmation/${apt.id}`}>View Details</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Cancel confirmation */}
      <AlertDialog open={!!toCancel} onOpenChange={(open) => !open && !cancel.isPending && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel &&
                `${toCancel.doctor.name} on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)}. ` +
                  "The slot will be released for other patients. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancel.isPending}>Keep appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancel.isPending}
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
                e.preventDefault();
                if (toCancel) cancel.mutate(toCancel.id);
              }}
            >
              {cancel.isPending ? "Cancelling..." : "Cancel appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RescheduleDialog appointment={toReschedule} onOpenChange={(open) => !open && setToReschedule(null)} />
    </div>
  );
};

export default Appointments;
