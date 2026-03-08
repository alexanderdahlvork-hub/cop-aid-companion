import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dagNavn = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  const maanedNavn = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];

  const datoStr = `${dagNavn[now.getDay()]} ${now.getDate()}. ${maanedNavn[now.getMonth()]}`;
  const tidStr = `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;

  const handleLogin = () => {
    if (!badgeNr || !kodeord) {
      setError("Udfyld begge felter");
      return;
    }

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
      setError("Forkert adgangskode");
      return;
    }
    setError("");
    onLogin(betjent, false);
  };

  // Find matched betjent for display
  const matchedBetjent = ansatteListe.find(
    (a) => a.badgeNr.toLowerCase() === badgeNr.toLowerCase()
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "url('/images/police-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Date & Time */}
      <div className="relative z-10 text-center mb-16">
        <p className="text-white/80 text-lg font-medium tracking-wide">{datoStr}</p>
        <p 
          className="text-white text-7xl font-bold tracking-tight cursor-default transition-all duration-500 hover:tracking-[0.3em] hover:text-primary hover:drop-shadow-[0_0_25px_hsl(213,80%,50%)] hover:scale-110"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {tidStr}
        </p>
      </div>

      {/* Login card */}
      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-xs">
        {/* Police logo */}
        <div className="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>

        {/* User info */}
        <p className="text-white text-sm font-semibold tracking-wide">
          {matchedBetjent
            ? `${matchedBetjent.fornavn} ${matchedBetjent.efternavn} | ${matchedBetjent.badgeNr}`
            : badgeNr
              ? badgeNr
              : "Politi Tablet"
          }
        </p>

        {/* Badge input */}
        <Input
          placeholder="Badge nummer"
          value={badgeNr}
          onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="bg-black/40 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 text-center h-10"
        />

        {/* Password input */}
        <Input
          type="password"
          placeholder="Angiv adgangskode"
          value={kodeord}
          onChange={(e) => { setKodeord(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="bg-black/40 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 text-center h-10"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <span className="text-white/50 text-xs">Politi MDT</span>
        <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
      </div>
    </div>
  );
};

export default LoginPage;
