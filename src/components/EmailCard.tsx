import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { AccountEmail } from "@/types";

/** Where appointment emails go. Nothing is sent to an address until the patient confirms it. */
export default function EmailCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ["account"], queryFn: api.account });
  const [draft, setDraft] = useState("");
  const [changing, setChanging] = useState(false);

  const onSaved = (state: AccountEmail, title: string, description?: string) => {
    queryClient.setQueryData(["account"], state);
    setDraft("");
    setChanging(false);
    toast({ title, description });
  };

  const save = useMutation({
    mutationFn: (email: string) => api.setEmail(email),
    onSuccess: (state) =>
      onSaved(state, "Check your inbox", `We sent a confirmation link to ${state.email}. It expires in 24 hours.`),
    onError: (err) => toast({ title: "Couldn't send the link", description: err.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: api.removeEmail,
    onSuccess: (state) => onSaved(state, "Email removed", "You won't get appointment emails any more."),
    onError: (err) => toast({ title: "Couldn't remove your email", description: err.message, variant: "destructive" }),
  });

  const busy = save.isPending || remove.isPending;
  const showForm = data && data.emailEnabled && (!data.email || changing);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Email notifications
        </CardTitle>
        <CardDescription>
          Get a confirmation when you book, move or cancel an appointment, and a reminder the day before. We only
          write to an address you have confirmed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && <p className="text-muted-foreground">Loading...</p>}
        {isError && (
          <p className="text-destructive">
            Couldn't load your email settings: {error.message}{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Try again
            </button>
          </p>
        )}

        {data && !data.emailEnabled && (
          <p className="text-muted-foreground">Email isn't set up on this server yet, so no emails can be sent.</p>
        )}

        {data?.email && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-medium text-foreground break-all">{data.email}</span>
            {data.emailVerified ? (
              <Badge className="bg-success">
                <CheckCircle className="h-3 w-3 mr-1" />
                Confirmed
              </Badge>
            ) : (
              <Badge variant="secondary">Waiting for confirmation</Badge>
            )}
          </div>
        )}

        {data?.email && !data.emailVerified && data.emailEnabled && (
          <p className="text-sm text-muted-foreground">
            Open the link we emailed to {data.email}. Until you do, nothing else is sent to that address.
          </p>
        )}

        {showForm && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate(draft.trim());
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="notify-email">{data.email ? "New email address" : "Email address"}</Label>
              <Input
                id="notify-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || draft.trim() === ""}>
                {save.isPending ? "Sending..." : "Send confirmation link"}
              </Button>
              {changing && (
                <Button type="button" variant="outline" onClick={() => setChanging(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}

        {data?.email && !showForm && (
          <div className="flex flex-wrap gap-2">
            {!data.emailVerified && data.emailEnabled && (
              <Button type="button" variant="outline" disabled={busy} onClick={() => save.mutate(data.email!)}>
                Send the link again
              </Button>
            )}
            {data.emailEnabled && (
              <Button type="button" variant="outline" disabled={busy} onClick={() => setChanging(true)}>
                Use a different address
              </Button>
            )}
            <Button type="button" variant="ghost" disabled={busy} onClick={() => remove.mutate()}>
              Remove email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
