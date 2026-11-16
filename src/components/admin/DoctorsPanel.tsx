import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { AdminDoctor } from "@/types";
import DoctorFormDialog from "./DoctorFormDialog";
import DoctorLoginDialog from "./DoctorLoginDialog";

type Dialog = { kind: "form"; doctor: AdminDoctor | null } | { kind: "login"; doctor: AdminDoctor } | null;

export default function DoctorsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<Dialog>(null);
  const { data: doctors, isPending, isError, error, refetch } = useQuery({
    queryKey: ["admin", "doctors"],
    queryFn: api.adminDoctors,
  });

  const toggle = useMutation({
    mutationFn: ({ id, available }: { id: number; available: boolean }) => api.adminUpdateDoctor(id, { available }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
    onError: (err) => toast({ title: "Couldn't update availability", description: err.message, variant: "destructive" }),
  });

  if (isPending) return <LoadingState label="Loading doctors..." />;
  if (isError) return <ErrorState title="Couldn't load doctors" message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">{doctors.length} doctors</p>
        <Button onClick={() => setDialog({ kind: "form", doctor: null })}>
          <Plus className="h-4 w-4 mr-2" />
          Add doctor
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Fee</TableHead>
              <TableHead>Accepting bookings</TableHead>
              <TableHead>Login</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-sm text-muted-foreground">{d.specialization}</p>
                </TableCell>
                <TableCell>{d.location}</TableCell>
                <TableCell className="text-right">₹{d.fee}</TableCell>
                <TableCell>
                  <Switch
                    checked={d.available}
                    aria-label={`${d.name} accepting bookings`}
                    disabled={toggle.isPending}
                    onCheckedChange={(available) => toggle.mutate({ id: d.id, available })}
                  />
                </TableCell>
                <TableCell>
                  {d.accountUserId ? (
                    <span className="font-mono text-sm">{d.accountUserId}</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setDialog({ kind: "login", doctor: d })}>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Create login
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${d.name}`}
                    onClick={() => setDialog({ kind: "form", doctor: d })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {dialog?.kind === "form" && (
        <DoctorFormDialog
          key={dialog.doctor?.id ?? "new"}
          doctor={dialog.doctor}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog?.kind === "login" && (
        <DoctorLoginDialog
          key={dialog.doctor.id}
          doctor={dialog.doctor}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </div>
  );
}
