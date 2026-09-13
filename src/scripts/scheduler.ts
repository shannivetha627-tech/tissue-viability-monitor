import { db } from "../db";
import { patients, predictions, predictionHistory } from "../db/schema";
import { predictViability } from "../lib/model.server";
import { sql } from "drizzle-orm";
import "dotenv/config";

// 120 seconds cycle
const INTERVAL_MS = 120 * 1000;

let isRunning = false;

export async function runPredictionCycle() {
  if (isRunning) {
    console.log("[Scheduler] Overlapping cycle prevented. Previous cycle still running.");
    return { successful: 0, failed: 0, historyCreated: 0, duration: 0, skipped: true };
  }

  isRunning = true;
  const startTime = Date.now();
  console.log(`[Scheduler] Cycle started at ${new Date().toISOString()}`);

  let successful = 0;
  let failed = 0;
  let historyCreated = 0;

  try {
    // 1. Load all eligible patients
    const allPatients = await db.select().from(patients);
    console.log(`[Scheduler] Loaded ${allPatients.length} patients.`);

    const batchSize = 1000;

    // Process in batches
    for (let i = 0; i < allPatients.length; i += batchSize) {
      const batch = allPatients.slice(i, i + batchSize);

      const newPredictions: (typeof predictions.$inferInsert)[] = [];
      const newHistory: (typeof predictionHistory.$inferInsert)[] = [];

      for (const p of batch) {
        try {
          // Convert DB record to ModelInput format
          const modelInput = {
            Age: p.age,
            Gender: p.gender,
            BMI: p.bmi,
            Diabetes: p.diabetes,
            Smoking: p.smoking,
            Hypertension: p.hypertension,
            Heart_Rate: p.heartRate,
            Blood_Pressure_Sys: p.bloodPressureSys,
            SpO2: p.spO2,
            Tissue_Temperature: p.tissueTemperature,
            Blood_Flow: p.bloodFlow,
            Perfusion_Index: p.perfusionIndex,
            Capillary_Refill_Time: p.capillaryRefillTime,
            Surgery_Duration: p.surgeryDuration,
            Flap_Type: p.flapType,
          };

          const res = predictViability(modelInput);

          const predRecord = {
            id: `pred_${p.patientId}`,
            patientId: p.patientId,
            prediction: res.prediction,
            viabilityProbability: res.probability,
            confidence: res.confidence,
            updatedAt: new Date(),
          };

          const historyRecord = {
            id: `hist_${p.patientId}_${Date.now()}`,
            patientId: p.patientId,
            prediction: res.prediction,
            viabilityProbability: res.probability,
            confidence: res.confidence,
            createdAt: new Date(),
          };

          newPredictions.push(predRecord);
          newHistory.push(historyRecord);
          successful++;
        } catch (e) {
          failed++;
          console.error(`Failed to predict for patient ${p.patientId}:`, e);
        }
      }

      if (newPredictions.length > 0) {
        await db
          .insert(predictions)
          .values(newPredictions)
          .onConflictDoUpdate({
            target: predictions.id,
            set: {
              prediction: sql`excluded.prediction`,
              viabilityProbability: sql`excluded.viability_probability`,
              confidence: sql`excluded.confidence`,
              updatedAt: sql`excluded.updated_at`,
            },
          });

        await db.insert(predictionHistory).values(newHistory);
        historyCreated += newHistory.length;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Scheduler] Cycle completed in ${duration}ms.`);
    console.log(`[Scheduler] Metrics: ${successful} successful, ${failed} failed, ${historyCreated} history created.`);

    if (duration > INTERVAL_MS) {
      console.warn(
        `[Scheduler] WARNING: Cycle took ${duration}ms, which is longer than the ${INTERVAL_MS}ms target interval!`,
      );
    }

    return { successful, failed, historyCreated, duration, skipped: false };
  } catch (error) {
    console.error(`[Scheduler] Critical failure during cycle:`, error);
    return { successful, failed, historyCreated, duration: Date.now() - startTime, skipped: false, error };
  } finally {
    isRunning = false;
  }
}

function startScheduler() {
  if (process.env["VERCEL"] === "1") {
    console.log(
      "[Scheduler] Detected Vercel serverless environment. Persistent scheduler disabled.",
    );
    return;
  }

  console.log(`[Scheduler] Starting persistent worker. Interval: ${INTERVAL_MS / 1000}s`);
  runPredictionCycle();
  setInterval(runPredictionCycle, INTERVAL_MS);
}

if (process.argv[1]?.includes("scheduler.ts")) {
  startScheduler();
}
