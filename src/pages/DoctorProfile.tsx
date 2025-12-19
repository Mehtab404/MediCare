import { useParams, Link } from "react-router-dom";
import { Star, Clock, MapPin, Award, Phone, Mail, ArrowLeft, Calendar } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { doctors } from "@/data/doctors";

const DoctorProfile = () => {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === Number(id));

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

  const qualifications = [
    "MBBS - All India Institute of Medical Sciences",
    `MD - ${doctor.specialization}`,
    "Fellowship - Advanced Training Program",
  ];

  const availableSlots = [
    { day: "Monday", time: "9:00 AM - 1:00 PM" },
    { day: "Wednesday", time: "2:00 PM - 6:00 PM" },
    { day: "Friday", time: "9:00 AM - 1:00 PM" },
    { day: "Saturday", time: "10:00 AM - 2:00 PM" },
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
                    <span className="text-4xl font-bold text-primary">
                      {doctor.name.split(" ").map(n => n[0]).join("")}
                    </span>
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
                            {doctor.rating} ({doctor.reviews} reviews)
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={doctor.available ? "default" : "secondary"}
                        className={`text-sm ${doctor.available ? "bg-success" : ""}`}
                      >
                        {doctor.available ? "Available Today" : "Not Available"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {doctor.name} is a highly experienced {doctor.specialization.toLowerCase()} with over {doctor.experience} years of expertise in the field. 
                  Known for providing compassionate care and employing the latest medical techniques, 
                  {doctor.name.split(" ")[1]} has helped thousands of patients achieve better health outcomes. 
                  Committed to continuous learning and patient-centered care.
                </p>
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Qualifications & Experience
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

            {/* Reviews Placeholder */}
            <Card className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle>Patient Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-4 w-4 text-warning fill-warning" />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">2 weeks ago</span>
                      </div>
                      <p className="text-foreground">
                        Excellent doctor! Very thorough and takes time to explain everything clearly. 
                        Highly recommended for anyone seeking quality care.
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">- Verified Patient</p>
                    </div>
                  ))}
                </div>
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
                  <p className="font-medium text-foreground mb-3">Available Slots</p>
                  <div className="space-y-2">
                    {availableSlots.map((slot, index) => (
                      <div key={index} className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
                        <span className="font-medium text-foreground">{slot.day}</span>
                        <span className="text-muted-foreground">{slot.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full h-12" asChild>
                  <Link to={`/book/${doctor.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Appointment
                  </Link>
                </Button>
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
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-5 w-5 text-primary" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  <span>{doctor.name.toLowerCase().replace(/\s|dr\./g, "")}@medicare.com</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;
