import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Calendar, Clock, User, MapPin, Printer, Home, XCircle, History } from "lucide-react";
import Header from "@/components/Header";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime, initials } from "@/lib/format";

const STATUS_COPY = {
  upcoming: { icon: CheckCircle, tone: "success", title: "Booking Confirmed!", subtitle: "Your appointment has been booked" },
  past: { icon: History, tone: "muted", title: "Past Appointment", subtitle: "This appointment has already taken place" },
  cancelled: { icon: XCircle, tone: "destructive", title: "Appointment Cancelled", subtitle: "This appointment was cancelled" },
} as const;

const Confirmation = () => {
  const { id } = useParams();
  const appointmentId = Number(id);
  const validId = Number.isInteger(appointmentId) && appointmentId > 0;
  const { data: booking, isPending, isError, error, refetch } = useQuery({
    queryKey: ["appointments", appointmentId],
    queryFn: () => api.appointment(appointmentId),
    enabled: validId,
  });

  if (validId && isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingState label="Loading appointment..." />
      </div>
    );
  }

  if (!validId || isError || !booking) {
    const notFound = !validId || (error instanceof ApiError && error.status === 404);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4">
          <ErrorState
            title={notFound ? "Appointment not found" : "Couldn't load appointment"}
            message={notFound ? undefined : error?.message}
            onRetry={notFound ? undefined : () => refetch()}
            backTo={{ to: "/appointments", label: "My Appointments" }}
          />
        </div>
      </div>
    );
  }

  const copy = STATUS_COPY[booking.status];
  const StatusIcon = copy.icon;
  const toneBg = { success: "bg-success/10", muted: "bg-muted", destructive: "bg-destructive/10" }[copy.tone];
  const toneText = { success: "text-success", muted: "text-muted-foreground", destructive: "text-destructive" }[copy.tone];

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          {/* Status Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${toneBg} flex items-center justify-center`}>
            <StatusIcon className={`h-12 w-12 ${toneText}`} />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">{copy.title}</h1>
          <p className="text-muted-foreground">{copy.subtitle}</p>
          <p className="text-sm text-muted-foreground mt-1">Booking ID: #{booking.id}</p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-8">
            {/* Doctor Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full gradient-medical flex items-center justify-center text-primary-foreground text-xl font-bold">
                {initials(booking.doctor.name)}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{booking.doctor.name}</h2>
                <p className="text-primary">{booking.doctor.specialization}</p>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Appointment Details */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">{formatDate(booking.date, "long")}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium text-foreground">{formatTime(booking.time)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">{booking.doctor.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Type</p>
                  <p className="font-medium text-foreground capitalize">{booking.bookingType}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Payment Summary */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {booking.status === "cancelled" ? "Amount" : "Amount Payable"}
                  </p>
                  <p className="text-2xl font-bold text-foreground">₹{booking.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="font-medium text-foreground">
                    {booking.status === "cancelled" ? "Nothing to pay" : "Pay at hospital reception"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in print:hidden" style={{ animationDelay: "0.2s" }}>
          <Button variant="outline" className="flex-1 h-12" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print / Save Receipt
          </Button>
          <Button className="flex-1 h-12" asChild>
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Please arrive 10 minutes before your appointment and show this booking ID at reception.
          <br />
          For any queries, contact us at{" "}
          <a href="mailto:support@medicare.com" className="text-primary hover:underline">
            support@medicare.com
          </a>
        </p>
      </main>
    </div>
  );
};

export default Confirmation;
