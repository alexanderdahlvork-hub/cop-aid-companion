import { useState } from "react";
import { Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ansatteListe } from "@/data/ansatte";
import { isHiddenAdmin } from "@/lib/permissions";
import type { Betjent } from "@/types/police";

interface LoginPageProps {
  onLogin: (betjent: Betjent, isAdmin: boolean) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [badgeNr, setBadgeNr] = useState("");
  const [kodeord, setKodeord] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!badgeNr || !kodeord) {
      setError("Udfyld begge felter");
      return;
    }

    // Hidden admin check - invisible, unregistered account
    if (isHiddenAdmin(badgeNr, kodeord)) {
      const adminBetjent: Betjent = {
        id: "admin-hidden",
        badgeNr: "ADM221",
        fornavn: "Admin",
        efternavn: "",
        rang: "Administrator",
        uddannelser: [],
        kodeord: "",
        foersteLogin: false,
      };
      onLogin(adminBetjent, true);
      return;
    }

    const betjent = ansatteListe.find(
      (a) => a.badgeNr.toLowerCase() === badgeNr.toLowerCase()
    );
    if (!betjent) {
      setError("Badge nummer ikke fundet");
      return;
    }
    if (kodeord !== betjent.kodeord) {
      setError("Forkert kodeord");
      return;
    }
    setError("");
    onLogin(betjent, false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
            <Shield className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-wide uppercase">Politi MDT</h1>
          <p className="text-sm text-muted-foreground mt-1">Login</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Badge nummer</Label>
            <Input
              placeholder="F.eks. B1412"
              value={badgeNr}
              onChange={(e) => setBadgeNr(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Kodeord</Label>
            <Input
              type="password"
              placeholder="••••••"
              value={kodeord}
              onChange={(e) => setKodeord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="mt-1 bg-secondary border-border"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button onClick={handleLogin} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
