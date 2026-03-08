import { useState } from "react";
import {
  MapPin, Radio, Send, Users, AlertTriangle, Shield, Phone,
  Plus, X, Check, ChevronDown, Clock, Siren, Car, Target,
  Building, Flame, Heart, Package, CircleDot, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";

// ─── Opkaldstyper med anbefalet antal patruljer ───
interface OpkaldsType {
  id: string;
  navn: string;
  icon: typeof Siren;
  prioritet: "lav" | "medium" | "høj" | "kritisk";
  anbefaletPatruljer: number;
  beskrivelse: string;
}

const opkaldsTyper: OpkaldsType[] = [
  { id: "trafik", navn: "Trafikuheld", icon: Car, prioritet: "medium", anbefaletPatruljer: 2, beskrivelse: "Færdselsuheld med mulige tilskadekomne" },
  { id: "indbrud", navn: "Indbrud i gang", icon: Building, prioritet: "høj", anbefaletPatruljer: 3, beskrivelse: "Aktiv indtrængen på adresse" },
  { id: "vold", navn: "Vold / Overfald", icon: AlertTriangle, prioritet: "høj", anbefaletPatruljer: 2, beskrivelse: "Igangværende voldelig hændelse" },
  { id: "skyderi", navn: "Skyderi", icon: Target, prioritet: "kritisk", anbefaletPatruljer: 5, beskrivelse: "Skydevåben affyret — kræver massiv indsats" },
  { id: "brand", navn: "Brand", icon: Flame, prioritet: "høj", anbefaletPatruljer: 2, beskrivelse: "Ild eller eksplosion — afspærring nødvendig" },
  { id: "narkotika", navn: "Narkorazzia", icon: Package, prioritet: "høj", anbefaletPatruljer: 4, beskrivelse: "Planlagt eller akut narkotikaindsats" },
  { id: "ambulance", navn: "Medicinsk nødsituation", icon: Heart, prioritet: "medium", anbefaletPatruljer: 1, beskrivelse: "Assistér ambulance eller livstruende situation" },
  { id: "huslig", navn: "Husspektakel", icon: Building, prioritet: "medium", anbefaletPatruljer: 2, beskrivelse: "Husspektakel med mulig vold" },
  { id: "eftersøgning", navn: "Eftersøgning", icon: Navigation, prioritet: "høj", anbefaletPatruljer: 3, beskrivelse: "Eftersøgning af forsvunden person eller flygtende" },
  { id: "rutine", navn: "Rutineopkald", icon: Phone, prioritet: "lav", anbefaletPatruljer: 1, beskrivelse: "Rutinekontrol eller borgerhenvendelse" },
];

const prioritetConfig = {
  lav: { label: "Lav", color: "bg-success/15 text-success border-success/20", dot: "bg-success" },
  medium: { label: "Medium", color: "bg-primary/15 text-primary border-primary/20", dot: "bg-primary" },
  høj: { label: "Høj", color: "bg-warning/15 text-warning border-warning/20", dot: "bg-warning" },
  kritisk: { label: "Kritisk", color: "bg-destructive/15 text-destructive border-destructive/20", dot: "bg-destructive animate-pulse" },
};

// ─── Simulerede ledige patruljer (i virkeligheden fra FleetManagement state) ───
interface LedigPatrulje {
  id: string;
  navn: string;
  kategori: string;
  medlemmer: string[];
}

const simuleredeLedige: LedigPatrulje[] = [
  { id: "bravo-21", navn: "Bravo 21", kategori: "Bravo", medlemmer: [] },
  { id: "bravo-22", navn: "Bravo 22", kategori: "Bravo", medlemmer: [] },
  { id: "bravo-23", navn: "Bravo 23", kategori: "Bravo", medlemmer: [] },
  { id: "bravo-24", navn: "Bravo 24", kategori: "Bravo", medlemmer: [] },
  { id: "bravo-25", navn: "Bravo 25", kategori: "Bravo", medlemmer: [] },
  { id: "mike-43", navn: "Mike 43", kategori: "Mike", medlemmer: [] },
  { id: "mike-44", navn: "Mike 44", kategori: "Mike", medlemmer: [] },
  { id: "kilo-16", navn: "Kilo 16", kategori: "Kilo", medlemmer: [] },
  { id: "kilo-17", navn: "Kilo 17", kategori: "Kilo", medlemmer: [] },
  { id: "romeo-13", navn: "Romeo 13", kategori: "Romeo", medlemmer: [] },
  { id: "foxtrot-11", navn: "Foxtrot 11", kategori: "Foxtrot", medlemmer: [] },
];

// ─── Aktiv opgave ───
interface Opgave {
  id: string;
  type: OpkaldsType;
  adresse: string;
  beskrivelse: string;
  tildeltPatruljer: string[];
  oprettet: string;
  status: "aktiv" | "undervejs" | "afsluttet";
}

const KortOgGPS = () => {
  const [opgaver, setOpgaver] = useState<Opgave[]>([]);
  const [opretDialog, setOpretDialog] = useState(false);
  const [valgtType, setValgtType] = useState<OpkaldsType | null>(null);
  const [adresse, setAdresse] = useState("");
  const [ekstraBeskrivelse, setEkstraBeskrivelse] = useState("");
  const [valgtePatruljer, setValgtePatruljer] = useState<string[]>([]);
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [patruljePanelOpen, setPatruljePanelOpen] = useState(false);

  const tildeltIDs = opgaver.filter(o => o.status !== "afsluttet").flatMap(o => o.tildeltPatruljer);
  const ledige = simuleredeLedige.filter(p => !tildeltIDs.includes(p.id));

  const togglePatrulje = (id: string) => {
    setValgtePatruljer(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const opretOpgave = () => {
    if (!valgtType || !adresse.trim()) return;
    const opgave: Opgave = {
      id: `opg-${Date.now()}`,
      type: valgtType,
      adresse: adresse.trim(),
      beskrivelse: ekstraBeskrivelse,
      tildeltPatruljer: valgtePatruljer,
      oprettet: new Date().toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" }),
      status: valgtePatruljer.length > 0 ? "undervejs" : "aktiv",
    };
    setOpgaver(prev => [opgave, ...prev]);
    setValgtType(null);
    setAdresse("");
    setEkstraBeskrivelse("");
    setValgtePatruljer([]);
    setOpretDialog(false);
    toast.success(`Opgave oprettet — ${valgtePatruljer.length} patruljer tildelt`);
  };

  const afslutOpgave = (id: string) => {
    setOpgaver(prev => prev.map(o => o.id === id ? { ...o, status: "afsluttet" } : o));
    toast("Opgave afsluttet");
  };

  const aktive = opgaver.filter(o => o.status !== "afsluttet");
  const afsluttede = opgaver.filter(o => o.status === "afsluttet");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Kort & Dispatch</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-success/10 border border-success/20 text-[10px]">
              <CircleDot className="w-3 h-3 text-success animate-pulse" />
              <span className="text-success font-medium">{ledige.length} ledige patruljer</span>
            </div>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setOpretDialog(true)}>
              <Siren className="w-3.5 h-3.5" /> Nyt opkald
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatBox label="Aktive opgaver" value={aktive.length} color="text-warning" />
          <StatBox label="Patruljer ude" value={tildeltIDs.length} color="text-primary" />
          <StatBox label="Ledige" value={ledige.length} color="text-success" />
          <StatBox label="Afsluttede" value={afsluttede.length} color="text-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Active tasks */}
        <ScrollArea className="flex-1 border-r border-border">
          <div className="p-4 space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aktive opgaver</h3>

            {aktive.length === 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-8 text-center">
                <Radio className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Ingen aktive opgaver</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Tryk "Nyt opkald" for at oprette</p>
              </div>
            )}

            {aktive.map(opgave => {
              const pConf = prioritetConfig[opgave.type.prioritet];
              const Icon = opgave.type.icon;
              return (
                <div key={opgave.id} className={cn(
                  "rounded-lg border overflow-hidden",
                  opgave.type.prioritet === "kritisk" ? "border-destructive/30 shadow-sm shadow-destructive/10" : "border-border"
                )}>
                  {/* Task header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", pConf.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{opgave.type.navn}</p>
                        <p className="text-xs text-muted-foreground">{opgave.adresse}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px] border", pConf.color)}>{pConf.label}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {opgave.oprettet}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  {opgave.beskrivelse && (
                    <div className="px-4 py-2 border-t border-border/30">
                      <p className="text-xs text-foreground/80">{opgave.beskrivelse}</p>
                    </div>
                  )}

                  {/* Assigned patrols */}
                  <div className="px-4 py-2.5 border-t border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tildelt:</span>
                      {opgave.tildeltPatruljer.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {opgave.tildeltPatruljer.map(id => {
                            const p = simuleredeLedige.find(x => x.id === id);
                            return (
                              <Badge key={id} variant="outline" className="text-[10px] gap-1">
                                <Car className="w-2.5 h-2.5" /> {p?.navn || id}
                              </Badge>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">Ingen tildelt</span>
                      )}
                    </div>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                      onClick={() => afslutOpgave(opgave.id)}>
                      Afslut
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Completed section */}
            {afsluttede.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mt-4">
                  <ChevronDown className="w-3 h-3" />
                  <span>Afsluttede opgaver ({afsluttede.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2 mt-2">
                    {afsluttede.map(o => (
                      <div key={o.id} className="rounded-md border border-border/50 px-4 py-2 bg-muted/10 opacity-60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground">{o.type.navn} — {o.adresse}</span>
                          <span className="text-[10px] text-muted-foreground">{o.oprettet}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        {/* Right: Available patrols panel */}
        <div className="w-64 shrink-0 flex flex-col bg-card/30">
          <div className="px-3 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary" /> Ledige patruljer
            </h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {ledige.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-4 italic">Alle patruljer er tildelt</p>
              )}
              {Object.entries(
                ledige.reduce((acc, p) => {
                  acc[p.kategori] = acc[p.kategori] || [];
                  acc[p.kategori].push(p);
                  return acc;
                }, {} as Record<string, LedigPatrulje[]>)
              ).map(([kat, patruljer]) => (
                <div key={kat}>
                  <p className="text-[9px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-semibold">{kat}</p>
                  {patruljer.map(p => (
                    <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-[11px] text-foreground font-medium">{p.navn}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* ─── Opret Opkald Dialog ─── */}
      <Dialog open={opretDialog} onOpenChange={setOpretDialog}>
        <DialogContent className="max-w-[600px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-border">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <Siren className="w-4 h-4 text-destructive" /> Opret nyt opkald
              </DialogTitle>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-6 py-5 space-y-5">

              {/* Opkaldstype */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">Type opkald</Label>
                <Collapsible open={typePickerOpen} onOpenChange={setTypePickerOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-10 text-xs">
                      {valgtType ? (
                        <span className="flex items-center gap-2">
                          <valgtType.icon className="w-4 h-4" />
                          {valgtType.navn}
                          <Badge className={cn("text-[9px] border ml-1", prioritetConfig[valgtType.prioritet].color)}>
                            {prioritetConfig[valgtType.prioritet].label}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Vælg opkaldstype...</span>
                      )}
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", typePickerOpen && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {opkaldsTyper.map(type => {
                        const pConf = prioritetConfig[type.prioritet];
                        const Icon = type.icon;
                        const selected = valgtType?.id === type.id;
                        return (
                          <button key={type.id} onClick={() => { setValgtType(type); setTypePickerOpen(false); setValgtePatruljer([]); }}
                            className={cn(
                              "flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all",
                              selected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/30 hover:bg-muted/20"
                            )}>
                            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", pConf.color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground">{type.navn}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{type.beskrivelse}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Recommendation box */}
              {valgtType && (
                <div className={cn(
                  "rounded-lg border p-3 flex items-start gap-3",
                  prioritetConfig[valgtType.prioritet].color
                )}>
                  <valgtType.icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold">{valgtType.navn}</p>
                    <p className="text-[11px] mt-0.5 opacity-80">{valgtType.beskrivelse}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-medium">
                      <span>Anbefalet: <strong>{valgtType.anbefaletPatruljer} patruljer</strong></span>
                      <span>•</span>
                      <span>Prioritet: <strong>{prioritetConfig[valgtType.prioritet].label}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Adresse */}
              <div>
                <Label className="text-xs font-semibold text-foreground">Adresse / Lokation</Label>
                <Input value={adresse} onChange={e => setAdresse(e.target.value)} placeholder="Indtast adresse..."
                  className="mt-1 h-9 text-sm bg-muted/20 border-border" />
              </div>

              {/* Extra info */}
              <div>
                <Label className="text-xs font-semibold text-foreground">Yderligere oplysninger</Label>
                <Textarea value={ekstraBeskrivelse} onChange={e => setEkstraBeskrivelse(e.target.value)}
                  placeholder="Evt. detaljer om situationen..."
                  rows={3} className="mt-1 text-sm bg-muted/20 border-border resize-none" />
              </div>

              {/* Tildel patruljer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Tildel patruljer</Label>
                  {valgtType && (
                    <span className="text-[10px] text-muted-foreground">
                      {valgtePatruljer.length} / {valgtType.anbefaletPatruljer} anbefalet
                    </span>
                  )}
                </div>

                {/* Progress bar for recommended */}
                {valgtType && (
                  <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        valgtePatruljer.length >= valgtType.anbefaletPatruljer ? "bg-success" :
                        valgtePatruljer.length >= valgtType.anbefaletPatruljer / 2 ? "bg-warning" : "bg-destructive"
                      )}
                      style={{ width: `${Math.min(100, (valgtePatruljer.length / valgtType.anbefaletPatruljer) * 100)}%` }}
                    />
                  </div>
                )}

                {/* Auto-select button */}
                {valgtType && (
                  <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1.5"
                    onClick={() => {
                      const needed = valgtType.anbefaletPatruljer;
                      const auto = ledige.slice(0, needed).map(p => p.id);
                      setValgtePatruljer(auto);
                      toast(`${auto.length} patruljer automatisk tildelt`);
                    }}>
                    <Navigation className="w-3 h-3" /> Auto-tildel {valgtType.anbefaletPatruljer} patruljer
                  </Button>
                )}

                {/* Patrol grid */}
                <div className="grid grid-cols-3 gap-1.5 max-h-[200px] overflow-y-auto">
                  {ledige.map(p => {
                    const sel = valgtePatruljer.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePatrulje(p.id)}
                        className={cn(
                          "flex items-center gap-2 px-2.5 py-2 rounded-md border text-left transition-all",
                          sel ? "border-primary/30 bg-primary/5" : "border-border hover:bg-muted/20"
                        )}>
                        <div className={cn("w-3 h-3 rounded-sm border flex items-center justify-center shrink-0",
                          sel ? "bg-primary border-primary" : "border-muted-foreground/25"
                        )}>{sel && <Check className="w-2 h-2 text-primary-foreground" />}</div>
                        <div>
                          <p className="text-[11px] font-medium text-foreground">{p.navn}</p>
                          <p className="text-[9px] text-muted-foreground">{p.kategori}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected summary */}
                {valgtePatruljer.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {valgtePatruljer.map(id => {
                      const p = ledige.find(x => x.id === id);
                      return (
                        <Badge key={id} variant="outline" className="text-[10px] gap-1 pr-1">
                          <Car className="w-2.5 h-2.5" /> {p?.navn}
                          <button onClick={() => togglePatrulje(id)} className="ml-0.5 hover:text-destructive">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/10">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setOpretDialog(false)}>Annuller</Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" disabled={!valgtType || !adresse.trim()}
              onClick={opretOpgave}>
              <Send className="w-3.5 h-3.5" /> Dispatch opgave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatBox = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="rounded-md bg-muted/20 border border-border px-3 py-2 text-center">
    <p className={cn("text-lg font-bold", color)}>{value}</p>
    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
  </div>
);

export default KortOgGPS;
