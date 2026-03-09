import { useState, useEffect } from "react";
import { Search, AlertTriangle, User, Loader2, MapPin, Phone, Car } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { personerApi, koeretoejerApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Person, Koeretoej } from "@/types/police";

type Tab = "personer" | "koeretoejer";

const Efterlysninger = () => {
  const [tab, setTab] = useState<Tab>("personer");
  const [personer, setPersoner] = useState<Person[]>([]);
  const [koeretoejer, setKoeretoejer] = useState<Koeretoej[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [valgtPerson, setValgtPerson] = useState<Person | null>(null);
  const [valgtKoeretoj, setValgtKoeretoj] = useState<Koeretoej | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [personData, koeretoejData] = await Promise.all([
          personerApi.getAll(),
          koeretoejerApi.getAll(),
        ]);
        setPersoner(personData.filter((p) => p.status === "eftersøgt"));
        setKoeretoejer(koeretoejData.filter((k) => k.status === "eftersøgt"));
      } catch (err) {
        console.error("Fejl ved indlæsning:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtreretPersoner = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  const filtreretKoeretoejer = koeretoejer.filter((k) =>
    `${k.nummerplade} ${k.maerke} ${k.model} ${k.farve}`.toLowerCase().includes(soegning.toLowerCase())
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
    <div className="flex flex-col h-full gap-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setTab("personer"); setValgtPerson(null); setValgtKoeretoj(null); setSoegning(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            tab === "personer"
              ? "bg-warning/15 text-warning border border-warning/30"
              : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
          )}
        >
          <AlertTriangle className="w-4 h-4" />
          Efterlyste Personer
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 ml-1">
            {personer.length}
          </Badge>
        </button>
        <button
          onClick={() => { setTab("koeretoejer"); setValgtPerson(null); setValgtKoeretoj(null); setSoegning(""); }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            tab === "koeretoejer"
              ? "bg-warning/15 text-warning border border-warning/30"
              : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted"
          )}
        >
          <Car className="w-4 h-4" />
          Efterlyste Køretøjer
          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 ml-1">
            {koeretoejer.length}
          </Badge>
        </button>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* List */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={tab === "personer" ? "Søg efterlyste personer..." : "Søg efterlyste køretøjer..."}
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto flex-1">
            {tab === "personer" && (
              <>
                {filtreretPersoner.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setValgtPerson(person)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                      valgtPerson?.id === person.id
                        ? "bg-warning/10 border border-warning/30"
                        : "bg-secondary/50 border border-transparent hover:bg-secondary"
                    )}
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
                {filtreretPersoner.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Ingen efterlyste personer fundet
                  </div>
                )}
              </>
            )}

            {tab === "koeretoejer" && (
              <>
                {filtreretKoeretoejer.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setValgtKoeretoj(k)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                      valgtKoeretoj?.id === k.id
                        ? "bg-warning/10 border border-warning/30"
                        : "bg-secondary/50 border border-transparent hover:bg-secondary"
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4 text-warning" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{k.nummerplade}</p>
                      <p className="text-xs text-muted-foreground">{k.maerke} {k.model} — {k.farve}</p>
                    </div>
                    <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                      Eftersøgt
                    </Badge>
                  </button>
                ))}
                {filtreretKoeretoejer.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Ingen efterlyste køretøjer fundet
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="hidden lg:block flex-1">
          {tab === "personer" && valgtPerson ? (
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <span className="text-sm text-warning font-semibold">AKTIV EFTERLYSNING — PERSON</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{valgtPerson.fornavn} {valgtPerson.efternavn}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{valgtPerson.cpr}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sidst kendte adresse</p>
                      <p className="text-sm font-medium">{valgtPerson.adresse}</p>
                      <p className="text-sm text-muted-foreground">{valgtPerson.postnr} {valgtPerson.by}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Telefon</p>
                      <p className="text-sm font-medium">{valgtPerson.telefon || "Ukendt"}</p>
                    </div>
                  </div>
                </div>
                {valgtPerson.noter && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Noter / Beskrivelse</p>
                    <div className="p-3 rounded-lg bg-muted/50 text-sm">{valgtPerson.noter}</div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Oprettet</p>
                  <p className="text-sm font-medium">{valgtPerson.oprettet}</p>
                </div>
              </CardContent>
            </Card>
          ) : tab === "koeretoejer" && valgtKoeretoj ? (
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-3">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <span className="text-sm text-warning font-semibold">AKTIV EFTERLYSNING — KØRETØJ</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                    <Car className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{valgtKoeretoj.nummerplade}</CardTitle>
                    <p className="text-sm text-muted-foreground">{valgtKoeretoj.maerke} {valgtKoeretoj.model}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Mærke & Model</p>
                    <p className="text-sm font-medium">{valgtKoeretoj.maerke} {valgtKoeretoj.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Årgang</p>
                    <p className="text-sm font-medium">{valgtKoeretoj.aargang}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Farve</p>
                    <p className="text-sm font-medium">{valgtKoeretoj.farve}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nummerplade</p>
                    <p className="text-sm font-medium font-mono">{valgtKoeretoj.nummerplade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tildelt</p>
                    <p className="text-sm font-medium">{valgtKoeretoj.tildelt || "Ikke tildelt"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Kilometer</p>
                    <p className="text-sm font-medium">{valgtKoeretoj.km.toLocaleString("da-DK")} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <AlertTriangle className="w-8 h-8 opacity-30" />
              <p className="text-sm">
                {tab === "personer" ? "Vælg en efterlyst person for detaljer" : "Vælg et efterlyst køretøj for detaljer"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Efterlysninger;
