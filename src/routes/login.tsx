import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { Disclaimer } from "@/components/Disclaimer";
import { login } from "@/lib/clinical.functions";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Secure Login | TissueGuard AI" },
      {
        name: "description",
        content:
          "Sign in to the TissueGuard AI clinical workspace as a doctor or patient to review tissue viability assessments.",
      },
      { property: "og:title", content: "Secure Login | TissueGuard AI" },
      {
        property: "og:description",
        content: "Role-based access to the TissueGuard AI clinical workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function LoginPage() {
  const router = useRouter();
  const doLogin = useServerFn(login);
  const [loginType, setLoginType] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loginType !== "doctor" && loginType !== "patient") {
      setError("Please select an access type.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await doLogin({
        data: { loginType, username, password },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await router.navigate({ to: result.role === "doctor" ? "/doctor" : "/patient" });
    } catch {
      setError("Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-wrap">
      <header>
        <p className="eyebrow">TissueGuard AI / secure access</p>
        <h1>Welcome back.</h1>
        <p>Choose the workspace associated with your account.</p>
      </header>
      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}
      <section className="login-card">
        <h2>Sign in</h2>
        <form onSubmit={onSubmit}>
          <label htmlFor="login-type">Access type</label>
          <select
            id="login-type"
            name="login_type"
            required
            value={loginType}
            onChange={(e) => setLoginType(e.target.value)}
          >
            <option value="">Select access type</option>
            <option value="doctor">Doctor</option>
            <option value="patient">Patient</option>
          </select>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Continue securely"}
          </button>
        </form>
        <p className="login-hint">
          Doctor account: <strong>doc1 / password123</strong>. Patient accounts use the
          patient ID as the username (for example <strong>P000047</strong>) with the
          password <strong>Patient@000047</strong>.
        </p>
        <Link className="back" to="/">
          Back to TissueGuard AI
        </Link>
        <Disclaimer />
      </section>
    </main>
  );
}
