import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SlotPicker from "@/components/SlotPicker";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/format";
import type { Appointment } from "@/types";

interface RescheduleDialogProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
}

const RescheduleDialog = ({ appointment, onOpenChange }: RescheduleDialogProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const doctorId = appointment?.doctor.id ?? 0;
  const isTatkal = appointment?.bookingType === "tatkal";

  const windowQuery = useQuery({
    queryKey: ["slots", doctorId, null],
    queryFn: () => api.slots(doctorId),
    enabled: !!appointment,
  });
  const slotsQuery = useQuery({
    queryKey: ["slots", doctorId, date],
    queryFn: () => api.slots(doctorId, date),
    enabled: !!appointment && !!date,
  });

  // Reset the form each time the dialog opens for an appointment.
  useEffect(() => {
    setTime("");
    setDate(appointment?.bookingType === "tatkal" ? windowQuery.data?.tomorrow ?? "" : "");
  }, [appointment, windowQuery.data?.tomorrow]);

  const reschedule = useMutation({
    mutationFn: () => api.reschedule(appointment!.id, date, time),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots", doctorId] });
      toast({
        title: "Appointment rescheduled",
        description: `Moved to ${formatDate(updated.date)} at ${formatTime(updated.time)}.`,
      });
      onOpenChange(false);
    },
    onError: (err) => {
      toast({ title: "Couldn't reschedule", description: err.message, variant: "destructive" });
      if (err instanceof ApiError && err.status === 409) {
        setTime("");
        slotsQuery.refetch();
      }
    },
  });

  const bookingWindow = windowQuery.data;

  return (
    <Dialog open={!!appointment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          {appointment && (
            <DialogDescription>
              {appointment.doctor.name}, currently {formatDate(appointment.date)} at {formatTime(appointment.time)}.
              {isTatkal && " Tatkal appointments can only be moved to another slot tomorrow."}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reschedule-date">New date</Label>
            <Input
              id="reschedule-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              min={isTatkal ? bookingWindow?.tomorrow : bookingWindow?.today}
              max={isTatkal ? bookingWindow?.tomorrow : bookingWindow?.maxDate}
              disabled={isTatkal || !bookingWindow}
            />
          </div>
          <div className="space-y-2">
            <Label>New time</Label>
            {slotsQuery.isError ? (
              <p className="text-destructive text-sm">{slotsQuery.error.message}</p>
            ) : (
              <SlotPicker
                slots={date ? slotsQuery.data?.slots : null}
                selected={time}
                onSelect={setTime}
                loading={!!date && slotsQuery.isPending}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep current time
          </Button>
          <Button onClick={() => reschedule.mutate()} disabled={!date || !time || reschedule.isPending}>
            {reschedule.isPending ? "Saving..." : "Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
