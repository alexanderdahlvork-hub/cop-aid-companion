import { useState, useEffect } from "react";
import { Search, Plus, AlertTriangle, Loader2, Scale, X, FileText, Pencil, Save, Building, Car, Phone, Check, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { personerApi, sigtelserApi, ejendommeApi, koeretoejerApi } from "@/lib/api";
import type { Person, Sigtelse, Ejendom, Koeretoej, SigtelseBoede, SagsStatus } from "@/types/police";
import OpretSigtelseDialog from "./OpretSigtelseDialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { standardBoeder } from "@/data/bodetakster";

const statusConfig: Record<Person["status"], { label: string; dot: string; bg: string }> = {
  aktiv: { label: "Aktiv", dot: "bg-success", bg: "bg-success/10 text-success border-success/20" },
  eftersøgt: { label: "Eftersøgt", dot: "bg-warning", bg: "bg-warning/10 text-warning border-warning/20" },
  anholdt: { label: "Anholdt", dot: "bg-destructive", bg: "bg-destructive/10 text-destructive border-destructive/20" },
  sigtet: { label: "Sigtet", dot: "bg-primary", bg: "bg-primary/10 text-primary border-primary/20" },
};

const KRRegister = () => {
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [valgtPerson, setValgtPerson] = useState<Person | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nyPerson, setNyPerson] = useState<Partial<Person>>({ status: "aktiv" });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sigtelseDialogOpen, setSigtelseDialogOpen] = useState(false);
  const [sigtelser, setSigtelser] = useState<Sigtelse[]>([]);
  const [ejendomme, setEjendomme] = useState<Ejendom[]>([]);
  const [koeretoejer, setKoeretoejer] = useState<Koeretoej[]>([]);
  const [redigerSigtelse, setRedigerSigtelse] = useState<Sigtelse | null>(null);
  const [redigerForm, setRedigerForm] = useState<{ haendelsesforloeb: string; konfiskeredeGenstande: string; magtanvendelse: string; erkender: boolean | null; fratagKoerekort: boolean; sigtelseBoeder: SigtelseBoede[]; sagsStatus: SagsStatus } | null>(null);
  const [gemmerRedigering, setGemmerRedigering] = useState(false);
  const [redigerBoederOpen, setRedigerBoederOpen] = useState(false);
  const [redigerBoederSoegning, setRedigerBoederSoegning] = useState("");
  const [redigerOpenKat, setRedigerOpenKat] = useState<string | null>(null);


  useEffect(() => {
    const load = async () => {
      try {
        const personData = await personerApi.getAll();
        setPersoner(personData);
      } catch (err) {
        console.error("Fejl ved indlæsning af personer:", err);
      }
      try {
        const sigtelseData = await sigtelserApi.getAll();
        setSigtelser(sigtelseData);
      } catch (err) {
        console.error("Fejl ved indlæsning af sigtelser:", err);
      }
      try {
        const ejendomData = await ejendommeApi.getAll();
        setEjendomme(ejendomData);
      } catch (err) {
        console.error("Fejl ved indlæsning af ejendomme:", err);
      }
      try {
        const koeretoejData = await koeretoejerApi.getAll();
        setKoeretoejer(koeretoejData);
      } catch (err) {
        console.error("Fejl ved indlæsning af køretøjer:", err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtreret = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  const personSigtelser = valgtPerson ? sigtelser.filter((s) => s.personId === valgtPerson.id) : [];

  const totalBoede = personSigtelser.reduce((sum, s) => sum + s.totalBoede, 0);
  const totalFaengsel = personSigtelser.reduce((sum, s) => sum + s.faengselMaaneder, 0);
  const totalKlip = personSigtelser.reduce((sum, s) => {
    return sum + s.sigtelseBoeder.reduce((k, b) => k, 0);
  }, 0);

  const opretPerson = async () => {
    setSaving(true);
    const person: Person = {
      id: Date.now().toString(),
      cpr: nyPerson.cpr || "",
      fornavn: nyPerson.fornavn || "",
      efternavn: nyPerson.efternavn || "",
      adresse: nyPerson.adresse || "",
      postnr: nyPerson.postnr || "",
      by: nyPerson.by || "",
      telefon: nyPerson.telefon || "",
      status: nyPerson.status as Person["status"] || "aktiv",
      noter: nyPerson.noter || "",
      oprettet: new Date().toISOString().split("T")[0],
    };
    try {
      await personerApi.create(person);
      setPersoner([person, ...personer]);
      setNyPerson({ status: "aktiv" });
      setDialogOpen(false);
    } catch (err) {
      console.error("Fejl ved oprettelse:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Person list */}
      <div className={cn(
        "flex flex-col border-r border-border bg-card/30",
        valgtPerson ? "w-64 shrink-0 hidden lg:flex" : "flex-1"
      )}>
        <div className="p-3 border-b border-border flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Søg navn eller CPR..."
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              className="pl-8 h-8 text-xs bg-background border-border"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0 shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">Opret person</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fornavn</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.fornavn || ""} onChange={(e) => setNyPerson({ ...nyPerson, fornavn: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Efternavn</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.efternavn || ""} onChange={(e) => setNyPerson({ ...nyPerson, efternavn: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">CPR</Label>
                  <Input className="h-8 text-sm mt-0.5" placeholder="DDMMÅÅ-XXXX" value={nyPerson.cpr || ""} onChange={(e) => setNyPerson({ ...nyPerson, cpr: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Adresse</Label>
                  <Input className="h-8 text-sm mt-0.5" value={nyPerson.adresse || ""} onChange={(e) => setNyPerson({ ...nyPerson, adresse: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Postnr</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.postnr || ""} onChange={(e) => setNyPerson({ ...nyPerson, postnr: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">By</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.by || ""} onChange={(e) => setNyPerson({ ...nyPerson, by: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefon</Label>
                  <Input className="h-8 text-sm mt-0.5" value={nyPerson.telefon || ""} onChange={(e) => setNyPerson({ ...nyPerson, telefon: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={nyPerson.status || "aktiv"} onValueChange={(v) => setNyPerson({ ...nyPerson, status: v as Person["status"] })}>
                    <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["aktiv", "eftersøgt", "anholdt", "sigtet"] as const).map((s) => (
                        <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Noter</Label>
                  <Textarea className="text-sm mt-0.5" rows={2} value={nyPerson.noter || ""} onChange={(e) => setNyPerson({ ...nyPerson, noter: e.target.value })} />
                </div>
                <Button onClick={opretPerson} disabled={saving} className="h-8 text-xs mt-1">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Opret
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtreret.map((person) => {
            const active = valgtPerson?.id === person.id;
            const pSigtelser = sigtelser.filter(s => s.personId === person.id);
            return (
              <button
                key={person.id}
                onClick={() => setValgtPerson(person)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-border/30 transition-colors",
                  active ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/30"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusConfig[person.status].dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{person.fornavn} {person.efternavn}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{person.cpr}</p>
                </div>
                {pSigtelser.length > 0 && (
                  <span className="text-[9px] text-muted-foreground">{pSigtelser.length}</span>
                )}
              </button>
            );
          })}
          {filtreret.length === 0 && (
            <p className="text-center py-8 text-xs text-muted-foreground">Ingen resultater</p>
          )}
        </div>
      </div>

      {/* Right: Detail view — inspired by reference but custom design */}
      {valgtPerson ? (
        <ScrollArea className="flex-1 h-full max-h-[calc(100vh-4rem)]">
          <div className="p-5 space-y-5 max-w-3xl">
            {/* Back button on mobile */}
            <button
              onClick={() => setValgtPerson(null)}
              className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <X className="w-3.5 h-3.5" /> Tilbage
            </button>

            {/* Person header row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {valgtPerson.fornavn[0]}{valgtPerson.efternavn[0]}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{valgtPerson.fornavn} {valgtPerson.efternavn}</h2>
                  <p className="text-xs text-muted-foreground font-mono">{valgtPerson.cpr}</p>
                </div>
              </div>
              <Badge className={cn("text-[10px] border", statusConfig[valgtPerson.status].bg)}>
                {statusConfig[valgtPerson.status].label}
              </Badge>
            </div>

            {valgtPerson.status === "eftersøgt" && (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-warning/8 border border-warning/15">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <span className="text-xs text-warning font-medium">Denne person er eftersøgt</span>
              </div>
            )}

            {/* Info fields — dark input style like reference */}
            <div className="space-y-3">
              <SectionTitle>Personoplysninger</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <ReadonlyField label="Fornavn" value={valgtPerson.fornavn} />
                <ReadonlyField label="Efternavn" value={valgtPerson.efternavn} />
                <ReadonlyField label="CPR-nummer" value={valgtPerson.cpr} />
                <ReadonlyField label="Telefon" value={valgtPerson.telefon || "—"} />
                <ReadonlyField label="Adresse" value={valgtPerson.adresse} />
                <ReadonlyField label="Postnr / By" value={`${valgtPerson.postnr} ${valgtPerson.by}`} />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <SectionTitle>Status</SectionTitle>
              <Select
                value={valgtPerson.status}
                onValueChange={async (v) => {
                  const s = v as Person["status"];
                  setUpdatingStatus(true);
                  try {
                    await personerApi.update(valgtPerson.id, { status: s });
                    const updated = { ...valgtPerson, status: s };
                    setValgtPerson(updated);
                    setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
                  } catch (err) {
                    console.error(err);
                  }
                  setUpdatingStatus(false);
                }}
              >
                <SelectTrigger className="h-9 text-xs bg-muted/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["aktiv", "eftersøgt", "anholdt", "sigtet"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", statusConfig[s].dot)} />
                        {statusConfig[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beskrivelse / noter */}
            {valgtPerson.noter && (
              <div className="space-y-2">
                <SectionTitle>Beskrivelse</SectionTitle>
                <div className="bg-muted/30 border border-border rounded-md p-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {valgtPerson.noter}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <ReadonlyField label="Oprettet af" value="System" />
              <ReadonlyField label="Oprettet" value={valgtPerson.oprettet} />
            </div>

            {/* Telefon highlight */}
            {valgtPerson.telefon && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/15">
                <Phone className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Telefonnummer</p>
                  <p className="text-sm font-mono font-semibold text-foreground">{valgtPerson.telefon}</p>
                </div>
              </div>
            )}

            {/* Ejendomme */}
            {(() => {
              const personEjendomme = ejendomme.filter(e =>
                e.ejerCpr === valgtPerson.cpr ||
                e.ejer.toLowerCase() === `${valgtPerson.fornavn} ${valgtPerson.efternavn}`.toLowerCase()
              );
              return (
                <div className="space-y-2">
                  <SectionTitle>Ejendomme ({personEjendomme.length})</SectionTitle>
                  {personEjendomme.length > 0 ? (
                    <div className="space-y-2">
                      {personEjendomme.map((ej) => (
                        <div key={ej.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                          <Building className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{ej.adresse}</p>
                            <p className="text-xs text-muted-foreground">{ej.postnr} {ej.by}</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground">Matrikel: {ej.matrikelnr}</span>
                              <span className="text-[10px] text-muted-foreground">Type: {ej.type}</span>
                              <span className="text-[10px] text-muted-foreground">Vurd.: {ej.vurdering.toLocaleString("da-DK")} kr.</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Ingen ejendomme registreret</p>
                  )}
                </div>
              );
            })()}

            {/* Køretøjer */}
            {(() => {
              const personBiler = koeretoejer.filter(k =>
                k.tildelt.toLowerCase() === `${valgtPerson.fornavn} ${valgtPerson.efternavn}`.toLowerCase() ||
                k.tildelt === valgtPerson.cpr
              );
              return (
                <div className="space-y-2">
                  <SectionTitle>Køretøjer ({personBiler.length})</SectionTitle>
                  {personBiler.length > 0 ? (
                    <div className="space-y-2">
                      {personBiler.map((bil) => (
                        <div key={bil.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                          <Car className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-semibold text-foreground">{bil.nummerplade}</span>
                              {bil.status === "eftersøgt" && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-destructive/15 text-destructive">Eftersøgt</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{bil.maerke} {bil.model} ({bil.aargang})</p>
                            <div className="flex gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground">Farve: {bil.farve}</span>
                              <span className="text-[10px] text-muted-foreground">Km: {bil.km.toLocaleString("da-DK")}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Ingen køretøjer registreret</p>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SectionTitle>Sigtelser</SectionTitle>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setSigtelseDialogOpen(true)} className="h-8 text-xs gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Tilføj sigtelse
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5"
                    onClick={() => toast("Bødeforlæg-funktion kommer snart")}>
                    <FileText className="w-3.5 h-3.5" /> Opret bødeforlæg
                  </Button>
                </div>
              </div>

              {personSigtelser.length > 0 ? (
                <div className="space-y-4">
                  {personSigtelser.map((sig) => (
                    <div key={sig.id} className="rounded-lg border border-border overflow-hidden">
                      {/* Sigtelse header with date */}
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/25 border-b border-border">
                        <div className="flex items-center gap-3">
                          <Scale className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">Sigtelse — {sig.dato}</span>
                          {sig.skabelonType && (
                            <Badge variant="outline" className="text-[10px]">{sig.skabelonType}</Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setRedigerSigtelse(sig);
                            setRedigerForm({
                              haendelsesforloeb: sig.rapport.haendelsesforloeb || "",
                              konfiskeredeGenstande: sig.rapport.konfiskeredeGenstande || "",
                              magtanvendelse: sig.rapport.magtanvendelse || "",
                              erkender: sig.erkender,
                              fratagKoerekort: sig.fratagKoerekort,
                            });
                          }}
                        >
                          <Pencil className="w-3 h-3" /> Rediger
                        </Button>
                      </div>

                      {/* Charges table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/15">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Beskrivelse</th>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Lovhenvisning</th>
                              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Bøde (DKK)</th>
                              <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Fængsel</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">Klip</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sig.sigtelseBoeder.map((b, i) => (
                              <tr key={i} className="border-b border-border/30 hover:bg-muted/5 transition-colors">
                                <td className="px-4 py-2.5 text-sm text-foreground">{b.beskrivelse}</td>
                                <td className="px-4 py-2.5 text-sm text-muted-foreground font-mono">{b.paragraf || "—"}</td>
                                <td className="px-4 py-2.5 text-sm font-mono text-warning text-right">{b.beloeb.toLocaleString("da-DK")} kr</td>
                                <td className="px-4 py-2.5 text-sm text-right">{b.faengselMaaneder > 0 ? `${b.faengselMaaneder} måneder` : "—"}</td>
                                <td className="px-4 py-2.5 text-sm text-center text-muted-foreground">0</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-primary/5 border-t border-primary/20">
                              <td className="px-4 py-3 text-sm font-bold text-foreground">Total</td>
                              <td />
                              <td className="px-4 py-3 text-sm font-bold font-mono text-warning text-right">{sig.totalBoede.toLocaleString("da-DK")} DKK</td>
                              <td className="px-4 py-3 text-sm font-bold text-right">{sig.faengselMaaneder > 0 ? `${sig.faengselMaaneder} måneder` : "—"}</td>
                              <td className="px-4 py-3 text-sm font-bold text-center">0 point</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Bottom info: erkender, kørekort, betjente */}
                      <div className="px-4 py-3 border-t border-border bg-muted/10 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Erkender:</span>
                          {sig.erkender === true && (
                            <Badge className="bg-success/15 text-success border-success/20 text-xs px-2">Ja</Badge>
                          )}
                          {sig.erkender === false && (
                            <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs px-2">Nej</Badge>
                          )}
                          {sig.erkender === null && (
                            <Badge variant="outline" className="text-xs px-2">Ikke angivet</Badge>
                          )}
                        </div>
                        <div className="w-px h-4 bg-border" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Kørekort:</span>
                          <Badge className={cn("text-xs px-2", sig.fratagKoerekort
                            ? "bg-destructive/15 text-destructive border-destructive/20"
                            : "bg-success/15 text-success border-success/20"
                          )}>
                            {sig.fratagKoerekort ? "Frataget" : "OK"}
                          </Badge>
                        </div>
                        {sig.involveretBetjente.length > 0 && (
                          <>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Betjente:</span>
                              <span className="text-xs text-foreground">{sig.involveretBetjente.length} involveret</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Rapport summary if present */}
                      {sig.rapport.haendelsesforloeb && (
                        <div className="px-4 py-3 border-t border-border/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Hændelsesforløb</p>
                          <p className="text-sm text-foreground/80 leading-relaxed">{sig.rapport.haendelsesforloeb}</p>
                        </div>
                      )}

                      {/* Konfiskerede + magt */}
                      {(sig.rapport.konfiskeredeGenstande || sig.rapport.magtanvendelse) && (
                        <div className="grid grid-cols-2 gap-0 border-t border-border/50">
                          {sig.rapport.konfiskeredeGenstande && (
                            <div className="px-4 py-3 border-r border-border/50">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Beslaglagte genstande</p>
                              <p className="text-sm text-foreground/80">{sig.rapport.konfiskeredeGenstande}</p>
                            </div>
                          )}
                          {sig.rapport.magtanvendelse && (
                            <div className="px-4 py-3">
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Magtanvendelse</p>
                              <p className="text-sm text-foreground/80">{sig.rapport.magtanvendelse}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/10 p-8 text-center">
                  <Scale className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ingen sigtelser registreret</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Tryk "Tilføj sigtelse" for at oprette en</p>
                </div>
              )}
            </div>

          </div>
        </ScrollArea>
      ) : (
        filtreret.length > 0 && (
          <div className="hidden lg:flex flex-1 items-center justify-center text-muted-foreground text-xs">
            Vælg en person fra listen
          </div>
        )
      )}

      {valgtPerson && (
        <OpretSigtelseDialog
          open={sigtelseDialogOpen}
          onOpenChange={setSigtelseDialogOpen}
          person={valgtPerson}
          onSigtelseOprettet={async (sig) => {
            setSigtelser((prev) => [sig, ...prev]);
            const updated = { ...valgtPerson, status: "sigtet" as const };
            setValgtPerson(updated);
            setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            try {
              await Promise.all([
                sigtelserApi.create(sig),
                personerApi.update(valgtPerson.id, { status: "sigtet" }),
              ]);
            } catch (err) {
              console.error("Fejl ved gemning af sigtelse:", err);
              toast.error("Kunne ikke gemme sigtelsen");
            }
            toast("Sigtelse oprettet og gemt");
          }}
        />
      )}

      {/* Rediger sigtelse dialog */}
      <Dialog open={!!redigerSigtelse} onOpenChange={(open) => { if (!open) { setRedigerSigtelse(null); setRedigerForm(null); } }}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
          {/* Sticky header */}
          <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
            <DialogTitle className="text-base font-semibold">Rediger sigtelse</DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Dato: {redigerSigtelse?.dato} · {redigerSigtelse?.skabelonType}</p>
          </DialogHeader>

          {/* Scrollable body */}
          {redigerForm && (
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 space-y-6">

                {/* Section: Rapport */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2">Rapport</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Hændelsesforløb</Label>
                    <Textarea
                      className="text-sm resize-none bg-muted/20 border-border focus-visible:ring-1 leading-relaxed"
                      rows={7}
                      placeholder="Beskriv hændelsesforløbet i detaljer..."
                      value={redigerForm.haendelsesforloeb}
                      onChange={(e) => setRedigerForm({ ...redigerForm, haendelsesforloeb: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground text-right">{redigerForm.haendelsesforloeb.length} tegn</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Beslaglagte genstande</Label>
                      <Textarea
                        className="text-sm resize-none bg-muted/20 border-border focus-visible:ring-1"
                        rows={4}
                        placeholder="F.eks. mobiltelefon, kontanter..."
                        value={redigerForm.konfiskeredeGenstande}
                        onChange={(e) => setRedigerForm({ ...redigerForm, konfiskeredeGenstande: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Magtanvendelse</Label>
                      <Textarea
                        className="text-sm resize-none bg-muted/20 border-border focus-visible:ring-1"
                        rows={4}
                        placeholder="Beskriv eventuel magtanvendelse..."
                        value={redigerForm.magtanvendelse}
                        onChange={(e) => setRedigerForm({ ...redigerForm, magtanvendelse: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Status */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2">Status</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Erkender sigtelsen</Label>
                      <Select
                        value={redigerForm.erkender === null ? "null" : redigerForm.erkender ? "ja" : "nej"}
                        onValueChange={(v) => setRedigerForm({ ...redigerForm, erkender: v === "null" ? null : v === "ja" })}
                      >
                        <SelectTrigger className="h-9 text-sm bg-muted/20 border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Ikke angivet</SelectItem>
                          <SelectItem value="ja">Ja — erkender</SelectItem>
                          <SelectItem value="nej">Nej — erkender ikke</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Kørekort</Label>
                      <div
                        className={cn(
                          "h-9 flex items-center gap-2.5 px-3 rounded-md border cursor-pointer transition-colors text-sm",
                          redigerForm.fratagKoerekort
                            ? "bg-destructive/10 border-destructive/30 text-destructive"
                            : "bg-muted/20 border-border text-foreground"
                        )}
                        onClick={() => setRedigerForm({ ...redigerForm, fratagKoerekort: !redigerForm.fratagKoerekort })}
                      >
                        <input
                          type="checkbox"
                          id="fratagKoerekort"
                          checked={redigerForm.fratagKoerekort}
                          onChange={(e) => setRedigerForm({ ...redigerForm, fratagKoerekort: e.target.checked })}
                          className="w-3.5 h-3.5 accent-destructive pointer-events-none"
                        />
                        <span>{redigerForm.fratagKoerekort ? "Kørekort frataget" : "Kørekort ikke frataget"}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </ScrollArea>
          )}

          {/* Sticky footer */}
          <div className="px-6 py-4 border-t border-border bg-card shrink-0 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Ændringer gemmes direkte på sigtelsen</p>
            <Button
              className="h-9 px-5 text-sm gap-2"
              disabled={gemmerRedigering}
              onClick={async () => {
                if (!redigerSigtelse || !redigerForm) return;
                setGemmerRedigering(true);
                const opdateret: Sigtelse = {
                  ...redigerSigtelse,
                  erkender: redigerForm.erkender,
                  fratagKoerekort: redigerForm.fratagKoerekort,
                  rapport: {
                    ...redigerSigtelse.rapport,
                    haendelsesforloeb: redigerForm.haendelsesforloeb,
                    konfiskeredeGenstande: redigerForm.konfiskeredeGenstande,
                    magtanvendelse: redigerForm.magtanvendelse,
                  },
                };
                try {
                  await sigtelserApi.update(redigerSigtelse.id, opdateret);
                  setSigtelser((prev) => prev.map((s) => s.id === opdateret.id ? opdateret : s));
                  toast("Sigtelse opdateret");
                  setRedigerSigtelse(null);
                  setRedigerForm(null);
                } catch (err) {
                  toast.error("Kunne ikke gemme ændringer");
                  console.error(err);
                } finally {
                  setGemmerRedigering(false);
                }
              }}
            >
              {gemmerRedigering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Gem ændringer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-foreground">{children}</h3>
);

const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
    <div className="bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-foreground min-h-[34px] flex items-center">
      {value || "—"}
    </div>
  </div>
);

export default KRRegister;
