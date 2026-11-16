import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  upcoming: "Upcoming",
  past: "Awaiting outcome",
  completed: "Completed",
  no_show: "No-show",
  cancelled: "Cancelled",
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  if (status === "cancelled" || status === "no_show") {
    return (
      <Badge variant="outline" className="text-destructive border-destructive/40">
        {STATUS_LABEL[status]}
      </Badge>
    );
  }
  return <Badge variant={status === "upcoming" ? "default" : "secondary"}>{STATUS_LABEL[status]}</Badge>;
}

export default function AppointmentsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [doctorId, setDoctorId] = useState("all");
  const [date, setDate] = useState("");
  const [toCancel, setToCancel] = useState<Appointment | null>(null);

  const doctors = useQuery({ queryKey: ["admin", "doctors"], queryFn: api.adminDoctors });
  const filters = {
    status: status === "all" ? undefined : status,
    doctorId: doctorId === "all" ? undefined : Number(doctorId),
    date: date || undefined,
  };
  const { data: appointments, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "appointments", filters],
    queryFn: () => api.adminAppointments(filters),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => api.adminCancelAppointment(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast({ title: "Appointment cancelled" });
    },
    onError: (err) => {
      toast({ title: "Couldn't cancel", description: err.message, variant: "destructive" });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onSettled: () => setToCancel(null),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus | "all")}>
          <SelectTrigger className="w-48" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={doctorId} onValueChange={setDoctorId}>
          <SelectTrigger className="w-56" aria-label="Filter by doctor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All doctors</SelectItem>
            {(doctors.data ?? []).map((d) => (
              <SelectItem key={d.id} value={String(d.id)}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" className="w-44" aria-label="Filter by date" value={date} onChange={(e) => setDate(e.target.value)} />
        {(status !== "all" || doctorId !== "all" || date) && (
          <Button
            variant="ghost"
            onClick={() => {
              setStatus("all");
              setDoctorId("all");
              setDate("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {isPending && <LoadingState label="Loading appointments..." />}
      {isError && <ErrorState title="Couldn't load appointments" message={error.message} onRetry={() => refetch()} />}

      {appointments && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No appointments match these filters.
                  </TableCell>
                </TableRow>
              )}
              {appointments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium">{formatDate(a.date)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(a.time)}
                      {a.bookingType === "tatkal" && " · Tatkal"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p>{a.patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">{a.patient.userId}</p>
                  </TableCell>
                  <TableCell>{a.doctor.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right">₹{a.amount}</TableCell>
                  <TableCell>
                    {a.status === "upcoming" && (
                      <Button variant="outline" size="sm" onClick={() => setToCancel(a)}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={toCancel !== null} onOpenChange={(open) => !open && setToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {toCancel &&
                `${toCancel.patient.fullName} with ${toCancel.doctor.name} on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)}. The patient will see it as cancelled and the slot opens up again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => toCancel && cancel.mutate(toCancel.id)}>Cancel appointment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
