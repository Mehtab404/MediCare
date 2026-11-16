import { Router } from "express";
import { query } from "../db.ts";
import { currentUserId, requireRole } from "../auth.ts";
import { PROFILE_COLUMNS, profileSchema, toProfile, type ProfileRow } from "../lib/profile.ts";

/** A patient's own health profile. Admins and other patients can't read it. */
export const profileRouter = Router();
profileRouter.use(requireRole("patient"));

profileRouter.get("/", async (req, res) => {
  const { rows } = await query<ProfileRow>(`SELECT ${PROFILE_COLUMNS} FROM patient_profiles WHERE user_id = $1`, [
    currentUserId(req),
  ]);
  res.json({ profile: toProfile(rows[0]) });
});

profileRouter.put("/", async (req, res) => {
  const userId = currentUserId(req);
  const p = profileSchema.parse(req.body);
  const { rows } = await query<ProfileRow>(
    `INSERT INTO patient_profiles
       (user_id, date_of_birth, gender, blood_group, phone, allergies, conditions, current_medications,
        emergency_contact_name, emergency_contact_phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (user_id) DO UPDATE SET
       date_of_birth = EXCLUDED.date_of_birth,
       gender = EXCLUDED.gender,
       blood_group = EXCLUDED.blood_group,
       phone = EXCLUDED.phone,
       allergies = EXCLUDED.allergies,
       conditions = EXCLUDED.conditions,
       current_medications = EXCLUDED.current_medications,
       emergency_contact_name = EXCLUDED.emergency_contact_name,
       emergency_contact_phone = EXCLUDED.emergency_contact_phone,
       updated_at = now()
     RETURNING ${PROFILE_COLUMNS}`,
    [
      userId, p.dateOfBirth, p.gender, p.bloodGroup, p.phone, p.allergies, p.conditions, p.currentMedications,
      p.emergencyContactName, p.emergencyContactPhone,
    ],
  );
  res.json({ profile: toProfile(rows[0]) });
});
