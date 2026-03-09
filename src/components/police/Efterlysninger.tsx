import { useState, useEffect } from "react";
import { Search, AlertTriangle, User, Loader2, MapPin, Phone, Car, Gavel, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { personerApi, koeretoejerApi, sigtelserApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Person, Koeretoej, Sigtelse } from "@/types/police";

type Tab = "personer" | "koeretoejer";

interface EfterlysningerProps {
  onSigtPerson?: (personId: string) => void;
}

const Efterlysninger = ({ onSigtPerson }: EfterlysningerProps) => {
  const [tab, setTab] = useState<Tab>("personer");
  const [personer, setPersoner] = useState<Person[]>([]);
  const [koeretoejer, setKoeretoejer] = useState<Koeretoej[]>([]);
  const [sigtelser, setSigtelser] = useState<Sigtelse[]>([]);
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
        console.error("Fejl ved indlæsning af personer/køretøjer:", err);
      }
      try {
        const sigtelseData = await sigtelserApi.getAll();
        setSigtelser(sigtelseData);
      } catch (err) {
        console.error("Fejl ved indlæsning af sigtelser:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtreretPersoner = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  const filtreretKoeretoejer = koeretoejer.filter((k) =>
    `${k.nummerplade} ${k.maerke} ${k.model} ${k.farve}`.toLowerCase().includes(soegning.toLowerCase())
  );

  // Get sigtelser for a person (efterlysning-type first)
  const getPersonSigtelser = (personId: string) =>
    sigtelser.filter((s) => s.personId === personId);

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
                {filtreretPersoner.map((person) => {
                  const pSigtelser = getPersonSigtelser(person.id);
                  const totalBoede = pSigtelser.reduce((s, sig) => s + sig.totalBoede, 0);
                  return (
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
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30 text-[10px]">
                          Eftersøgt
                        </Badge>
                        {pSigtelser.length > 0 && (
                          <span className="text-[10px] text-muted-foreground">{pSigtelser.length} sigtelse(r)</span>
                        )}
                      </div>
                    </button>
                  );
                })}
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
            <PersonDetalje person={valgtPerson} sigtelser={getPersonSigtelser(valgtPerson.id)} onSigtPerson={onSigtPerson} />
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

/** Detail view for a wanted person, including sigtelser/charges */
const PersonDetalje = ({ person, sigtelser, onSigtPerson }: { person: Person; sigtelser: Sigtelse[]; onSigtPerson?: (personId: string) => void }) => {
  const totalBoede = sigtelser.reduce((s, sig) => s + sig.totalBoede, 0);
  const totalFaengsel = sigtelser.reduce((s, sig) => s + sig.faengselMaaneder, 0);
  // Find the efterlysning-typed sigtelse for begrundelse
  const efterlysningSigtelse = sigtelser.find((s) => s.skabelonType === "Efterlysning");
  const begrundelse = efterlysningSigtelse?.rapport?.haendelsesforloeb;

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20 mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <span className="text-sm text-warning font-semibold">AKTIV EFTERLYSNING — PERSON</span>
          </div>
          {onSigtPerson && (
            <button
              onClick={() => onSigtPerson(person.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              <Gavel className="w-3.5 h-3.5" />
              Gå til sigtelse
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
            <User className="w-6 h-6 text-warning" />
          </div>
          <div>
            <CardTitle className="text-lg">{person.fornavn} {person.efternavn}</CardTitle>
            <p className="text-sm text-muted-foreground font-mono">{person.cpr}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Person info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Sidst kendte adresse</p>
              <p className="text-sm font-medium">{person.adresse}</p>
              <p className="text-sm text-muted-foreground">{person.postnr} {person.by}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="text-sm font-medium">{person.telefon || "Ukendt"}</p>
            </div>
          </div>
        </div>

        {/* Begrundelse */}
        {begrundelse && (
          <div className="rounded-lg bg-warning/5 border border-warning/15 p-4">
            <p className="text-[10px] text-warning uppercase tracking-wider font-semibold mb-1.5">Begrundelse for efterlysning</p>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{begrundelse}</p>
          </div>
        )}

        {/* Straffe / charges summary */}
        {sigtelser.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gavel className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-foreground">Eftersøgt for</h3>
            </div>

            {/* Summary stats */}
            {(totalBoede > 0 || totalFaengsel > 0) && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</p>
                  <p className="text-[10px] text-muted-foreground">Samlet bøde</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold font-mono text-foreground">{totalFaengsel} mdr</p>
                  <p className="text-[10px] text-muted-foreground">Fængsel</p>
                </div>
                <div className="rounded-lg bg-muted/20 p-3 text-center">
                  <p className="text-lg font-bold font-mono text-foreground">{sigtelser.reduce((s, sig) => s + sig.sigtelseBoeder.length, 0)}</p>
                  <p className="text-[10px] text-muted-foreground">Forhold</p>
                </div>
              </div>
            )}

            {/* Individual charges */}
            <div className="space-y-1.5">
              {sigtelser.map((sig) =>
                sig.sigtelseBoeder.map((b) => (
                  <div key={`${sig.id}-${b.boedeId}`}
                    className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/15 border border-border/50 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Scale className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-mono text-[10px] text-muted-foreground">{b.paragraf}</span>
                      <span className="truncate text-foreground">{b.beskrivelse}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {b.beloeb > 0 && <span className="font-mono text-warning">{b.beloeb.toLocaleString("da-DK")} kr</span>}
                      {b.faengselMaaneder > 0 && <span className="font-mono text-destructive">{b.faengselMaaneder} mdr</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Noter */}
        {person.noter && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Noter</p>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">{person.noter}</div>
          </div>
        )}

        <div>
          <p className="text-xs text-muted-foreground mb-1">Oprettet</p>
          <p className="text-sm font-medium">{person.oprettet}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Efterlysninger;
