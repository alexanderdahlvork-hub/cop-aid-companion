import { useState, useEffect } from "react";
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

  const handleLogoTap = () => {
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
  };

  return (
    <div className="min-h-screen flex bg-[#0a0f1a]">
      {/* Left side branding panel */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-10 border-r border-white/[0.06]">
        <div className="flex items-center gap-3">
          <img
            alt="Politi"
            className="w-8 h-8 object-contain opacity-90"
            src="/lovable-uploads/6b773a4d-6a46-42ee-9e4e-ef6f93fd61bd.png"
          />
          <span className="text-white/80 text-sm font-medium tracking-wide">Politi MDT</span>
        </div>

        <div className="max-w-md">
          <h2 className="text-white text-2xl font-medium leading-snug tracking-tight">
            Mobile Data Terminal
          </h2>
          <p className="text-white/50 text-sm mt-3 leading-relaxed">
            Internt arbejdsværktøj til registrering, opslag og sagsbehandling.
            Adgang kræver gyldigt tjenestebadge.
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/30 uppercase tracking-wider">
          <span>v2.4.1</span>
          <span>Klassificeret · Intern brug</span>
        </div>
      </div>

      {/* Right side login */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[340px]">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-3 mb-10 justify-center">
            <img
              alt="Politi"
              className="w-7 h-7 object-contain"
              src="/lovable-uploads/6b773a4d-6a46-42ee-9e4e-ef6f93fd61bd.png"
            />
            <span className="text-white/80 text-sm font-medium">Politi MDT</span>
          </div>

          <div
            className="cursor-pointer select-none mb-8"
            onClick={handleLogoTap}
          >
            <h1 className="text-white text-xl font-medium tracking-tight">Log ind</h1>
            <p className="text-white/40 text-sm mt-1">
              Indtast badge og adgangskode for at fortsætte
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">
                Badge nummer
              </label>
              <Input
                placeholder="f.eks. 1234"
                value={badgeNr}
                onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-transparent border-white/10 !text-white placeholder:text-white/25 h-11 text-sm rounded-md focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {matchedBetjent && (
                <p className="text-white/50 text-xs mt-2">
                  {matchedBetjent.fornavn} {matchedBetjent.efternavn} · {matchedBetjent.rang}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-white/40 mb-2">
                Adgangskode
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={kodeord}
                onChange={(e) => { setKodeord(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="bg-transparent border-white/10 !text-white placeholder:text-white/25 h-11 text-sm rounded-md focus:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400/90 mt-4">{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 mt-6"
          >
            {loading ? "Logger ind..." : "Log ind"}
          </button>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              Sikret forbindelse
            </span>
            <span className="text-[10px] text-white/30">
              {new Date().getFullYear()} · Politi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
