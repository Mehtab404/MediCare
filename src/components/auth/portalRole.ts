import { useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * The role tabs on the sign-in pages. They change the wording and which form is shown.
 * They do not pick the account type: the server decides the role from the account that logs in.
 * "Staff" means an admin account.
 */
export const PORTAL_ROLES = ["Patient", "Doctor", "Staff"] as const;
export type PortalRole = (typeof PORTAL_ROLES)[number];

export const ROLE_DESCRIPTIONS: Record<PortalRole, string> = {
  Patient: "Sign in to book appointments, read visit summaries and keep your health profile up to date.",
  Doctor: "Sign in to see your patients, write visit records and mark visits completed.",
  Staff: "Sign in to manage doctors, appointments and accounts.",
};

interface AuthNavState {
  role?: PortalRole;
  from?: string;
}

/**
 * Selected role tab for the page. The choice is passed along in the router state of the links between
 * login, register and forgot-password, together with any `from` page the route guard stored.
 */
export function usePortalRole() {
  const location = useLocation();
  const incoming = (location.state ?? {}) as AuthNavState;
  const [role, setRole] = useState<PortalRole>(
    incoming.role && PORTAL_ROLES.includes(incoming.role) ? incoming.role : "Patient",
  );
  const linkState: AuthNavState = { ...incoming, role };
  return { role, setRole, linkState };
}
