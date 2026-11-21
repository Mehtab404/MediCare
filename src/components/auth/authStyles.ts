/** Class names shared by the sign-in pages, so inputs and buttons look the same everywhere. */

export const authInputClass =
  "w-full py-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-medium text-[#0F172A] " +
  "placeholder:text-slate-400 transition-all focus:bg-white focus:border-[#0F172A] " +
  "focus:ring-2 focus:ring-[#0F172A]/10 focus:outline-none";

export const authLabelClass = "block text-xs font-bold text-[#0F172A] mb-1.5";

export const authPrimaryButtonClass =
  "w-full py-3.5 px-5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] hover:-translate-y-0.5 " +
  "disabled:opacity-75 disabled:hover:translate-y-0 disabled:cursor-not-allowed " +
  "text-white text-sm font-semibold flex items-center justify-center gap-2 mt-2 " +
  "shadow-[0_12px_24px_-8px_rgba(15,23,42,0.32)] transition-all cursor-pointer";

export const authLinkButtonClass =
  "font-bold text-[#0F172A] hover:text-[#1E4E5F] underline underline-offset-4 ml-1 cursor-pointer";
