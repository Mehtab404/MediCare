/**
 * Column list for reading a doctor, from the table aliased as `d`.
 * rating and reviews are worked out from the reviews table (0 and 0 when there are none).
 */
export const DOCTOR_COLUMNS = `
  d.id, d.name, d.specialization, d.experience, d.available, d.location, d.fee, d.phone, d.email,
  d.bio, d.qualifications,
  COALESCE((SELECT round(avg(r.rating), 1) FROM reviews r WHERE r.doctor_id = d.id), 0) AS rating,
  (SELECT count(*)::int FROM reviews r WHERE r.doctor_id = d.id) AS reviews`;
