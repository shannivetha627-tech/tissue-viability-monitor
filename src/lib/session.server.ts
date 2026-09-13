import { useSession } from "@tanstack/react-start/server";
import "dotenv/config";

export type AppSession = {
  role?: "doctor" | "patient" | "pending_doctor";
  username?: string;
  patientId?: string;
};

export function getAppSession() {
  const password = process.env["SESSION_SECRET"];

  if (!password) {
    throw new Error("SESSION_SECRET environment variable is required.");
  }

  return useSession<AppSession>({
    name: "tissueguard_session",
    password,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    },
  });
}
