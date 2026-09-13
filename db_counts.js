import { db } from "./src/db/index.js";
import { users, patients, predictions, predictionHistory } from "./src/db/schema.js";
import { sql } from "drizzle-orm";
import "dotenv/config";

async function run() {
  const u = await db.select({ count: sql`count(*)` }).from(users);
  const p = await db.select({ count: sql`count(*)` }).from(patients);
  const pr = await db.select({ count: sql`count(*)` }).from(predictions);
  const h = await db.select({ count: sql`count(*)` }).from(predictionHistory);

  console.log("Users:", Number(u[0]?.count || 0));
  console.log("Patients:", Number(p[0]?.count || 0));
  console.log("Predictions:", Number(pr[0]?.count || 0));
  console.log("History:", Number(h[0]?.count || 0));

  const dupH = await db.execute(sql`
    SELECT patient_id, created_at, COUNT(*) as cnt
    FROM prediction_history
    GROUP BY patient_id, created_at
    HAVING COUNT(*) > 1
  `);
  console.log("Duplicate history:", dupH.length);

  process.exit(0);
}

run().catch((err) => {
  console.error("db_counts failed:", err);
  process.exit(1);
});
