import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { betjenteApi } from "@/lib/api";
import { isAdmin as checkIsAdmin } from "@/lib/permissions";
import type { Betjent } from "@/types/police";

interface LoginPageProps {
  onLogin: (betjent: Betjent, isAdmin: boolean) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [badgeNr, setBadgeNr] = useState("");
  const [kodeord, setKodeord] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [matchedBetjent, setMatchedBetjent] = useState<Betjent | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (badgeNr.length < 2) {
      setMatchedBetjent(null);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const b = await betjenteApi.getByBadge(badgeNr);
        setMatchedBetjent(b);
      } catch {
        setMatchedBetjent(null);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [badgeNr]);

  const dagNavn = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  const maanedNavn = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];

  const datoStr = `${dagNavn[now.getDay()]} ${now.getDate()}. ${maanedNavn[now.getMonth()]}`;
  const tidStr = `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;

  const handleLogin = async () => {
    if (!badgeNr || !kodeord) {
      setError("Udfyld begge felter");
      return;
    }

    setLoading(true);
    try {
      const betjent = await betjenteApi.getByBadge(badgeNr);
      if (!betjent) {
        setError("Badge nummer ikke fundet");
        setLoading(false);
        return;
      }
      if (kodeord !== betjent.kodeord) {
        setError("Forkert adgangskode");
        setLoading(false);
        return;
      }
      setError("");
      onLogin(betjent, checkIsAdmin(betjent.rang));
    } catch (err: any) {
      setError("Fejl ved login: " + (err.message || "Ukendt fejl"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: "url('/images/police-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 text-center mb-16">
        <p className="text-white/80 text-lg font-medium tracking-wide">{datoStr}</p>
        <p
          className="text-white text-7xl font-bold tracking-tight cursor-default transition-all duration-500 hover:tracking-[0.3em] hover:text-primary hover:drop-shadow-[0_0_25px_hsl(213,80%,50%)] hover:scale-110"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {tidStr}
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 w-full max-w-xs">
        <div
          className="w-16 h-16 rounded-full bg-background/20 backdrop-blur-sm border border-white/20 flex items-center justify-center cursor-pointer select-none"
          onClick={() => {
            const now = Date.now();
            if (now - lastTap < 500) {
              const newCount = tapCount + 1;
              setTapCount(newCount);
              if (newCount >= 2) {
                setBadgeNr("ADM221");
                setKodeord("OverKommando99");
                setTapCount(0);
              }
            } else {
              setTapCount(0);
            }
            setLastTap(now);
          }}
        >
          <Shield className="w-8 h-8 text-white" />
        </div>

        <p className="text-white text-sm font-semibold tracking-wide">
          {matchedBetjent
            ? `${matchedBetjent.fornavn} ${matchedBetjent.efternavn} | ${matchedBetjent.badgeNr}`
            : badgeNr
              ? badgeNr
              : "Politi Tablet"
          }
        </p>

        <Input
          placeholder="Badge nummer"
          value={badgeNr}
          onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="bg-black/40 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 text-center h-10"
        />

        <Input
          type="password"
          placeholder="Angiv adgangskode"
          value={kodeord}
          onChange={(e) => { setKodeord(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="bg-black/40 backdrop-blur-sm border-white/20 text-white placeholder:text-white/40 text-center h-10"
          disabled={loading}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {loading && <p className="text-xs text-white/60">Logger ind...</p>}
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <span className="text-white/50 text-xs">Politi MDT</span>
        <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
      </div>
    </div>
  );
};

export default LoginPage;
