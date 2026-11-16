import { Pill } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VisitRecord } from "@/types";

function Section({ title, children }: { title: string; children: string }) {
  if (!children) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <p className="text-foreground whitespace-pre-wrap">{children}</p>
    </div>
  );
}

/** Read-only view of what the doctor recorded: diagnosis, notes, prescription and follow-up. */
export default function VisitRecordView({ record }: { record: VisitRecord }) {
  return (
    <div className="space-y-6">
      <Section title="Diagnosis">{record.diagnosis}</Section>
      <Section title="Doctor's notes">{record.notes}</Section>

      {record.prescriptions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Pill className="h-4 w-4" />
            Prescription
          </h3>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>How often</TableHead>
                  <TableHead>For</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.prescriptions.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-medium">{item.medicine}</p>
                      {item.instructions && <p className="text-sm text-muted-foreground">{item.instructions}</p>}
                    </TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>{item.frequency}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Section title="Follow-up">{record.followUp}</Section>
    </div>
  );
}
