import { useState, useEffect } from "react";
import {
  FileText, Scale, Shield, Car, Check, X, AlertTriangle,
  ChevronRight, ChevronDown, Loader2, Clock, Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { betjenteApi } from "@/lib/api";
import { standardBoeder } from "@/data/bodetakster";
import type { Person, Betjent, Boede, Sigtelse, SigtelseBoede, RapportSkabelon } from "@/types/police";
import { cn } from "@/lib/utils";
import FartBeregner from "./FartBeregner";

const rapportSkabeloner: RapportSkabelon[] = [
  {
    id: "overfald", navn: "Overfald",
    spoergsmaal: [
      "Hvornår fandt overfaldet sted (dato/tid)?",
      "Hvor fandt overfaldet sted (adresse/lokation)?",
      "Beskriv gerningsmanden(ernes) signalement",
      "Hvilke skader har offeret pådraget sig?",
      "Var der vidner til stede? Hvis ja, beskriv",
      "Blev der brugt våben? Hvis ja, hvilke?",
    ],
  },
  {
    id: "tyveri", navn: "Tyveri / Indbrud",
    spoergsmaal: [
      "Hvornår blev tyveriet opdaget (dato/tid)?",
      "Hvor fandt tyveriet sted (adresse)?",
      "Hvad er blevet stjålet (beskriv genstande)?",
      "Er der tegn på indbrud (opbrudt lås, knust rude)?",
      "Var der overvågning på stedet?",
      "Anslået værdi af stjålne genstande?",
    ],
  },
  {
    id: "faerdsel", navn: "Færdselsforseelse",
    spoergsmaal: [
      "Hvornår fandt hændelsen sted (dato/tid)?",
      "Hvor fandt hændelsen sted (vej/kryds)?",
      "Hvilket køretøj var involveret (mærke/nummerplade)?",
      "Hvilken forseelse blev begået?",
      "Var der passagerer i køretøjet?",
      "Blev der foretaget alkohol-/narkotikatest? Resultat?",
    ],
  },
  {
    id: "narkotika", navn: "Narkotikaforhold",
    spoergsmaal: [
      "Hvornår blev forholdet konstateret (dato/tid)?",
      "Hvor blev stofferne fundet/beslaglagt?",
      "Hvilken type stof (hash, kokain, amfetamin etc.)?",
      "Anslået mængde (gram/kg)?",
      "Var der tegn på salg/distribution?",
      "Blev der fundet udstyr (vægte, poser, kontanter)?",
    ],
  },
  {
    id: "vandalisme", navn: "Hærværk / Vandalisme",
    spoergsmaal: [
      "Hvornår fandt hærværket sted (dato/tid)?",
      "Hvor fandt hærværket sted (adresse)?",
      "Hvad er blevet beskadiget?",
      "Anslået skadeomfang/værdi?",
      "Er gerningsmand(en) identificeret?",
      "Var der vidner?",
    ],
  },
];

// Klip system: Danish point system for license
function getKlipStatus(totalKlip: number, tidligereKlip: number) {
  const samlet = totalKlip + tidligereKlip;
  if (samlet >= 3) {
    return {
      type: "ubetinget" as const,
      tekst: `${samlet} klip i alt — Ubetinget frakendelse af kørekort`,
      detalje: "Kørekortet frakendes i minimum 6 måneder. Ny køreprøve kræves.",
    };
  }
  if (samlet >= 2) {
    return {
      type: "betinget" as const,
      tekst: `${samlet} klip i alt — Betinget frakendelse`,
      detalje: "Ved yderligere klip inden for 3 år medfører det ubetinget frakendelse.",
    };
  }
  if (samlet >= 1) {
    return {
      type: "advarsel" as const,
      tekst: `${samlet} klip i alt`,
      detalje: "Personen har modtaget klip. Ved 3 klip inden for 3 år frakendes kørekortet.",
    };
  }
  return null;
}

interface OpretSigtelseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person;
  onSigtelseOprettet: (sigtelse: Sigtelse) => void;
  tidligereKlip?: number;
}

