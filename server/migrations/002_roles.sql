-- Accounts are no longer only patients: doctors and admins log in too.
ALTER TABLE patients RENAME TO users;

ALTER TABLE users
  ADD COLUMN role TEXT NOT NULL DEFAULT 'patient'
  CHECK (role IN ('patient', 'doctor', 'admin'));

-- A doctor record can be linked to the account that logs in as that doctor.
ALTER TABLE doctors
  ADD COLUMN user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL;

-- Doctors close out visits after the slot has started.
ALTER TABLE appointments DROP CONSTRAINT appointments_status_check;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('booked', 'cancelled', 'completed', 'no_show'));

CREATE INDEX appointments_doctor_idx ON appointments (doctor_id, appointment_date);
