import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Clock, MapPin, Award, Phone, Mail, ArrowLeft, Calendar } from "lucide-react";
import Header from "@/components/Header";
import { ErrorState, LoadingState } from "@/components/PageState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import { formatTimestamp, initials, ratingLabel } from "@/lib/format";
import { Stars } from "@/components/Stars";

const DoctorProfile = () => {
  const { id } = useParams();
  const doctorId = Number(id);
  const validId = Number.isInteger(doctorId) && doctorId > 0;
  const { data: doctor, isPending, isError, error, refetch } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => api.doctor(doctorId),
    enabled: validId,
  });
  const reviewsQuery = useQuery({
    queryKey: ["doctor", doctorId, "reviews"],
    queryFn: () => api.doctorReviews(doctorId),
    enabled: validId,
  });

  if (validId && isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <LoadingState label="Loading doctor..." />
      </div>
    );
  }

  if (!validId || isError || !doctor) {
    const notFound = !validId || (error instanceof ApiError && error.status === 404);
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4">
          <ErrorState
            title={notFound ? "Doctor not found" : "Couldn't load doctor"}
            message={notFound ? undefined : error?.message}
            onRetry={notFound ? undefined : () => refetch()}
            backTo={{ to: "/doctors", label: "Back to Doctors" }}
          />
        </div>
      </div>
    );
  }

  const qualifications = (doctor.qualifications ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  // Matches the bookable slots on the server (server/lib/dates.ts).
  const consultationHours = [
    { label: "Morning", time: "9:00 AM - 12:00 PM" },
    { label: "Afternoon", time: "2:00 PM - 5:00 PM" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Doctors
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <Card className="overflow-hidden animate-fade-in">
              <div className="h-32 gradient-medical" />
              <CardContent className="relative pt-0">
                <div className="flex flex-col sm:flex-row gap-6 -mt-16">
                  <div className="w-32 h-32 rounded-2xl border-4 border-card bg-muted flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-primary">{initials(doctor.name)}</span>
                  </div>
                  <div className="flex-1 pt-4 sm:pt-16">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">{doctor.name}</h1>
                        <p className="text-primary font-medium text-lg">{doctor.specialization}</p>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {doctor.experience} years
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning fill-warning" />
                            {ratingLabel(doctor.rating, doctor.reviews)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={doctor.available ? "default" : "secondary"}
                        className={`text-sm ${doctor.available ? "bg-success" : ""}`}
                      >
                        {doctor.available ? "Accepting Bookings" : "Not Available"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About: only when the hospital has written something */}
            {doctor.bio && (
              <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{doctor.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Qualifications: only when the hospital has listed them */}
            {qualifications.length > 0 && (
              <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Qualifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {qualifications.map((qual, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <span className="text-foreground">{qual}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Reviews from patients whose visit was completed */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle>Patient Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviewsQuery.isPending && <LoadingState label="Loading reviews..." />}
                {reviewsQuery.isError && <p className="text-muted-foreground">Couldn't load reviews.</p>}
                {reviewsQuery.isSuccess && reviewsQuery.data.length === 0 && (
                  <p className="text-muted-foreground">
                    No reviews yet. Patients can review {doctor.name} after a completed visit.
                  </p>
                )}
                {reviewsQuery.isSuccess && reviewsQuery.data.length > 0 && (
                  <div className="space-y-4">
                    {reviewsQuery.data.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Stars value={review.rating} />
                          <span className="text-sm text-muted-foreground">{formatTimestamp(review.createdAt)}</span>
                        </div>
                        {review.comment && <p className="text-foreground whitespace-pre-wrap">{review.comment}</p>}
                        <p className="text-sm text-muted-foreground mt-2">- {review.patientName}, verified visit</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-24 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle>Book Appointment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  <p className="text-3xl font-bold text-foreground">₹{doctor.fee}</p>
                </div>

                <div>
                  <p className="font-medium text-foreground mb-3">Consultation Hours (daily)</p>
                  <div className="space-y-2">
                    {consultationHours.map((slot) => (
                      <div key={slot.label} className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <span className="font-medium text-foreground">{slot.label}</span>
                        <span className="text-muted-foreground">{slot.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {doctor.available ? (
                  <Button className="w-full h-12" asChild>
                    <Link to={`/book/${doctor.id}`}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button className="w-full h-12" disabled>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                    <p className="text-sm text-muted-foreground text-center">
                      {doctor.name} isn't taking bookings right now.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{doctor.location}</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="h-5 w-5 text-primary" />
                    <a href={`tel:${doctor.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                      {doctor.phone}
                    </a>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href={`mailto:${doctor.email}`} className="hover:text-foreground break-all">
                      {doctor.email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;
