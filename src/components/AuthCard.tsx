import type { ReactNode } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/** Centered card with the MediCare logo, for pages people reach before or without logging in. */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 gradient-medical rounded-xl">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MediCare</h1>
        </div>
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
