import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { verifyFace, getCurrentSession } from "../lib/clinical.functions";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, UserCheck, ScanFace } from "lucide-react";

export const Route = createFileRoute("/verify-face")({
  component: VerifyFace,
});

function VerifyFace() {
  const navigate = useNavigate();
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [session, setSession] = useState<{ role: string | null; username: string | null } | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const s = await getCurrentSession();
        if (active) {
          setSession(s);
          setIsLoading(false);
          if (s.role !== "pending_doctor") {
            await navigate({ to: "/" });
          }
        }
      } catch {
        if (active) {
          setIsLoading(false);
          await navigate({ to: "/" });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const verifyMutation = useMutation({
    mutationFn: () => verifyFace(),
    onSuccess: async (res) => {
      if (res.ok) {
        toast.success("Biometric verification successful");
        await router.invalidate();
        await navigate({ to: "/doctor" });
      } else {
        toast.error(res.error || "Verification failed");
      }
    },
    onError: () => toast.error("A network error occurred"),
  });

  const handleScan = () => {
    setScanning(true);
    // Simulate biometric scan delay
    setTimeout(() => {
      setScanning(false);
      verifyMutation.mutate();
    }, 2000);
  };

  if (isLoading || session?.role !== "pending_doctor") {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-cyan-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-cyan-400 border border-cyan-500/20">
            {scanning ? (
              <ScanFace className="w-8 h-8 animate-pulse text-cyan-400" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-slate-100">
            Physician Verification Demo
          </CardTitle>
          <CardDescription className="text-slate-300 font-medium mt-2 leading-relaxed">
            Demonstration liveness verification for access to clinical patient data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative h-48 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex items-center justify-center">
            {scanning ? (
              <div className="absolute inset-0 bg-cyan-500/20 scan-line-animation" />
            ) : null}
            <UserCheck className={`w-24 h-24 ${scanning ? "text-cyan-400" : "text-slate-500"}`} />
          </div>

          <Button
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 text-base shadow-md transition-all"
            size="lg"
            onClick={handleScan}
            disabled={scanning || verifyMutation.isPending}
          >
            {scanning ? "Scanning Verification..." : "Begin Face Scan Demo"}
          </Button>

          <style>{`
            .scan-line-animation {
              background: linear-gradient(to bottom, transparent 0%, rgba(6, 182, 212, 0.4) 50%, transparent 100%);
              background-size: 100% 10%;
              animation: scan 2s linear infinite;
            }
            @keyframes scan {
              0% { background-position: 0 -100%; }
              100% { background-position: 0 200%; }
            }
          `}</style>
        </CardContent>
      </Card>
    </div>
  );
}
