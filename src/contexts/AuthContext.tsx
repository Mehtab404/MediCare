import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError, setUnauthorizedHandler } from "@/lib/api";
import type { Patient } from "@/types";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  patient: Patient | null;
  status: AuthStatus;
  login: (userId: string, password: string) => Promise<void>;
  register: (userId: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const signedIn = useCallback((p: Patient) => {
    setPatient(p);
    setStatus("authenticated");
  }, []);

  const signedOut = useCallback(() => {
    setPatient(null);
    setStatus("anonymous");
    queryClient.clear();
  }, [queryClient]);

  // Restore the session from the cookie on page load.
  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((p) => !cancelled && signedIn(p))
      .catch((err) => {
        if (cancelled) return;
        if (!(err instanceof ApiError) || err.status !== 401) console.error(err);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // If the session expires while the app is open, drop back to the login page.
  useEffect(() => {
    setUnauthorizedHandler(signedOut);
    return () => setUnauthorizedHandler(null);
  }, [signedOut]);

  const value = useMemo<AuthContextValue>(
    () => ({
      patient,
      status,
      login: async (userId, password) => signedIn(await api.login(userId, password)),
      register: async (userId, fullName, password) => signedIn(await api.register(userId, fullName, password)),
      logout: async () => {
        try {
          await api.logout();
        } finally {
          signedOut();
        }
      },
    }),
    [patient, status, signedIn, signedOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
