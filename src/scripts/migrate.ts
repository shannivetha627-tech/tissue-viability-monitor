import { db } from "../db";
import { patients, users, predictions } from "../db/schema";
import { getPatientByIndex, PATIENT_COUNT } from "../lib/patients.server";
import { predictViability } from "../lib/model.server";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function migrate() {
  console.log("Starting migration...");

  const doctorPassword = await bcrypt.hash("password123", 10);

  console.log("Migrating Doctor user...");
  await db
    .insert(users)
    .values({
      id: "doc1",
      username: "doc1",
      passwordHash: doctorPassword,
      role: "doctor",
      patientId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing();

  console.log(`Migrating ${PATIENT_COUNT} patients...`);

  let newPatientsCount = 0;
  let newUsersCount = 0;
  let newPredictionsCount = 0;

  const batchSize = 1000;

  for (let i = 0; i < PATIENT_COUNT; i += batchSize) {
    const end = Math.min(i + batchSize, PATIENT_COUNT);
    const patientsBatch = [];
    const usersBatch = [];
    const predictionsBatch = [];

    for (let j = i; j < end; j++) {
      const p = getPatientByIndex(j);

      patientsBatch.push({
        patientId: p.Patient_ID,
        age: p.Age,
        gender: p.Gender,
        bmi: p.BMI,
        diabetes: p.Diabetes,
        smoking: p.Smoking,
        hypertension: p.Hypertension,
        heartRate: p.Heart_Rate,
        bloodPressureSys: p.Blood_Pressure_Sys,
        spO2: p.SpO2,
        tissueTemperature: p.Tissue_Temperature,
        bloodFlow: p.Blood_Flow,
        perfusionIndex: p.Perfusion_Index,
        capillaryRefillTime: p.Capillary_Refill_Time,
        surgeryDuration: p.Surgery_Duration,
        flapType: p.Flap_Type,
        riskLevel: p.Risk_Level,
        tissueViability: p.Tissue_Viability,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const pass = "Patient@" + p.Patient_ID.slice(1);
      const passHash = bcrypt.hashSync(pass, 4);

      usersBatch.push({
        id: `usr_${p.Patient_ID}`,
        username: p.Patient_ID,
        passwordHash: passHash,
        role: "patient" as const,
        patientId: p.Patient_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = predictViability(p);
      predictionsBatch.push({
        id: `pred_${p.Patient_ID}`,
        patientId: p.Patient_ID,
        prediction: res.prediction,
        viabilityProbability: res.probability,
        confidence: res.confidence,
        updatedAt: new Date(),
      });
    }

    try {
      await db.insert(patients).values(patientsBatch).onConflictDoNothing();
      await db.insert(users).values(usersBatch).onConflictDoNothing();
      await db.insert(predictions).values(predictionsBatch).onConflictDoNothing();

      newPatientsCount += patientsBatch.length;
      newUsersCount += usersBatch.length;
      newPredictionsCount += predictionsBatch.length;

      console.log(`Processed ${end}/${PATIENT_COUNT} records...`);
    } catch (err) {
      console.error(`Error in batch ${i}-${end}:`, err);
    }
  }

  console.log("Migration Complete.");
  console.log(`Processed Patients: ${newPatientsCount}`);
  console.log(`Processed Users: ${newUsersCount}`);
  console.log(`Processed Predictions: ${newPredictionsCount}`);
}

migrate().catch(console.error);
