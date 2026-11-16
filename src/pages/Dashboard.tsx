import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Users, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatDate, formatTime, initials } from "@/lib/format";

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.fullName ?? "Patient"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your healthcare activities
          </p>
        </div>

        {/* Prompt to turn on email notifications */}
        {accountQuery.data?.emailEnabled && !accountQuery.data.emailVerified && (
          <div
            className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-fade-in"
            role="note"
          >
            <p className="text-foreground">
              {accountQuery.data.email
                ? `Confirm ${accountQuery.data.email} to get appointment emails.`
                : "Add your email to get appointment confirmations and reminders."}
            </p>
            <Button size="sm" asChild>
              <Link to="/profile">{accountQuery.data.email ? "Finish setup" : "Add email"}</Link>
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <StatCard
              title="Upcoming Appointments"
              value={appointmentsQuery.isPending ? "–" : upcoming.length}
              icon={Calendar}
              trend={next ? `Next: ${formatDate(next.date)}` : "None scheduled"}
              variant="primary"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <StatCard
              title="Total Visits"
              value={appointmentsQuery.isPending ? "–" : past.length}
              icon={TrendingUp}
              trend="All time"
              variant="secondary"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <StatCard
              title="Doctors Consulted"
              value={appointmentsQuery.isPending ? "–" : doctorsConsulted}
              icon={Users}
              variant="accent"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/doctors">
                    <Plus className="h-4 w-4 mr-2" />
                    Book New
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {appointmentsQuery.isPending && <LoadingState label="Loading appointments..." />}
                {appointmentsQuery.isError && (
                  <ErrorState
                    title="Couldn't load appointments"
                    message={appointmentsQuery.error.message}
                    onRetry={() => appointmentsQuery.refetch()}
                  />
                )}
                {appointmentsQuery.isSuccess && upcoming.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You have no upcoming appointments.</p>
                    <Button className="mt-4" asChild>
                      <Link to="/doctors">Book an Appointment</Link>
                    </Button>
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div className="space-y-4">
                    {upcoming.slice(0, 3).map((apt) => (
                      <Link
                        key={apt.id}
                        to={`/confirmation/${apt.id}`}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full gradient-medical flex items-center justify-center text-primary-foreground font-bold">
                            {initials(apt.doctor.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{apt.doctor.name}</p>
                            <p className="text-sm text-muted-foreground">{apt.doctor.specialization}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{formatDate(apt.date)}</p>
                          <p className="text-sm text-muted-foreground">{formatTime(apt.time)}</p>
                        </div>
                        <Badge
                          variant={apt.bookingType === "tatkal" ? "secondary" : "default"}
                          className={apt.bookingType === "tatkal" ? "" : "bg-success"}
                        >
                          {apt.bookingType === "tatkal" ? "Tatkal" : "Confirmed"}
                        </Badge>
                      </Link>
                    ))}
                    {upcoming.length > 3 && (
                      <Link to="/appointments" className="block text-center text-sm text-primary hover:underline">
                        View all {upcoming.length} upcoming appointments
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-between" asChild>
                  <Link to="/doctors">
                    Book Appointment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/appointments">
                    View All Appointments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Top Doctors */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Top Doctors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctorsQuery.isPending && <LoadingState />}
                {doctorsQuery.isError && <p className="text-sm text-muted-foreground">Couldn't load doctors.</p>}
                {topDoctors.map((doctor) => (
                  <Link
                    key={doctor.id}
                    to={`/doctor/${doctor.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full gradient-medical flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {initials(doctor.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                    </div>
                    {doctor.reviews > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {doctor.rating.toFixed(1)}
                      </Badge>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
