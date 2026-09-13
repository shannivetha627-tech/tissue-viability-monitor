import { predictViability } from "./src/lib/model.server.js";
import { getPatientById } from "./src/lib/patients.server.js";

// Test ML with a specific patient
const p = getPatientById("P000047");
if (p) {
  const modelInput = {
    Age: p.Age,
    Gender: p.Gender,
    BMI: p.BMI,
    Diabetes: p.Diabetes,
    Smoking: p.Smoking,
    Hypertension: p.Hypertension,
    Heart_Rate: p.Heart_Rate,
    Blood_Pressure_Sys: p.Blood_Pressure_Sys,
    SpO2: p.SpO2,
    Tissue_Temperature: p.Tissue_Temperature,
    Blood_Flow: p.Blood_Flow,
    Perfusion_Index: p.Perfusion_Index,
    Capillary_Refill_Time: p.Capillary_Refill_Time,
    Surgery_Duration: p.Surgery_Duration,
    Flap_Type: p.Flap_Type,
  };
  const res = predictViability(modelInput);
  console.log("=== ML PREDICTION ===");
  console.log("Patient ID:", p.Patient_ID);
  console.log("Prediction:", res.prediction);
  console.log("Viability Probability:", res.probability);
  console.log("Confidence:", res.confidence);
  console.log("Predicted Class Probability (should match Viability if Yes, or 100-Viability if No):", res.predictedClassProbability);
}
