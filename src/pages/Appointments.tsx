import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import DoctorAvatar from "@/components/DoctorAvatar";
import RescheduleDialog from "@/components/RescheduleDialog";
import { ErrorState, LoadingState } from "@/components/PageState";
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
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

const outlineButton =
  "px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer";
const darkButton =
  "px-4 py-2 rounded-full bg-[#1B2A2F] hover:bg-[#111C20] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer";

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
    <div className="min-h-screen app-bg">
      <Header />

      <main className="container mx-auto px-4 pt-10 pb-14">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
              My{" "}
              <span className="font-display italic font-normal text-4xl sm:text-5xl text-[#14807A]">Appointments</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1">View and manage your appointments</p>
          </div>
          <Link
            to="/doctors"
            className="px-5 py-3 rounded-full bg-[#1B2A2F] hover:bg-[#111C20] text-white text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto shadow-sm transition-all"
          >
            + Book New Appointment
          </Link>
        </div>

        {isPending && <LoadingState label="Loading appointments..." />}
        {isError && <ErrorState title="Couldn't load appointments" message={error.message} onRetry={() => refetch()} />}

        {!isPending && !isError && (
          <>
            {/* Upcoming Appointments */}
            <section className="mb-10">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#14807A]" />
                Upcoming Appointments ({upcomingAppointments.length})
              </h2>

              {upcomingAppointments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-5">
                  {upcomingAppointments.map((apt, index) => (
                    <div
                      key={apt.id}
                      className="glass-card rounded-[24px] p-6 transition-transform hover:-translate-y-0.5 animate-fade-in"
                      style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <DoctorAvatar id={apt.doctor.id} name={apt.doctor.name} />
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-bold text-[#0F172A]">{apt.doctor.name}</p>
                            <p className="text-xs font-medium text-[#14807A] mt-0.5">{apt.doctor.specialization}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                            Upcoming
                          </span>
                          {apt.bookingType === "tatkal" && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-700">
                              Tatkal
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-[#14807A]" />
                          <span className="font-semibold text-[#0F172A]">{formatDate(apt.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#14807A]" />
                          <span>{formatTime(apt.time)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#14807A]" />
                          <span>{apt.doctor.location}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-[#0F172A]">₹{apt.amount}</span>
                        <div className="flex gap-2 flex-wrap">
                          <Link to={`/confirmation/${apt.id}`} className={outlineButton}>
                            Details
                          </Link>
                          <button type="button" className={outlineButton} onClick={() => setToReschedule(apt)}>
                            Reschedule
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors cursor-pointer"
                            onClick={() => setToCancel(apt)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-[24px] p-10 text-center">
                  <p className="text-sm font-semibold text-[#0F172A]">No upcoming appointments</p>
                  <Link to="/doctors" className={cn(darkButton, "inline-block mt-4 px-6 py-3")}>
                    Book an Appointment
                  </Link>
                </div>
              )}
            </section>

            {/* Past Appointments */}
            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                Past &amp; Cancelled ({pastAppointments.length})
              </h2>

              {pastAppointments.length === 0 ? (
                <p className="text-sm text-slate-600">Nothing here yet.</p>
              ) : (
                <div className="space-y-3">
                  {pastAppointments.map((apt, index) => (
                    <div
                      key={apt.id}
                      className="glass-card rounded-2xl p-4 animate-fade-in"
                      style={{ animationDelay: `${0.1 * (index + 3)}s` }}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <DoctorAvatar id={apt.doctor.id} name={apt.doctor.name} size="sm" className="opacity-80" />
                          <div>
                            <p className="text-sm font-bold text-[#0F172A]">{apt.doctor.name}</p>
                            <p className="text-xs text-slate-600">{apt.doctor.specialization}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#14807A]" />
                            <span>{formatDate(apt.date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-[#14807A]" />
                            <span>{formatTime(apt.time)}</span>
                          </div>
                          {apt.status === "cancelled" || apt.status === "no_show" ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
                              {apt.status === "cancelled" ? "Cancelled" : "Missed"}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                              {apt.status === "completed" ? "Completed" : "Past"}
                            </span>
                          )}
                          <Link to={`/confirmation/${apt.id}`} className={outlineButton}>
                            View Details
                          </Link>
                          {apt.status === "completed" && (
                            <Link to={`/records/${apt.id}`} className={darkButton}>
                              Visit Summary
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
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
