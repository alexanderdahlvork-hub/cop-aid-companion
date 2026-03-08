import { useState, useEffect } from "react";
import { Car, Wrench, MapPin, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { koeretoejerApi } from "@/lib/api";
import type { Koeretoej } from "@/types/police";

const statusConfig: Record<Koeretoej["status"], { label: string; className: string; icon: typeof Car }> = {
  aktiv: { label: "Ledig", className: "bg-success/20 text-success border-success/30", icon: Car },
  i_brug: { label: "I brug", className: "bg-primary/20 text-primary border-primary/30", icon: MapPin },
  vedligehold: { label: "Værksted", className: "bg-warning/20 text-warning border-warning/30", icon: Wrench },
  ude_af_drift: { label: "Ude af drift", className: "bg-destructive/20 text-destructive border-destructive/30", icon: Car },
};

const FleetManagement = () => {
  const [koeretoejer, setKoeretoejer] = useState<Koeretoej[]>([]);
  const [loading, setLoading] = useState(true);
  const [valgt, setValgt] = useState<Koeretoej | null>(null);
  const [soegning, setSoegning] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await koeretoejerApi.getAll();
        setKoeretoejer(data);
      } catch (err) {
        console.error("Fejl ved indlæsning af køretøjer:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = {
    total: koeretoejer.length,
    ledig: koeretoejer.filter((k) => k.status === "aktiv").length,
    iBrug: koeretoejer.filter((k) => k.status === "i_brug").length,
    vaerksted: koeretoejer.filter((k) => k.status === "vedligehold").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser køretøjer...</span>
      </div>
    );
  }

  const filtreret = koeretoejer.filter((k) =>
    `${k.nummerplade} ${k.maerke} ${k.model} ${k.farve} ${k.tildelt}`
      .toLowerCase()
      .includes(soegning.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søg nummerplade, mærke, model..."
          value={soegning}
          onChange={(e) => setSoegning(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Car} color="text-foreground" />
        <StatCard label="Ledige" value={stats.ledig} icon={Car} color="text-success" />
        <StatCard label="I brug" value={stats.iBrug} icon={MapPin} color="text-primary" />
        <StatCard label="Værksted" value={stats.vaerksted} icon={Wrench} color="text-warning" />
      </div>

      {filtreret.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Ingen køretøjer fundet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtreret.map((k) => {
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
      )}
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
