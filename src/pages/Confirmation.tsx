import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, Clock, User, MapPin, Download, Home } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingDetails {
  doctor: {
    name: string;
    specialization: string;
    location: string;
  };
  date: string;
  time: string;
  bookingType: string;
  amount: number;
}

const Confirmation = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetails | null>(null);

  useEffect(() => {
    const storedBooking = localStorage.getItem("currentBooking");
    if (storedBooking) {
      setBooking(JSON.parse(storedBooking));
    } else {
      navigate("/dashboard");
    }
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8 animate-fade-in">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground">
            Your appointment has been successfully booked
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <CardContent className="p-8">
            {/* Doctor Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full gradient-medical flex items-center justify-center text-primary-foreground text-xl font-bold">
                {booking.doctor.name.split(" ").map(n => n[0]).join("")}
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
                  <p className="font-medium text-foreground">{formatDate(booking.date)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium text-foreground">{booking.time}</p>
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
            <div className="p-4 rounded-xl bg-success/10 border border-success/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-2xl font-bold text-success">₹{booking.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-success">Payment Successful</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Button variant="outline" className="flex-1 h-12">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
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
          A confirmation email has been sent to your registered email address.
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
