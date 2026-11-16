import { useQuery } from "@tanstack/react-query";
import { Calendar, CheckCircle, Stethoscope, Users } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/PageState";
import StatCard from "@/components/StatCard";
import { api } from "@/lib/api";

export default function OverviewPanel() {
  const { data: s, isPending, isError, error, refetch } = useQuery({ queryKey: ["admin", "stats"], queryFn: api.adminStats });

  if (isPending) return <LoadingState label="Loading overview..." />;
  if (isError) return <ErrorState title="Couldn't load the overview" message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard title="Patients" value={s.patients} icon={Users} variant="primary" />
      <StatCard
        title="Doctors"
        value={s.doctors}
        icon={Stethoscope}
        trend={`${s.doctorsAvailable} accepting bookings · ${s.doctorAccounts} with a login`}
        variant="secondary"
      />
      <StatCard
        title="Upcoming appointments"
        value={s.upcomingAppointments}
        icon={Calendar}
        trend={`${s.appointmentsToday} today`}
        variant="accent"
      />
      <StatCard
        title="Completed visits"
        value={s.completed}
        icon={CheckCircle}
        trend={`${s.noShow} no-shows · ${s.cancelled} cancelled`}
        variant="success"
      />
    </div>
  );
}
