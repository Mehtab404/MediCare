import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Each doctor keeps the same colour, picked from their id.
const COLORS = ["bg-[#14807A]", "bg-[#1B2A2F]", "bg-[#0F766E]", "bg-[#1E3A8A]"];
const SIZES = {
  sm: "w-10 h-10 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-14 h-14 text-base",
};

/** Coloured tile with the doctor's initials. */
export default function DoctorAvatar({
  id,
  name,
  size = "md",
  round = false,
  className,
}: {
  id: number;
  name: string;
  size?: keyof typeof SIZES;
  round?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "text-white font-bold flex items-center justify-center shrink-0 shadow-sm",
        COLORS[id % COLORS.length],
        SIZES[size],
        round ? "rounded-full" : "rounded-2xl",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
