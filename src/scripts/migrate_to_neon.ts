// @ts-nocheck — migration utility; libsql Row uses index signatures
import { createClient as createSqliteClient } from "@libsql/client";
import { db } from "../db";
import { users, patients, predictions, predictionHistory } from "../db/schema";
import { eq, sql } from "drizzle-orm";
import "dotenv/config";

const sqliteClient = createSqliteClient({ url: "file:sqlite.db" });

async function migrateData() {
  console.log("=== STARTING MIGRATION FROM SQLITE TO NEON POSTGRESQL ===");

  // 1. Get exact counts from SQLite
  const sqliteUsersRes = await sqliteClient.execute("SELECT count(*) as c FROM users");
  const sqlitePatientsRes = await sqliteClient.execute("SELECT count(*) as c FROM patients");
  const sqlitePredsRes = await sqliteClient.execute("SELECT count(*) as c FROM predictions");
  const sqliteHistRes = await sqliteClient.execute("SELECT count(*) as c FROM prediction_history");

  const sqliteUsersCount = Number(sqliteUsersRes.rows[0]?.c || 0);
  const sqlitePatientsCount = Number(sqlitePatientsRes.rows[0]?.c || 0);
  const sqlitePredsCount = Number(sqlitePredsRes.rows[0]?.c || 0);
  const sqliteHistCount = Number(sqliteHistRes.rows[0]?.c || 0);

  console.log("\n--- Source SQLite Row Counts ---");
  console.log(`Users:             ${sqliteUsersCount}`);
  console.log(`Patients:          ${sqlitePatientsCount}`);
  console.log(`Predictions:       ${sqlitePredsCount}`);
  console.log(`PredictionHistory: ${sqliteHistCount}`);

  // 2. Fetch all data from SQLite
  console.log("\nFetching data from sqlite.db...");

  const rawPatients = await sqliteClient.execute("SELECT * FROM patients");
  const rawUsers = await sqliteClient.execute("SELECT * FROM users");
  const rawPreds = await sqliteClient.execute("SELECT * FROM predictions");
  const rawHist = await sqliteClient.execute("SELECT * FROM prediction_history");

  // 3. Migrate Patients in batches
  console.log(`\nMigrating ${rawPatients.rows.length} patients to Neon...`);
  const batchSize = 1000;

  for (let i = 0; i < rawPatients.rows.length; i += batchSize) {
    const batchRows = rawPatients.rows.slice(i, i + batchSize);
    const batchValues = batchRows.map((r) => ({
      patientId: String(r.patient_id),
      age: Number(r.age),
      gender: String(r.gender),
      bmi: Number(r.bmi),
      diabetes: String(r.diabetes),
      smoking: String(r.smoking),
      hypertension: String(r.hypertension),
      heartRate: Number(r.heart_rate),
      bloodPressureSys: Number(r.blood_pressure_sys),
      spO2: Number(r.sp_o2),
      tissueTemperature: Number(r.tissue_temperature),
      bloodFlow: String(r.blood_flow),
      perfusionIndex: Number(r.perfusion_index),
      capillaryRefillTime: Number(r.capillary_refill_time),
      surgeryDuration: Number(r.surgery_duration),
      flapType: String(r.flap_type),
      riskLevel: String(r.risk_level),
      tissueViability: String(r.tissue_viability),
      createdAt: new Date(Number(r.created_at)),
      updatedAt: new Date(Number(r.updated_at)),
    }));

    await db.insert(patients).values(batchValues).onConflictDoNothing();
    console.log(`Patients batch ${i + batchValues.length}/${rawPatients.rows.length} done.`);
  }

  // 4. Migrate Users in batches
  console.log(`\nMigrating ${rawUsers.rows.length} users to Neon...`);
  for (let i = 0; i < rawUsers.rows.length; i += batchSize) {
    const batchRows = rawUsers.rows.slice(i, i + batchSize);
    const batchValues = batchRows.map((r) => ({
      id: String(r.id),
      username: String(r.username),
      passwordHash: String(r.password_hash),
      role: String(r.role) as "doctor" | "patient",
      patientId: r.patient_id ? String(r.patient_id) : null,
      createdAt: new Date(Number(r.created_at)),
      updatedAt: new Date(Number(r.updated_at)),
    }));

    await db.insert(users).values(batchValues).onConflictDoNothing();
    console.log(`Users batch ${i + batchValues.length}/${rawUsers.rows.length} done.`);
  }

  // 5. Migrate Predictions in batches
  console.log(`\nMigrating ${rawPreds.rows.length} predictions to Neon...`);
  for (let i = 0; i < rawPreds.rows.length; i += batchSize) {
    const batchRows = rawPreds.rows.slice(i, i + batchSize);
    const batchValues = batchRows.map((r) => ({
      id: String(r.id),
      patientId: String(r.patient_id),
      prediction: String(r.prediction) as "Yes" | "No",
      viabilityProbability: Number(r.viability_probability),
      confidence: String(r.confidence) as "High" | "Moderate" | "Low",
      updatedAt: new Date(Number(r.updated_at)),
    }));

    await db.insert(predictions).values(batchValues).onConflictDoNothing();
    console.log(`Predictions batch ${i + batchValues.length}/${rawPreds.rows.length} done.`);
  }

  // 6. Migrate PredictionHistory in batches
  console.log(`\nMigrating ${rawHist.rows.length} prediction history records to Neon...`);
  for (let i = 0; i < rawHist.rows.length; i += batchSize) {
    const batchRows = rawHist.rows.slice(i, i + batchSize);
    const batchValues = batchRows.map((r) => ({
      id: String(r.id),
      patientId: String(r.patient_id),
      prediction: String(r.prediction) as "Yes" | "No",
      viabilityProbability: Number(r.viability_probability),
      confidence: String(r.confidence) as "High" | "Moderate" | "Low",
      createdAt: new Date(Number(r.created_at)),
    }));

    await db.insert(predictionHistory).values(batchValues).onConflictDoNothing();
    console.log(`History batch ${i + batchValues.length}/${rawHist.rows.length} done.`);
  }

  // 7. Verify Neon Counts
  console.log("\n=== VERIFYING DESTINATION NEON POSTGRESQL COUNTS ===");

  const neonUsersRes = await db.select({ count: sql<number>`count(*)` }).from(users);
  const neonPatientsRes = await db.select({ count: sql<number>`count(*)` }).from(patients);
  const neonPredsRes = await db.select({ count: sql<number>`count(*)` }).from(predictions);
  const neonHistRes = await db.select({ count: sql<number>`count(*)` }).from(predictionHistory);

  const neonUsersCount = Number(neonUsersRes[0]?.count || 0);
  const neonPatientsCount = Number(neonPatientsRes[0]?.count || 0);
  const neonPredsCount = Number(neonPredsRes[0]?.count || 0);
  const neonHistCount = Number(neonHistRes[0]?.count || 0);

  console.log(`Users:             SQLite=${sqliteUsersCount} | Neon=${neonUsersCount} | Diff=${neonUsersCount - sqliteUsersCount}`);
  console.log(`Patients:          SQLite=${sqlitePatientsCount} | Neon=${neonPatientsCount} | Diff=${neonPatientsCount - sqlitePatientsCount}`);
  console.log(`Predictions:       SQLite=${sqlitePredsCount} | Neon=${neonPredsCount} | Diff=${neonPredsCount - sqlitePredsCount}`);
  console.log(`PredictionHistory: SQLite=${sqliteHistCount} | Neon=${neonHistCount} | Diff=${neonHistCount - sqliteHistCount}`);

  // Integrity Checks
  const orphanPreds = await db.execute(sql`
    SELECT COUNT(*) as c FROM predictions p LEFT JOIN patients pt ON p.patient_id = pt.patient_id WHERE pt.patient_id IS NULL
  `);
  const orphanHist = await db.execute(sql`
    SELECT COUNT(*) as c FROM prediction_history ph LEFT JOIN patients pt ON ph.patient_id = pt.patient_id WHERE pt.patient_id IS NULL
  `);

  console.log("\n--- Integrity Check Results ---");
  console.log(`Orphan Predictions: ${Number((orphanPreds as unknown as { rows: Record<string, unknown>[] }).rows?.[0]?.["c"] || 0)}`);
  console.log(`Orphan History:     ${Number((orphanHist as unknown as { rows: Record<string, unknown>[] }).rows?.[0]?.["c"] || 0)}`);

  const diffSum =
    Math.abs(neonUsersCount - sqliteUsersCount) +
    Math.abs(neonPatientsCount - sqlitePatientsCount) +
    Math.abs(neonPredsCount - sqlitePredsCount) +
    Math.abs(neonHistCount - sqliteHistCount);

  if (diffSum === 0) {
    console.log("\n✅ SUCCESS: Migration completed with EXACT ZERO DIFFERENCE!");
  } else {
    console.error("\n❌ MISMATCH DETECTED: Source and Destination counts do not match!");
    process.exit(1);
  }
}

migrateData().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
