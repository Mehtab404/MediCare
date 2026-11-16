-- Patient health profile. One row per patient, created the first time they save it.
CREATE TABLE patient_profiles (
  user_id                 INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth           DATE,
  gender                  TEXT CHECK (gender IN ('female', 'male', 'other')),
  blood_group             TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  phone                   TEXT,
  allergies               TEXT,
  conditions              TEXT,   -- long-term conditions
  current_medications     TEXT,
  emergency_contact_name  TEXT,
  emergency_contact_phone TEXT,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- What the doctor recorded for one visit. At most one per appointment.
CREATE TABLE visit_records (
  appointment_id INTEGER PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
  diagnosis      TEXT NOT NULL DEFAULT '',
  notes          TEXT NOT NULL DEFAULT '',
  follow_up      TEXT NOT NULL DEFAULT '',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE prescription_items (
  id             SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES visit_records(appointment_id) ON DELETE CASCADE,
  position       INTEGER NOT NULL,
  medicine       TEXT NOT NULL,
  dosage         TEXT NOT NULL,
  frequency      TEXT NOT NULL,
  duration       TEXT NOT NULL,
  instructions   TEXT NOT NULL DEFAULT ''
);

CREATE INDEX prescription_items_appointment_idx ON prescription_items (appointment_id, position);

-- A patient can review a completed visit once.
CREATE TABLE reviews (
  id             SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id      INTEGER NOT NULL REFERENCES doctors(id),
  rating         INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reviews_doctor_idx ON reviews (doctor_id, created_at DESC);

-- Ratings are now worked out from the reviews table. The old columns held made-up seed numbers.
ALTER TABLE doctors DROP COLUMN rating;
ALTER TABLE doctors DROP COLUMN reviews;

-- Shown on the doctor's profile page only when an admin has filled them in.
ALTER TABLE doctors ADD COLUMN bio TEXT;
ALTER TABLE doctors ADD COLUMN qualifications TEXT;   -- one qualification per line
