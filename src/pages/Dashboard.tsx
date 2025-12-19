import { Link } from "react-router-dom";
import { Calendar, Users, Clock, TrendingUp, ArrowRight, Plus } from "lucide-react";
import Header from "@/components/Header";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { doctors } from "@/data/doctors";

const Dashboard = () => {
  const patientName = localStorage.getItem("patientName") || "Patient";
  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Amit Sharma",
      specialization: "Cardiologist",
      date: "Dec 22, 2024",
      time: "10:00 AM",
      status: "confirmed",
    },
    {
      id: 2,
      doctor: "Dr. Neha Verma",
      specialization: "Dermatologist",
      date: "Dec 25, 2024",
      time: "2:30 PM",
      status: "pending",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {patientName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your healthcare activities
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <StatCard
              title="Upcoming Appointments"
              value={2}
              icon={Calendar}
              trend="Next: Dec 22"
              variant="primary"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <StatCard
              title="Total Visits"
              value={12}
              icon={TrendingUp}
              trend="This year"
              variant="secondary"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <StatCard
              title="Doctors Consulted"
              value={5}
              icon={Users}
              variant="accent"
            />
          </div>
          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <StatCard
              title="Pending Reports"
              value={1}
              icon={Clock}
              variant="success"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upcoming Appointments */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Appointments</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/doctors">
                    <Plus className="h-4 w-4 mr-2" />
                    Book New
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full gradient-medical flex items-center justify-center text-primary-foreground font-bold">
                          {apt.doctor.split(" ")[1][0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{apt.doctor}</p>
                          <p className="text-sm text-muted-foreground">{apt.specialization}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">{apt.date}</p>
                        <p className="text-sm text-muted-foreground">{apt.time}</p>
                      </div>
                      <Badge
                        variant={apt.status === "confirmed" ? "default" : "secondary"}
                        className={apt.status === "confirmed" ? "bg-success" : ""}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="animate-fade-in" style={{ animationDelay: "0.6s" }}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-between" asChild>
                  <Link to="/doctors">
                    Book Appointment
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between" asChild>
                  <Link to="/appointments">
                    View All Appointments
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between">
                  Download Reports
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Top Doctors */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Top Doctors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {doctors.slice(0, 3).map((doctor) => (
                  <Link
                    key={doctor.id}
                    to={`/doctor/${doctor.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full gradient-medical flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {doctor.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{doctor.name}</p>
                      <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {doctor.rating}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
