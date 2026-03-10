import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Clock, Radio, ArrowRight, Activity } from "lucide-react";
import { betjenteApi, personerApi } from "@/lib/api";
import type { Betjent } from "@/types/police";

interface DashboardProps {
  currentUser: Betjent;
  onTabChange?: (tab: string) => void;
}

const Dashboard = ({ currentUser, onTabChange }: DashboardProps) => {
  const [antalEfterlyste, setAntalEfterlyste] = useState(0);
  const [kolleger, setKolleger] = useState<Betjent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [betjente, personer] = await Promise.all([
          betjenteApi.getAll(),
          personerApi.getAll(),
        ]);
        setKolleger(betjente.filter(a => a.id !== currentUser.id).slice(0, 4));
        setAntalEfterlyste(personer.filter(p => p.status === "eftersøgt").length);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    load();
  }, [currentUser.id]);

  const now = new Date();
  const dagNavn = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  const maanedNavn = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  return (
    <div className="h-full overflow-y-auto space-y-4">
      {/* Welcome banner */}
      <div className="relative bg-card border border-border rounded-xl px-5 py-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-base font-bold text-foreground relative">
          Velkommen, {currentUser.fornavn}
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5 font-mono relative">
          {dagNavn[now.getDay()]} d. {now.getDate()}. {maanedNavn[now.getMonth()]} — Badge: {currentUser.badgeNr}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Efterlyste */}
          <button
            onClick={() => onTabChange?.("efterlysninger")}
            className="w-full bg-card border border-border rounded-xl px-5 py-4 text-left hover:border-warning/30 transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-warning rounded-l-xl" />
            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-semibold text-foreground">Efterlyste Personer</h3>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-warning transition-colors" />
            </div>
            <div className="flex items-center gap-3 mt-3 relative">
              <div className="w-11 h-11 rounded-xl bg-warning/10 border border-warning/15 flex items-center justify-center">
                <span className="text-lg font-bold text-warning font-mono">{antalEfterlyste}</span>
              </div>
              <p className="text-[12px] text-muted-foreground">aktive efterlysninger</p>
            </div>
          </button>

          {/* Seneste aktivitet */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent rounded-l-xl" />
            <div className="flex items-center gap-2 mb-2 relative">
              <Activity className="w-3.5 h-3.5 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Seneste Aktivitet</h3>
            </div>
            <p className="text-[12px] text-muted-foreground italic relative">Ingen aktivitet i denne session.</p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Status */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />
            <div className="flex items-center gap-2 mb-3 relative">
              <Radio className="w-3.5 h-3.5 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Din Status</h3>
            </div>
            <div className="space-y-2 text-[12px] relative">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rang</span>
                <span className="font-medium text-foreground font-mono">{currentUser.rang}</span>
              </div>
              {currentUser.afdeling && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Afdeling</span>
                  <span className="font-medium text-foreground font-mono">{currentUser.afdeling}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uddannelser</span>
                <span className="font-medium text-foreground font-mono">{currentUser.uddannelser.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success font-mono">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  I TJENESTE
                </span>
              </div>
            </div>
          </div>

          {/* Kolleger */}
          <div className="bg-card border border-border rounded-xl px-5 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary-foreground/20 rounded-l-xl" />
            <h3 className="text-sm font-semibold text-foreground mb-3 relative">
              Kollegaer <span className="text-muted-foreground font-normal font-mono">({kolleger.length})</span>
            </h3>
            <div className="space-y-2.5 relative">
              {kolleger.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic">Ingen kolleger</p>
              ) : (
                kolleger.map((k) => (
                  <div key={k.id} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/8 border border-primary/10 flex items-center justify-center">
                      <Shield className="w-3 h-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-[12px] font-medium text-foreground">{k.fornavn} {k.efternavn}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{k.rang} · {k.badgeNr}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
