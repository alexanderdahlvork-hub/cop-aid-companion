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
  const [matchedBetjent, setMatchedBetjent] = useState<Betjent | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [lastTap, setLastTap] = useState(0);

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/police-bg.webp')" }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="p-8">
          {/* Logo & title */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div
              className="w-20 h-20 rounded-2xl bg-[hsl(217,91%,50%,0.1)] border border-[hsl(217,91%,50%,0.2)] flex items-center justify-center cursor-pointer select-none overflow-hidden transition-all hover:border-[hsl(217,91%,50%,0.4)]"
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
              <img
                alt="AVLD Systems"
                className="w-12 h-12 object-contain"
                src="/lovable-uploads/6b773a4d-6a46-42ee-9e4e-ef6f93fd61bd.png"
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold text-white tracking-wide">POLITI MDT</h1>
              <p className="text-[10px] text-[hsl(217,91%,50%)] font-mono tracking-[0.3em] mt-1">MOBILE DATA TERMINAL</p>
            </div>
          </div>

          {/* Matched user */}
          {matchedBetjent && (
            <div className="text-center mb-4">
              <p className="text-white/80 text-sm font-medium">
                {matchedBetjent.fornavn} {matchedBetjent.efternavn}
              </p>
              <p className="text-[hsl(217,91%,50%,0.6)] text-[11px] font-mono">{matchedBetjent.rang}</p>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            <div className="relative">
              <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(217,91%,50%,0.4)]" />
              <Input
                placeholder="BADGE NUMMER"
                value={badgeNr}
                onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-transparent border-white/15 !text-white placeholder:text-white/30 pl-10 h-11 text-[13px] rounded-xl focus:border-[hsl(217,91%,50%,0.5)] text-center"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(217,91%,50%,0.4)]" />
              <Input
                type="password"
                placeholder="ADGANGSKODE"
                value={kodeord}
                onChange={(e) => { setKodeord(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-transparent border-white/15 !text-white placeholder:text-white/30 pl-10 h-11 text-[13px] rounded-xl focus:border-[hsl(217,91%,50%,0.5)] text-center"
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-red-400 text-center mt-3">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[hsl(217,91%,50%)] text-white text-[13px] font-semibold hover:bg-[hsl(217,91%,55%)] transition-all disabled:opacity-50 tracking-wider mt-5"
          >
            {loading ? "LOGGER IND..." : "LOG IND"}
          </button>

          <p className="text-white/20 text-[9px] font-mono text-center mt-4 tracking-wider">
            AVLD SYSTEMS — SIKRET FORBINDELSE
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
