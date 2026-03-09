import { useState, useEffect } from "react";
import { Shield, AlertTriangle, Clock, Radio } from "lucide-react";
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
        setKolleger(betjente.filter(a => a.id !== currentUser.id).slice(0, 5));
        setAntalEfterlyste(personer.filter(p => p.status === "eftersøgt").length);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    load();
  }, [currentUser.id]);

  const now = new Date();
  const dagNavn = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
  const maanedNavn = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];

  return (
    <div className="h-full overflow-y-auto">
      {/* Welcome */}
      <div className="bg-card border border-border rounded-lg p-6 mb-5">
        <h1 className="text-xl font-bold text-foreground">
          Velkommen tilbage, {currentUser.fornavn}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {dagNavn[now.getDay()]} d. {now.getDate()}. {maanedNavn[now.getMonth()]} {now.getFullYear()} — Badge: {currentUser.badgeNr}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Efterlyste */}
          <button
            onClick={() => onTabChange?.("efterlysninger")}
            className="w-full bg-card border border-border rounded-lg p-5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <h3 className="text-base font-bold text-foreground">Efterlyste Personer</h3>
            </div>
            {antalEfterlyste === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen efterlyste personer i systemet</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-warning">{antalEfterlyste}</span>
                </div>
                <p className="text-sm text-muted-foreground">aktive efterlysninger i registeret</p>
              </div>
            )}
          </button>

          {/* Seneste aktivitet */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="text-base font-bold text-foreground">Seneste Aktivitet</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">Ingen aktivitet registreret endnu i denne session.</p>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-success" />
              <h3 className="text-base font-bold text-foreground">Din Status</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rang</span>
                <span className="font-medium text-foreground">{currentUser.rang}</span>
              </div>
              {currentUser.afdeling && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Afdeling</span>
                  <span className="font-medium text-foreground">{currentUser.afdeling}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uddannelser</span>
                <span className="font-medium text-foreground">{currentUser.uddannelser.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  I tjeneste
                </span>
              </div>
            </div>
          </div>

          {/* Kolleger */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-base font-bold text-foreground mb-3">Kollegaer ({kolleger.length})</h3>
            <div className="space-y-3">
              {kolleger.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Ingen kolleger registreret</p>
              ) : (
                kolleger.map((k) => (
                  <div key={k.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{k.fornavn} {k.efternavn} | {k.badgeNr}</p>
                      <p className="text-xs text-muted-foreground">{k.rang}</p>
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