const OpretSigtelseDialog = ({ open, onOpenChange, person, onSigtelseOprettet, tidligereKlip = 0 }: OpretSigtelseDialogProps) => {
  const [step, setStep] = useState(0);
  const [betjente, setBetjente] = useState<Betjent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [valgteBoeder, setValgteBoeder] = useState<SigtelseBoede[]>([]);
  const [fratagKoerekort, setFratagKoerekort] = useState(false);
  const [erkender, setErkender] = useState<boolean | null>(null);
  const [valgteBetjente, setValgteBetjente] = useState<string[]>([]);

  const [haendelse, setHaendelse] = useState("");
  const [konfiskeret, setKonfiskeret] = useState("");
  const [magt, setMagt] = useState("");

  const [valgtSkabelon, setValgtSkabelon] = useState<RapportSkabelon | null>(null);
  const [skabelonSvar, setSkabelonSvar] = useState<Record<string, string>>({});

  const [openKat, setOpenKat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showKlipPopup, setShowKlipPopup] = useState(false);
  const [soegning, setSoegning] = useState("");
  const [fartOpen, setFartOpen] = useState(false);

  const boeder = standardBoeder;

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    betjenteApi.getAll()
      .then((bt) => setBetjente(bt))
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [open]);

  useEffect(() => {
    if (open) {
      setStep(0);
      setValgteBoeder([]);
      setFratagKoerekort(false);
      setErkender(null);
      setValgteBetjente([]);
      setHaendelse("");
      setKonfiskeret("");
      setMagt("");
      setValgtSkabelon(null);
      setSkabelonSvar({});
      setShowKlipPopup(false);
      setSoegning("");
    }
  }, [open]);

  // Calculate totals from actual data
  const totalBoede = valgteBoeder.reduce((s, b) => s + b.beloeb, 0);
  const totalKlip = valgteBoeder.reduce((s, b) => {
    const orig = boeder.find((x) => x.id === b.boedeId);
    return s + (orig?.klip || 0);
  }, 0);
  const totalFaengsel = valgteBoeder.reduce((s, b) => s + b.faengselMaaneder, 0);

  // Check frakendelse from selected items
  const harFrakendelse = valgteBoeder.some((b) => {
    const orig = boeder.find((x) => x.id === b.boedeId);
    return orig?.frakendelse;
  });
  const frakendelsesType = valgteBoeder.reduce((worst, b) => {
    const orig = boeder.find((x) => x.id === b.boedeId);
    if (orig?.frakendelse === "Ubetinget") return "Ubetinget";
    if (orig?.frakendelse === "Betinget" && worst !== "Ubetinget") return "Betinget";
    return worst;
  }, "" as string);

  const klipStatus = getKlipStatus(totalKlip, tidligereKlip);

  const toggleBoede = (b: Boede) => {
    const exists = valgteBoeder.find((v) => v.boedeId === b.id);
    if (exists) {
      setValgteBoeder(valgteBoeder.filter((v) => v.boedeId !== b.id));
    } else {
      setValgteBoeder([...valgteBoeder, {
        boedeId: b.id,
        paragraf: b.paragraf,
        beskrivelse: b.beskrivelse,
        beloeb: b.beloeb,
        faengselMaaneder: b.faengselMaaneder || 0,
      }]);
    }
  };

  const toggleBetjent = (id: string) => {
    setValgteBetjente((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtreretBoeder = soegning
    ? boeder.filter((b) => `${b.paragraf} ${b.beskrivelse}`.toLowerCase().includes(soegning.toLowerCase()))
    : boeder;
  const kategorier = Array.from(new Set(filtreretBoeder.map((b) => b.kategori)));

  const handleSubmit = () => {
    setSaving(true);
    const sigtelse: Sigtelse = {
      id: Date.now().toString(),
      personId: person.id,
      personNavn: `${person.fornavn} ${person.efternavn}`,
      personCpr: person.cpr,
      dato: new Date().toISOString().split("T")[0],
      sigtelseBoeder: valgteBoeder,
      totalBoede,
      faengselMaaneder: totalFaengsel,
      fratagKoerekort: fratagKoerekort || frakendelsesType === "Ubetinget",
      erkender,
      involveretBetjente: valgteBetjente,
      rapport: {
        haendelsesforloeb: haendelse,
        konfiskeredeGenstande: konfiskeret,
        magtanvendelse: magt,
        skabelonSvar: valgtSkabelon ? skabelonSvar : undefined,
      },
      skabelonType: valgtSkabelon?.id,
    };

    // Show klip popup if there are klip
    if (totalKlip > 0 && !showKlipPopup) {
      setShowKlipPopup(true);
      setSaving(false);
      return;
    }

    onSigtelseOprettet(sigtelse);
    setSaving(false);
    onOpenChange(false);
  };

  const confirmAndSubmit = () => {
    const sigtelse: Sigtelse = {
      id: Date.now().toString(),
      personId: person.id,
      personNavn: `${person.fornavn} ${person.efternavn}`,
      personCpr: person.cpr,
      dato: new Date().toISOString().split("T")[0],
      sigtelseBoeder: valgteBoeder,
      totalBoede,
      faengselMaaneder: totalFaengsel,
      fratagKoerekort: fratagKoerekort || frakendelsesType === "Ubetinget",
      erkender,
      involveretBetjente: valgteBetjente,
      rapport: {
        haendelsesforloeb: haendelse,
        konfiskeredeGenstande: konfiskeret,
        magtanvendelse: magt,
        skabelonSvar: valgtSkabelon ? skabelonSvar : undefined,
      },
      skabelonType: valgtSkabelon?.id,
    };
    onSigtelseOprettet(sigtelse);
    onOpenChange(false);
  };

  const steps = ["Sigtelser", "Rapport", "Betjente", "Oversigt"];

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Indlæser data...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Klip popup
  if (showKlipPopup) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Klipkort-advarsel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Tidligere klip:</span>
                <span className="font-bold font-mono text-foreground">{tidligereKlip}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Nye klip:</span>
                <span className="font-bold font-mono text-warning">+{totalKlip}</span>
              </div>
              <div className="border-t border-warning/20 pt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Klip i alt:</span>
                <span className="text-lg font-bold font-mono text-warning">{totalKlip + tidligereKlip}</span>
              </div>
            </div>

            {klipStatus && (
              <div className={cn(
                "p-4 rounded-lg border space-y-1",
                klipStatus.type === "ubetinget"
                  ? "bg-destructive/10 border-destructive/20"
                  : klipStatus.type === "betinget"
                    ? "bg-warning/10 border-warning/20"
                    : "bg-primary/10 border-primary/20"
              )}>
                <p className={cn(
                  "text-sm font-semibold",
                  klipStatus.type === "ubetinget" ? "text-destructive" : klipStatus.type === "betinget" ? "text-warning" : "text-primary"
                )}>
                  {klipStatus.tekst}
                </p>
                <p className="text-xs text-muted-foreground">{klipStatus.detalje}</p>
              </div>
            )}

            {(totalKlip + tidligereKlip) >= 3 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                <Car className="w-5 h-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Kørekort frakendes ubetinget</p>
                  <p className="text-xs text-muted-foreground">Min. 6 måneders frakendelse. Ny køreprøve påkrævet.</p>
                </div>
              </div>
            )}

            {(totalKlip + tidligereKlip) >= 2 && (totalKlip + tidligereKlip) < 3 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
                <Car className="w-5 h-5 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-warning">Betinget frakendelse</p>
                  <p className="text-xs text-muted-foreground">Yderligere klip inden 3 år medfører ubetinget frakendelse.</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowKlipPopup(false)}>
                Tilbage
              </Button>
              <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={confirmAndSubmit}>
                Bekræft sigtelse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Opret sigtelse — {person.fornavn} {person.efternavn}
            </DialogTitle>
          </DialogHeader>

          {/* Steps */}
          <div className="flex gap-1 mt-3">
            {steps.map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(i)}
                className={cn(
                  "flex-1 text-center py-1.5 rounded text-[11px] font-medium transition-colors",
                  step === i
                    ? "bg-primary text-primary-foreground"
                    : i < step
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 max-h-[55vh] px-5">
          {step === 0 && (
            <div className="space-y-2.5 pb-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Søg paragraf eller beskrivelse..."
                  value={soegning}
                  onChange={(e) => setSoegning(e.target.value)}
                  className="bg-muted/50 border-border text-sm h-8 flex-1"
                />
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 shrink-0" onClick={() => setFartOpen(true)}>
                  <Gauge className="w-3.5 h-3.5" /> Fartberegner
                </Button>
              </div>

              {kategorier.map((kat) => {
                const katBoeder = filtreretBoeder.filter((b) => b.kategori === kat);
                const isOpen = openKat === kat;
                return (
                  <div key={kat} className="rounded-md border border-border overflow-hidden">
                    <button
                      onClick={() => setOpenKat(isOpen ? null : kat)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <span className="text-xs font-medium text-foreground">{kat}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{katBoeder.length}</span>
                        {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-border/40">
                        {katBoeder.map((b) => {
                          const selected = valgteBoeder.some((v) => v.boedeId === b.id);
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleBoede(b)}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors",
                                selected ? "bg-primary/8" : "hover:bg-muted/30"
                              )}
                            >
                              <div className={cn(
                                "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                                selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                              )}>
                                {selected && <Check className="w-2 h-2 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] text-foreground">
                                  {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}
                                  {b.beskrivelse}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {(b.klip ?? 0) > 0 && <span className="text-[9px] text-primary font-medium">{b.klip} klip</span>}
                                {(b.faengselMaaneder ?? 0) > 0 && <span className="text-[9px] text-destructive font-medium">{b.faengselMaaneder} md.</span>}
                                <span className="text-[11px] font-mono text-warning ml-1">{b.beloeb.toLocaleString("da-DK")} kr</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary bar */}
              {valgteBoeder.length > 0 && (
                <div className="p-3 rounded-md bg-card border border-border">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Bøde</p>
                      <p className="text-xs font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Fængsel</p>
                      <p className="text-xs font-bold text-destructive">{totalFaengsel > 0 ? `${totalFaengsel} md.` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Klip</p>
                      <p className={cn("text-xs font-bold", totalKlip > 0 ? "text-primary" : "text-muted-foreground")}>{totalKlip > 0 ? `+${totalKlip}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Frakendelse</p>
                      <p className={cn("text-xs font-bold", frakendelsesType === "Ubetinget" ? "text-destructive" : frakendelsesType ? "text-warning" : "text-muted-foreground")}>
                        {frakendelsesType || "—"}
                      </p>
                    </div>
                  </div>
                  {klipStatus && (
                    <div className={cn(
                      "mt-2 p-2 rounded text-[11px] flex items-center gap-1.5",
                      klipStatus.type === "ubetinget" ? "bg-destructive/10 text-destructive"
                        : klipStatus.type === "betinget" ? "bg-warning/10 text-warning"
                        : "bg-primary/10 text-primary"
                    )}>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      {klipStatus.tekst}
                    </div>
                  )}
                </div>
              )}

              {/* Kørekort + erkender */}
              <div className="flex gap-2">
                <div className="flex items-center gap-2 flex-1 p-2 rounded-md bg-muted/30 border border-border">
                  <Checkbox checked={fratagKoerekort} onCheckedChange={(v) => setFratagKoerekort(!!v)} id="koerekort" />
                  <label htmlFor="koerekort" className="text-[11px] font-medium text-foreground cursor-pointer">Fratag kørekort</label>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant={erkender === true ? "default" : "outline"} onClick={() => setErkender(true)}
                  className={cn("flex-1 h-7 text-[11px]", erkender === true ? "bg-success hover:bg-success/90" : "")}>
                  <Check className="w-3 h-3 mr-1" /> Erkender
                </Button>
                <Button size="sm" variant={erkender === false ? "default" : "outline"} onClick={() => setErkender(false)}
                  className={cn("flex-1 h-7 text-[11px]", erkender === false ? "bg-destructive hover:bg-destructive/90" : "")}>
                  <X className="w-3 h-3 mr-1" /> Erkender ikke
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Rapportskabelon</p>
                <div className="flex flex-wrap gap-1">
                  {rapportSkabeloner.map((sk) => (
                    <Button key={sk.id} size="sm" variant={valgtSkabelon?.id === sk.id ? "default" : "outline"}
                      className="h-6 text-[10px] px-2"
                      onClick={() => { valgtSkabelon?.id === sk.id ? (setValgtSkabelon(null), setSkabelonSvar({})) : (setValgtSkabelon(sk), setSkabelonSvar({})); }}>
                      {sk.navn}
                    </Button>
                  ))}
                </div>
              </div>

              {valgtSkabelon && (
                <div className="p-3 rounded-md bg-primary/5 border border-primary/15 space-y-2.5">
                  <p className="text-xs font-medium text-primary">{valgtSkabelon.navn}</p>
                  {valgtSkabelon.spoergsmaal.map((sp, i) => (
                    <div key={i}>
                      <Label className="text-[11px] text-foreground">{sp}</Label>
                      <Textarea value={skabelonSvar[`q${i}`] || ""} onChange={(e) => setSkabelonSvar({ ...skabelonSvar, [`q${i}`]: e.target.value })} rows={2} className="mt-0.5 bg-muted/30 border-border text-xs" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Hændelsesforløb</Label>
                <Textarea placeholder="Beskriv hændelsesforløbet..." value={haendelse} onChange={(e) => setHaendelse(e.target.value)} rows={3} className="mt-1 bg-muted/30 border-border text-sm" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Konfiskerede genstande</Label>
                <Textarea placeholder="Genstande konfiskeret..." value={konfiskeret} onChange={(e) => setKonfiskeret(e.target.value)} rows={2} className="mt-1 bg-muted/30 border-border text-sm" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Magtanvendelse</Label>
                <Textarea placeholder="Brug af magtmidler..." value={magt} onChange={(e) => setMagt(e.target.value)} rows={2} className="mt-1 bg-muted/30 border-border text-sm" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1 pb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Involverede betjente</p>
              {betjente.map((b) => {
                const selected = valgteBetjente.includes(b.id);
                return (
                  <button key={b.id} onClick={() => toggleBetjent(b.id)}
                    className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors",
                      selected ? "bg-primary/8 border border-primary/20" : "hover:bg-muted/30 border border-transparent"
                    )}>
                    <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0", selected ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                      {selected && <Check className="w-2 h-2 text-primary-foreground" />}
                    </div>
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium">{b.fornavn} {b.efternavn}</p>
                      <p className="text-[10px] text-muted-foreground">{b.rang} — {b.badgeNr}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="pb-3">
              <div className="p-4 rounded-md bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{person.fornavn} {person.efternavn}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{person.cpr}</span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center p-2.5 rounded bg-muted/30">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Bøde</p>
                    <p className="text-xs font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Fængsel</p>
                    <p className="text-xs font-bold text-destructive">{totalFaengsel > 0 ? `${totalFaengsel} md.` : "Ingen"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Klip</p>
                    <p className="text-xs font-bold text-primary">{totalKlip > 0 ? `+${totalKlip}` : "Ingen"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Kørekort</p>
                    <p className={cn("text-xs font-bold", (fratagKoerekort || frakendelsesType === "Ubetinget") ? "text-destructive" : "text-success")}>
                      {fratagKoerekort || frakendelsesType === "Ubetinget" ? "Frataget" : frakendelsesType || "OK"}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-border/30">
                  {valgteBoeder.map((b) => (
                    <div key={b.boedeId} className="flex justify-between text-[11px] py-1.5">
                      <span className="text-foreground">{b.paragraf && `${b.paragraf} — `}{b.beskrivelse}</span>
                      <span className="font-mono text-warning shrink-0 ml-2">{b.beloeb.toLocaleString("da-DK")} kr</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  {erkender === true && <Badge className="bg-success/20 text-success border-success/30 text-[10px]">Erkender</Badge>}
                  {erkender === false && <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">Erkender ikke</Badge>}
                  {erkender === null && <Badge variant="outline" className="text-[10px]">Ikke angivet</Badge>}
                </div>

                {valgteBetjente.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {valgteBetjente.map((id) => {
                      const bt = betjente.find((x) => x.id === id);
                      return bt ? <Badge key={id} variant="outline" className="text-[9px]">{bt.fornavn} {bt.efternavn}</Badge> : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="h-7 text-xs">
            Tilbage
          </Button>
          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(step + 1)} className="h-7 text-xs">
              Næste <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={saving || valgteBoeder.length === 0}
              className="h-7 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Scale className="w-3.5 h-3.5 mr-1" />}
              Opret sigtelse
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <FartBeregner
      open={fartOpen}
      onOpenChange={setFartOpen}
      onTilfoejBoede={(beskrivelse, beloeb, klip, frakendelse) => {
        const id = `fart-${Date.now()}`;
        setValgteBoeder((prev) => [...prev, {
          boedeId: id,
          paragraf: "Fartoverskridelse",
          beskrivelse,
          beloeb,
          faengselMaaneder: 0,
        }]);
      }}
    />
    </>
  );
};

export default OpretSigtelseDialog;
