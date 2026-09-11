import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { logout } from "@/lib/clinical.functions";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
  head: () => ({
    meta: [
      { title: "Signing out | TissueGuard AI" },
      { name: "description", content: "Ending your secure TissueGuard AI session." },
      { property: "og:title", content: "Signing out | TissueGuard AI" },
      {
        property: "og:description",
        content: "Ending your secure TissueGuard AI session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function LogoutPage() {
  const router = useRouter();
  const doLogout = useServerFn(logout);

  useEffect(() => {
    void (async () => {
      await doLogout({});
      await router.navigate({ to: "/login" });
    })();
  }, [doLogout, router]);

  return (
    <main className="login-wrap">
      <header>
        <p className="eyebrow">TissueGuard AI</p>
        <h1>Signing out…</h1>
      </header>
    </main>
  );
}
