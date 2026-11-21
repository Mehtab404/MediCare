import { Link } from "react-router-dom";
import { Star, Clock, MapPin } from "lucide-react";
import DoctorAvatar from "@/components/DoctorAvatar";
import { ratingLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Doctor } from "@/types";

interface DoctorCardProps {
  doctor: Doctor;
}

const DoctorCard = ({ doctor }: DoctorCardProps) => {
  return (
    <div className="glass-card rounded-[24px] p-6 h-full flex flex-col transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4 min-w-0">
          <DoctorAvatar id={doctor.id} name={doctor.name} size="lg" />
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#0F172A]">{doctor.name}</h3>
            <p className="text-xs font-semibold text-[#14807A] mt-0.5">{doctor.specialization}</p>
          </div>
        </div>
        <span
          className={cn(
            "px-2.5 py-0.5 rounded-full border text-[11px] font-semibold shrink-0",
            doctor.available
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-500 border-slate-200",
          )}
        >
          {doctor.available ? "Available" : "Busy"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#14807A]" />
          <span>{doctor.experience} years experience</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#14807A]" />
          <span>{doctor.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          <span>{ratingLabel(doctor.rating, doctor.reviews)}</span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-500">Consultation Fee</p>
            <p className="text-lg font-bold text-[#0F172A]">₹{doctor.fee}</p>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/doctor/${doctor.id}`}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors"
            >
              View Profile
            </Link>
            {doctor.available ? (
              <Link
                to={`/book/${doctor.id}`}
                className="px-5 py-2 rounded-full bg-[#1B2A2F] hover:bg-[#111C20] text-white text-xs font-semibold shadow-sm transition-all"
              >
                Book Now
              </Link>
            ) : (
              <button
                type="button"
                disabled
                title="This doctor isn't taking bookings right now"
                className="px-5 py-2 rounded-full bg-slate-100 text-slate-400 border border-slate-200 text-xs font-semibold cursor-not-allowed"
              >
                Unavailable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorCard;
