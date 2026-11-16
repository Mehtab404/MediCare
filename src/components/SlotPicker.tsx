import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import type { SlotsResponse } from "@/types";

interface SlotPickerProps {
  slots: SlotsResponse["slots"] | undefined;
  selected: string;
  onSelect: (time: string) => void;
  loading?: boolean;
  /** Shown before a date is chosen. */
  emptyMessage?: string;
}

const STATUS_LABEL = { booked: "Booked", past: "Passed" } as const;

/** Grid of time slots. Booked and past slots are shown but can't be picked. */
const SlotPicker = ({ slots, selected, onSelect, loading, emptyMessage = "Select a date first." }: SlotPickerProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking availability...
      </div>
    );
  }
  if (!slots) return <p className="text-muted-foreground py-4">{emptyMessage}</p>;

  const openCount = slots.filter((s) => s.status === "open").length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Time slot">
        {slots.map((slot) => {
          const isOpen = slot.status === "open";
          const isSelected = selected === slot.time;
          return (
            <button
              key={slot.time}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!isOpen}
              onClick={() => onSelect(slot.time)}
              className={cn(
                "rounded-full border px-3 py-2 text-xs font-semibold transition-all flex flex-col items-center",
                isSelected && "bg-primary text-primary-foreground border-primary",
                !isSelected && isOpen && "hover:bg-muted border-border text-foreground",
                !isOpen && "opacity-50 cursor-not-allowed line-through border-border text-muted-foreground",
              )}
            >
              {formatTime(slot.time)}
              {!isOpen && <span className="sr-only">({STATUS_LABEL[slot.status]})</span>}
            </button>
          );
        })}
      </div>
      {openCount === 0 && <p className="text-sm text-muted-foreground">No free slots on this date. Please pick another day.</p>}
    </div>
  );
};

export default SlotPicker;
