import { z } from "zod";
import { hospitalNow, isValidDate } from "./dates.ts";

export type ProfileRow = {
  date_of_birth: string | null;
  gender: "female" | "male" | "other" | null;
  blood_group: string | null;
  phone: string | null;
  allergies: string | null;
  conditions: string | null;
  current_medications: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  updated_at: Date;
};

export const PROFILE_COLUMNS = `date_of_birth, gender, blood_group, phone, allergies, conditions, current_medications,
  emergency_contact_name, emergency_contact_phone, updated_at`;

/** API shape. A patient who hasn't saved a profile yet gets all-null fields. */
export function toProfile(row: ProfileRow | undefined) {
  return {
    dateOfBirth: row?.date_of_birth ?? null,
    gender: row?.gender ?? null,
    bloodGroup: row?.blood_group ?? null,
    phone: row?.phone ?? null,
    allergies: row?.allergies ?? null,
    conditions: row?.conditions ?? null,
    currentMedications: row?.current_medications ?? null,
    emergencyContactName: row?.emergency_contact_name ?? null,
    emergencyContactPhone: row?.emergency_contact_phone ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

/** Optional text: trimmed, and an empty string becomes null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Please keep this under ${max} characters.`)
    .nullish()
    .transform((v) => (v ? v : null));

const phone = z
  .string()
  .trim()
  .regex(/^[0-9+()\-\s]{7,20}$/, "Please enter a valid phone number.")
  .nullish()
  .or(z.literal(""))
  .transform((v) => (v ? v : null));

export const profileSchema = z.object({
  dateOfBirth: z
    .string()
    .nullish()
    .or(z.literal(""))
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || isValidDate(v), "Please enter a valid date of birth.")
    .refine((v) => v === null || (v >= "1900-01-01" && v <= hospitalNow().date), "Date of birth must be between 1900 and today."),
  gender: z
    .enum(["female", "male", "other"], { errorMap: () => ({ message: "Please choose a gender from the list." }) })
    .nullish()
    .transform((v) => v ?? null),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
      errorMap: () => ({ message: "Please choose a blood group from the list." }),
    })
    .nullish()
    .transform((v) => v ?? null),
  phone,
  allergies: optionalText(1000),
  conditions: optionalText(1000),
  currentMedications: optionalText(1000),
  emergencyContactName: optionalText(80),
  emergencyContactPhone: phone,
});
