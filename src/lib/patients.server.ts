import patientsJson from "./data/patients.json";

/**
 * Compact binary export of dataset/tissue_viability.csv from the original project.
 * Values round-trip exactly to the CSV values (verified during export).
 */

function decodeBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

type Raw = {
  count: number;
  cat: Record<string, string>;
  num: Record<string, string>;
  categories: Record<string, string[]>;
  scales: Record<string, { scale: number; dtype: string }>;
};

const raw = patientsJson as unknown as Raw;

const CAT: Record<string, Uint8Array> = {};
for (const [col, b64] of Object.entries(raw.cat)) CAT[col] = decodeBytes(b64);

const NUM: Record<string, { values: Uint8Array | Uint16Array; scale: number }> = {};
for (const [col, b64] of Object.entries(raw.num)) {
  const bytes = decodeBytes(b64);
  const { scale, dtype } = raw.scales[col];
  NUM[col] = {
    values:
      dtype === "uint8"
        ? bytes
        : new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2),
    scale,
  };
}

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

export const PATIENT_COUNT = raw.count;

function cat(col: string, i: number): string {
  return raw.categories[col][CAT[col][i]];
}

function num(col: string, i: number): number {
  const { values, scale } = NUM[col];
  return Math.round((values[i] / scale) * 1000) / 1000;
}

export function formatPatientId(index: number): string {
  return "P" + String(index + 1).padStart(6, "0");
}

export function patientIndexFromId(id: string): number | null {
  const match = /^P?(\d{1,6})$/i.exec(id.trim());
  if (!match) return null;
  const index = Number(match[1]) - 1;
  if (index < 0 || index >= raw.count) return null;
  return index;
}

export function getPatientByIndex(index: number): PatientRecord {
  return {
    Patient_ID: formatPatientId(index),
    Age: num("Age", index),
    Gender: cat("Gender", index),
    BMI: num("BMI", index),
    Diabetes: cat("Diabetes", index),
    Smoking: cat("Smoking", index),
    Hypertension: cat("Hypertension", index),
    Heart_Rate: num("Heart_Rate", index),
    Blood_Pressure_Sys: num("Blood_Pressure_Sys", index),
    SpO2: num("SpO2", index),
    Tissue_Temperature: num("Tissue_Temperature", index),
    Blood_Flow: cat("Blood_Flow", index),
    Perfusion_Index: num("Perfusion_Index", index),
    Capillary_Refill_Time: num("Capillary_Refill_Time", index),
    Surgery_Duration: num("Surgery_Duration", index),
    Flap_Type: cat("Flap_Type", index),
    Risk_Level: cat("Risk_Level", index),
    Tissue_Viability: cat("Tissue_Viability", index),
  };
}

export function getPatientById(id: string): PatientRecord | null {
  const index = patientIndexFromId(id);
  return index === null ? null : getPatientByIndex(index);
}

/** Registry-level counts, computed straight from the dataset columns. */
export function registrySummary() {
  const viability = CAT["Tissue_Viability"];
  const risk = CAT["Risk_Level"];
  const viableLevel = raw.categories["Tissue_Viability"].indexOf("Yes");
  const highLevel = raw.categories["Risk_Level"].indexOf("High");

  let stable = 0;
  let highRisk = 0;
  for (let i = 0; i < raw.count; i++) {
    if (viability[i] === viableLevel) stable++;
    if (risk[i] === highLevel) highRisk++;
  }

  return {
    totalPatients: raw.count,
    stable,
    atRisk: raw.count - stable,
    highRisk,
  };
}
