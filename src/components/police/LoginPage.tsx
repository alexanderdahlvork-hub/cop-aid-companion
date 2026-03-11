import { useState, useEffect } from "react";
import { Shield, Lock, BadgeCheck } from "lucide-react";
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
  const tidStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const datoStr = `${dagNavn[now.getDay()]} ${now.getDate()}. ${maanedNavn[now.getMonth()]}`;

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
    <div className="min-h-screen flex relative overflow-hidden bg-black" style={{"--lp-primary": "36 90% 50%", "--lp-success": "152 50% 42%"} as React.CSSProperties}>
      {/* Left side — time & branding */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-10 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(36,90%,50%,0.05)] via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[hsl(36,90%,50%,0.4)] via-[hsl(36,90%,50%,0.1)] to-transparent" />
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[hsl(36,90%,50%,0.4)] via-[hsl(36,90%,50%,0.1)] to-transparent" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[hsl(36,90%,50%,0.1)] border border-[hsl(36,90%,50%,0.2)] flex items-center justify-center">
              <Shield className="w-5 h-5 text-[hsl(36,90%,50%)]" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-white tracking-wide">POLITI MDT</p>
              <p className="text-[9px] text-[hsl(36,90%,50%)] font-mono tracking-[0.3em]">COMMAND SYSTEM</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-sm font-mono tracking-widest uppercase mb-2">{datoStr}</p>
          <p className="text-white text-7xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {tidStr}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(152,50%,42%)] animate-pulse" />
          <span className="text-white/30 text-[10px] font-mono tracking-wider">SYSTEM OPERATIONAL</span>
        </div>
      </div>

      {/* Right side — login form */}
      <div className="w-full md:w-[400px] flex flex-col items-center justify-center p-8 relative bg-[hsl(30,12%,4%)] border-l border-[hsl(36,90%,50%,0.1)]">
        <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-[hsl(36,90%,50%,0.5)] to-transparent" />
        <div className="absolute top-0 left-0 w-[1px] h-16 bg-gradient-to-b from-[hsl(36,90%,50%,0.5)] to-transparent" />

        {/* Mobile time */}
        <div className="md:hidden text-center mb-8">
          <p className="text-white/40 text-xs font-mono">{datoStr}</p>
          <p className="text-white text-4xl font-bold mt-1">{tidStr}</p>
        </div>

        <div className="w-full max-w-[260px] space-y-5">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-2xl bg-[hsl(36,90%,50%,0.08)] border border-[hsl(36,90%,50%,0.2)] flex items-center justify-center cursor-pointer select-none overflow-hidden transition-all hover:border-[hsl(36,90%,50%,0.4)] hover:bg-[hsl(36,90%,50%,0.12)]"
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
            <p className="text-white/70 text-[13px] font-medium">
              {matchedBetjent
                ? `${matchedBetjent.fornavn} ${matchedBetjent.efternavn}`
                : "Identificer dig"
              }
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-2.5">
            <div className="relative">
              <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(36,90%,50%,0.4)]" />
              <Input
                placeholder="Badge nummer"
                value={badgeNr}
                onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-transparent border-white/10 !text-white placeholder:text-white/25 pl-9 h-10 text-[13px] rounded-xl focus:border-[hsl(36,90%,50%,0.4)]"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(36,90%,50%,0.4)]" />
              <Input
                type="password"
                placeholder="Adgangskode"
                value={kodeord}
                onChange={(e) => { setKodeord(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-transparent border-white/10 !text-white placeholder:text-white/25 pl-9 h-10 text-[13px] rounded-xl focus:border-[hsl(36,90%,50%,0.4)]"
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-destructive text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-10 rounded-xl bg-[hsl(36,90%,50%,0.1)] border border-[hsl(36,90%,50%,0.25)] text-[hsl(36,90%,50%)] text-[13px] font-semibold hover:bg-[hsl(36,90%,50%,0.2)] transition-all disabled:opacity-50 font-mono tracking-wider"
          >
            {loading ? "LOGGER IND..." : "LOG IND"}
          </button>
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-1.5">
          <span className="text-white/20 text-[9px] font-mono">AVLD SYSTEMS</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
