import { useState, useEffect } from "react";
import {
  FileText, Scale, Shield, Users, Car, Check, X,
  ChevronRight, ChevronDown, Loader2, Plus, Minus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { boederApi, betjenteApi } from "@/lib/api";
import type { Person, Betjent, Boede, Sigtelse, SigtelseBoede, RapportSkabelon } from "@/types/police";
import { cn } from "@/lib/utils";

const rapportSkabeloner: RapportSkabelon[] = [
  {
    id: "overfald",
    navn: "Overfald",
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
    id: "tyveri",
    navn: "Tyveri / Indbrud",
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
    id: "faerdsel",
    navn: "Færdselsforseelse",
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
    id: "narkotika",
    navn: "Narkotikaforhold",
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
    id: "vandalisme",
    navn: "Hærværk / Vandalisme",
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

// Simple fine-to-prison mapping
function estimerFaengsel(totalBoede: number): number {
  if (totalBoede < 5000) return 0;
  if (totalBoede < 15000) return 1;
  if (totalBoede < 30000) return 3;
  if (totalBoede < 60000) return 6;
  if (totalBoede < 100000) return 12;
  return 24;
}

interface OpretSigtelseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person;
  onSigtelseOprettet: (sigtelse: Sigtelse) => void;
}

const OpretSigtelseDialog = ({ open, onOpenChange, person, onSigtelseOprettet }: OpretSigtelseDialogProps) => {
  const [step, setStep] = useState(0);
  const [boeder, setBoeder] = useState<Boede[]>([]);
  const [betjente, setBetjente] = useState<Betjent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Selections
  const [valgteBoeder, setValgteBoeder] = useState<SigtelseBoede[]>([]);
  const [fratagKoerekort, setFratagKoerekort] = useState(false);
  const [erkender, setErkender] = useState<boolean | null>(null);
  const [valgteBetjente, setValgteBetjente] = useState<string[]>([]);

  // Rapport
  const [haendelse, setHaendelse] = useState("");
  const [konfiskeret, setKonfiskeret] = useState("");
  const [magt, setMagt] = useState("");

  // Skabelon
  const [valgtSkabelon, setValgtSkabelon] = useState<RapportSkabelon | null>(null);
  const [skabelonSvar, setSkabelonSvar] = useState<Record<string, string>>({});

  // Open categories
  const [openKat, setOpenKat] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([boederApi.getAll(), betjenteApi.getAll()])
      .then(([b, bt]) => { setBoeder(b); setBetjente(bt); })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [open]);

  // Reset on open
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
    }
  }, [open]);

  const totalBoede = valgteBoeder.reduce((s, b) => s + b.beloeb, 0);
  const faengselMaaneder = estimerFaengsel(totalBoede);

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
        faengselMaaneder: 0,
      }]);
    }
  };

  const toggleBetjent = (id: string) => {
    setValgteBetjente((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Group boeder by kategori
  const kategorier = Array.from(new Set(boeder.map((b) => b.kategori)));

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
      faengselMaaneder,
      fratagKoerekort,
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
    setSaving(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Opret sigtelse — {person.fornavn} {person.efternavn}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-1 pb-2">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={cn(
                "flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all",
                step === i
                  ? "bg-primary text-primary-foreground"
                  : i < step
                    ? "bg-success/20 text-success"
                    : "bg-secondary text-muted-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <ScrollArea className="flex-1 max-h-[55vh]">
          {/* Step 0: Vælg sigtelser/bøder */}
          {step === 0 && (
            <div className="space-y-3 pr-3">
              <p className="text-xs text-muted-foreground">Vælg de lovovertrædelser personen sigtes for:</p>

              {kategorier.map((kat) => {
                const katBoeder = boeder.filter((b) => b.kategori === kat);
                const isOpen = openKat === kat;
                return (
                  <div key={kat} className="rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setOpenKat(isOpen ? null : kat)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary/80 hover:bg-secondary transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-foreground">{kat}</span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    {isOpen && (
                      <div className="divide-y divide-border/50">
                        {katBoeder.map((b) => {
                          const selected = valgteBoeder.some((v) => v.boedeId === b.id);
                          return (
                            <button
                              key={b.id}
                              onClick={() => toggleBoede(b)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all",
                                selected ? "bg-primary/10" : "hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                selected ? "bg-primary border-primary" : "border-border"
                              )}>
                                {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{b.paragraf} — {b.beskrivelse}</p>
                              </div>
                              <span className="text-sm font-mono font-semibold text-warning shrink-0">{b.beloeb.toLocaleString("da-DK")} kr</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Summary */}
              {valgteBoeder.length > 0 && (
                <div className="p-3 rounded-lg bg-card border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Valgte sigtelser:</span>
                    <span className="font-semibold text-foreground">{valgteBoeder.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total bøde:</span>
                    <span className="font-mono font-bold text-warning">{totalBoede.toLocaleString("da-DK")} kr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimeret fængselstraf:</span>
                    <span className="font-semibold text-destructive">
                      {faengselMaaneder > 0 ? `${faengselMaaneder} måned${faengselMaaneder !== 1 ? "er" : ""}` : "Ingen"}
                    </span>
                  </div>
                </div>
              )}

              {/* Kørekort */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <Checkbox
                  checked={fratagKoerekort}
                  onCheckedChange={(v) => setFratagKoerekort(!!v)}
                  id="koerekort"
                />
                <label htmlFor="koerekort" className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <Car className="w-4 h-4 text-destructive" />
                  Fratag kørekort
                </label>
              </div>

              {/* Erkender */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Erkender personen sigtelsen?</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={erkender === true ? "default" : "outline"}
                    onClick={() => setErkender(true)}
                    className={erkender === true ? "bg-success hover:bg-success/90" : ""}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Erkender
                  </Button>
                  <Button
                    size="sm"
                    variant={erkender === false ? "default" : "outline"}
                    onClick={() => setErkender(false)}
                    className={erkender === false ? "bg-destructive hover:bg-destructive/90" : ""}
                  >
                    <X className="w-3.5 h-3.5 mr-1" /> Erkender ikke
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Rapport */}
          {step === 1 && (
            <div className="space-y-4 pr-3">
              {/* Skabeloner */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Vælg rapportskabelon (valgfrit):</p>
                <div className="flex flex-wrap gap-2">
                  {rapportSkabeloner.map((sk) => (
                    <Button
                      key={sk.id}
                      size="sm"
                      variant={valgtSkabelon?.id === sk.id ? "default" : "outline"}
                      onClick={() => {
                        if (valgtSkabelon?.id === sk.id) {
                          setValgtSkabelon(null);
                          setSkabelonSvar({});
                        } else {
                          setValgtSkabelon(sk);
                          setSkabelonSvar({});
                        }
                      }}
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      {sk.navn}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Skabelon spørgsmål */}
              {valgtSkabelon && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                  <p className="text-sm font-semibold text-primary">{valgtSkabelon.navn} — Spørgsmål</p>
                  {valgtSkabelon.spoergsmaal.map((sp, i) => (
                    <div key={i}>
                      <Label className="text-xs text-foreground">{sp}</Label>
                      <Textarea
                        value={skabelonSvar[`q${i}`] || ""}
                        onChange={(e) => setSkabelonSvar({ ...skabelonSvar, [`q${i}`]: e.target.value })}
                        rows={2}
                        className="mt-1 bg-secondary border-border text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground">Hændelsesforløb</Label>
                <Textarea
                  placeholder="Beskriv hændelsesforløbet i detaljer..."
                  value={haendelse}
                  onChange={(e) => setHaendelse(e.target.value)}
                  rows={4}
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Konfiskerede genstande</Label>
                <Textarea
                  placeholder="Liste over genstande der er konfiskeret fra personen..."
                  value={konfiskeret}
                  onChange={(e) => setKonfiskeret(e.target.value)}
                  rows={3}
                  className="mt-1 bg-secondary border-border"
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Magtanvendelse</Label>
                <Textarea
                  placeholder="Beskriv eventuel brug af magtmidler (peberspray, håndjern, etc.)..."
                  value={magt}
                  onChange={(e) => setMagt(e.target.value)}
                  rows={3}
                  className="mt-1 bg-secondary border-border"
                />
              </div>
            </div>
          )}

          {/* Step 2: Involverede betjente */}
          {step === 2 && (
            <div className="space-y-3 pr-3">
              <p className="text-xs text-muted-foreground">Vælg de betjente der har været involveret:</p>
              <div className="space-y-1">
                {betjente.map((b) => {
                  const selected = valgteBetjente.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      onClick={() => toggleBetjent(b.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                        selected ? "bg-primary/10 border border-primary/30" : "bg-secondary/50 border border-transparent hover:bg-secondary"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                        selected ? "bg-primary border-primary" : "border-border"
                      )}>
                        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{b.fornavn} {b.efternavn}</p>
                        <p className="text-xs text-muted-foreground">{b.rang} — {b.badgeNr}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {valgteBetjente.length > 0 && (
                <p className="text-xs text-muted-foreground">{valgteBetjente.length} betjent{valgteBetjente.length !== 1 ? "e" : ""} valgt</p>
              )}
            </div>
          )}

          {/* Step 3: Oversigt */}
          {step === 3 && (
            <div className="space-y-4 pr-3">
              <div className="p-4 rounded-lg bg-card border border-border space-y-3">
                <h3 className="text-sm font-bold text-foreground">Sigtelse mod {person.fornavn} {person.efternavn}</h3>
                <p className="text-xs text-muted-foreground font-mono">CPR: {person.cpr}</p>

                <div className="border-t border-border pt-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sigtelser</p>
                  {valgteBoeder.map((b) => (
                    <div key={b.boedeId} className="flex justify-between text-sm">
                      <span className="text-foreground">{b.paragraf} — {b.beskrivelse}</span>
                      <span className="font-mono text-warning">{b.beloeb.toLocaleString("da-DK")} kr</span>
                    </div>
                  ))}
                  {valgteBoeder.length === 0 && <p className="text-xs text-muted-foreground">Ingen sigtelser valgt</p>}
                </div>

                <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total bøde</p>
                    <p className="text-lg font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fængselstraf</p>
                    <p className="text-lg font-bold text-destructive">
                      {faengselMaaneder > 0 ? `${faengselMaaneder} md.` : "Ingen"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-3 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{fratagKoerekort ? <span className="text-destructive font-semibold">Kørekort frataget</span> : "Kørekort beholdt"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {erkender === true && <Badge className="bg-success/20 text-success border-success/30">Erkender</Badge>}
                    {erkender === false && <Badge className="bg-destructive/20 text-destructive border-destructive/30">Erkender ikke</Badge>}
                    {erkender === null && <Badge variant="outline">Ikke angivet</Badge>}
                  </div>
                </div>

                {valgteBetjente.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Involverede betjente</p>
                    <div className="flex flex-wrap gap-1.5">
                      {valgteBetjente.map((id) => {
                        const b = betjente.find((x) => x.id === id);
                        return b ? (
                          <Badge key={id} variant="outline" className="text-xs">
                            {b.fornavn} {b.efternavn} ({b.badgeNr})
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {(haendelse || konfiskeret || magt) && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rapport</p>
                    {haendelse && (
                      <div>
                        <p className="text-xs text-muted-foreground">Hændelsesforløb</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{haendelse}</p>
                      </div>
                    )}
                    {konfiskeret && (
                      <div>
                        <p className="text-xs text-muted-foreground">Konfiskerede genstande</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{konfiskeret}</p>
                      </div>
                    )}
                    {magt && (
                      <div>
                        <p className="text-xs text-muted-foreground">Magtanvendelse</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{magt}</p>
                      </div>
                    )}
                  </div>
                )}

                {valgtSkabelon && Object.keys(skabelonSvar).length > 0 && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skabelon: {valgtSkabelon.navn}</p>
                    {valgtSkabelon.spoergsmaal.map((sp, i) => (
                      skabelonSvar[`q${i}`] ? (
                        <div key={i}>
                          <p className="text-xs text-muted-foreground">{sp}</p>
                          <p className="text-sm text-foreground">{skabelonSvar[`q${i}`]}</p>
                        </div>
                      ) : null
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Tilbage
          </Button>
          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(step + 1)}>
              Næste <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={saving || valgteBoeder.length === 0}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Scale className="w-4 h-4 mr-1" />}
              Opret sigtelse
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OpretSigtelseDialog;
