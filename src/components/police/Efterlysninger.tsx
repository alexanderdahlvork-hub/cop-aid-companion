import { useState, useEffect } from "react";
import { Search, AlertTriangle, User, Loader2, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { personerApi } from "@/lib/api";
import type { Person } from "@/types/police";

const Efterlysninger = () => {
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [valgt, setValgt] = useState<Person | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await personerApi.getAll();
        setPersoner(data.filter((p) => p.status === "eftersøgt"));
      } catch (err) {
        console.error("Fejl ved indlæsning:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtreret = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser efterlysninger...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg efterlyste..."
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 shrink-0">
            {filtreret.length} efterlyst{filtreret.length !== 1 ? "e" : ""}
          </Badge>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtreret.map((person) => (
            <button
              key={person.id}
              onClick={() => setValgt(person)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                valgt?.id === person.id
                  ? "bg-warning/10 border border-warning/30"
                  : "bg-secondary/50 border border-transparent hover:bg-secondary"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{person.fornavn} {person.efternavn}</p>
                <p className="text-xs text-muted-foreground font-mono">{person.cpr}</p>
              </div>
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                Eftersøgt
              </Badge>
            </button>
          ))}
          {filtreret.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Ingen efterlyste personer fundet
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block flex-1">
        {valgt ? (
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-3">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <span className="text-sm text-warning font-semibold">AKTIV EFTERLYSNING</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">{valgt.fornavn} {valgt.efternavn}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{valgt.cpr}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sidst kendte adresse</p>
                    <p className="text-sm font-medium">{valgt.adresse}</p>
                    <p className="text-sm text-muted-foreground">{valgt.postnr} {valgt.by}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="text-sm font-medium">{valgt.telefon || "Ukendt"}</p>
                  </div>
                </div>
              </div>
              {valgt.noter && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Noter / Beskrivelse</p>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">{valgt.noter}</div>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Oprettet</p>
                <p className="text-sm font-medium">{valgt.oprettet}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <AlertTriangle className="w-8 h-8 opacity-30" />
            <p className="text-sm">Vælg en efterlyst person for detaljer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Efterlysninger;
