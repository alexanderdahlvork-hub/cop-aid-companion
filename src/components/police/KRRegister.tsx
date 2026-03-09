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
import EfterlysningDialog from "./EfterlysningDialog";
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
  const [efterlysningDialogOpen, setEfterlysningDialogOpen] = useState(false);


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
              <div className="mt-2">
                {valgtPerson.status !== "eftersøgt" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
                    onClick={() => setEfterlysningDialogOpen(true)}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                    Efterlys person
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-success/30 text-success hover:bg-success/10 hover:text-success"
                    disabled={updatingStatus}
                    onClick={async () => {
                      setUpdatingStatus(true);
                      try {
                        await personerApi.update(valgtPerson.id, { status: "aktiv" });
                        const updated = { ...valgtPerson, status: "aktiv" as const };
                        setValgtPerson(updated);
                        setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
                        toast("Efterlysning fjernet");
                      } catch (err) {
                        console.error(err);
                        toast("Fejl ved fjernelse af efterlysning");
                      }
                      setUpdatingStatus(false);
                    }}
                  >
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Fjern efterlysning
                  </Button>
                )}
              </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {personSigtelser.map((sig) => {
                    const isLukket = sig.sagsStatus === "lukket";
                    const statusLabel = { aaben: "Åben", under_efterforskning: "Efterforskning", afventer_retten: "Afventer ret", lukket: "Lukket" }[sig.sagsStatus] || "Åben";
                    const statusCls = {
                      aaben: "bg-success/15 text-success",
                      under_efterforskning: "bg-primary/15 text-primary",
                      afventer_retten: "bg-warning/15 text-warning",
                      lukket: "bg-destructive/15 text-destructive",
                    }[sig.sagsStatus] || "";
                    return (
                      <div key={sig.id} className={cn(
                        "rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
                        isLukket ? "border-destructive/40" : "border-border"
                      )}
                        onClick={() => {
                          setRedigerSigtelse(sig);
                          setRedigerForm({
                            haendelsesforloeb: sig.rapport.haendelsesforloeb || "",
                            konfiskeredeGenstande: sig.rapport.konfiskeredeGenstande || "",
                            magtanvendelse: sig.rapport.magtanvendelse || "",
                            erkender: sig.erkender,
                            fratagKoerekort: sig.fratagKoerekort,
                            sigtelseBoeder: [...sig.sigtelseBoeder],
                            sagsStatus: sig.sagsStatus || "aaben",
                          });
                          setRedigerBoederOpen(false);
                          setRedigerBoederSoegning("");
                        }}
                      >
                        <div className={cn("px-3 py-2 border-b flex items-center justify-between",
                          isLukket ? "bg-destructive/10 border-destructive/20" : "bg-muted/25 border-border"
                        )}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Scale className={cn("w-3 h-3 shrink-0", isLukket ? "text-destructive" : "text-primary")} />
                            <span className={cn("text-[10px] font-semibold truncate", isLukket ? "text-destructive" : "text-foreground")}>{sig.dato}</span>
                          </div>
                          <Badge className={cn("text-[8px] px-1.5 py-0 h-4 shrink-0", statusCls)}>{statusLabel}</Badge>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Bøde</span>
                            <span className="text-[11px] font-mono font-bold text-warning">{sig.totalBoede.toLocaleString("da-DK")} kr</span>
                          </div>
                          {sig.faengselMaaneder > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Fængsel</span>
                              <span className="text-[11px] font-medium text-foreground">{sig.faengselMaaneder} mdr</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">Erkender</span>
                            <span className={cn("text-[10px] font-medium",
                              sig.erkender === true ? "text-success" : sig.erkender === false ? "text-destructive" : "text-muted-foreground"
                            )}>{sig.erkender === true ? "Ja" : sig.erkender === false ? "Nej" : "—"}</span>
                          </div>
                          {sig.sigtelseBoeder.length > 0 && (
                            <p className="text-[9px] text-muted-foreground/70 truncate">{sig.sigtelseBoeder.map(b => b.beskrivelse).join(", ")}</p>
                          )}
                        </div>
                        {sig.skabelonType && (
                          <div className="px-3 pb-1.5">
                            <Badge variant="outline" className="text-[8px] h-4">{sig.skabelonType}</Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {valgtPerson && (
        <EfterlysningDialog
          open={efterlysningDialogOpen}
          onOpenChange={setEfterlysningDialogOpen}
          person={valgtPerson}
          onEfterlysningOprettet={async (data) => {
            try {
              // Set person as eftersøgt
              await personerApi.update(valgtPerson.id, { status: "eftersøgt" });
              const updated = { ...valgtPerson, status: "eftersøgt" as const };
              setValgtPerson(updated);
              setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));

              // Create a sigtelse for the charges if any were selected
              if (data.sigtelseBoeder.length > 0) {
                const sig: Sigtelse = {
                  id: Date.now().toString(),
                  personId: valgtPerson.id,
                  personNavn: `${valgtPerson.fornavn} ${valgtPerson.efternavn}`,
                  personCpr: valgtPerson.cpr,
                  dato: new Date().toISOString().split("T")[0],
                  sigtelseBoeder: data.sigtelseBoeder,
                  totalBoede: data.totalBoede,
                  faengselMaaneder: data.totalFaengsel,
                  fratagKoerekort: false,
                  erkender: null,
                  involveretBetjente: [],
                  rapport: {
                    haendelsesforloeb: data.begrundelse,
                    konfiskeredeGenstande: "",
                    magtanvendelse: "",
                  },
                  skabelonType: "Efterlysning",
                  sagsStatus: "aaben",
                };
                await sigtelserApi.create(sig);
                setSigtelser((prev) => [sig, ...prev]);
              }

              toast("Efterlysning oprettet");
            } catch (err) {
              console.error("Fejl ved oprettelse af efterlysning:", err);
              toast("Fejl ved oprettelse af efterlysning");
            }
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

                {/* Section: Bødetakster */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-2">Bødetakster</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {redigerForm.sigtelseBoeder.length > 0 && (
                    <div className="rounded-md border border-border overflow-hidden">
                      <div className="divide-y divide-border/30">
                        {redigerForm.sigtelseBoeder.map((b, i) => (
                          <div key={i} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                            <span className="text-foreground truncate pr-2">{b.paragraf && `${b.paragraf} — `}{b.beskrivelse}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-warning">{b.beloeb.toLocaleString("da-DK")} kr</span>
                              {b.faengselMaaneder > 0 && <span className="text-destructive">{b.faengselMaaneder}md</span>}
                              <button onClick={() => setRedigerForm({ ...redigerForm, sigtelseBoeder: redigerForm.sigtelseBoeder.filter((_, j) => j !== i) })}
                                className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-t border-primary/15 text-xs">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold font-mono text-warning">
                          {redigerForm.sigtelseBoeder.reduce((s, b) => s + b.beloeb, 0).toLocaleString("da-DK")} kr
                        </span>
                      </div>
                    </div>
                  )}

                  <Collapsible open={redigerBoederOpen} onOpenChange={setRedigerBoederOpen}>
                    <CollapsibleTrigger asChild>
                      <Button className="w-full h-9 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-3.5 h-3.5" /> Tilføj / fjern bøder
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-2">
                        <Input placeholder="Søg paragraf eller beskrivelse..." value={redigerBoederSoegning}
                          onChange={(e) => setRedigerBoederSoegning(e.target.value)} className="bg-muted/30 border-border text-xs h-8" />
                        <div className="space-y-1 max-h-[250px] overflow-y-auto">
                          {(() => {
                            const filtered = redigerBoederSoegning
                              ? standardBoeder.filter(b => `${b.paragraf} ${b.beskrivelse}`.toLowerCase().includes(redigerBoederSoegning.toLowerCase()))
                              : standardBoeder;
                            const kats = Array.from(new Set(filtered.map(b => b.kategori)));
                            return kats.map(kat => {
                              const katBoeder = filtered.filter(b => b.kategori === kat);
                              const isOpen = redigerOpenKat === kat;
                              return (
                                <Collapsible key={kat} open={isOpen} onOpenChange={() => setRedigerOpenKat(isOpen ? null : kat)}>
                                  <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-muted/40 hover:bg-muted/60 transition-colors">
                                    <span className="text-[11px] font-medium text-foreground">{kat}</span>
                                    <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="mt-0.5 rounded border border-border overflow-hidden divide-y divide-border/30">
                                      {katBoeder.map(b => {
                                        const selected = redigerForm.sigtelseBoeder.some(v => v.boedeId === b.id);
                                        return (
                                          <button key={b.id} onClick={() => {
                                            if (selected) {
                                              setRedigerForm({ ...redigerForm, sigtelseBoeder: redigerForm.sigtelseBoeder.filter(v => v.boedeId !== b.id) });
                                            } else {
                                              setRedigerForm({ ...redigerForm, sigtelseBoeder: [...redigerForm.sigtelseBoeder, {
                                                boedeId: b.id, paragraf: b.paragraf, beskrivelse: b.beskrivelse, beloeb: b.beloeb, faengselMaaneder: b.faengselMaaneder || 0,
                                              }] });
                                            }
                                          }}
                                            className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                              selected ? "bg-primary/5" : "hover:bg-muted/20"
                                            )}>
                                            <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                                              selected ? "bg-primary border-primary" : "border-muted-foreground/25"
                                            )}>{selected && <Check className="w-2 h-2 text-primary-foreground" />}</div>
                                            <span className="flex-1 text-[11px] truncate">
                                              {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}{b.beskrivelse}
                                            </span>
                                            <span className="font-mono text-[9px] text-warning">{b.beloeb.toLocaleString("da-DK")}kr</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

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

                  {/* Sagsstatus */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Sagsstatus</Label>
                    <div className="flex gap-1.5">
                      {([
                        { value: "aaben" as const, label: "Åben", color: "bg-success/15 text-success border-success/20" },
                        { value: "under_efterforskning" as const, label: "Under efterforskning", color: "bg-primary/15 text-primary border-primary/20" },
                        { value: "afventer_retten" as const, label: "Afventer retten", color: "bg-warning/15 text-warning border-warning/20" },
                        { value: "lukket" as const, label: "Lukket", color: "bg-destructive/15 text-destructive border-destructive/20" },
                      ]).map((s) => (
                        <button key={s.value} onClick={() => setRedigerForm({ ...redigerForm, sagsStatus: s.value })}
                          className={cn("px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all",
                            redigerForm.sagsStatus === s.value ? s.color : "border-border text-muted-foreground hover:bg-muted/30"
                          )}>
                          {s.label}
                        </button>
                      ))}
                    </div>
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
                  sigtelseBoeder: redigerForm.sigtelseBoeder,
                  totalBoede: redigerForm.sigtelseBoeder.reduce((s, b) => s + b.beloeb, 0),
                  faengselMaaneder: redigerForm.sigtelseBoeder.reduce((s, b) => s + b.faengselMaaneder, 0),
                  sagsStatus: redigerForm.sagsStatus,
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
