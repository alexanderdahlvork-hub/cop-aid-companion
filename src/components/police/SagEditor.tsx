import { useState, useEffect, useCallback } from "react";
import {
  FileText, Users, Car, Plus, X, Search, Loader2, Save,
  Shield, Tag, Link2, Camera, ChevronDown, Check, Gavel,
  Image, Clock, User, AlertTriangle, Package, Gauge
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { personerApi, betjenteApi } from "@/lib/api";
import { sagerApi } from "@/lib/sagerApi";
import { standardBoeder } from "@/data/bodetakster";
import type {
  Sag, SagMistaenkt, SagBorger, SagKoeretoej, SagReference, SagBevis,
  Person, Betjent, Boede, SigtelseBoede, SagsStatus
} from "@/types/police";
import MistaenktSigtelser from "./MistaenktSigtelser";

interface SagEditorProps {
  sagId?: string;
  currentUser: { badgeNr: string; fornavn: string; efternavn: string };
  initialPersonId?: string | null;
  onSagSaved?: (sag: Sag) => void;
}

const emptySag = (oprettetAf: string): Sag => ({
  id: Date.now().toString(),
  sagsnummer: `SAG-${Date.now().toString().slice(-6)}`,
  titel: "",
  oprettet: new Date().toISOString(),
  opdateret: new Date().toISOString(),
  status: "aaben",
  oprettetAf,
  mistaenkte: [],
  involveretBetjente: [],
  involveretBorgere: [],
  koeretoejer: [],
  referencer: [],
  tags: [],
  beviser: [],
  rapport: {
    haendelsesforloeb: "",
    konfiskeredeGenstande: [],
    magtanvendelse: [],
  },
});

const SagEditor = ({ sagId, currentUser, initialPersonId, onSagSaved }: SagEditorProps) => {
  const [sag, setSag] = useState<Sag>(emptySag(`${currentUser.fornavn} ${currentUser.efternavn}`));
  const [personer, setPersoner] = useState<Person[]>([]);
  const [betjente, setBetjente] = useState<Betjent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  // Search states
  const [personSearch, setPersonSearch] = useState("");
  const [borgerSearch, setBorgerSearch] = useState("");
  const [showPersonSearch, setShowPersonSearch] = useState(false);
  const [showBorgerSearch, setShowBorgerSearch] = useState(false);
  const [betjenteOpen, setBetjenteOpen] = useState(false);

  // Section toggles
  const [activeMistaenkt, setActiveMistaenkt] = useState<string | null>(null);

  // Evidence form
  const [bevisForm, setBevisForm] = useState({ billedUrl: "", beskrivelse: "", timestamp: "" });

  // Tags
  const [tagInput, setTagInput] = useState("");

  // References
  const [refForm, setRefForm] = useState({ titel: "", url: "", beskrivelse: "" });

  // Vehicle form
  const [koeretoejForm, setKoeretoejForm] = useState({ nummerplade: "", beskrivelse: "" });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [p, b] = await Promise.all([personerApi.getAll(), betjenteApi.getAll()]);
        setPersoner(p);
        setBetjente(b);

        // Auto-select current user as betjent
        const currentMatch = b.find(bt => bt.badgeNr === currentUser.badgeNr);

        if (sagId) {
          const allSager = await sagerApi.getAll();
          const existing = allSager.find(s => s.id === sagId);
          if (existing) {
            setSag(existing);
            setIsExisting(true);
            if (existing.mistaenkte.length > 0) {
              setActiveMistaenkt(existing.mistaenkte[0].id);
            }
          }
        } else {
          const newSag = emptySag(`${currentUser.fornavn} ${currentUser.efternavn}`);
          if (currentMatch) {
            newSag.involveretBetjente = [currentMatch.id];
          }
          if (initialPersonId) {
            const person = p.find(pp => pp.id === initialPersonId);
            if (person) {
              const m: SagMistaenkt = {
                id: Date.now().toString(),
                personId: person.id,
                personNavn: `${person.fornavn} ${person.efternavn}`,
                personCpr: person.cpr,
                sigtelser: [],
                totalBoede: 0,
                totalFaengsel: 0,
                erkender: null,
                behandlet: false,
                tilkendegivelseAfgivet: false,
                fratagKoerekort: false,
              };
              newSag.mistaenkte = [m];
              setActiveMistaenkt(m.id);
            }
          }
          setSag(newSag);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [sagId, currentUser, initialPersonId]);

  const updateSag = useCallback((partial: Partial<Sag>) => {
    setSag(prev => ({ ...prev, ...partial, opdateret: new Date().toISOString() }));
  }, []);

  const handleSave = async () => {
    if (!sag.titel.trim()) {
      toast("Angiv en titel for sagen");
      return;
    }
    setSaving(true);
    try {
      if (isExisting) {
        await sagerApi.update(sag.id, sag);
      } else {
        await sagerApi.create(sag);
        setIsExisting(true);
      }
      toast(isExisting ? "Sag opdateret" : "Sag oprettet");
      onSagSaved?.(sag);
    } catch (err) {
      console.error(err);
      toast("Fejl ved gemning af sag");
    } finally {
      setSaving(false);
    }
  };

  // Add suspect
  const addMistaenkt = (person: Person) => {
    if (sag.mistaenkte.find(m => m.personId === person.id)) {
      toast("Person er allerede tilføjet som mistænkt");
      return;
    }
    const m: SagMistaenkt = {
      id: Date.now().toString(),
      personId: person.id,
      personNavn: `${person.fornavn} ${person.efternavn}`,
      personCpr: person.cpr,
      sigtelser: [],
      totalBoede: 0,
      totalFaengsel: 0,
      erkender: null,
      behandlet: false,
      tilkendegivelseAfgivet: false,
      fratagKoerekort: false,
    };
    updateSag({ mistaenkte: [...sag.mistaenkte, m] });
    setActiveMistaenkt(m.id);
    setShowPersonSearch(false);
    setPersonSearch("");
  };

  const removeMistaenkt = (id: string) => {
    const updated = sag.mistaenkte.filter(m => m.id !== id);
    updateSag({ mistaenkte: updated });
    if (activeMistaenkt === id) {
      setActiveMistaenkt(updated.length > 0 ? updated[0].id : null);
    }
  };

  const updateMistaenkt = (id: string, data: Partial<SagMistaenkt>) => {
    updateSag({
      mistaenkte: sag.mistaenkte.map(m => m.id === id ? { ...m, ...data } : m),
    });
  };

  // Add citizen
  const addBorger = (person: Person, rolle: string) => {
    const b: SagBorger = {
      id: Date.now().toString(),
      personId: person.id,
      navn: `${person.fornavn} ${person.efternavn}`,
      cpr: person.cpr,
      rolle,
    };
    updateSag({ involveretBorgere: [...sag.involveretBorgere, b] });
    setShowBorgerSearch(false);
    setBorgerSearch("");
  };

  // Toggle officer
  const toggleBetjent = (id: string) => {
    const prev = sag.involveretBetjente;
    updateSag({
      involveretBetjente: prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    });
  };

  // Add evidence
  const addBevis = () => {
    if (!bevisForm.beskrivelse.trim()) return;
    const b: SagBevis = {
      id: Date.now().toString(),
      type: bevisForm.billedUrl ? 'billede' : 'tekst',
      billedUrl: bevisForm.billedUrl || undefined,
      beskrivelse: bevisForm.beskrivelse,
      timestamp: bevisForm.timestamp || undefined,
      oprettetAf: `${currentUser.fornavn} ${currentUser.efternavn}`,
      oprettetDato: new Date().toISOString(),
    };
    updateSag({ beviser: [...sag.beviser, b] });
    setBevisForm({ billedUrl: "", beskrivelse: "", timestamp: "" });
  };

  // Add tag
  const addTag = () => {
    if (!tagInput.trim() || sag.tags.includes(tagInput.trim())) return;
    updateSag({ tags: [...sag.tags, tagInput.trim()] });
    setTagInput("");
  };

  // Add reference
  const addReference = () => {
    if (!refForm.titel.trim()) return;
    const r: SagReference = {
      id: Date.now().toString(),
      titel: refForm.titel,
      url: refForm.url || undefined,
      beskrivelse: refForm.beskrivelse || undefined,
    };
    updateSag({ referencer: [...sag.referencer, r] });
    setRefForm({ titel: "", url: "", beskrivelse: "" });
  };

  // Add vehicle
  const addKoeretoej = () => {
    if (!koeretoejForm.nummerplade.trim()) return;
    const k: SagKoeretoej = {
      id: Date.now().toString(),
      nummerplade: koeretoejForm.nummerplade,
      beskrivelse: koeretoejForm.beskrivelse,
    };
    updateSag({ koeretoejer: [...sag.koeretoejer, k] });
    setKoeretoejForm({ nummerplade: "", beskrivelse: "" });
  };

  const filteredPersoner = (search: string) =>
    personer.filter(p => {
      const q = search.toLowerCase();
      return p.fornavn.toLowerCase().includes(q) || p.efternavn.toLowerCase().includes(q) || p.cpr.includes(q);
    }).slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {isExisting ? "Rediger Sag" : "Opret Sag"}
            </h1>
            <p className="text-[11px] text-muted-foreground font-mono">{sag.sagsnummer}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelector value={sag.status} onChange={(status) => updateSag({ status })} />
          <Button onClick={handleSave} disabled={saving} className="gap-1.5 h-9 text-xs">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isExisting ? "Gem ændringer" : "Opret sag"}
          </Button>
        </div>
      </div>

      {/* Title + Tags */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sagstitel</Label>
          <Input
            value={sag.titel}
            onChange={(e) => updateSag({ titel: e.target.value })}
            placeholder="Skriv en titel for sagen..."
            className="mt-1 bg-secondary border-border text-sm"
          />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tags</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tilføj tag..."
              className="bg-secondary border-border text-xs h-8 flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
            />
            <Button size="sm" className="h-8 w-8 p-0" onClick={addTag} disabled={!tagInput.trim()}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {sag.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {sag.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[10px] gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button onClick={() => updateSag({ tags: sag.tags.filter((_, j) => j !== i) })}
                    className="hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Left column - Main content */}
        <div className="space-y-4">
          {/* Mistænkte */}
          <SectionCard title="Mistænkte" icon={<AlertTriangle className="w-4 h-4" />} count={sag.mistaenkte.length}>
            <div className="space-y-2">
              {sag.mistaenkte.map((m) => (
                <div key={m.id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setActiveMistaenkt(activeMistaenkt === m.id ? null : m.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-left transition-colors",
                      activeMistaenkt === m.id ? "bg-primary/5" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{m.personNavn}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{m.personCpr}</span>
                      {m.sigtelser.length > 0 && (
                        <Badge className="bg-primary/10 text-primary border-0 text-[9px] h-4 px-1.5">
                          {m.sigtelser.length} sigtelser
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {m.erkender !== null && (
                          <Badge className={cn("text-[9px] h-4 border-0", m.erkender ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                            {m.erkender ? "Erkender" : "Erkender ikke"}
                          </Badge>
                        )}
                        {m.behandlet && <Badge className="bg-primary/15 text-primary border-0 text-[9px] h-4">Behandlet</Badge>}
                        {m.tilkendegivelseAfgivet && <Badge className="bg-accent/15 text-accent border-0 text-[9px] h-4">Tilkendegivelse</Badge>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeMistaenkt(m.id); }}
                        className="text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", activeMistaenkt === m.id && "rotate-180")} />
                    </div>
                  </button>

                  {activeMistaenkt === m.id && (
                    <div className="px-3 py-3 border-t border-border space-y-3">
                      <MistaenktSigtelser
                        mistaenkt={m}
                        onUpdate={(data) => updateMistaenkt(m.id, data)}
                      />
                    </div>
                  )}
                </div>
              ))}

              {/* Add suspect */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs gap-1.5 border-dashed"
                  onClick={() => setShowPersonSearch(!showPersonSearch)}
                >
                  <Plus className="w-3 h-3" /> Tilføj mistænkt
                </Button>
                {showPersonSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-20 max-h-[250px] overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <Input
                        placeholder="Søg person..."
                        value={personSearch}
                        onChange={(e) => setPersonSearch(e.target.value)}
                        className="h-8 text-xs bg-secondary"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {filteredPersoner(personSearch).map(p => (
                        <button
                          key={p.id}
                          onClick={() => addMistaenkt(p)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30 transition-colors"
                        >
                          <span className="font-medium">{p.fornavn} {p.efternavn}</span>
                          <span className="text-muted-foreground font-mono">{p.cpr}</span>
                        </button>
                      ))}
                      {filteredPersoner(personSearch).length === 0 && (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">Ingen resultater</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Rapport */}
          <SectionCard title="Rapport beskrivelse" icon={<FileText className="w-4 h-4" />}>
            <Textarea
              placeholder="Beskriv hændelsesforløbet..."
              value={sag.rapport.haendelsesforloeb}
              onChange={(e) => updateSag({
                rapport: { ...sag.rapport, haendelsesforloeb: e.target.value }
              })}
              rows={6}
              className="bg-secondary border-border text-xs resize-none"
            />
          </SectionCard>

          {/* Beviser */}
          <SectionCard title="Beviser" icon={<Camera className="w-4 h-4" />} count={sag.beviser.length}>
            {sag.beviser.map((b) => (
              <div key={b.id} className="flex gap-3 p-2.5 bg-muted/20 border border-border rounded-lg mb-2">
                {b.billedUrl && (
                  <div className="w-16 h-16 rounded bg-muted border border-border overflow-hidden shrink-0">
                    <img src={b.billedUrl} alt="" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs">{b.beskrivelse}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span>{b.oprettetAf}</span>
                    {b.timestamp && <><span>·</span><Clock className="w-2.5 h-2.5" /><span>{b.timestamp}</span></>}
                    <span>·</span>
                    <span>{new Date(b.oprettetDato).toLocaleDateString("da-DK")}</span>
                  </div>
                </div>
                <button onClick={() => updateSag({ beviser: sag.beviser.filter(x => x.id !== b.id) })}
                  className="text-muted-foreground hover:text-destructive shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}

            <div className="space-y-2 p-3 bg-muted/10 border border-border/50 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Billedlink (valgfrit)</Label>
                  <Input value={bevisForm.billedUrl} onChange={(e) => setBevisForm({ ...bevisForm, billedUrl: e.target.value })}
                    placeholder="https://..." className="h-8 text-xs bg-secondary mt-1" />
                </div>
                <div>
                  <Label className="text-[10px]">Timestamp (valgfrit)</Label>
                  <Input value={bevisForm.timestamp} onChange={(e) => setBevisForm({ ...bevisForm, timestamp: e.target.value })}
                    placeholder="f.eks. 14:30" className="h-8 text-xs bg-secondary mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-[10px]">Beskrivelse *</Label>
                <Textarea value={bevisForm.beskrivelse} onChange={(e) => setBevisForm({ ...bevisForm, beskrivelse: e.target.value })}
                  placeholder="Beskriv beviset..." rows={2} className="text-xs bg-secondary resize-none mt-1" />
              </div>
              <Button size="sm" className="h-8 text-xs gap-1" onClick={addBevis} disabled={!bevisForm.beskrivelse.trim()}>
                <Plus className="w-3 h-3" /> Tilføj bevis
              </Button>
            </div>
          </SectionCard>
        </div>

        {/* Right column - Sidebar info */}
        <div className="space-y-4">
          {/* Betjente */}
          <SectionCard title="Involverede betjente" icon={<Shield className="w-4 h-4" />} count={sag.involveretBetjente.length}>
            <Collapsible open={betjenteOpen} onOpenChange={setBetjenteOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                  <Plus className="w-3 h-3" /> Vælg betjente
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1 mt-2 max-h-[200px] overflow-y-auto">
                  {betjente.map((b) => {
                    const sel = sag.involveretBetjente.includes(b.id);
                    return (
                      <button key={b.id} onClick={() => toggleBetjent(b.id)}
                        className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs transition-colors",
                          sel ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30 border border-transparent"
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
            {sag.involveretBetjente.length > 0 && !betjenteOpen && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sag.involveretBetjente.map(id => {
                  const b = betjente.find(x => x.id === id);
                  return b ? <Badge key={id} variant="outline" className="text-[10px]">{b.fornavn} {b.efternavn}</Badge> : null;
                })}
              </div>
            )}
          </SectionCard>

          {/* Involverede borgere */}
          <SectionCard title="Involverede borgere" icon={<Users className="w-4 h-4" />} count={sag.involveretBorgere.length}>
            {sag.involveretBorgere.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-2.5 py-1.5 bg-muted/20 border border-border rounded text-xs mb-1">
                <div>
                  <span className="font-medium">{b.navn}</span>
                  <span className="ml-1.5 text-muted-foreground">({b.rolle})</span>
                </div>
                <button onClick={() => updateSag({ involveretBorgere: sag.involveretBorgere.filter(x => x.id !== b.id) })}
                  className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <div className="relative">
              <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5 border-dashed"
                onClick={() => setShowBorgerSearch(!showBorgerSearch)}>
                <Plus className="w-3 h-3" /> Tilføj borger
              </Button>
              {showBorgerSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-20 max-h-[250px] overflow-hidden">
                  <div className="p-2 border-b border-border">
                    <Input placeholder="Søg person..." value={borgerSearch}
                      onChange={(e) => setBorgerSearch(e.target.value)} className="h-8 text-xs bg-secondary" autoFocus />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredPersoner(borgerSearch).map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/30">
                        <span className="text-xs">{p.fornavn} {p.efternavn}</span>
                        <div className="flex gap-1">
                          {["Vidne", "Offer", "Anden"].map(rolle => (
                            <Button key={rolle} size="sm" variant="outline" className="h-6 text-[10px] px-2"
                              onClick={() => addBorger(p, rolle)}>{rolle}</Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Køretøjer */}
          <SectionCard title="Køretøjer" icon={<Car className="w-4 h-4" />} count={sag.koeretoejer.length}>
            {sag.koeretoejer.map((k) => (
              <div key={k.id} className="flex items-center justify-between px-2.5 py-1.5 bg-muted/20 border border-border rounded text-xs mb-1">
                <div>
                  <span className="font-mono font-medium">{k.nummerplade}</span>
                  {k.beskrivelse && <span className="ml-1.5 text-muted-foreground">{k.beskrivelse}</span>}
                </div>
                <button onClick={() => updateSag({ koeretoejer: sag.koeretoejer.filter(x => x.id !== k.id) })}
                  className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <Input value={koeretoejForm.nummerplade} onChange={(e) => setKoeretoejForm({ ...koeretoejForm, nummerplade: e.target.value })}
                placeholder="Nummerplade" className="h-8 text-xs bg-secondary flex-1" />
              <Input value={koeretoejForm.beskrivelse} onChange={(e) => setKoeretoejForm({ ...koeretoejForm, beskrivelse: e.target.value })}
                placeholder="Beskrivelse" className="h-8 text-xs bg-secondary flex-1" />
              <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={addKoeretoej} disabled={!koeretoejForm.nummerplade.trim()}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </SectionCard>

          {/* Referencer */}
          <SectionCard title="Referencer" icon={<Link2 className="w-4 h-4" />} count={sag.referencer.length}>
            {sag.referencer.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-2.5 py-1.5 bg-muted/20 border border-border rounded text-xs mb-1">
                <div className="truncate">
                  <span className="font-medium">{r.titel}</span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="ml-1.5 text-primary hover:underline text-[10px]">Link</a>
                  )}
                </div>
                <button onClick={() => updateSag({ referencer: sag.referencer.filter(x => x.id !== r.id) })}
                  className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ))}
            <div className="space-y-1.5">
              <Input value={refForm.titel} onChange={(e) => setRefForm({ ...refForm, titel: e.target.value })}
                placeholder="Titel" className="h-8 text-xs bg-secondary" />
              <div className="flex gap-1.5">
                <Input value={refForm.url} onChange={(e) => setRefForm({ ...refForm, url: e.target.value })}
                  placeholder="URL (valgfrit)" className="h-8 text-xs bg-secondary flex-1" />
                <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={addReference} disabled={!refForm.titel.trim()}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Sag info */}
          <div className="bg-card border border-border rounded-lg p-3 space-y-2 text-[10px] text-muted-foreground">
            <div className="flex justify-between"><span>Sagsnummer</span><span className="font-mono text-foreground">{sag.sagsnummer}</span></div>
            <div className="flex justify-between"><span>Oprettet af</span><span className="text-foreground">{sag.oprettetAf}</span></div>
            <div className="flex justify-between"><span>Oprettet</span><span className="font-mono">{new Date(sag.oprettet).toLocaleDateString("da-DK")}</span></div>
            <div className="flex justify-between"><span>Sidst opdateret</span><span className="font-mono">{new Date(sag.opdateret).toLocaleDateString("da-DK")}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const SectionCard = ({ title, icon, count, children }: { title: string; icon: React.ReactNode; count?: number; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-lg p-3 space-y-2">
    <div className="flex items-center justify-between pb-1.5 border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
        {count !== undefined && count > 0 && (
          <Badge className="bg-primary/10 text-primary border-0 text-[9px] h-4 px-1.5">{count}</Badge>
        )}
      </div>
    </div>
    {children}
  </div>
);

const StatusSelector = ({ value, onChange }: { value: SagsStatus; onChange: (v: SagsStatus) => void }) => {
  const statuses = [
    { value: "aaben" as const, label: "Åben", color: "bg-success/15 text-success border-success/20" },
    { value: "under_efterforskning" as const, label: "Efterforskning", color: "bg-primary/15 text-primary border-primary/20" },
    { value: "afventer_retten" as const, label: "Afventer retten", color: "bg-warning/15 text-warning border-warning/20" },
    { value: "lukket" as const, label: "Lukket", color: "bg-muted text-muted-foreground border-border" },
  ];

  return (
    <div className="flex gap-1">
      {statuses.map(s => (
        <button key={s.value} onClick={() => onChange(s.value)}
          className={cn("px-2.5 py-1 rounded-md border text-[10px] font-medium transition-all",
            value === s.value ? s.color : "border-border text-muted-foreground hover:bg-muted/30"
          )}>
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default SagEditor;
