import type { ReactNode } from "react";
import { CalendarCheck, FileText, Pill, ShieldCheck } from "lucide-react";
import MediCareLogo from "./MediCareLogo";

const BENEFITS = [
  {
    icon: CalendarCheck,
    iconClass: "bg-[#0F172A] text-teal-200",
    title: "Book appointments with top specialists",
    text: "Choose a doctor, pick a free slot, and book a Normal or Tatkal appointment.",
  },
  {
    icon: FileText,
    iconClass: "bg-[#E3F0F2] text-[#1E4E5F] border border-[#DCE7EA]",
    title: "View your medical history anytime",
    text: "Read the diagnosis and notes from every completed visit, and keep your health profile current.",
  },
  {
    icon: Pill,
    iconClass: "bg-emerald-50 text-emerald-800 border border-emerald-200/80",
    title: "Manage prescriptions digitally",
    text: "Prescriptions from your doctor sit in your visit summary. Print it or save it as a PDF.",
  },
];

/**
 * Two-column shell for the sign-in pages. The left half describes MediCare, the right half holds the form card.
 * On narrow screens only the brand header is shown above the form.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="font-jakarta min-h-screen w-full grid grid-cols-1 min-[900px]:grid-cols-2 text-[#0F172A] antialiased overflow-x-hidden">
      {/* Left half: brand, headline, quote, highlights */}
      <section
        aria-label="About MediCare"
        className="auth-dot-pattern relative overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 border-b min-[900px]:border-b-0 min-[900px]:border-r border-[#DCE7EA] bg-gradient-to-br from-[#E3F0F2] via-[#EEF6F7] to-[#F8FAFC]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-teal-200/35 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-10 -right-20 w-72 h-72 rounded-full bg-sky-200/35 blur-3xl" />

        <header className="relative z-10 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white border border-[#DCE7EA] shadow-sm flex items-center justify-center shrink-0 p-1.5">
            <MediCareLogo />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-[26px] font-extrabold tracking-tight leading-none">MediCare</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-[#DCE7EA] text-[10px] font-code font-semibold uppercase tracking-wider text-teal-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                HMS Portal
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-1">Hospital Management System</p>
          </div>
        </header>

        <div className="relative z-10 my-6 max-w-xl space-y-6 hidden min-[900px]:block">
          <div>
            <h1 className="text-3xl sm:text-4xl xl:text-[44px] font-bold tracking-tight leading-[1.13]">
              Your Health Deserves the{" "}
              <span className="font-display italic font-normal text-4xl sm:text-5xl xl:text-[52px] text-[#1E4E5F]">
                right specialist
              </span>
            </h1>
            <p className="text-sm text-slate-600 mt-2.5 leading-relaxed max-w-md">
              One workspace for patients, doctors and hospital staff: appointments, visit records and reviews.
            </p>
          </div>

          <blockquote className="p-5 rounded-3xl bg-white/85 backdrop-blur-sm border border-[#DCE7EA] shadow-[0_10px_28px_-12px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-3.5">
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-2xl bg-[#0F172A] text-teal-200 font-display text-2xl flex items-center justify-center shrink-0 leading-none pt-1"
              >
                “
              </span>
              <div>
                <p className="font-display italic text-xl sm:text-[22px] leading-snug">
                  Wherever the art of Medicine is loved, there is also a love of Humanity.
                </p>
                <footer className="mt-2 flex items-center gap-2 text-xs font-semibold text-[#1E4E5F]">
                  <span>— Hippocrates</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-normal text-slate-500">Patient-First Clinical Philosophy</span>
                </footer>
              </div>
            </div>
          </blockquote>

          <div className="space-y-3">
            <p className="text-[11px] font-code uppercase tracking-widest text-slate-500 font-semibold pl-1">
              Platform Highlights
            </p>
            {BENEFITS.map(({ icon: Icon, iconClass, title, text }) => (
              <div
                key={title}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/85 hover:bg-white transition-colors border border-[#DCE7EA] flex items-start gap-3.5 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">{title}</h2>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-[#DCE7EA]/80 hidden min-[900px]:flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span className="font-medium text-[#1E4E5F]">Patients, doctors and administrators in one portal</span>
          <span>Admins can't read patient records</span>
        </div>
      </section>

      {/* Right half: form card */}
      <main className="auth-right-panel flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-[450px]">
          <div className="animate-view-in bg-white rounded-[28px] border border-[#E2E8F0] p-7 sm:p-10 auth-card-shadow">
            {children}
          </div>

          <footer className="mt-6 text-center space-y-1.5">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} MediCare Hospital. All rights reserved.</p>
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Passwords are hashed. Sessions use httpOnly cookies.</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
