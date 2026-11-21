import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import DoctorCard from "@/components/DoctorCard";
import { ErrorState, LoadingState } from "@/components/PageState";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const Doctors = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");
  const [availableOnly, setAvailableOnly] = useState(false);
  const { data: doctors = [], isPending, isError, error, refetch } = useQuery({
    queryKey: ["doctors"],
    queryFn: api.doctors,
  });

  const specializations = useMemo(
    () => ["All", ...Array.from(new Set(doctors.map((d) => d.specialization))).sort()],
    [doctors],
  );

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpec === "All" || doctor.specialization === selectedSpec;
    const matchesAvailability = !availableOnly || doctor.available;
    return matchesSearch && matchesSpec && matchesAvailability;
  });

  return (
    <div className="min-h-screen app-bg">
      <Header />

      <main className="container mx-auto px-4 pt-10 pb-14">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
            Our{" "}
            <span className="font-display italic font-normal text-4xl sm:text-5xl text-[#14807A]">Doctors</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">Find and book appointments with our experienced specialists</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                aria-label="Search doctors"
                placeholder="Search doctors by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E2E8F0] bg-white/90 text-sm font-medium text-[#0F172A] placeholder:text-slate-400 focus:bg-white focus:border-[#0F172A] focus:ring-2 focus:ring-[#0F172A]/10 focus:outline-none transition-all"
              />
            </div>
            <button
              type="button"
              aria-pressed={availableOnly}
              onClick={() => setAvailableOnly((v) => !v)}
              className={cn(
                "px-5 py-3 rounded-2xl text-sm font-semibold inline-flex items-center justify-center gap-2 border transition-all cursor-pointer",
                availableOnly
                  ? "bg-[#1B2A2F] text-white border-[#1B2A2F] shadow-sm"
                  : "bg-white/90 text-slate-600 border-[#E2E8F0] hover:bg-white",
              )}
            >
              <CheckCircle className="h-4 w-4" />
              Available only
            </button>
          </div>

          {/* Specialization Pills */}
          <div className="flex flex-wrap gap-2">
            {specializations.map((spec) => (
              <button
                key={spec}
                type="button"
                aria-pressed={selectedSpec === spec}
                onClick={() => setSelectedSpec(spec)}
                className={cn(
                  "px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  selectedSpec === spec
                    ? "bg-[#1B2A2F] text-white shadow-sm"
                    : "bg-white/85 text-slate-600 border border-slate-200 hover:bg-white",
                )}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {isPending && <LoadingState label="Loading doctors..." />}
        {isError && (
          <ErrorState title="Couldn't load doctors" message={error.message} onRetry={() => refetch()} />
        )}

        {!isPending && !isError && (
          <>
            {/* Results Count */}
            <p className="text-sm text-slate-600 mb-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
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
              <div className="glass-card rounded-[24px] text-center py-14 px-6">
                <p className="text-base font-semibold text-[#0F172A]">No doctors found matching your criteria</p>
                <button
                  type="button"
                  className="mt-4 px-5 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors cursor-pointer"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedSpec("All");
                    setAvailableOnly(false);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Doctors;
