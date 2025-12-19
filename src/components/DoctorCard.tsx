import { Link } from "react-router-dom";
import { Star, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  reviews: number;
  available: boolean;
  image: string;
  location: string;
  fee: number;
}

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <div className="h-32 gradient-medical" />
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden shadow-lg">
              <span className="text-3xl font-bold text-primary">
                {doctor.name.split(" ").map(n => n[0]).join("")}
              </span>
            </div>
          </div>
          <Badge
            variant={doctor.available ? "default" : "secondary"}
            className={`absolute top-4 right-4 ${
              doctor.available ? "bg-success" : "bg-muted"
            }`}
          >
            {doctor.available ? "Available" : "Busy"}
          </Badge>
        </div>

        <div className="pt-14 px-6 pb-6">
          <h3 className="text-xl font-semibold text-foreground">{doctor.name}</h3>
          <p className="text-primary font-medium">{doctor.specialization}</p>

          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{doctor.experience} years experience</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{doctor.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-warning fill-warning" />
              <span>{doctor.rating} ({doctor.reviews} reviews)</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Consultation Fee</p>
              <p className="text-lg font-bold text-foreground">₹{doctor.fee}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/doctor/${doctor.id}`}>View Profile</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/book/${doctor.id}`}>Book Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorCard;
