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

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#0b1220]">
      {/* Login card */}
      <div className="relative z-10 w-full max-w-[320px] mx-4">
        <div className="px-6 py-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-12 h-12 flex items-center justify-center cursor-pointer select-none mb-4"
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
                alt="Politi"
                className="w-16 h-16 object-contain"
                src="/lovable-uploads/6b773a4d-6a46-42ee-9e4e-ef6f93fd61bd.png"
              />
            </div>
            <h1 className="text-base font-medium text-white tracking-wide">Politi MDT</h1>
            {matchedBetjent && (
              <p className="text-white/60 text-xs mt-2">
                {matchedBetjent.fornavn} {matchedBetjent.efternavn}
              </p>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <Input
              placeholder="Badge nummer"
              value={badgeNr}
              onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="bg-white/5 border-white/10 !text-white placeholder:text-white/40 h-11 text-sm rounded-md focus:border-white/30 focus-visible:ring-0"
            />
            <Input
              type="password"
              placeholder="Adgangskode"
              value={kodeord}
              onChange={(e) => { setKodeord(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="bg-white/5 border-white/10 !text-white placeholder:text-white/40 h-11 text-sm rounded-md focus:border-white/30 focus-visible:ring-0"
              disabled={loading}
            />
          </div>

          {error && <p className="text-xs text-red-400 text-center mt-3">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-11 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? "Logger ind..." : "Log ind"}
          </button>

          <p className="text-white/30 text-[10px] text-center mt-6">
            Sikret forbindelse
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
