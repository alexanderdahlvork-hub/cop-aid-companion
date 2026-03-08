import { Shield, FileText, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { ansatteListe } from "@/data/ansatte";
import type { Betjent } from "@/types/police";

interface DashboardProps {
  currentUser: Betjent;
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: string; color: string }) => (
  <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  </div>
);

const Dashboard = ({ currentUser }: DashboardProps) => {
  const now = new Date();
  const dagNavn = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
  const maanedNavn = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
  const datoStr = `${dagNavn[now.getDay()]} den ${now.getDate()}. ${maanedNavn[now.getMonth()]} ${now.getFullYear()} kl. ${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}.${String(now.getSeconds()).padStart(2, "0")}`;

  const onlineKolleger = ansatteListe.filter(a => a.id !== currentUser.id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-foreground tracking-wide uppercase">POLITI</h1>
        <p className="text-sm text-muted-foreground">{datoStr}</p>
      </div>

      {/* Welcome card */}
      <div className="absolute top-4 right-6 bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Politi Tablet</p>
          <p className="text-sm font-semibold text-foreground">Velkommen til {currentUser.fornavn} {currentUser.efternavn}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats + Sager */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard icon={FileText} label="Total Sager" value="0" color="bg-primary/20 text-primary" />
            <StatCard icon={TrendingUp} label="Sendt Bøder for" value="0,00 kr." color="bg-success/20 text-success" />
            <StatCard icon={AlertTriangle} label="Antal efterlysninger" value="0" color="bg-warning/20 text-warning" />
            <StatCard icon={Users} label="Antal personer" value="0" color="bg-primary/20 text-primary" />
          </div>

          {/* Seneste Sager */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Seneste Sager</h2>
            <p className="text-sm text-muted-foreground">Der er ikke blevet oprettet nogle sager under denne session.</p>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Efterlyste Personer */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground">Efterlyste Personer</h3>
              <span className="text-xs text-muted-foreground">0 af 0</span>
            </div>
            <p className="text-sm text-muted-foreground italic">Ingen efterlyste personer</p>
          </div>

          {/* Sagsoverblik */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-bold text-foreground mb-2">Sagsoverblik</h3>
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-success">↑ 0% fra sidste måned</p>
            <div className="mt-4 h-24 flex items-end gap-1">
              {["Jan", "Feb", "Mar", "Apr", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"].map((m) => (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary/20 rounded-sm" style={{ height: "2px" }} />
                  <span className="text-[8px] text-muted-foreground">{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kolleger på Vagt */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Kolleger på Vagt ({onlineKolleger.length})</h3>
            <div className="space-y-3">
              {onlineKolleger.map((k) => (
                <div key={k.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{k.fornavn} {k.efternavn} | {k.badgeNr}</p>
                    <p className="text-[10px] text-muted-foreground">På arbejde</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
