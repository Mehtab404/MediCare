import { cn } from "@/lib/utils";
import { PORTAL_ROLES, type PortalRole } from "./portalRole";

export default function RoleTabs({ role, onChange }: { role: PortalRole; onChange: (role: PortalRole) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Select portal role"
      className="p-1 rounded-full bg-slate-100 border border-[#E2E8F0] grid grid-cols-3 gap-1"
    >
      {PORTAL_ROLES.map((r) => {
        const active = role === r;
        return (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(r)}
            className={cn(
              "py-2 rounded-full text-xs font-bold transition-all cursor-pointer",
              active ? "bg-[#0F172A] text-white shadow-sm" : "text-slate-600 hover:text-[#0F172A]",
            )}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
