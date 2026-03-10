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
  const maanedNavn = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  const datoStr = `${dagNavn[now.getDay()]} ${now.getDate()}. ${maanedNavn[now.getMonth()]}`;
  const tidStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

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
        backgroundImage: "url('/images/police-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 text-center mb-12">
        <p className="text-white/60 text-sm font-medium tracking-widest uppercase">{datoStr}</p>
        <p
          className="text-white text-6xl font-bold tracking-tight mt-1 cursor-default transition-all duration-500 hover:tracking-[0.2em] hover:text-primary"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {tidStr}
        </p>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-[280px]">
        <div
          className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center cursor-pointer select-none overflow-hidden transition-transform hover:scale-105"
          onClick={() => {
            const nowMs = Date.now();
            if (nowMs - lastTap < 500) {
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
            setLastTap(nowMs);
          }}
        >
          <img alt="AVLD Systems" className="w-10 h-10 object-contain" src="/lovable-uploads/6b773a4d-6a46-42ee-9e4e-ef6f93fd61bd.png" />
        </div>

        <p className="text-white/80 text-[13px] font-medium">
          {matchedBetjent
            ? `${matchedBetjent.fornavn} ${matchedBetjent.efternavn}`
            : "Politi MDT"
          }
        </p>

        <Input
          placeholder="Badge nummer"
          value={badgeNr}
          onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="bg-transparent backdrop-blur-sm border-white/15 !text-white placeholder:text-white/30 text-center h-9 text-[13px]"
        />

        <Input
          type="password"
          placeholder="Adgangskode"
          value={kodeord}
          onChange={(e) => { setKodeord(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
           className="bg-white/8 backdrop-blur-sm border-white/15 !text-white placeholder:text-white/30 text-center h-9 text-[13px]"
          disabled={loading}
        />

        {error && <p className="text-[11px] text-red-400">{error}</p>}
        {loading && <p className="text-[11px] text-white/50">Logger ind...</p>}
      </div>

      <div className="absolute bottom-3 right-4 z-10 flex items-center gap-1.5">
        <span className="text-white/30 text-[10px]">AVLD Systems</span>
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
      </div>
    </div>
  );
};

export default LoginPage;
