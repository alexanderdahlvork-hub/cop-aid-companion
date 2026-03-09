import { useState, useEffect } from "react";
import {
  FileText, Scale, Shield, Car, Check, X, AlertTriangle,
  ChevronDown, Loader2, Gauge, Plus, Package, Gavel, Users, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  if (samlet >= 3) return { type: "ubetinget" as const, tekst: `${samlet} klip — Ubetinget frakendelse`, detalje: "Min. 6 måneders frakendelse. Ny køreprøve kræves." };
  if (samlet >= 2) return { type: "betinget" as const, tekst: `${samlet} klip — Betinget frakendelse`, detalje: "Yderligere klip inden 3 år → ubetinget." };
  if (samlet >= 1) return { type: "advarsel" as const, tekst: `${samlet} klip`, detalje: "Ved 3 klip inden 3 år frakendes kørekortet." };
  return null;
}

interface OpretSigtelseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person;
  onSigtelseOprettet: (sigtelse: Sigtelse) => void;
  tidligereKlip?: number;
  currentUser?: { badgeNr: string; fornavn: string; efternavn: string };
}

const OpretSigtelseDialog = ({ open, onOpenChange, person, onSigtelseOprettet, tidligereKlip = 0, currentUser }: OpretSigtelseDialogProps) => {
  const [betjente, setBetjente] = useState<Betjent[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [valgteBoeder, setValgteBoeder] = useState<SigtelseBoede[]>([]);
  const [fratagKoerekort, setFratagKoerekort] = useState(false);
  const [erkender, setErkender] = useState<boolean | null>(null);
  const [valgteBetjente, setValgteBetjente] = useState<string[]>([]);
  const [sagsStatus, setSagsStatus] = useState<import("@/types/police").SagsStatus>("aaben");
  const [haendelse, setHaendelse] = useState("");
  const [konfiskeret, setKonfiskeret] = useState("");
  const [magt, setMagt] = useState("");

  const [valgtSkabelon, setValgtSkabelon] = useState<RapportSkabelon | null>(null);
  const [skabelonSvar, setSkabelonSvar] = useState<Record<string, string>>({});

  const [betjenteOpen, setBetjenteOpen] = useState(false);
  const [straffeOpen, setStraffeOpen] = useState(false);
  const [konfiskeretOpen, setKonfiskeretOpen] = useState(false);
  const [magtOpen, setMagtOpen] = useState(false);
  const [skabelonOpen, setSkabelonOpen] = useState(false);
  const [dokOpen, setDokOpen] = useState(false);

  const [openKat, setOpenKat] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showKlipPopup, setShowKlipPopup] = useState(false);
  const [soegning, setSoegning] = useState("");
  const [fartOpen, setFartOpen] = useState(false);

  const [dokNavn, setDokNavn] = useState("");
  const [dokUrl, setDokUrl] = useState("");
  const [dokumenter, setDokumenter] = useState<{ navn: string; url: string }[]>([]);

  const [konfiskeretInput, setKonfiskeretInput] = useState("");
  const [konfiskeredeGenstande, setKonfiskeredeGenstande] = useState<string[]>([]);

  const [magtInput, setMagtInput] = useState("");
  const [magtmidler, setMagtmidler] = useState<string[]>([]);

  const boeder = standardBoeder;

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    betjenteApi.getAll()
      .then((bt) => {
        setBetjente(bt);
        // Auto-select current user
        if (currentUser) {
          const match = bt.find(b => b.badgeNr === currentUser.badgeNr);
          if (match) {
            setValgteBetjente(prev => prev.includes(match.id) ? prev : [match.id]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false));
  }, [open, currentUser]);

  useEffect(() => {
    if (open) {
      setValgteBoeder([]); setFratagKoerekort(false); setErkender(null);
      setValgteBetjente([]); setHaendelse(""); setKonfiskeret(""); setMagt("");
      setValgtSkabelon(null); setSkabelonSvar({}); setShowKlipPopup(false);
      setSoegning(""); setBetjenteOpen(false); setStraffeOpen(false);
      setKonfiskeretOpen(false); setMagtOpen(false); setSkabelonOpen(false);
      setDokNavn(""); setDokUrl(""); setDokumenter([]); setDokOpen(false);
      setKonfiskeretInput(""); setKonfiskeredeGenstande([]);
      setMagtInput(""); setMagtmidler([]);
    }
  }, [open]);

  const totalBoede = valgteBoeder.reduce((s, b) => s + b.beloeb, 0);
  const totalKlip = valgteBoeder.reduce((s, b) => {
    const orig = boeder.find((x) => x.id === b.boedeId);
    return s + (orig?.klip || 0);
  }, 0);
  const totalFaengsel = valgteBoeder.reduce((s, b) => s + b.faengselMaaneder, 0);
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
        boedeId: b.id, paragraf: b.paragraf, beskrivelse: b.beskrivelse,
        beloeb: b.beloeb, faengselMaaneder: b.faengselMaaneder || 0,
      }]);
    }
  };

  const toggleBetjent = (id: string) => {
    setValgteBetjente((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
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
      konfiskeredeGenstande: konfiskeredeGenstande.join(", "),
      magtanvendelse: magtmidler.join(", "),
      skabelonSvar: valgtSkabelon ? skabelonSvar : undefined,
    },
    skabelonType: valgtSkabelon?.id,
    sagsStatus,
  });

  const handleSubmit = () => {
    if (erkender === null) {
      return;
    }
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

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Indlæser...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (showKlipPopup) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" /> Klipkort-advarsel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-2">
              <div className="flex justify-between text-sm"><span>Tidligere klip:</span><span className="font-bold font-mono">{tidligereKlip}</span></div>
              <div className="flex justify-between text-sm"><span>Nye klip:</span><span className="font-bold font-mono text-warning">+{totalKlip}</span></div>
              <div className="border-t border-warning/20 pt-2 flex justify-between"><span className="font-semibold">I alt:</span><span className="text-lg font-bold font-mono text-warning">{totalKlip + tidligereKlip}</span></div>
            </div>
            {klipStatus && (
              <div className={cn("p-3 rounded-lg border", klipStatus.type === "ubetinget" ? "bg-destructive/10 border-destructive/20" : "bg-warning/10 border-warning/20")}>
                <p className={cn("text-sm font-semibold", klipStatus.type === "ubetinget" ? "text-destructive" : "text-warning")}>{klipStatus.tekst}</p>
                <p className="text-xs text-muted-foreground">{klipStatus.detalje}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowKlipPopup(false)}>Tilbage</Button>
              <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={confirmAndSubmit}>Bekræft sigtelse</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[720px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          {/* Title */}
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-center text-base font-semibold">Opret Sigtelse / Rapport</DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-6 py-5 space-y-5">

              {/* Person info card */}
              <div className="rounded-lg bg-muted/30 border border-border p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Navn:</span> {person.fornavn} {person.efternavn}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Adresse:</span> {person.adresse || "Ingen adresse"}, {person.postnr} {person.by}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Telefon:</span> {person.telefon || "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">CPR:</span> {person.cpr}
                    </div>
                  </div>
                  <div className="w-16 h-16 rounded-lg bg-muted/60 border border-border flex items-center justify-center shrink-0">
                    <span className="text-lg font-bold text-muted-foreground">{person.fornavn[0]}{person.efternavn[0]}</span>
                  </div>
                </div>
              </div>

              {/* === Medvirkende betjente === */}
              <SectionBlock title="Medvirkende betjente" icon={<Users className="w-4 h-4" />}>
                <Collapsible open={betjenteOpen} onOpenChange={setBetjenteOpen}>
                  <CollapsibleTrigger asChild>
                    <Button className="w-full h-10 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-3.5 h-3.5" /> Vælg Betjente
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {betjente.map((b) => {
                        const sel = valgteBetjente.includes(b.id);
                        return (
                          <button key={b.id} onClick={() => toggleBetjent(b.id)}
                            className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all border text-xs",
                              sel ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/30"
                            )}>
                            <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                              sel ? "bg-primary border-primary" : "border-muted-foreground/25"
                            )}>{sel && <Check className="w-2 h-2 text-primary-foreground" />}</div>
                            <div>
                              <p className="font-medium">{b.fornavn} {b.efternavn}</p>
                              <p className="text-[9px] text-muted-foreground">{b.rang} · {b.badgeNr}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                {valgteBetjente.length > 0 && !betjenteOpen && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {valgteBetjente.map(id => {
                      const b = betjente.find(x => x.id === id);
                      return b ? <Badge key={id} variant="outline" className="text-[10px]">{b.fornavn} {b.efternavn}</Badge> : null;
                    })}
                  </div>
                )}
              </SectionBlock>

              {/* === Straffe === */}
              <SectionBlock title="Straffe" icon={<Gavel className="w-4 h-4" />}>
                <Collapsible open={straffeOpen} onOpenChange={setStraffeOpen}>
                  <CollapsibleTrigger asChild>
                    <Button className="w-full h-10 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="w-3.5 h-3.5" /> Vælg Straffe
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        <Input placeholder="Søg paragraf eller beskrivelse..." value={soegning}
                          onChange={(e) => setSoegning(e.target.value)} className="bg-muted/30 border-border text-xs h-8 flex-1" />
                        <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1 shrink-0" onClick={() => setFartOpen(true)}>
                          <Gauge className="w-3 h-3" /> Fart
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {kategorier.map((kat) => {
                          const katBoeder = filtreretBoeder.filter((b) => b.kategori === kat);
                          const isOpen = openKat === kat;
                          const selCount = katBoeder.filter(b => valgteBoeder.some(v => v.boedeId === b.id)).length;
                          return (
                            <Collapsible key={kat} open={isOpen} onOpenChange={() => setOpenKat(isOpen ? null : kat)}>
                              <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-muted/40 hover:bg-muted/60 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-medium text-foreground">{kat}</span>
                                  {selCount > 0 && <Badge className="bg-primary/15 text-primary border-0 text-[9px] h-4 px-1.5">{selCount}</Badge>}
                                </div>
                                <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-0.5 rounded border border-border overflow-hidden divide-y divide-border/30">
                                  {katBoeder.map((b) => {
                                    const selected = valgteBoeder.some((v) => v.boedeId === b.id);
                                    return (
                                      <button key={b.id} onClick={() => toggleBoede(b)}
                                        className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                                          selected ? "bg-primary/5" : "hover:bg-muted/20"
                                        )}>
                                        <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                                          selected ? "bg-primary border-primary" : "border-muted-foreground/25"
                                        )}>{selected && <Check className="w-2 h-2 text-primary-foreground" />}</div>
                                        <span className="flex-1 text-[11px] truncate">
                                          {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}{b.beskrivelse}
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0 text-[9px]">
                                          {(b.klip ?? 0) > 0 && <span className="text-primary font-medium">{b.klip}klip</span>}
                                          {(b.faengselMaaneder ?? 0) > 0 && <span className="text-destructive font-medium">{b.faengselMaaneder}md</span>}
                                          <span className="font-mono text-warning">{b.beloeb.toLocaleString("da-DK")}kr</span>
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
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {valgteBoeder.length > 0 && (
                  <div className="mt-2 rounded-md border border-border overflow-hidden">
                    <div className="divide-y divide-border/30">
                      {valgteBoeder.map((b) => (
                        <div key={b.boedeId} className="flex items-center justify-between px-3 py-1.5 text-[11px]">
                          <span className="text-foreground truncate pr-2">{b.paragraf && `${b.paragraf} — `}{b.beskrivelse}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-warning">{b.beloeb.toLocaleString("da-DK")} kr</span>
                            <button onClick={() => setValgteBoeder(valgteBoeder.filter(v => v.boedeId !== b.boedeId))}
                              className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-t border-primary/15 text-xs">
                      <span className="font-semibold">Total</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</span>
                        {totalFaengsel > 0 && <span className="font-bold text-destructive">{totalFaengsel} md.</span>}
                        {totalKlip > 0 && <span className="font-bold text-primary">+{totalKlip} klip</span>}
                      </div>
                    </div>
                  </div>
                )}

                {klipStatus && (
                  <div className={cn("mt-2 px-3 py-2 rounded-md text-[10px] flex items-center gap-1.5",
                    klipStatus.type === "ubetinget" ? "bg-destructive/10 text-destructive" : klipStatus.type === "betinget" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                  )}><AlertTriangle className="w-3 h-3 shrink-0" />{klipStatus.tekst}</div>
                )}
              </SectionBlock>

              {/* === Konfiskerede ting + Magtmidler brugt (side by side) === */}
              <div className="grid grid-cols-2 gap-3">
                <SectionBlock title="Konfiskerede ting" icon={<Package className="w-4 h-4" />}>
                  <Collapsible open={konfiskeretOpen} onOpenChange={setKonfiskeretOpen}>
                    <CollapsibleTrigger asChild>
                      <Button className="w-full h-10 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-3.5 h-3.5" /> Vælg Konfiskerede ting
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 flex gap-1.5">
                        <Input placeholder="Genstand..." value={konfiskeretInput} onChange={(e) => setKonfiskeretInput(e.target.value)}
                          className="h-8 text-xs bg-muted/30 border-border flex-1"
                          onKeyDown={(e) => { if (e.key === "Enter" && konfiskeretInput.trim()) { setKonfiskeredeGenstande([...konfiskeredeGenstande, konfiskeretInput.trim()]); setKonfiskeretInput(""); } }} />
                        <Button size="sm" className="h-8 w-8 p-0 shrink-0" disabled={!konfiskeretInput.trim()}
                          onClick={() => { setKonfiskeredeGenstande([...konfiskeredeGenstande, konfiskeretInput.trim()]); setKonfiskeretInput(""); }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {konfiskeredeGenstande.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {konfiskeredeGenstande.map((g, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded px-2.5 py-1.5 text-[11px]">
                          <span>{g}</span>
                          <button onClick={() => setKonfiskeredeGenstande(konfiskeredeGenstande.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionBlock>

                <SectionBlock title="Magtmidler brugt" icon={<Shield className="w-4 h-4" />}>
                  <Collapsible open={magtOpen} onOpenChange={setMagtOpen}>
                    <CollapsibleTrigger asChild>
                      <Button className="w-full h-10 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-3.5 h-3.5" /> Vælg Magtmidler
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 flex gap-1.5">
                        <Input placeholder="Magtmiddel..." value={magtInput} onChange={(e) => setMagtInput(e.target.value)}
                          className="h-8 text-xs bg-muted/30 border-border flex-1"
                          onKeyDown={(e) => { if (e.key === "Enter" && magtInput.trim()) { setMagtmidler([...magtmidler, magtInput.trim()]); setMagtInput(""); } }} />
                        <Button size="sm" className="h-8 w-8 p-0 shrink-0" disabled={!magtInput.trim()}
                          onClick={() => { setMagtmidler([...magtmidler, magtInput.trim()]); setMagtInput(""); }}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  {magtmidler.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {magtmidler.map((m, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded px-2.5 py-1.5 text-[11px]">
                          <span>{m}</span>
                          <button onClick={() => setMagtmidler(magtmidler.filter((_, j) => j !== i))}
                            className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionBlock>
              </div>

              {/* === Rapport beskrivelse === */}
              <SectionBlock title="Rapport beskrivelse" icon={<FileText className="w-4 h-4" />}>
                <Collapsible open={skabelonOpen} onOpenChange={setSkabelonOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-10 text-xs">
                      <span className="text-muted-foreground">{valgtSkabelon ? `Skabelon: ${valgtSkabelon.navn}` : "Vælg rapportskabelon (valgfrit)"}</span>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", skabelonOpen && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {rapportSkabeloner.map((sk) => (
                        <button key={sk.id} onClick={() => {
                          valgtSkabelon?.id === sk.id ? (setValgtSkabelon(null), setSkabelonSvar({})) : (setValgtSkabelon(sk), setSkabelonSvar({}));
                          setSkabelonOpen(false);
                        }}
                          className={cn("px-3 py-2 rounded border text-[11px] text-left transition-all",
                            valgtSkabelon?.id === sk.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-border hover:border-primary/30 hover:bg-muted/30"
                          )}>{sk.navn}</button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {valgtSkabelon && (
                  <div className="rounded-md border border-primary/15 bg-primary/[0.02] p-3 space-y-2.5 mt-2">
                    <p className="text-[11px] font-medium text-primary">{valgtSkabelon.navn}</p>
                    {valgtSkabelon.spoergsmaal.map((sp, i) => (
                      <div key={i}>
                        <Label className="text-[10px] font-medium">{i + 1}. {sp}</Label>
                        <Textarea value={skabelonSvar[`q${i}`] || ""} onChange={(e) => setSkabelonSvar({ ...skabelonSvar, [`q${i}`]: e.target.value })}
                          rows={2} className="mt-1 bg-background border-border text-xs resize-none" placeholder="Skriv svar..." />
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  placeholder="Skriv rapportbeskrivelsen her..."
                  value={haendelse}
                  onChange={(e) => setHaendelse(e.target.value)}
                  rows={5}
                  className="bg-muted/20 border-border text-xs resize-none mt-2"
                />
              </SectionBlock>

              {/* === Øvrige oplysninger === */}
              <SectionBlock title="Øvrige oplysninger" icon={<FileText className="w-4 h-4" />}>
                {/* Sagsstatus */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sagsstatus</Label>
                  <div className="flex gap-1.5">
                    {([
                      { value: "aaben", label: "Åben", color: "bg-success/15 text-success border-success/20" },
                      { value: "under_efterforskning", label: "Under efterforskning", color: "bg-primary/15 text-primary border-primary/20" },
                      { value: "afventer_retten", label: "Afventer retten", color: "bg-warning/15 text-warning border-warning/20" },
                      { value: "lukket", label: "Lukket", color: "bg-muted text-muted-foreground border-border" },
                    ] as const).map((s) => (
                      <button key={s.value} onClick={() => setSagsStatus(s.value)}
                        className={cn("px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all",
                          sagsStatus === s.value ? s.color : "border-border text-muted-foreground hover:bg-muted/30"
                        )}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border">
                    <Checkbox checked={fratagKoerekort} onCheckedChange={(v) => setFratagKoerekort(!!v)} id="koerekort2" />
                    <label htmlFor="koerekort2" className="text-xs font-medium cursor-pointer whitespace-nowrap">Fratag kørekort</label>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn("text-xs mr-1", erkender === null ? "text-destructive font-semibold" : "text-muted-foreground")}>
                      Erkender {erkender === null && "*"}
                    </span>
                    <Button size="sm" variant={erkender === true ? "default" : "outline"} onClick={() => setErkender(true)}
                      className={cn("h-8 w-8 p-0", erkender === true && "bg-success hover:bg-success/90")}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant={erkender === false ? "default" : "outline"} onClick={() => setErkender(false)}
                      className={cn("h-8 w-8 p-0", erkender === false && "bg-destructive hover:bg-destructive/90")}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {erkender === null && (
                  <p className="text-[10px] text-destructive mt-1">* Du skal angive om personen erkender eller ej</p>
                )}
              </SectionBlock>

            </div>
          </div>

          {/* Dokument panel (expandable above footer) */}
          {dokOpen && (
            <div className="px-6 py-3 border-t border-border bg-muted/5 space-y-2">
              {dokumenter.length > 0 && (
                <div className="space-y-1">
                  {dokumenter.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded px-3 py-1.5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span>{d.navn}</span>
                      </div>
                      <button onClick={() => setDokumenter(dokumenter.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="Dokumentnavn" value={dokNavn} onChange={(e) => setDokNavn(e.target.value)}
                  className="h-8 text-xs bg-muted/30 border-border flex-1" />
                <Input placeholder="URL" value={dokUrl} onChange={(e) => setDokUrl(e.target.value)}
                  className="h-8 text-xs bg-muted/30 border-border flex-1" />
                <Button size="sm" className="h-8 text-xs gap-1 shrink-0" disabled={!dokNavn.trim()}
                  onClick={() => { setDokumenter([...dokumenter, { navn: dokNavn.trim(), url: dokUrl }]); setDokNavn(""); setDokUrl(""); }}>
                  <Plus className="w-3 h-3" /> Tilføj
                </Button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/10">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => setDokOpen(!dokOpen)}>
              <Plus className="w-3 h-3" /> Tilføj dokumenter...
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">Annuller</Button>
              <Button size="sm" onClick={handleSubmit} disabled={saving || valgteBoeder.length === 0 || erkender === null}
                className="h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1.5">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scale className="w-3.5 h-3.5" />}
                Opret sigtelse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FartBeregner open={fartOpen} onOpenChange={setFartOpen}
        onTilfoejBoede={(beskrivelse, beloeb) => {
          setValgteBoeder((prev) => [...prev, { boedeId: `fart-${Date.now()}`, paragraf: "Fartoverskridelse", beskrivelse, beloeb, faengselMaaneder: 0 }]);
        }} />
    </>
  );
};

const SectionBlock = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between border-b border-border pb-1.5">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <span className="text-muted-foreground">{icon}</span>
    </div>
    {children}
  </div>
);

export default OpretSigtelseDialog;
