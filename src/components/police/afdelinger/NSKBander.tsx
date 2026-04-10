import { useState, useMemo, useEffect } from "react";
import {
  Search, Plus, X, Check, ChevronLeft, Users, AlertTriangle,
  FileText, Trash2, UserPlus, Shield, Info
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { personerApi } from "@/lib/api";
import type { Person } from "@/types/police";

interface BandeMedlem {
  personId: string;
  navn: string;
  cpr: string;
  rolle: string;
  tilfojetDato: string;
}

interface Bevis {
  id: string;
  beskrivelse: string;
  tilfojetAf: string;
  tilfojetDato: string;
}

interface Bande {
  id: string;
  navn: string;
  trpivsselsniveau: string; // Høj, Middel, Lav
  medlemmer: BandeMedlem[];
  beviser: Bevis[];
  information: string;
  oprettetAf: string;
  oprettetDato: string;
}

const BANDER_KEY = "nsk_bander";
const trusselsfarver: Record<string, { bg: string; text: string; badge: string }> = {
  "Høj": { bg: "bg-destructive", text: "text-destructive", badge: "bg-destructive text-destructive-foreground" },
  "Middel": { bg: "bg-yellow-500", text: "text-yellow-500", badge: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" },
  "Lav": { bg: "bg-green-500", text: "text-green-500", badge: "bg-green-500/20 text-green-600 border-green-500/30" },
};

interface NSKBanderProps {
  userName: string;
}

const NSKBander = ({ userName }: NSKBanderProps) => {
  const [bander, setBander] = useState<Bande[]>([]);
  const [personer, setPersoner] = useState<Person[]>([]);
  const [selectedBandeId, setSelectedBandeId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBandeNavn, setNewBandeNavn] = useState("");
  const [newBandeTrussel, setNewBandeTrussel] = useState("Høj");
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showBevisForm, setShowBevisForm] = useState(false);
  const [newBevis, setNewBevis] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(BANDER_KEY);
    if (saved) {
      try { setBander(JSON.parse(saved)); } catch { /* empty */ }
    }
    personerApi.getAll().then(p => setPersoner(p as Person[])).catch(() => {});
  }, []);

  const save = (updated: Bande[]) => {
    setBander(updated);
    localStorage.setItem(BANDER_KEY, JSON.stringify(updated));
  };

  const selectedBande = bander.find(b => b.id === selectedBandeId);

  const opretBande = () => {
    if (!newBandeNavn.trim()) return;
    const ny: Bande = {
      id: crypto.randomUUID(),
      navn: newBandeNavn.trim(),
      trpivsselsniveau: newBandeTrussel,
      medlemmer: [],
      beviser: [],
      information: "",
      oprettetAf: userName,
      oprettetDato: new Date().toISOString().split("T")[0],
    };
    save([ny, ...bander]);
    setNewBandeNavn("");
    setNewBandeTrussel("Høj");
    setShowCreateForm(false);
    setSelectedBandeId(ny.id);
  };

  const sletBande = (id: string) => {
    save(bander.filter(b => b.id !== id));
    if (selectedBandeId === id) setSelectedBandeId(null);
  };

  const updateBande = (id: string, updates: Partial<Bande>) => {
    save(bander.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const tilfoejMedlem = (person: Person) => {
    if (!selectedBande) return;
    if (selectedBande.medlemmer.some(m => m.personId === person.id)) return;
    const nytMedlem: BandeMedlem = {
      personId: person.id,
      navn: `${person.fornavn} ${person.efternavn}`,
      cpr: person.cpr,
      rolle: "Medlem",
      tilfojetDato: new Date().toISOString().split("T")[0],
    };
    updateBande(selectedBande.id, { medlemmer: [...selectedBande.medlemmer, nytMedlem] });
    setMemberSearch("");
    setShowMemberDropdown(false);
  };

  const fjernMedlem = (personId: string) => {
    if (!selectedBande) return;
    updateBande(selectedBande.id, { medlemmer: selectedBande.medlemmer.filter(m => m.personId !== personId) });
  };

  const tilfoejBevis = () => {
    if (!selectedBande || !newBevis.trim()) return;
    const nytBevis: Bevis = {
      id: crypto.randomUUID(),
      beskrivelse: newBevis.trim(),
      tilfojetAf: userName,
      tilfojetDato: new Date().toISOString().split("T")[0],
    };
    updateBande(selectedBande.id, { beviser: [...selectedBande.beviser, nytBevis] });
    setNewBevis("");
    setShowBevisForm(false);
  };

  const fjernBevis = (bevisId: string) => {
    if (!selectedBande) return;
    updateBande(selectedBande.id, { beviser: selectedBande.beviser.filter(b => b.id !== bevisId) });
  };

  const updateTrussel = (niveau: string) => {
    if (!selectedBande) return;
    updateBande(selectedBande.id, { trpivsselsniveau: niveau });
  };

  const filteredMemberPersoner = useMemo(() => {
    if (!memberSearch || !selectedBande) return [];
    const q = memberSearch.toLowerCase();
    const existingIds = new Set(selectedBande.medlemmer.map(m => m.personId));
    return personer
      .filter(p => !existingIds.has(p.id) && `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [memberSearch, personer, selectedBande]);

  // Detail view for a selected bande
  if (selectedBande) {
    const trussel = trusselsfarver[selectedBande.trpivsselsniveau] || trusselsfarver["Lav"];
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="rounded-lg border bg-card p-4">
          <button
            onClick={() => setSelectedBandeId(null)}
            className="flex items-center gap-1 text-[11px] text-primary hover:underline mb-3"
          >
            <ChevronLeft className="w-3 h-3" /> Tilbage til oversigt
          </button>

          <div className="text-center mb-3">
            <h2 className="text-base font-bold">{selectedBande.navn} - Detaljer</h2>
          </div>

          {/* Trusselsniveau */}
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium">Trusselsniveau:</span>
            </div>
            <select
              value={selectedBande.trpivsselsniveau}
              onChange={e => updateTrussel(e.target.value)}
              className="h-8 px-3 text-xs rounded-md border border-input bg-background text-foreground"
            >
              <option value="Høj">Høj</option>
              <option value="Middel">Middel</option>
              <option value="Lav">Lav</option>
            </select>
          </div>
        </div>

        {/* Members + Statistics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Members */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">Medlemmer</h3>
              </div>
              <button
                onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                className="p-1 rounded hover:bg-muted text-green-500"
                title="Tilføj medlem"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[10px] text-muted-foreground mb-2">
              Antal medlemmer: {selectedBande.medlemmer.length}
            </div>

            {/* Search to add member */}
            {showMemberDropdown && (
              <div className="mb-3 relative">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="Søg efter medlem..."
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    className="pl-7 h-7 text-[11px]"
                    autoFocus
                  />
                </div>
                {memberSearch && filteredMemberPersoner.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-32 overflow-y-auto">
                    {filteredMemberPersoner.map(p => (
                      <button
                        key={p.id}
                        onClick={() => tilfoejMedlem(p)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] hover:bg-muted/50 text-left border-b border-border/50 last:border-0"
                      >
                        <span className="font-medium">{p.fornavn} {p.efternavn}</span>
                        <span className="text-muted-foreground font-mono text-[9px]">{p.cpr}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Member list */}
            <div className="space-y-1">
              {selectedBande.medlemmer.map(m => (
                <div key={m.personId} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/30">
                  <div>
                    <div className="text-[11px] font-medium">{m.navn}</div>
                    <div className="text-[9px] text-muted-foreground">Antal sigtelser: 0</div>
                  </div>
                  <button onClick={() => fjernMedlem(m.personId)} className="p-1 rounded hover:bg-muted">
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
              {selectedBande.medlemmer.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-4">Ingen medlemmer endnu</div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="text-sm font-bold mb-3">Bande Statistik</h3>
            <div className="text-[11px] text-muted-foreground mb-2">
              Samlet antal sigtelser: {selectedBande.medlemmer.length > 0 ? 0 : 0}
            </div>
            <div>
              <div className="text-xs font-semibold mb-2">Seneste Sigtelser</div>
              <div className="rounded-lg border bg-muted/20 p-3 min-h-[80px]">
                <span className="text-[11px] text-muted-foreground">Ingen sigtelser endnu</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evidence */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold">Beviser</h3>
            </div>
            <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setShowBevisForm(true)}>
              <Plus className="w-3 h-3" /> Tilføj Bevis
            </Button>
          </div>
          {showBevisForm && (
            <div className="mb-3 flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Beskrivelse af bevis..."
                  value={newBevis}
                  onChange={e => setNewBevis(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && tilfoejBevis()}
                  className="h-8 text-xs"
                  autoFocus
                />
              </div>
              <Button size="sm" className="h-8 text-xs" onClick={tilfoejBevis} disabled={!newBevis.trim()}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowBevisForm(false); setNewBevis(""); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
          <div className="space-y-1">
            {selectedBande.beviser.map(b => (
              <div key={b.id} className="flex items-center justify-between px-2 py-1.5 rounded border bg-muted/20">
                <div>
                  <div className="text-[11px]">{b.beskrivelse}</div>
                  <div className="text-[9px] text-muted-foreground">{b.tilfojetDato} — {b.tilfojetAf}</div>
                </div>
                <button onClick={() => fjernBevis(b.id)} className="p-1 rounded hover:bg-muted">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}
            {selectedBande.beviser.length === 0 && !showBevisForm && (
              <div className="text-[11px] text-muted-foreground text-center py-4">Ingen beviser tilføjet</div>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold">Information</h3>
          </div>
          <Textarea
            placeholder="Skriv generel information om banden her..."
            value={selectedBande.information}
            onChange={e => updateBande(selectedBande.id, { information: e.target.value })}
            className="text-xs min-h-[100px]"
          />
          <Button
            size="sm"
            className="mt-2 h-7 text-[11px]"
            onClick={() => {
              const current = bander.find(b => b.id === selectedBande.id);
              if (current) save(bander);
            }}
          >
            Gem Information
          </Button>
        </div>
      </div>
    );
  }

  // Overview: all bander as cards
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-center">
        <h2 className="text-base font-bold">NSK Bande Oversigt</h2>
      </div>

      <div className="flex justify-start">
        {showCreateForm ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Bande navn..."
              value={newBandeNavn}
              onChange={e => setNewBandeNavn(e.target.value)}
              onKeyDown={e => e.key === "Enter" && opretBande()}
              className="h-8 text-xs w-48"
              autoFocus
            />
            <select
              value={newBandeTrussel}
              onChange={e => setNewBandeTrussel(e.target.value)}
              className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground"
            >
              <option value="Høj">Høj</option>
              <option value="Middel">Middel</option>
              <option value="Lav">Lav</option>
            </select>
            <Button size="sm" className="h-8 text-xs gap-1" onClick={opretBande} disabled={!newBandeNavn.trim()}>
              <Check className="w-3 h-3" /> Opret
            </Button>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setShowCreateForm(false); setNewBandeNavn(""); }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-3.5 h-3.5" /> Opret Ny Bande
          </Button>
        )}
      </div>

      {/* Bande cards */}
      <div className="grid grid-cols-2 gap-4">
        {bander.map(b => {
          const trussel = trusselsfarver[b.trpivsselsniveau] || trusselsfarver["Lav"];
          return (
            <div key={b.id} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">{b.navn}</h3>
                <Badge className={cn("text-[10px] px-2 py-0.5", trussel.badge)}>
                  {b.trpivsselsniveau}
                </Badge>
              </div>
              <div className="text-[10px] text-muted-foreground">ID: {b.id.slice(0, 8)}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Users className="w-3 h-3" /> {b.medlemmer.length} medlemmer
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <AlertTriangle className="w-3 h-3" /> Trusselsniveau: {b.trpivsselsniveau}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] flex-1"
                  onClick={() => setSelectedBandeId(b.id)}
                >
                  Se Detaljer
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[11px] text-destructive hover:text-destructive"
                  onClick={() => sletBande(b.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {bander.length === 0 && !showCreateForm && (
        <div className="text-center py-12">
          <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-xs font-medium mb-1">Ingen bander registreret</p>
          <p className="text-[10px] text-muted-foreground mb-4">Opret den første bande for at komme i gang</p>
        </div>
      )}
    </div>
  );
};

export default NSKBander;
