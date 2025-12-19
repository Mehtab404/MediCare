import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, MapPin } from "lucide-react";

const Appointments = () => {
  // Mock data for appointments
  const appointments = [
    {
      id: 1,
      doctor: "Dr. Amit Sharma",
      specialization: "Cardiologist",
      date: "2024-12-22",
      time: "10:00 AM",
      location: "Block A, Room 101",
      status: "upcoming",
      amount: 500,
    },
    {
      id: 2,
      doctor: "Dr. Neha Verma",
      specialization: "Dermatologist",
      date: "2024-12-25",
      time: "2:30 PM",
      location: "Block B, Room 205",
      status: "upcoming",
      amount: 400,
    },
    {
      id: 3,
      doctor: "Dr. Priya Singh",
      specialization: "Pediatrician",
      date: "2024-12-10",
      time: "11:00 AM",
      location: "Block A, Room 108",
      status: "completed",
      amount: 350,
    },
    {
      id: 4,
      doctor: "Dr. Rahul Mehta",
      specialization: "Orthopedic",
      date: "2024-11-28",
      time: "3:00 PM",
      location: "Block C, Room 302",
      status: "completed",
      amount: 450,
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === "upcoming");
  const pastAppointments = appointments.filter(apt => apt.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
            <p className="text-muted-foreground">
              View and manage your appointments
            </p>
          </div>
          <Button asChild>
            <Link to="/doctors">Book New Appointment</Link>
          </Button>
        </div>

        {/* Upcoming Appointments */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Appointments ({upcomingAppointments.length})
          </h2>
          
          {upcomingAppointments.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingAppointments.map((apt, index) => (
                <Card 
                  key={apt.id} 
                  className="card-hover animate-fade-in"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full gradient-medical flex items-center justify-center text-primary-foreground font-bold">
                          {apt.doctor.split(" ")[1][0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{apt.doctor}</p>
                          <p className="text-sm text-primary">{apt.specialization}</p>
                        </div>
                      </div>
                      <Badge className="bg-primary">Upcoming</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(apt.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{apt.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{apt.location}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="font-semibold text-foreground">₹{apt.amount}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="destructive" size="sm">Cancel</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No upcoming appointments</p>
                <Button className="mt-4" asChild>
                  <Link to="/doctors">Book an Appointment</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Past Appointments */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Past Appointments ({pastAppointments.length})
          </h2>
          
          <div className="space-y-3">
            {pastAppointments.map((apt, index) => (
              <Card 
                key={apt.id}
                className="animate-fade-in"
                style={{ animationDelay: `${0.1 * (index + 3)}s` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold">
                        {apt.doctor.split(" ")[1][0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{apt.doctor}</p>
                        <p className="text-sm text-muted-foreground">{apt.specialization}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(apt.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{apt.time}</span>
                      </div>
                      <Badge variant="secondary">Completed</Badge>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Appointments;
