import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { predictViability, type PredictionResult } from "./model.server";
import {
  getPatientById,
  registrySummary,
  type PatientRecord,
} from "./patients.server";
import { getAppSession } from "./session.server";

/** Doctor accounts, mirroring add_test_users.py from the original project. */
const DOCTORS: Record<string, string> = {
  doc1: "password123",
};

/** Patient credentials follow create_patient_accounts.py: P000123 -> Patient@000123 */
function patientPasswordFor(patientId: string) {
  return "Patient@" + patientId.slice(1);
}

export type ViabilityAssessment = PredictionResult & {
  recordedViability: string;
  comparison: "Match" | "Mismatch";
};

function assess(patient: PatientRecord): ViabilityAssessment {
  const result = predictViability({
    Age: patient.Age,
    Gender: patient.Gender,
    BMI: patient.BMI,
    Diabetes: patient.Diabetes,
    Smoking: patient.Smoking,
    Hypertension: patient.Hypertension,
    Heart_Rate: patient.Heart_Rate,
    Blood_Pressure_Sys: patient.Blood_Pressure_Sys,
    SpO2: patient.SpO2,
    Tissue_Temperature: patient.Tissue_Temperature,
    Blood_Flow: patient.Blood_Flow,
    Perfusion_Index: patient.Perfusion_Index,
    Capillary_Refill_Time: patient.Capillary_Refill_Time,
    Surgery_Duration: patient.Surgery_Duration,
    Flap_Type: patient.Flap_Type,
  });

  return {
    ...result,
    recordedViability: patient.Tissue_Viability,
    comparison: result.prediction === patient.Tissue_Viability ? "Match" : "Mismatch",
  };
}

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        loginType: z.enum(["doctor", "patient"]),
        username: z.string().min(1),
        password: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = await getAppSession();
    const username = data.username.trim();

    if (data.loginType === "doctor") {
      const expected = DOCTORS[username.toLowerCase()];
      if (!expected || expected !== data.password) {
        return { ok: false as const, error: "Invalid username or password." };
      }
      await session.update({
        role: "doctor",
        username: username.toLowerCase(),
        patientId: "",
      });

      return { ok: true as const, role: "doctor" as const };
    }

    const patient = getPatientById(username);
    if (!patient || data.password !== patientPasswordFor(patient.Patient_ID)) {
      return { ok: false as const, error: "Invalid username or password." };
    }

    await session.update({
      role: "patient",
      username: patient.Patient_ID,
      patientId: patient.Patient_ID,
    });
    return { ok: true as const, role: "patient" as const };
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

export const getRegistrySummary = createServerFn({ method: "GET" }).handler(async () => {
  return registrySummary();
});

export const searchPatient = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ patientId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data }) => {
    const session = await getAppSession();
    if (session.data.role !== "doctor") {
      return { ok: false as const, error: "Only doctors can search patient records." };
    }

    const patient = getPatientById(data.patientId);
    if (!patient) {
      return { ok: false as const, error: "No patient record found for that ID." };
    }

    return { ok: true as const, patient, assessment: assess(patient) };
  });

export const getMyRecord = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getAppSession();
  if (session.data.role !== "patient" || !session.data.patientId) {
    return { ok: false as const, error: "Please sign in to view your record." };
  }

  const patient = getPatientById(session.data.patientId);
  if (!patient) {
    return { ok: false as const, error: "Your record could not be found." };
  }

  return { ok: true as const, patient, assessment: assess(patient) };
});
