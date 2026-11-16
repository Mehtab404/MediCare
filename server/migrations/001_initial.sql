CREATE TABLE patients (
  id            SERIAL PRIMARY KEY,
  user_id       TEXT NOT NULL UNIQUE,          -- login handle, stored lowercase
  full_name     TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE doctors (
  id             SERIAL PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE,
  specialization TEXT NOT NULL,
  experience     INTEGER NOT NULL CHECK (experience >= 0),
  rating         NUMERIC(2, 1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
  reviews        INTEGER NOT NULL DEFAULT 0 CHECK (reviews >= 0),
  available      BOOLEAN NOT NULL DEFAULT TRUE,
  location       TEXT NOT NULL,
  fee            INTEGER NOT NULL CHECK (fee >= 0),
  phone          TEXT,
  email          TEXT
);

CREATE TABLE appointments (
  id               SERIAL PRIMARY KEY,
  patient_id       INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id        INTEGER NOT NULL REFERENCES doctors(id),
  appointment_date DATE NOT NULL,
  time_slot        TEXT NOT NULL CHECK (time_slot ~ '^[0-2][0-9]:[0-5][0-9]$'),  -- 24h "HH:MM"
  booking_type     TEXT NOT NULL CHECK (booking_type IN ('normal', 'tatkal')),
  amount           INTEGER NOT NULL CHECK (amount >= 0),
  status           TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A doctor can't have two active bookings in the same slot.
CREATE UNIQUE INDEX appointments_active_slot_idx
  ON appointments (doctor_id, appointment_date, time_slot)
  WHERE status = 'booked';

CREATE INDEX appointments_patient_idx ON appointments (patient_id, appointment_date);
