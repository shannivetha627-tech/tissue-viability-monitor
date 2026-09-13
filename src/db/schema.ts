import { pgTable, text, doublePrecision, timestamp, index } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").$type<"doctor" | "patient">().notNull(),
    patientId: text("patient_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("idx_users_username").on(table.username),
  ]
);

export const patients = pgTable(
  "patients",
  {
    patientId: text("patient_id").primaryKey(),
    age: doublePrecision("age").notNull(),
    gender: text("gender").notNull(),
    bmi: doublePrecision("bmi").notNull(),
    diabetes: text("diabetes").notNull(),
    smoking: text("smoking").notNull(),
    hypertension: text("hypertension").notNull(),
    heartRate: doublePrecision("heart_rate").notNull(),
    bloodPressureSys: doublePrecision("blood_pressure_sys").notNull(),
    spO2: doublePrecision("sp_o2").notNull(),
    tissueTemperature: doublePrecision("tissue_temperature").notNull(),
    bloodFlow: text("blood_flow").notNull(),
    perfusionIndex: doublePrecision("perfusion_index").notNull(),
    capillaryRefillTime: doublePrecision("capillary_refill_time").notNull(),
    surgeryDuration: doublePrecision("surgery_duration").notNull(),
    flapType: text("flap_type").notNull(),
    riskLevel: text("risk_level").notNull(),
    tissueViability: text("tissue_viability").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("idx_patients_patient_id").on(table.patientId),
  ]
);

export const predictions = pgTable(
  "predictions",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.patientId),
    prediction: text("prediction").$type<"Yes" | "No">().notNull(),
    viabilityProbability: doublePrecision("viability_probability").notNull(),
    confidence: text("confidence").$type<"High" | "Moderate" | "Low">().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("idx_predictions_patient_id").on(table.patientId),
  ]
);

export const predictionHistory = pgTable(
  "prediction_history",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => patients.patientId),
    prediction: text("prediction").$type<"Yes" | "No">().notNull(),
    viabilityProbability: doublePrecision("viability_probability").notNull(),
    confidence: text("confidence").$type<"High" | "Moderate" | "Low">().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("idx_prediction_history_patient_id").on(table.patientId),
    index("idx_prediction_history_patient_created").on(table.patientId, table.createdAt),
  ]
);
