import path from "node:path";
import { pathToFileURL } from "node:url";
import { pool } from "./db.ts";

const doctors = [
  { name: "Dr. Amit Sharma", specialization: "Cardiologist", experience: 15, rating: 4.9, reviews: 234, available: true, location: "Block A, Room 101", fee: 500 },
  { name: "Dr. Neha Verma", specialization: "Dermatologist", experience: 10, rating: 4.8, reviews: 189, available: true, location: "Block B, Room 205", fee: 400 },
  { name: "Dr. Rahul Mehta", specialization: "Orthopedic", experience: 12, rating: 4.7, reviews: 156, available: false, location: "Block C, Room 302", fee: 450 },
  { name: "Dr. Priya Singh", specialization: "Pediatrician", experience: 8, rating: 4.9, reviews: 312, available: true, location: "Block A, Room 108", fee: 350 },
  { name: "Dr. Vikram Patel", specialization: "Neurologist", experience: 18, rating: 4.8, reviews: 267, available: true, location: "Block D, Room 401", fee: 600 },
  { name: "Dr. Ananya Gupta", specialization: "Gynecologist", experience: 14, rating: 4.9, reviews: 298, available: true, location: "Block B, Room 210", fee: 500 },
];

/** Inserts the default doctors. Safe to run more than once: existing doctors (matched by name) are updated. */
export async function seedDoctors() {
  for (const d of doctors) {
    const email = d.name.toLowerCase().replace(/^dr\.\s*/, "").replace(/\s+/g, ".") + "@medicare.com";
    await pool.query(
      `INSERT INTO doctors (name, specialization, experience, rating, reviews, available, location, fee, phone, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (name) DO UPDATE SET
         specialization = EXCLUDED.specialization,
         experience     = EXCLUDED.experience,
         rating         = EXCLUDED.rating,
         reviews        = EXCLUDED.reviews,
         available      = EXCLUDED.available,
         location       = EXCLUDED.location,
         fee            = EXCLUDED.fee,
         phone          = EXCLUDED.phone,
         email          = EXCLUDED.email`,
      [d.name, d.specialization, d.experience, d.rating, d.reviews, d.available, d.location, d.fee, "+91 98765 43210", email],
    );
  }
  console.log(`Seeded ${doctors.length} doctors.`);
}

/** Seeds doctors only when the table is empty, so a fresh deployment has data but edits made later are kept. */
export async function seedDoctorsIfEmpty() {
  const { rows } = await pool.query<{ count: string }>("SELECT count(*) FROM doctors");
  if (Number(rows[0].count) === 0) await seedDoctors();
}

// Run directly: npm run db:seed
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  seedDoctors()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
