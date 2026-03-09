import { useState, useEffect } from "react";
import { Shield, FileText, AlertTriangle, Users, TrendingUp, BadgeCheck, Building, BookOpen, Settings } from "lucide-react";
import { betjenteApi, personerApi } from "@/lib/api";
import type { Betjent } from "@/types/police";

interface DashboardProps {
  currentUser: Betjent;
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: string; color: string }) => (
  <div className="bg-card border border-border rounded-lg p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const Dashboard = ({ currentUser }: DashboardProps) => {
  const [antalPersoner, setAntalPersoner] = useState(0);
  const [antalEfterlyste, setAntalEfterlyste] = useState(0);
  const [kolleger, setKolleger] = useState<Betjent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [betjente, personer] = await Promise.all([
          betjenteApi.getAll(),
          personerApi.getAll(),
        ]);
        setKolleger(betjente.filter(a => a.id !== currentUser.id).slice(0, 3));
        setAntalPersoner(personer.length);
        setAntalEfterlyste(personer.filter(p => p.status === "eftersøgt").length);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };
    load();
  }, [currentUser.id]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 p-1">
        {/* Left: Stats + Seneste Sager */}
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={FileText} label="Total Sager" value="0" color="bg-primary/20 text-primary" />
            <StatCard icon={TrendingUp} label="Sendt Bøder for" value="0,00 kr." color="bg-success/20 text-success" />
            <StatCard icon={AlertTriangle} label="Antal efterlysninger" value={String(antalEfterlyste)} color="bg-warning/20 text-warning" />
            <StatCard icon={Users} label="Antal personer" value={String(antalPersoner)} color="bg-primary/20 text-primary" />
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Seneste Sager</h2>
            <p className="text-sm text-muted-foreground">Der er ikke blevet oprettet nogle sager under denne session.</p>
          </div>
        </div>

        {/* Right sidebar cards */}
        <div className="space-y-5">
          {/* Efterlyste Personer */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-base font-bold text-foreground mb-2">Efterlyste Personer</h3>
            {antalEfterlyste === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen efterlyste personer</p>
            ) : (
              <p className="text-sm text-muted-foreground">{antalEfterlyste} person(er) eftersøgt</p>
            )}
          </div>

          {/* Sagsoverblik */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-base font-bold text-foreground mb-1">Sagsoverblik</h3>
            <p className="text-3xl font-bold text-foreground">0</p>
            <p className="text-xs text-success mt-1">↑ 0% fra sidste måned</p>
            <div className="mt-4 h-20 flex items-end gap-1">
              {["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"].map((m) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/20 rounded-sm" style={{ height: "2px" }} />
                  <span className="text-[8px] text-muted-foreground">{m}</span>
                </div>
              ))}
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
