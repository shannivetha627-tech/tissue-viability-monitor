import { useSession } from "@tanstack/react-start/server";

export type AppSession = {
  role?: "doctor" | "patient";
  username?: string;
  patientId?: string;
};

const DEFAULT_PASSWORD = "tissueguard-ai-development-session-secret-key";

export function getAppSession() {
  const password = process.env["SESSION_SECRET"] || DEFAULT_PASSWORD;
  return useSession<AppSession>({
    name: "tissueguard_session",
    password,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    },
  });
}
