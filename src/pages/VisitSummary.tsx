import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import Header from "@/components/Header";
import { ErrorState, LoadingState } from "@/components/PageState";
import { StarInput, Stars } from "@/components/Stars";
import VisitRecordView from "@/components/VisitRecordView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime, formatTimestamp } from "@/lib/format";

const VisitSummary = () => {
  const { id } = useParams();
  const appointmentId = Number(id);
  const validId = Number.isInteger(appointmentId) && appointmentId > 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["visit-summary", appointmentId],
    queryFn: () => api.visitSummary(appointmentId),
    enabled: validId,
  });

  const submit = useMutation({
    mutationFn: () => api.submitReview(appointmentId, { rating, comment: comment.trim() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["visit-summary", appointmentId] });
      void queryClient.invalidateQueries({ queryKey: ["doctors"] });
      void queryClient.invalidateQueries({ queryKey: ["doctor"] });
      toast({ title: "Thank you for your review" });
    },
    onError: (err) => toast({ title: "Couldn't submit your review", description: err.message, variant: "destructive" }),
  });

  if (!validId || isPending || isError) {
    const notFound = !validId || (error instanceof ApiError && error.status === 404);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        {validId && isPending ? (
          <LoadingState label="Loading visit summary..." />
        ) : (
          <div className="container mx-auto px-4">
            <ErrorState
              title={notFound ? "No visit summary yet" : "Couldn't load the visit summary"}
              message={
                notFound
                  ? "A summary appears here after your doctor has completed the visit."
                  : error?.message
              }
              onRetry={notFound ? undefined : () => refetch()}
              backTo={{ to: "/appointments", label: "My Appointments" }}
            />
          </div>
        )}
      </div>
    );
  }

  const { appointment, record, review } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          My Appointments
        </Link>

        <Card className="mb-6 animate-fade-in">
          <CardHeader>
            <CardTitle>Visit summary</CardTitle>
            <CardDescription>
              {appointment.doctor.name} ({appointment.doctor.specialization}) · {formatDate(appointment.date, "long")} at{" "}
              {formatTime(appointment.time)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Patient: <span className="text-foreground font-medium">{user?.fullName}</span> · Booking #{appointment.id}
            </p>
            <Separator />
            {record ? (
              <>
                <VisitRecordView record={record} />
                <p className="text-xs text-muted-foreground">Recorded by {appointment.doctor.name} on {formatTimestamp(record.updatedAt)}.</p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Your doctor completed this visit but didn't add any notes or a prescription.
              </p>
            )}
            <p className="hidden print:block text-xs text-muted-foreground">
              Printed from MediCare. This copy is not signed by the doctor.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end mb-8 print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save as PDF
          </Button>
        </div>

        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>{review ? "Your review" : "Rate this visit"}</CardTitle>
            <CardDescription>
              {review
                ? `Posted ${formatTimestamp(review.createdAt)}. It shows on ${appointment.doctor.name}'s page with your first name.`
                : "Reviews are public and show your first name only."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {review ? (
              <div className="space-y-2">
                <Stars value={review.rating} className="h-5 w-5" />
                {review.comment && <p className="text-foreground whitespace-pre-wrap">{review.comment}</p>}
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit.mutate();
                }}
              >
                <StarInput value={rating} onChange={setRating} disabled={submit.isPending} />
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea
                    id="comment"
                    rows={3}
                    maxLength={1000}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={rating === 0 || submit.isPending}>
                  {submit.isPending ? "Submitting..." : "Submit review"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VisitSummary;
