import type { Role } from "@/types";

/** Where each kind of account lands after logging in. */
export function homePath(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor";
    default:
      return "/dashboard";
  }
}
