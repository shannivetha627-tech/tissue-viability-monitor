import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const dbUrl = process.env["DATABASE_URL"];
if (!dbUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = neon(dbUrl);

async function initSchema() {
  console.log("Initializing PostgreSQL schema on Neon...");

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      patient_id TEXT,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`;

  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      patient_id TEXT PRIMARY KEY,
      age DOUBLE PRECISION NOT NULL,
      gender TEXT NOT NULL,
      bmi DOUBLE PRECISION NOT NULL,
      diabetes TEXT NOT NULL,
      smoking TEXT NOT NULL,
      hypertension TEXT NOT NULL,
      heart_rate DOUBLE PRECISION NOT NULL,
      blood_pressure_sys DOUBLE PRECISION NOT NULL,
      sp_o2 DOUBLE PRECISION NOT NULL,
      tissue_temperature DOUBLE PRECISION NOT NULL,
      blood_flow TEXT NOT NULL,
      perfusion_index DOUBLE PRECISION NOT NULL,
      capillary_refill_time DOUBLE PRECISION NOT NULL,
      surgery_duration DOUBLE PRECISION NOT NULL,
      flap_type TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      tissue_viability TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);`;

  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(patient_id),
      prediction TEXT NOT NULL,
      viability_probability DOUBLE PRECISION NOT NULL,
      confidence TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_predictions_patient_id ON predictions(patient_id);`;

  await sql`DROP TABLE IF EXISTS prediction_history CASCADE;`;

  await sql`
    CREATE TABLE prediction_history (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(patient_id),
      prediction TEXT NOT NULL,
      viability_probability DOUBLE PRECISION NOT NULL,
      confidence TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_prediction_history_patient_id ON prediction_history(patient_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prediction_history_patient_created ON prediction_history(patient_id, created_at);`;

  console.log("Schema initialization complete.");
}

initSchema().catch((err) => {
  console.error("Failed to initialize schema:", err);
  process.exit(1);
});
