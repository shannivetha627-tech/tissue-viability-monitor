import modelJson from "./data/model.json";

/**
 * Portable export of the trained scikit-learn pipeline
 * (model/tissue_viability_model.pkl in the original Flask project):
 *
 *   ColumnTransformer(OneHotEncoder(handle_unknown="ignore") on the 6 categorical
 *   columns, remainder="passthrough")  ->  RandomForestClassifier(n_estimators=200,
 *   class_weight="balanced", random_state=42)
 *
 * The tree structure below was exported node-for-node from that .pkl, so the
 * predictions here are identical to the Python model. Risk_Level is NOT a feature.
 */

function decode(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

const m = modelJson as unknown as {
  classes: string[];
  categoricalCols: string[];
  categories: string[][];
  numericCols: string[];
  nTrees: number;
  offsets: number[];
  feature: string;
  threshold: string;
  left: string;
  right: string;
  prob: string;
};

const FEATURE = new Int8Array(decode(m.feature));
const THRESHOLD = new Float32Array(decode(m.threshold));
const LEFT = new Int32Array(decode(m.left));
const RIGHT = new Int32Array(decode(m.right));
const PROB = new Float32Array(decode(m.prob));
const OFFSETS = m.offsets;

export const CATEGORICAL_COLS = m.categoricalCols;
export const NUMERIC_COLS = m.numericCols;

/** The exact 15 model input features (Risk_Level is deliberately excluded). */
export const MODEL_FEATURES = [
  "Age",
  "Gender",
  "BMI",
  "Diabetes",
  "Smoking",
  "Hypertension",
  "Heart_Rate",
  "Blood_Pressure_Sys",
  "SpO2",
  "Tissue_Temperature",
  "Blood_Flow",
  "Perfusion_Index",
  "Capillary_Refill_Time",
  "Surgery_Duration",
  "Flap_Type",
] as const;

export type ModelInput = Record<string, string | number>;

/** Reproduces the ColumnTransformer: one-hot block first, then passthrough numerics. */
function buildVector(input: ModelInput): Float64Array {
  const oneHotLength = m.categories.reduce((sum, c) => sum + c.length, 0);
  const x = new Float64Array(oneHotLength + m.numericCols.length);

  let offset = 0;
  m.categoricalCols.forEach((col, i) => {
    const levels = m.categories[i]!;
    const idx = levels.indexOf(String(input[col]));
    // handle_unknown="ignore" -> unknown categories stay all-zero
    if (idx >= 0) x[offset + idx] = 1;
    offset += levels.length;
  });

  m.numericCols.forEach((col, i) => {
    x[oneHotLength + i] = Number(input[col]);
  });

  return x;
}

export type PredictionResult = {
  prediction: "Yes" | "No";
  /** Probability of the "Yes" (viable) class, in percent. */
  probability: number;
  /** Certainty of the predicted class, in percent. */
  predictedClassProbability: number;
  confidence: "High" | "Moderate" | "Low";
};

export function predictViability(input: ModelInput): PredictionResult {
  const x = buildVector(input);

  let total = 0;
  for (let t = 0; t < m.nTrees; t++) {
    let node = OFFSETS[t]!;
    while (FEATURE[node]! !== -1) {
      node = x[FEATURE[node]!]! <= THRESHOLD[node]! ? LEFT[node]! : RIGHT[node]!;
    }
    total += PROB[node]!;
  }

  const pYes = total / m.nTrees;
  const prediction: "Yes" | "No" = pYes >= 0.5 ? "Yes" : "No";
  const predictedClassProbability = (prediction === "Yes" ? pYes : 1 - pYes) * 100;

  const confidence =
    predictedClassProbability >= 80 ? "High" : predictedClassProbability >= 60 ? "Moderate" : "Low";

  return {
    prediction,
    probability: Math.round(pYes * 100 * 100) / 100,
    predictedClassProbability: Math.round(predictedClassProbability * 100) / 100,
    confidence,
  };
}
