/** Validation results carried over from the original project (held-out split). */
export const VALIDATION = {
  accuracy: "99.90%",
  rocAuc: "1.0000",
  records: "10,000",
  correct: "9,990 / 10,000",
  confusionMatrix: [
    [1208, 0],
    [10, 8782],
  ],
};

/** Real values from model/feature_importance.csv — not estimates. */
export const FEATURE_IMPORTANCE: { name: string; value: number }[] = [
  { name: "Blood Flow (Low)", value: 0.2571 },
  { name: "SpO₂", value: 0.2548 },
  { name: "Capillary Refill Time", value: 0.191 },
  { name: "Blood Flow (Moderate)", value: 0.0754 },
  { name: "Blood Flow (Normal)", value: 0.0408 },
  { name: "Surgery Duration", value: 0.0304 },
  { name: "Diabetes", value: 0.0289 },
  { name: "Perfusion Index", value: 0.0288 },
  { name: "Smoking", value: 0.0249 },
  { name: "Tissue Temperature", value: 0.0161 },
];
