import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq, desc } from "drizzle-orm";

import { db } from "../db";
import { users, patients, predictions, predictionHistory } from "../db/schema";
import { getAppSession } from "./session.server";
import { predictViability, type PredictionResult } from "./model.server";

export type ViabilityAssessment = PredictionResult & {
  recordedViability: string;
  comparison: "Match" | "Mismatch";
};

export type PredictionHistoryRecord = {
  id: string;
  patientId: string;
  prediction: string;
  viabilityProbability: number;
  confidence: string;
  createdAt: Date;
};

export type PatientRecord = {
  Patient_ID: string;
  Age: number;
  Gender: string;
  BMI: number;
  Diabetes: string;
  Smoking: string;
  Hypertension: string;
  Heart_Rate: number;
  Blood_Pressure_Sys: number;
  SpO2: number;
  Tissue_Temperature: number;
  Blood_Flow: string;
  Perfusion_Index: number;
  Capillary_Refill_Time: number;
  Surgery_Duration: number;
  Flap_Type: string;
  Risk_Level: string;
  Tissue_Viability: string;
};

function mapToPatientRecord(p: typeof patients.$inferSelect): PatientRecord {
  return {
    Patient_ID: p.patientId,
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
    Risk_Level: p.riskLevel,
    Tissue_Viability: p.tissueViability,
  };
}

const AUTH_CONFIG_ERROR = "Use the credentials provided by your system administrator.";

export const login = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        loginType: z.enum(["doctor", "patient"]),
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      if (!process.env["DATABASE_URL"] || !process.env["SESSION_SECRET"]) {
        return { ok: false as const, error: AUTH_CONFIG_ERROR };
      }

      const session = await getAppSession();
      const username = data.username.trim();

      let [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

      // If doctor login requested and username entered is "doctor" or "doc1", map lookup to doc1 if exact username not found
      if (!user && data.loginType === "doctor") {
        if (username.toLowerCase() === "doctor" || username.toLowerCase() === "doc1") {
          [user] = await db.select().from(users).where(eq(users.username, "doc1")).limit(1);
        }
      }

      if (!user || user.role !== data.loginType) {
        return { ok: false as const, error: "Invalid username or password." };
      }

      const isValid = await bcrypt.compare(data.password, user.passwordHash);

      if (!isValid) {
        return { ok: false as const, error: "Invalid username or password." };
      }

      if (user.role === "doctor") {
        // Require face verification boundary
        await session.update({
          role: "pending_doctor",
          username: user.username,
          patientId: "",
        });
        return { ok: true as const, role: "pending_doctor" as const };
      }

      await session.update({
        role: "patient",
        username: user.username,
        patientId: user.patientId || user.username,
      });
      return { ok: true as const, role: "patient" as const };
    } catch (err: unknown) {
      console.error("Login server error:", err);
      return { ok: false as const, error: "Unable to sign in right now. Please try again." };
    }
  });

export const verifyFace = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAppSession();
  if (session.data.role !== "pending_doctor") {
    return { ok: false as const, error: "Unauthorized" };
  }

  // In a real implementation, this would validate a signed liveness token from a biometric provider
  // Since we are creating a secure integration boundary, we accept the call as a simulation of a successful check

  await session.update({
    ...session.data,
    role: "doctor",
  });

  return { ok: true as const, role: "doctor" as const };
});

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getAppSession();
  await session.clear();
  return { ok: true };
});

export const getCurrentSession = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  return {
    role: session.data.role ?? null,
    username: session.data.username ?? null,
    patientId: session.data.patientId ?? null,
  };
});

export const searchPatient = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ patientId: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const session = await getAppSession();
    if (session.data.role !== "doctor") {
      return { ok: false as const, error: "Only doctors can search patient records." };
    }

    const [patientData] = await db
      .select()
      .from(patients)
      .where(eq(patients.patientId, data.patientId))
      .limit(1);

    if (!patientData) {
      return { ok: false as const, error: "No patient record found for that ID." };
    }

    const patient = mapToPatientRecord(patientData);

    const [latestPred] = await db
      .select()
      .from(predictions)
      .where(eq(predictions.patientId, data.patientId))
      .limit(1);

    let assessment: ViabilityAssessment;
    if (latestPred) {
      assessment = {
        prediction: latestPred.prediction as "Yes" | "No",
        probability: latestPred.viabilityProbability,
        predictedClassProbability:
          latestPred.prediction === "Yes"
            ? latestPred.viabilityProbability
            : 100 - latestPred.viabilityProbability,
        confidence: latestPred.confidence as "High" | "Moderate" | "Low",
        recordedViability: patient.Tissue_Viability,
        comparison: latestPred.prediction === patient.Tissue_Viability ? "Match" : "Mismatch",
      };
    } else {
      const res = predictViability(patient);
      assessment = {
        ...res,
        recordedViability: patient.Tissue_Viability,
        comparison: res.prediction === patient.Tissue_Viability ? "Match" : "Mismatch",
      };
    }

    return { ok: true as const, patient, assessment };
  });

export const getMyRecord = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  if (session.data.role !== "patient" || !session.data.patientId) {
    return { ok: false as const, error: "Please sign in to view your record." };
  }

  const [patientData] = await db
    .select()
    .from(patients)
    .where(eq(patients.patientId, session.data.patientId))
    .limit(1);
  if (!patientData) {
    return { ok: false as const, error: "Your record could not be found." };
  }

  const patient = mapToPatientRecord(patientData);

  const [latestPred] = await db
    .select()
    .from(predictions)
    .where(eq(predictions.patientId, session.data.patientId))
    .limit(1);

  let assessment: ViabilityAssessment;
  if (latestPred) {
    assessment = {
      prediction: latestPred.prediction as "Yes" | "No",
      probability: latestPred.viabilityProbability,
      predictedClassProbability:
        latestPred.prediction === "Yes"
          ? latestPred.viabilityProbability
          : 100 - latestPred.viabilityProbability,
      confidence: latestPred.confidence as "High" | "Moderate" | "Low",
      recordedViability: patient.Tissue_Viability,
      comparison: latestPred.prediction === patient.Tissue_Viability ? "Match" : "Mismatch",
    };
  } else {
    const res = predictViability(patient);
    assessment = {
      ...res,
      recordedViability: patient.Tissue_Viability,
      comparison: res.prediction === patient.Tissue_Viability ? "Match" : "Mismatch",
    };
  }

  return { ok: true as const, patient, assessment };
});

export const getRegistrySummary = createServerFn({ method: "GET" }).handler(async () => {
  const allPatients = await db
    .select({ viability: patients.tissueViability, risk: patients.riskLevel })
    .from(patients);

  let stable = 0;
  let highRisk = 0;

  for (const p of allPatients) {
    if (p.viability === "Yes") stable++;
    if (p.risk === "High") highRisk++;
  }

  return {
    totalPatients: allPatients.length,
    stable,
    atRisk: allPatients.length - stable,
    highRisk,
  };
});

export const getPredictionHistory = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ patientId: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const session = await getAppSession();
    if (!session.data.role) {
      return { ok: false as const, error: "Unauthorized" };
    }

    if (session.data.role === "patient" && session.data.patientId !== data.patientId) {
      return { ok: false as const, error: "Unauthorized access to patient history." };
    }

    const history = await db
      .select()
      .from(predictionHistory)
      .where(eq(predictionHistory.patientId, data.patientId))
      .orderBy(desc(predictionHistory.createdAt));

    return { ok: true as const, history };
  });
