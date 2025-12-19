import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, CreditCard, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { doctors } from "@/data/doctors";

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const doctor = doctors.find((d) => d.id === Number(id));

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingType, setBookingType] = useState<"normal" | "tatkal">("normal");

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
    "11:00 AM", "11:30 AM", "2:00 PM", "2:30 PM",
    "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
  ];

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getMinDate = () => {
    if (bookingType === "tatkal") {
      return getTomorrowDate();
    }
    return new Date().toISOString().split("T")[0];
  };

  const getAmount = () => {
    if (!doctor) return 0;
    return bookingType === "tatkal" ? doctor.fee + 300 : doctor.fee;
  };

  const handleBookingTypeChange = (value: "normal" | "tatkal") => {
    setBookingType(value);
    if (value === "tatkal") {
      setSelectedDate(getTomorrowDate());
    }
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select both date and time slot",
        variant: "destructive",
      });
      return;
    }

    // Store booking details
    const bookingDetails = {
      doctor,
      date: selectedDate,
      time: selectedTime,
      bookingType,
      amount: getAmount(),
    };
    localStorage.setItem("currentBooking", JSON.stringify(bookingDetails));

    navigate("/confirmation");
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Doctor not found</h1>
          <Button asChild>
            <Link to="/doctors">Back to Doctors</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Link
          to={`/doctor/${doctor.id}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="md:col-span-2 space-y-6">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground mb-2">Book Appointment</h1>
              <p className="text-muted-foreground">
                Schedule your appointment with {doctor.name}
              </p>
            </div>

            {/* Booking Type */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Booking Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={bookingType}
                  onValueChange={(v) => handleBookingTypeChange(v as "normal" | "tatkal")}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="normal"
                      id="normal"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="normal"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    >
                      <span className="text-lg font-semibold">Normal</span>
                      <span className="text-2xl font-bold text-primary">₹{doctor.fee}</span>
                      <span className="text-sm text-muted-foreground">Standard booking</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="tatkal"
                      id="tatkal"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="tatkal"
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-all"
                    >
                      <span className="text-lg font-semibold">Tatkal</span>
                      <span className="text-2xl font-bold text-warning">₹{doctor.fee + 300}</span>
                      <span className="text-sm text-muted-foreground">Next day only</span>
                    </Label>
                  </div>
                </RadioGroup>

                {bookingType === "tatkal" && (
                  <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      Tatkal booking is available only for next-day appointments. Additional ₹300 convenience fee applies.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Selection */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  className="h-12"
                  disabled={bookingType === "tatkal"}
                />
              </CardContent>
            </Card>

            {/* Time Selection */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Select Time Slot
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {timeSlots.map((time) => (
                    <Badge
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className={`py-3 px-4 justify-center cursor-pointer transition-all ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Card */}
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Doctor Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-12 h-12 rounded-full gradient-medical flex items-center justify-center text-primary-foreground font-bold">
                    {doctor.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">
                      {selectedDate || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium text-foreground">
                      {selectedTime || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant={bookingType === "tatkal" ? "secondary" : "outline"}>
                      {bookingType === "tatkal" ? "Tatkal" : "Normal"}
                    </Badge>
                  </div>
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{getAmount()}</span>
                  </div>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedTime}
                >
                  Confirm Booking
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;
