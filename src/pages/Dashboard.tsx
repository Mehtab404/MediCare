import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, CalendarPlus, Clock, TrendingUp, Users, type LucideIcon } from "lucide-react";
import Header from "@/components/Header";
import DoctorAvatar from "@/components/DoctorAvatar";
import { ErrorState, LoadingState } from "@/components/PageState";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const darkButton =
  "bg-[#1B2A2F] hover:bg-[#111C20] text-white rounded-full font-semibold inline-flex items-center gap-2 shadow-sm transition-all";

function KpiCard({
  title,
  value,
  note,
  icon: Icon,
  dark = false,
}: {
  title: string;
  value: string | number;
  note?: string;
  icon: LucideIcon;
  dark?: boolean;
}) {
  return (
    <div className="glass-card rounded-[24px] p-6 flex items-start justify-between transition-transform hover:-translate-y-0.5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        <p className="font-display text-4xl sm:text-[44px] font-normal text-[#0F172A] leading-none mt-3">{value}</p>
        {note && <p className="text-xs font-medium text-slate-600 mt-2.5">{note}</p>}
      </div>
      <div
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
          dark ? "bg-[#1B2A2F] text-white shadow-sm" : "bg-[#E3F0F2] text-[#14807A]",
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

const Dashboard = () => {
  const { user } = useAuth();
  const appointmentsQuery = useQuery({ queryKey: ["appointments"], queryFn: api.appointments });
  const doctorsQuery = useQuery({ queryKey: ["doctors"], queryFn: api.doctors });
  const accountQuery = useQuery({ queryKey: ["account"], queryFn: api.account });

  const appointments = appointmentsQuery.data ?? [];
  // The API returns appointments oldest first, so the first upcoming one is the next visit.
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  // A visit counts once its time has passed, unless the doctor recorded a no-show.
  const past = appointments.filter((a) => a.status === "past" || a.status === "completed");
  const doctorsConsulted = new Set(past.map((a) => a.doctor.id)).size;
  const next = upcoming[0];

  const topDoctors = [...(doctorsQuery.data ?? [])].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 3);
  const firstName = user?.fullName.split(/\s+/)[0] ?? "Patient";
  const pending = appointmentsQuery.isPending;

  return (
    <div className="min-h-screen app-bg">
      <Header />

      <main className="container mx-auto px-4 pt-10 pb-14 space-y-7">
        {/* Welcome */}
        <section className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-slate-200/90 text-xs font-medium text-slate-600 mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#14807A]" />
            <span>
              Signed in as <strong className="text-[#0F172A]">{user?.userId}</strong>
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
            Welcome back,{" "}
            <span className="font-display italic font-normal text-4xl sm:text-[54px] text-[#14807A]">{firstName}!</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">Here's an overview of your healthcare activities</p>
        </section>

        {/* Prompt to turn on email notifications */}
        {accountQuery.data?.emailEnabled && !accountQuery.data.emailVerified && (
          <div
            className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 animate-fade-in"
            role="note"
          >
            <p className="text-sm text-[#0F172A]">
              {accountQuery.data.email
                ? `Confirm ${accountQuery.data.email} to get appointment emails.`
                : "Add your email to get appointment confirmations and reminders."}
            </p>
            <Link to="/profile" className={cn(darkButton, "px-5 py-2.5 text-xs")}>
              {accountQuery.data.email ? "Finish setup" : "Add email"}
            </Link>
          </div>
        )}

        {/* Stats */}
        <section aria-label="Healthcare activity summary" className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
          <KpiCard
            title="Upcoming Appointments"
            value={pending ? "–" : upcoming.length}
            note={next ? `Next: ${formatDate(next.date)}` : "None scheduled"}
            icon={Calendar}
          />
          <KpiCard title="Total Visits" value={pending ? "–" : past.length} note="All time" icon={TrendingUp} />
          <KpiCard title="Doctors Consulted" value={pending ? "–" : doctorsConsulted} icon={Users} dark />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Upcoming appointments */}
          <div className="lg:col-span-8 glass-card rounded-[28px] p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Upcoming Appointments</h2>
                <p className="text-xs text-slate-500 mt-0.5">Your scheduled consultations</p>
              </div>
              <Link
                to="/doctors"
                className="border border-slate-200 bg-white hover:bg-slate-50 rounded-full px-4 py-1.5 text-sm font-semibold text-[#0F172A] inline-flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span className="text-[#14807A] font-bold">+</span>
                <span>Book New</span>
              </Link>
            </div>

            {appointmentsQuery.isPending && <LoadingState label="Loading appointments..." />}
            {appointmentsQuery.isError && (
              <ErrorState
                title="Couldn't load appointments"
                message={appointmentsQuery.error.message}
                onRetry={() => appointmentsQuery.refetch()}
              />
            )}
            {appointmentsQuery.isSuccess && upcoming.length === 0 && (
              <div className="bg-[#F8FAFC] border border-dashed border-slate-200 rounded-2xl p-10 sm:p-12 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#E3F0F2] text-[#14807A] flex items-center justify-center mb-4">
                  <CalendarPlus className="w-7 h-7" />
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#0F172A]">You have no upcoming appointments.</p>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1">
                  Pick a doctor and a free slot to book your next visit.
                </p>
                <Link to="/doctors" className={cn(darkButton, "mt-6 px-6 py-3 text-sm")}>
                  <span>Book an Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="space-y-3.5">
                {upcoming.slice(0, 3).map((apt) => (
                  <Link
                    key={apt.id}
                    to={`/confirmation/${apt.id}`}
                    className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-slate-200/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <DoctorAvatar id={apt.doctor.id} name={apt.doctor.name} />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-[#0F172A]">{apt.doctor.name}</h3>
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full border text-[11px] font-semibold",
                              apt.bookingType === "tatkal"
                                ? "bg-amber-50 border-amber-200 text-amber-700"
                                : "bg-emerald-50 border-emerald-200 text-emerald-700",
                            )}
                          >
                            {apt.bookingType === "tatkal" ? "Tatkal" : "Confirmed"}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-[#14807A] mt-0.5">{apt.doctor.specialization}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0F172A]">
                        <Calendar className="w-3.5 h-3.5 text-[#14807A]" />
                        {formatDate(apt.date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#14807A]" />
                        {formatTime(apt.time)}
                      </span>
                    </div>
                  </Link>
                ))}
                {upcoming.length > 3 && (
                  <Link
                    to="/appointments"
                    className="block text-center text-sm font-semibold text-[#14807A] hover:text-[#1B2A2F] hover:underline"
                  >
                    View all {upcoming.length} upcoming appointments
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6 animate-fade-in">
            <div className="glass-card rounded-[28px] p-6">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/doctors" className={cn(darkButton, "w-full justify-between py-3.5 px-5 text-sm")}>
                  <span>Book Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/appointments"
                  className="w-full bg-[#F8FAFC] hover:bg-[#E3F0F2]/60 text-slate-800 border border-slate-200 rounded-full py-3.5 px-5 text-sm font-semibold flex items-center justify-between transition-all"
                >
                  <span>View All Appointments</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="glass-card rounded-[28px] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#0F172A]">Top Doctors</h2>
                <Link to="/doctors" className="text-xs font-semibold text-[#14807A] hover:text-[#1B2A2F] hover:underline">
                  View all
                </Link>
              </div>

              <div className="space-y-3.5">
                {doctorsQuery.isPending && <LoadingState />}
                {doctorsQuery.isError && <p className="text-sm text-slate-500">Couldn't load doctors.</p>}
                {topDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] hover:bg-white border border-slate-200/80 transition-all flex items-center justify-between gap-3"
                  >
                    <Link to={`/doctor/${doctor.id}`} className="flex items-center gap-3 min-w-0">
                      <DoctorAvatar id={doctor.id} name={doctor.name} size="sm" round />
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#0F172A] truncate">{doctor.name}</h3>
                        <p className="text-xs text-slate-600 truncate">{doctor.specialization}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {doctor.reviews > 0 && (
                            <span className="text-[11px] font-bold text-amber-600">{doctor.rating.toFixed(1)} ★</span>
                          )}
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full border text-[10px] font-semibold",
                              doctor.available
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200",
                            )}
                          >
                            {doctor.available ? "Available" : "Busy"}
                          </span>
                        </div>
                      </div>
                    </Link>
                    {doctor.available ? (
                      <Link
                        to={`/book/${doctor.id}`}
                        className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#1B2A2F] text-[#0F172A] hover:text-white border border-slate-200 hover:border-[#1B2A2F] text-xs font-semibold transition-all shrink-0"
                      >
                        Book
                      </Link>
                    ) : (
                      <span
                        className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold shrink-0"
                        title="This doctor isn't taking bookings right now"
                      >
                        Book
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
