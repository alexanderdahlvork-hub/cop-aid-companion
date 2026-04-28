import { useState, useEffect } from "react";
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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
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

  const dateStr = time.toLocaleDateString("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = time.toLocaleTimeString("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen w-full bg-[#0b1018] text-white flex flex-col font-sans">
      {/* Top status bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05] text-[11px] uppercase tracking-[0.15em] text-white/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>System online</span>
        </div>
        <div className="hidden sm:block">{dateStr} · {timeStr}</div>
        <div>v2.4.1</div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[920px] grid md:grid-cols-2 gap-px bg-white/[0.05] border border-white/[0.05] rounded-lg overflow-hidden">
          {/* Left: identity */}
          <section className="bg-[#0b1018] p-10 flex flex-col justify-between min-h-[460px]">
            <div
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={handleLogoTap}
            >
              <img
                alt="Politi"
                className="w-9 h-9 object-contain"
                src="/lovable-uploads/6b773a4d-6a46-42ee-9e4e-ef6f93fd61bd.png"
              />
              <div className="leading-tight">
                <div className="text-white text-sm font-semibold tracking-wide">Politi MDT</div>
                <div className="text-white/40 text-[11px] uppercase tracking-wider">Mobile Data Terminal</div>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-white text-3xl font-medium tracking-tight leading-tight">
                Velkommen tilbage.
              </h1>
              <p className="text-white/45 text-sm leading-relaxed max-w-sm">
                Log ind med dit tjenestebadge for at få adgang til registre,
                sager og rapportering.
              </p>
            </div>

            <div className="space-y-2 text-[11px] text-white/35">
              <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
                <span className="uppercase tracking-wider">Klassificering</span>
                <span className="text-white/55">Intern brug</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-wider">Forbindelse</span>
                <span className="text-emerald-400/80">Krypteret</span>
              </div>
            </div>
          </section>

          {/* Right: form */}
          <section className="bg-[#0e141f] p-10 flex flex-col justify-center">
            <div className="mb-8">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-2">
                Sikker login
              </div>
              <h2 className="text-white text-xl font-medium tracking-tight">
                Identificér dig
              </h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
                  Badge nummer
                </label>
                <input
                  type="text"
                  placeholder="f.eks. 1234"
                  value={badgeNr}
                  onChange={(e) => { setBadgeNr(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full h-11 bg-transparent border-b border-white/15 px-0 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/50 transition-colors"
                />
                <div className="h-4 mt-1.5">
                  {matchedBetjent && (
                    <p className="text-white/55 text-xs">
                      {matchedBetjent.fornavn} {matchedBetjent.efternavn} · {matchedBetjent.rang}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
                  Adgangskode
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={kodeord}
                  onChange={(e) => { setKodeord(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  disabled={loading}
                  className="w-full h-11 bg-transparent border-b border-white/15 px-0 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/50 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400/90 mt-4">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full h-11 mt-8 rounded-md bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? "Logger ind..." : "Log ind"}
              {!loading && <span aria-hidden>→</span>}
            </button>

            <p className="text-[10px] text-white/30 text-center mt-6 leading-relaxed">
              Adgang er logget. Misbrug medfører tjenstlig undersøgelse.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-white/[0.05] text-[10px] uppercase tracking-[0.15em] text-white/30 flex items-center justify-between">
        <span>© {time.getFullYear()} Politi</span>
        <span>Autoriseret personale</span>
      </footer>
    </div>
  );
};

export default LoginPage;
