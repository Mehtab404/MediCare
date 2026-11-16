import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Clock, CreditCard, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import SlotPicker from "@/components/SlotPicker";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError } from "@/lib/api";
import { formatDate, formatTime, initials } from "@/lib/format";
import type { BookingType } from "@/types";

const Booking = () => {
  const { id } = useParams();
  const doctorId = Number(id);
  const validId = Number.isInteger(doctorId) && doctorId > 0;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingType, setBookingType] = useState<BookingType>("normal");

  const doctorQuery = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => api.doctor(doctorId),
    enabled: validId,
  });
  // Booking window (today, tomorrow, max date) in the hospital's time zone.
  const windowQuery = useQuery({
    queryKey: ["slots", doctorId, null],
    queryFn: () => api.slots(doctorId),
    enabled: validId,
  });
  const slotsQuery = useQuery({
    queryKey: ["slots", doctorId, selectedDate],
    queryFn: () => api.slots(doctorId, selectedDate),
    enabled: validId && !!selectedDate,
  });

  const booking = useMutation({
    mutationFn: api.book,
    onSuccess: (appointment) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots", doctorId] });
      navigate(`/confirmation/${appointment.id}`);
    },
    onError: (err) => {
      toast({ title: "Booking failed", description: err.message, variant: "destructive" });
      if (err instanceof ApiError && err.status === 409) {
        setSelectedTime("");
        slotsQuery.refetch();
      }
    },
  });

  const doctor = doctorQuery.data;
  const bookingWindow = windowQuery.data;
  const tatkalFee = bookingWindow?.tatkalFee ?? 300;
  const amount = doctor ? doctor.fee + (bookingType === "tatkal" ? tatkalFee : 0) : 0;

  const changeDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleBookingTypeChange = (value: BookingType) => {
    setBookingType(value);
    if (value === "tatkal" && bookingWindow) changeDate(bookingWindow.tomorrow);
  };

  const handleSubmit = () => {
    if (!doctor || !selectedDate || !selectedTime) {
      toast({
        title: "Error",
        description: "Please select both date and time slot",
        variant: "destructive",
      });
      return;
    }
    booking.mutate({ doctorId: doctor.id, date: selectedDate, time: selectedTime, bookingType });
  };

  if (validId && (doctorQuery.isPending || windowQuery.isPending)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingState />
      </div>
    );
  }

  if (!validId || !doctor || !bookingWindow) {
    const err = doctorQuery.error ?? windowQuery.error;
    const notFound = !validId || (err instanceof ApiError && err.status === 404);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4">
          <ErrorState
            title={notFound ? "Doctor not found" : "Couldn't load booking details"}
            message={notFound ? undefined : err?.message}
            onRetry={notFound ? undefined : () => { doctorQuery.refetch(); windowQuery.refetch(); }}
            backTo={{ to: "/doctors", label: "Back to Doctors" }}
          />
        </div>
      </div>
    );
  }

  if (!doctor.available) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4">
          <ErrorState
            title="Not taking bookings"
            message={`${doctor.name} isn't taking bookings right now. Please choose another doctor.`}
            backTo={{ to: "/doctors", label: "Back to Doctors" }}
          />
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
                  onValueChange={(v) => handleBookingTypeChange(v as BookingType)}
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
                      <span className="text-2xl font-bold text-warning">₹{doctor.fee + tatkalFee}</span>
                      <span className="text-sm text-muted-foreground">Next day only</span>
                    </Label>
                  </div>
                </RadioGroup>

                {bookingType === "tatkal" && (
                  <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">
                      Tatkal booking is available only for next-day appointments. Additional ₹{tatkalFee} convenience fee applies.
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
                  aria-label="Appointment date"
                  value={selectedDate}
                  onChange={(e) => changeDate(e.target.value)}
                  min={bookingType === "tatkal" ? bookingWindow.tomorrow : bookingWindow.today}
                  max={bookingType === "tatkal" ? bookingWindow.tomorrow : bookingWindow.maxDate}
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
                {slotsQuery.isError ? (
                  <p className="text-destructive">{slotsQuery.error.message}</p>
                ) : (
                  <SlotPicker
                    slots={selectedDate ? slotsQuery.data?.slots : null}
                    selected={selectedTime}
                    onSelect={setSelectedTime}
                    loading={!!selectedDate && slotsQuery.isPending}
                  />
                )}
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
                    {initials(doctor.name)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{doctor.name}</p>
                    <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground text-right">
                      {selectedDate ? formatDate(selectedDate) : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium text-foreground">
                      {selectedTime ? formatTime(selectedTime) : "Not selected"}
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
                    <span className="text-2xl font-bold text-primary">₹{amount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Payable at the hospital reception.</p>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={handleSubmit}
                  disabled={!selectedDate || !selectedTime || booking.isPending}
                >
                  {booking.isPending ? "Booking..." : "Confirm Booking"}
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
