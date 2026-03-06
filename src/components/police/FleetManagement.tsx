import { useState } from "react";
import { Car, Wrench, MapPin, Fuel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Koeretoej } from "@/types/police";

const demoKoeretoejer: Koeretoej[] = [
  { id: "1", nummerplade: "AB 12 345", maerke: "VW", model: "Passat", aargang: "2023", farve: "Hvid/Blå", status: "aktiv", tildelt: "Patrulje 12", sidstService: "2024-08-01", km: 34500 },
  { id: "2", nummerplade: "CD 67 890", maerke: "BMW", model: "X5", aargang: "2022", farve: "Mørkeblå", status: "i_brug", tildelt: "Hundepatrulje", sidstService: "2024-07-15", km: 52100 },
  { id: "3", nummerplade: "EF 11 223", maerke: "Mercedes", model: "Vito", aargang: "2021", farve: "Hvid", status: "vedligehold", tildelt: "Udrykningsvogn 3", sidstService: "2024-09-10", km: 78200 },
  { id: "4", nummerplade: "GH 44 556", maerke: "Ford", model: "Mondeo", aargang: "2024", farve: "Hvid/Gul", status: "aktiv", tildelt: "Civil patrulje", sidstService: "2024-10-05", km: 12300 },
];

const statusConfig: Record<Koeretoej["status"], { label: string; className: string; icon: typeof Car }> = {
  aktiv: { label: "Ledig", className: "bg-success/20 text-success border-success/30", icon: Car },
  i_brug: { label: "I brug", className: "bg-primary/20 text-primary border-primary/30", icon: MapPin },
  vedligehold: { label: "Værksted", className: "bg-warning/20 text-warning border-warning/30", icon: Wrench },
  ude_af_drift: { label: "Ude af drift", className: "bg-destructive/20 text-destructive border-destructive/30", icon: Car },
};

const FleetManagement = () => {
  const [valgt, setValgt] = useState<Koeretoej | null>(null);

  const stats = {
    total: demoKoeretoejer.length,
    ledig: demoKoeretoejer.filter((k) => k.status === "aktiv").length,
    iBrug: demoKoeretoejer.filter((k) => k.status === "i_brug").length,
    vaerksted: demoKoeretoejer.filter((k) => k.status === "vedligehold").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Car} color="text-foreground" />
        <StatCard label="Ledige" value={stats.ledig} icon={Car} color="text-success" />
        <StatCard label="I brug" value={stats.iBrug} icon={MapPin} color="text-primary" />
        <StatCard label="Værksted" value={stats.vaerksted} icon={Wrench} color="text-warning" />
      </div>

      {/* Vehicle grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {demoKoeretoejer.map((k) => {
          const sc = statusConfig[k.status];
          return (
            <Card
              key={k.id}
              className={`cursor-pointer transition-all hover:border-primary/30 ${
                valgt?.id === k.id ? "border-primary/50 bg-primary/5" : ""
              }`}
              onClick={() => setValgt(k)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono font-bold text-sm">{k.nummerplade}</p>
                    <p className="text-xs text-muted-foreground">{k.maerke} {k.model} ({k.aargang})</p>
                  </div>
                  <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tildelt</span>
                    <p className="font-medium">{k.tildelt}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Km-stand</span>
                    <p className="font-medium font-mono">{k.km.toLocaleString("da-DK")}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Farve</span>
                    <p className="font-medium">{k.farve}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sidst service</span>
                    <p className="font-medium">{k.sidstService}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center text-sm text-muted-foreground">
        📌 Flådestyring er et udkast — send mere info om hvordan det skal fungere
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Car; color: string }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

export default FleetManagement;
