import { useState } from "react";
import { Search, Filter } from "lucide-react";
import Header from "@/components/Header";
import DoctorCard from "@/components/DoctorCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { doctors, specializations } from "@/data/doctors";

const Doctors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpec === "All" || doctor.specialization === selectedSpec;
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">Our Doctors</h1>
          <p className="text-muted-foreground">
            Find and book appointments with our experienced specialists
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12"
              />
            </div>
            <Button variant="outline" className="h-12">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Specialization Pills */}
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <Badge
                key={spec}
                variant={selectedSpec === spec ? "default" : "outline"}
                className={`cursor-pointer transition-all px-4 py-2 text-sm ${
                  selectedSpec === spec
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedSpec(spec)}
              >
                {spec}
              </Badge>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-muted-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Showing {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? "s" : ""}
        </p>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor, index) => (
            <div
              key={doctor.id}
              className="animate-fade-in"
              style={{ animationDelay: `${0.1 * (index + 3)}s` }}
            >
              <DoctorCard doctor={doctor} />
            </div>
          ))}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No doctors found matching your criteria</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedSpec("All");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Doctors;
