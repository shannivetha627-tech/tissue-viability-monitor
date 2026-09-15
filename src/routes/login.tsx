import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Disclaimer } from "@/components/Disclaimer";
import { TissueAnimation } from "@/components/TissueAnimation";
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
      {
        property: "og:title",
        content: "Secure Login | TissueGuard AI",
      },
      {
        property: "og:description",
        content: "Role-based access to the TissueGuard AI clinical workspace.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary",
      },
    ],
  }),
});

function LoginPage() {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const doLogin = useServerFn(login);

  const [loginType, setLoginType] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.add("login-page");

    return () => {
      document.body.classList.remove("login-page");
    };
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
        data: {
          loginType,
          username,
          password,
        },
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["session"],
      });

      await router.invalidate();

      /*
       * Doctor accounts are returned as "pending_doctor"
       * and must complete face verification before entering
       * the doctor dashboard.
       *
       * Patient accounts go directly to the patient dashboard.
       */
      if (result.role === "pending_doctor") {
        await router.navigate({
          to: "/verify-face",
        });
      } else {
        await router.navigate({
          to: "/patient",
        });
      }
    } catch {
      setError("Unable to sign in right now. Please try again.");
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

      <div style={{ marginBottom: "20px" }}>
        <TissueAnimation
          mode="auto"
          caption="Live tissue viability monitoring signal"
        />
      </div>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <section className="login-card">
        <h2>Sign in</h2>

        <form onSubmit={onSubmit}>
          <label htmlFor="login-type">ACCESS TYPE</label>

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

          <label htmlFor="username">USERNAME</label>

          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Enter username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">PASSWORD</label>

          <div className="password-wrap relative w-full">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter password"
              required
              className="pr-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              className="password-toggle absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          <button type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Continue securely"}
          </button>
        </form>

        <div className="login-hint">
          <p>
            Enter the username and password associated with your account.
          </p>

          <p style={{ marginTop: "4px" }}>
            Patient accounts use the assigned Patient ID as the username.
          </p>
        </div>

        <Link className="back" to="/">
          Back to TissueGuard AI
        </Link>

        <Disclaimer />
      </section>
    </main>
  );
}