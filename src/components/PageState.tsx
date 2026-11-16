import { Link } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  backTo?: { to: string; label: string };
}

export function ErrorState({ title = "Something went wrong", message, onRetry, backTo }: ErrorStateProps) {
  return (
    <div className="py-16 text-center" role="alert">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      {message && <p className="text-muted-foreground mb-6">{message}</p>}
      <div className="flex justify-center gap-3">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
        {backTo && (
          <Button asChild>
            <Link to={backTo.to}>{backTo.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
