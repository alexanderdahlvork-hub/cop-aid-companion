import { useState, useEffect } from "react";
import {
  FileText, Scale, Shield, Car, Check, X, AlertTriangle,
  ChevronRight, ChevronDown, Loader2, Clock, Gauge, ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [skabelonOpen, setSkabelonOpen] = useState(false);

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
      setSkabelonOpen(false);
      setShowKlipPopup(false);
      setSoegning("");
    }
  }, [open]);

  const totalBoede = valgteBoeder.reduce((s, b) => s + b.beloeb, 0);
  const totalKlip = valgteBoeder.reduce((s, b) => {
    const orig = boeder.find((x) => x.id === b.boedeId);
    return s + (orig?.klip || 0);
  }, 0);
  const totalFaengsel = valgteBoeder.reduce((s, b) => s + b.faengselMaaneder, 0);

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

  const buildSigtelse = (): Sigtelse => ({
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
  });

  const handleSubmit = () => {
    setSaving(true);
    if (totalKlip > 0 && !showKlipPopup) {
      setShowKlipPopup(true);
      setSaving(false);
      return;
    }
    onSigtelseOprettet(buildSigtelse());
    setSaving(false);
    onOpenChange(false);
  };

  const confirmAndSubmit = () => {
    onSigtelseOprettet(buildSigtelse());
    onOpenChange(false);
  };

  const steps = [
    { label: "Sigtelser", icon: Scale },
    { label: "Rapport", icon: FileText },
    { label: "Betjente", icon: Shield },
    { label: "Oversigt", icon: ListChecks },
  ];

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
      <DialogContent className="max-w-[680px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header with person info */}
        <div className="px-5 pt-5 pb-4 border-b border-border bg-muted/20">
          <DialogHeader className="mb-0">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              Opret sigtelse
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">
                {person.fornavn[0]}{person.efternavn[0]}
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{person.fornavn} {person.efternavn}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{person.cpr}</p>
              </div>
            </div>
            {valgteBoeder.length > 0 && (
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-warning font-semibold font-mono">{totalBoede.toLocaleString("da-DK")} kr</span>
                {totalFaengsel > 0 && <span className="text-destructive font-semibold">{totalFaengsel} md.</span>}
                {totalKlip > 0 && <span className="text-primary font-semibold">+{totalKlip} klip</span>}
              </div>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex gap-0.5 mt-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-all",
                    step === i
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : i < step
                        ? "bg-success/10 text-success hover:bg-success/15"
                        : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5">
            {/* STEP 0: Sigtelser */}
            {step === 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Søg paragraf eller beskrivelse..."
                    value={soegning}
                    onChange={(e) => setSoegning(e.target.value)}
                    className="bg-muted/30 border-border text-xs h-8 flex-1"
                  />
                  <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1.5 shrink-0" onClick={() => setFartOpen(true)}>
                    <Gauge className="w-3 h-3" /> Fart
                  </Button>
                </div>

                <div className="space-y-1">
                  {kategorier.map((kat) => {
                    const katBoeder = filtreretBoeder.filter((b) => b.kategori === kat);
                    const isOpen = openKat === kat;
                    const selectedInKat = katBoeder.filter(b => valgteBoeder.some(v => v.boedeId === b.id)).length;
                    return (
                      <Collapsible key={kat} open={isOpen} onOpenChange={() => setOpenKat(isOpen ? null : kat)}>
                        <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-foreground">{kat}</span>
                            {selectedInKat > 0 && (
                              <Badge className="bg-primary/15 text-primary border-0 text-[9px] h-4 px-1.5">{selectedInKat}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-muted-foreground">{katBoeder.length}</span>
                            {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-0.5 rounded-md border border-border overflow-hidden divide-y divide-border/30">
                            {katBoeder.map((b) => {
                              const selected = valgteBoeder.some((v) => v.boedeId === b.id);
                              return (
                                <button
                                  key={b.id}
                                  onClick={() => toggleBoede(b)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                    selected ? "bg-primary/5" : "hover:bg-muted/20"
                                  )}
                                >
                                  <div className={cn(
                                    "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
                                    selected ? "bg-primary border-primary" : "border-muted-foreground/25"
                                  )}>
                                    {selected && <Check className="w-2 h-2 text-primary-foreground" />}
                                  </div>
                                  <span className="flex-1 text-[11px] text-foreground truncate">
                                    {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}
                                    {b.beskrivelse}
                                  </span>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {(b.klip ?? 0) > 0 && <span className="text-[9px] text-primary font-medium">{b.klip}klip</span>}
                                    {(b.faengselMaaneder ?? 0) > 0 && <span className="text-[9px] text-destructive font-medium">{b.faengselMaaneder}md</span>}
                                    <span className="text-[10px] font-mono text-warning ml-0.5">{b.beloeb.toLocaleString("da-DK")}kr</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>

                {/* Compact erkender + kørekort row */}
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/30 border border-border">
                    <Checkbox checked={fratagKoerekort} onCheckedChange={(v) => setFratagKoerekort(!!v)} id="koerekort" />
                    <label htmlFor="koerekort" className="text-[10px] font-medium text-foreground cursor-pointer whitespace-nowrap">Fratag kørekort</label>
                  </div>
                  <div className="flex gap-1 flex-1">
                    <Button size="sm" variant={erkender === true ? "default" : "outline"} onClick={() => setErkender(true)}
                      className={cn("flex-1 h-7 text-[10px]", erkender === true && "bg-success hover:bg-success/90 text-success-foreground")}>
                      <Check className="w-3 h-3 mr-0.5" /> Erkender
                    </Button>
                    <Button size="sm" variant={erkender === false ? "default" : "outline"} onClick={() => setErkender(false)}
                      className={cn("flex-1 h-7 text-[10px]", erkender === false && "bg-destructive hover:bg-destructive/90 text-destructive-foreground")}>
                      <X className="w-3 h-3 mr-0.5" /> Nej
                    </Button>
                  </div>
                </div>

                {/* Klip warning */}
                {klipStatus && (
                  <div className={cn(
                    "px-3 py-2 rounded-md text-[10px] flex items-center gap-1.5",
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

            {/* STEP 1: Rapport */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Collapsible template selector */}
                <Collapsible open={skabelonOpen} onOpenChange={setSkabelonOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-9 text-xs">
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        {valgtSkabelon ? `Skabelon: ${valgtSkabelon.navn}` : "Vælg rapportskabelon"}
                      </span>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", skabelonOpen && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {rapportSkabeloner.map((sk) => (
                        <button
                          key={sk.id}
                          onClick={() => {
                            if (valgtSkabelon?.id === sk.id) {
                              setValgtSkabelon(null);
                              setSkabelonSvar({});
                            } else {
                              setValgtSkabelon(sk);
                              setSkabelonSvar({});
                            }
                            setSkabelonOpen(false);
                          }}
                          className={cn(
                            "px-3 py-2 rounded-md border text-left transition-all text-[11px]",
                            valgtSkabelon?.id === sk.id
                              ? "border-primary bg-primary/5 text-primary font-medium"
                              : "border-border hover:border-primary/30 hover:bg-muted/30 text-foreground"
                          )}
                        >
                          {sk.navn}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Template questions */}
                {valgtSkabelon && (
                  <div className="rounded-md border border-primary/15 bg-primary/[0.02] overflow-hidden">
                    <div className="px-3 py-2 bg-primary/5 border-b border-primary/10">
                      <p className="text-[11px] font-medium text-primary">{valgtSkabelon.navn} — Spørgsmål</p>
                    </div>
                    <div className="p-3 space-y-3">
                      {valgtSkabelon.spoergsmaal.map((sp, i) => (
                        <div key={i}>
                          <Label className="text-[10px] font-medium text-foreground">{i + 1}. {sp}</Label>
                          <Textarea
                            value={skabelonSvar[`q${i}`] || ""}
                            onChange={(e) => setSkabelonSvar({ ...skabelonSvar, [`q${i}`]: e.target.value })}
                            rows={2}
                            className="mt-1 bg-background border-border text-xs resize-none"
                            placeholder="Skriv svar..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main report fields */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Hændelsesforløb *</Label>
                    <Textarea
                      placeholder="Beskriv hændelsesforløbet detaljeret..."
                      value={haendelse}
                      onChange={(e) => setHaendelse(e.target.value)}
                      rows={4}
                      className="mt-1 bg-muted/20 border-border text-xs resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Konfiskerede genstande</Label>
                      <Textarea
                        placeholder="Evt. genstande..."
                        value={konfiskeret}
                        onChange={(e) => setKonfiskeret(e.target.value)}
                        rows={2}
                        className="mt-1 bg-muted/20 border-border text-xs resize-none"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Magtanvendelse</Label>
                      <Textarea
                        placeholder="Evt. magtmidler..."
                        value={magt}
                        onChange={(e) => setMagt(e.target.value)}
                        rows={2}
                        className="mt-1 bg-muted/20 border-border text-xs resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Betjente */}
            {step === 2 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Involverede betjente</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {betjente.map((b) => {
                    const selected = valgteBetjente.includes(b.id);
                    return (
                      <button key={b.id} onClick={() => toggleBetjent(b.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all border",
                          selected
                            ? "border-primary/30 bg-primary/5"
                            : "border-transparent hover:bg-muted/30"
                        )}>
                        <div className={cn(
                          "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                          selected ? "bg-primary border-primary" : "border-muted-foreground/25"
                        )}>
                          {selected && <Check className="w-2 h-2 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium truncate">{b.fornavn} {b.efternavn}</p>
                          <p className="text-[9px] text-muted-foreground">{b.rang} · {b.badgeNr}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Oversigt */}
            {step === 3 && (
              <div className="space-y-3">
                {/* Summary card */}
                <div className="rounded-md border border-border overflow-hidden">
                  <div className="grid grid-cols-4 divide-x divide-border bg-muted/30">
                    <div className="p-2.5 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Bøde</p>
                      <p className="text-sm font-bold font-mono text-warning mt-0.5">{totalBoede.toLocaleString("da-DK")}</p>
                      <p className="text-[8px] text-muted-foreground">DKK</p>
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Fængsel</p>
                      <p className="text-sm font-bold text-destructive mt-0.5">{totalFaengsel > 0 ? totalFaengsel : "—"}</p>
                      <p className="text-[8px] text-muted-foreground">{totalFaengsel > 0 ? "måneder" : ""}</p>
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Klip</p>
                      <p className="text-sm font-bold text-primary mt-0.5">{totalKlip > 0 ? `+${totalKlip}` : "—"}</p>
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Kørekort</p>
                      <p className={cn("text-sm font-bold mt-0.5", (fratagKoerekort || frakendelsesType === "Ubetinget") ? "text-destructive" : "text-success")}>
                        {fratagKoerekort || frakendelsesType === "Ubetinget" ? "✗" : frakendelsesType || "✓"}
                      </p>
                    </div>
                  </div>

                  {/* Charges list */}
                  <div className="divide-y divide-border/30">
                    {valgteBoeder.map((b) => (
                      <div key={b.boedeId} className="flex justify-between items-center px-3 py-1.5">
                        <span className="text-[11px] text-foreground truncate pr-2">
                          {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}{b.beskrivelse}
                        </span>
                        <span className="text-[10px] font-mono text-warning shrink-0">{b.beloeb.toLocaleString("da-DK")} kr</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-1.5">
                  {erkender === true && <Badge className="bg-success/15 text-success border-success/20 text-[10px]">Erkender</Badge>}
                  {erkender === false && <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px]">Erkender ikke</Badge>}
                  {erkender === null && <Badge variant="outline" className="text-[10px]">Ikke angivet</Badge>}
                  {valgtSkabelon && <Badge variant="outline" className="text-[10px]">{valgtSkabelon.navn}</Badge>}
                  {valgteBetjente.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">{valgteBetjente.length} betjent{valgteBetjente.length > 1 ? "e" : ""}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/10">
          <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="h-7 text-[11px]">
            Tilbage
          </Button>
          <div className="flex items-center gap-1.5">
            {step === 0 && valgteBoeder.length > 0 && (
              <span className="text-[10px] text-muted-foreground mr-2">{valgteBoeder.length} valgt</span>
            )}
            {step < 3 ? (
              <Button size="sm" onClick={() => setStep(step + 1)} className="h-7 text-[11px] gap-1">
                Næste <ChevronRight className="w-3 h-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={saving || valgteBoeder.length === 0}
                className="h-7 text-[11px] bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Scale className="w-3 h-3" />}
                Opret sigtelse
              </Button>
            )}
          </div>
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
