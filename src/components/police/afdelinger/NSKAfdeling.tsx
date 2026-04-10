import { useState, useEffect, useMemo } from "react";
import { Search, Users, Target, Plus, X, Trash2, Edit2, Check, Loader2, ChevronDown, ChevronRight, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AfdelingLayout from "./AfdelingLayout";
import type { Betjent, Person } from "@/types/police";
import { personerApi, tilhoersforholdApi, type TilhoersforholdDB } from "@/lib/api";

interface BandeTilhoer {
  id: string;
  personId?: string;
  personNavn: string;
  personCpr: string;
  bande: string;
  rolle: string;
  status: "aktiv" | "inaktiv" | "tidligere";
  noter: string;
  tilfojetAf: string;
  tilfojetDato: string;
  oprettetAf?: string;
  oprettetDato?: string;
}

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  aktiv: { label: "Aktiv", dot: "bg-green-500", badge: "bg-green-500/10 text-green-500 border-green-500/20" },
  inaktiv: { label: "Inaktiv", dot: "bg-muted-foreground", badge: "bg-muted text-muted-foreground" },
  tidligere: { label: "Tidligere", dot: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
};

const STORAGE_KEY = "nsk_netvaerk";

interface NSKAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const TilhoersforholdContent = ({ userName }: { userName: string }) => {
  const [tilhoer, setTilhoer] = useState<BandeTilhoer[]>([]);
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personSearch, setPersonSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedBander, setExpandedBander] = useState<Set<string>>(new Set());

  // Form state
  const [formPersonId, setFormPersonId] = useState("");
  const [formNavn, setFormNavn] = useState("");
  const [formCpr, setFormCpr] = useState("");
  const [formBande, setFormBande] = useState("");
  const [formRolle, setFormRolle] = useState("Medlem");
  const [formStatus, setFormStatus] = useState<string>("aktiv");
  const [formNoter, setFormNoter] = useState("");
  const [formPersonSearch, setFormPersonSearch] = useState("");
  const [showFormPersonDropdown, setShowFormPersonDropdown] = useState(false);

  useEffect(() => {
    Promise.all([
      tilhoersforholdApi.getAll().catch(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
      }),
      personerApi.getAll().catch(() => []),
    ]).then(([th, p]) => {
      setTilhoer(th as BandeTilhoer[]);
      setPersoner(p as Person[]);
    }).finally(() => setLoading(false));
  }, []);

  // Derived data
  const bander = useMemo(() => {
    const map: Record<string, BandeTilhoer[]> = {};
    tilhoer.forEach(t => { if (!map[t.bande]) map[t.bande] = []; map[t.bande].push(t); });
    return map;
  }, [tilhoer]);

  const filteredPersoner = useMemo(() => {
    if (!personSearch) return personer;
    const q = personSearch.toLowerCase();
    return personer.filter(p => `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(q));
  }, [personer, personSearch]);

  const selectedPerson = personer.find(p => p.id === selectedPersonId);
  const selectedPersonTilhoer = useMemo(() => {
    if (!selectedPerson) return [];
    return tilhoer.filter(t => t.personId === selectedPerson.id || t.personCpr === selectedPerson.cpr);
  }, [selectedPerson, tilhoer]);

  const stats = useMemo(() => ({
    total: tilhoer.length,
    grupper: Object.keys(bander).length,
    aktive: tilhoer.filter(t => t.status === "aktiv").length,
  }), [tilhoer, bander]);

  // Persons with tilhørsforhold count
  const personTilhoerCount = useMemo(() => {
    const counts: Record<string, number> = {};
    tilhoer.forEach(t => {
      if (t.personId) counts[t.personId] = (counts[t.personId] || 0) + 1;
    });
    return counts;
  }, [tilhoer]);

  const save = (items: BandeTilhoer[]) => {
    setTilhoer(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setFormPersonId(""); setFormNavn(""); setFormCpr(""); setFormBande(""); setFormRolle("Medlem"); setFormStatus("aktiv"); setFormNoter("");
    setFormPersonSearch(""); setShowFormPersonDropdown(false);
  };

  const openFormForPerson = (p: Person) => {
    resetForm();
    setFormPersonId(p.id);
    setFormNavn(`${p.fornavn} ${p.efternavn}`);
    setFormCpr(p.cpr);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formNavn.trim() || !formBande.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      const updated = { personNavn: formNavn, personCpr: formCpr, bande: formBande, rolle: formRolle, status: formStatus as BandeTilhoer["status"], noter: formNoter };
      try { await tilhoersforholdApi.update(editId, updated as unknown as Partial<TilhoersforholdDB>); } catch {}
      save(tilhoer.map(t => t.id === editId ? { ...t, ...updated } : t));
    } else {
      const nyt: BandeTilhoer = {
        id: crypto.randomUUID(), personId: formPersonId, personNavn: formNavn, personCpr: formCpr,
        bande: formBande, rolle: formRolle, status: formStatus as BandeTilhoer["status"],
        noter: formNoter, tilfojetAf: userName, tilfojetDato: now,
        oprettetAf: userName, oprettetDato: now.split("T")[0],
      };
      try { await tilhoersforholdApi.create(nyt as unknown as TilhoersforholdDB); } catch {}
      save([nyt, ...tilhoer]);
    }
    resetForm();
  };

  const startEdit = (t: BandeTilhoer) => {
    setEditId(t.id); setFormNavn(t.personNavn); setFormCpr(t.personCpr); setFormBande(t.bande);
    setFormRolle(t.rolle); setFormStatus(t.status); setFormNoter(t.noter); setShowForm(true);
  };

  const slet = async (id: string) => {
    try { await tilhoersforholdApi.remove(id); } catch {}
    save(tilhoer.filter(t => t.id !== id));
  };

  const toggleBande = (bande: string) => {
    setExpandedBander(prev => {
      const next = new Set(prev);
      next.has(bande) ? next.delete(bande) : next.add(bande);
      return next;
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const formPersonerFiltered = personer.filter(p => {
    if (!formPersonSearch) return false;
    const q = formPersonSearch.toLowerCase();
    return `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(q);
  }).slice(0, 8);

  const existingBander = Object.keys(bander);

  return (
    <div className="space-y-3">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-lg font-bold text-primary">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">Registreringer</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-lg font-bold text-destructive">{stats.grupper}</div>
          <div className="text-[10px] text-muted-foreground">Grupperinger</div>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <div className="text-lg font-bold text-green-500">{stats.aktive}</div>
          <div className="text-[10px] text-muted-foreground">Aktive</div>
        </div>
      </div>

      {/* Main split layout */}
      <div className="flex gap-3" style={{ height: "calc(100vh - 340px)", minHeight: 400 }}>
        {/* Left: Person list */}
        <div className="w-60 shrink-0 rounded-lg border bg-card flex flex-col overflow-hidden">
          <div className="p-2 border-b">
            <div className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" /> Personer
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                placeholder="Søg navn eller CPR..."
                value={personSearch}
                onChange={e => setPersonSearch(e.target.value)}
                className="pl-7 h-7 text-[11px]"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredPersoner.map(p => {
              const count = personTilhoerCount[p.id] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersonId(p.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50",
                    selectedPersonId === p.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", count > 0 ? "bg-destructive" : "bg-green-500")} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{p.fornavn} {p.efternavn}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">{p.cpr}</div>
                  </div>
                  {count > 0 && (
                    <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4 shrink-0">{count}</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Content */}
        <div className="flex-1 rounded-lg border bg-card overflow-y-auto p-4">
          {selectedPerson ? (
            /* Person detail view */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">{selectedPerson.fornavn} {selectedPerson.efternavn}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">{selectedPerson.cpr}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => openFormForPerson(selectedPerson)}>
                    <UserPlus className="w-3 h-3" /> Tilføj tilhørsforhold
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setSelectedPersonId(null)}>
                    ← Overblik
                  </Button>
                </div>
              </div>

              {/* Person info */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border p-2">
                  <div className="text-[9px] text-muted-foreground">Adresse</div>
                  <div className="text-[11px]">{selectedPerson.adresse || "—"}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-[9px] text-muted-foreground">Telefon</div>
                  <div className="text-[11px]">{selectedPerson.telefon || "—"}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-[9px] text-muted-foreground">Status</div>
                  <div className="text-[11px]">{selectedPerson.status || "aktiv"}</div>
                </div>
              </div>

              {/* Tilhørsforhold for this person */}
              <div>
                <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-destructive" />
                  Tilhørsforhold ({selectedPersonTilhoer.length})
                </div>
                {selectedPersonTilhoer.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border border-dashed">
                    <Target className="w-6 h-6 mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-[11px] text-muted-foreground mb-3">Ingen tilhørsforhold registreret</p>
                    <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => openFormForPerson(selectedPerson)}>
                      <Plus className="w-3 h-3" /> Tilføj tilhørsforhold
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPersonTilhoer.map(t => (
                      <div key={t.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold">{t.bande}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0">{t.rolle || "Medlem"}</Badge>
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 border", statusConfig[t.status]?.badge || "")}>
                                {statusConfig[t.status]?.label || t.status}
                              </Badge>
                              <span className="text-[8px] text-muted-foreground">
                                Tilføjet: {t.oprettetDato || t.tilfojetDato || "—"} af {t.oprettetAf || t.tilfojetAf || "—"}
                              </span>
                            </div>
                            {t.noter && <p className="text-[10px] text-muted-foreground mt-1">{t.noter}</p>}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(t)} className="p-1 rounded hover:bg-muted"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                            <button onClick={() => slet(t.id)} className="p-1 rounded hover:bg-muted"><Trash2 className="w-3 h-3 text-destructive" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Overview: all grupperinger */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Alle grupperinger</h3>
                </div>
                <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => { resetForm(); setShowForm(true); }}>
                  <Plus className="w-3 h-3" /> Tilføj tilhørsforhold
                </Button>
              </div>

              {Object.keys(bander).length === 0 && !showForm ? (
                <div className="text-center py-16">
                  <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                  <p className="text-xs font-medium mb-1">Ingen tilhørsforhold registreret</p>
                  <p className="text-[10px] text-muted-foreground mb-4">Vælg en person i listen til venstre, eller brug knappen ovenfor</p>
                  <Button size="sm" className="gap-1" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus className="w-3.5 h-3.5" /> Tilføj første tilhørsforhold
                  </Button>
                </div>
              ) : (
                Object.entries(bander).map(([bande, members]) => {
                  const isExpanded = expandedBander.has(bande);
                  const aktiveMedl = members.filter(m => m.status === "aktiv").length;
                  return (
                    <div key={bande} className="rounded-lg border overflow-hidden border-l-2 border-l-destructive">
                      <button
                        onClick={() => toggleBande(bande)}
                        className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                          <span className="text-xs font-bold">{bande}</span>
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">{members.length} medl.</Badge>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-green-500 border-green-500/20">{aktiveMedl} aktive</Badge>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="divide-y divide-border">
                          {members.map(m => (
                            <div key={m.id} className="px-4 py-2 flex items-center justify-between hover:bg-muted/20 transition-colors">
                              <div
                                className="flex items-center gap-2 cursor-pointer"
                                onClick={() => { if (m.personId) setSelectedPersonId(m.personId); }}
                              >
                                <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig[m.status]?.dot || "bg-muted-foreground")} />
                                <span className="text-[11px] font-medium">{m.personNavn || "Ukendt"}</span>
                                <span className="text-[9px] text-muted-foreground font-mono">{m.personCpr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{m.rolle || "Medlem"}</Badge>
                                <Badge variant="outline" className={cn("text-[9px] px-1 py-0 border", statusConfig[m.status]?.badge || "")}>
                                  {statusConfig[m.status]?.label || m.status}
                                </Badge>
                                <button onClick={() => startEdit(m)} className="p-1 rounded hover:bg-muted"><Edit2 className="w-2.5 h-2.5 text-muted-foreground" /></button>
                                <button onClick={() => slet(m.id)} className="p-1 rounded hover:bg-muted"><Trash2 className="w-2.5 h-2.5 text-destructive" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Add/Edit form overlay */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={e => { if (e.target === e.currentTarget) resetForm(); }}>
              <div className="bg-card border rounded-xl shadow-xl p-5 w-full max-w-md space-y-3" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">{editId ? "Rediger" : "Tilføj"} tilhørsforhold</h3>
                  <button onClick={resetForm} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
                </div>

                {/* Person selection (pre-filled or search) */}
                {formPersonId ? (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <div>
                      <div className="text-xs font-medium">{formNavn}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{formCpr}</div>
                    </div>
                    {!editId && (
                      <button onClick={() => { setFormPersonId(""); setFormNavn(""); setFormCpr(""); }} className="ml-auto p-1 rounded hover:bg-muted">
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                ) : !editId ? (
                  <div className="relative">
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Søg person</label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input
                        placeholder="Søg navn eller CPR..."
                        value={formPersonSearch}
                        onChange={e => { setFormPersonSearch(e.target.value); setShowFormPersonDropdown(true); }}
                        onFocus={() => setShowFormPersonDropdown(true)}
                        className="pl-7 h-8 text-xs"
                      />
                    </div>
                    {showFormPersonDropdown && formPersonSearch && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {formPersonerFiltered.length === 0 ? (
                          <div className="p-3 text-[11px] text-muted-foreground text-center">Ingen personer fundet</div>
                        ) : (
                          formPersonerFiltered.map(p => (
                            <button
                              key={p.id}
                              onClick={() => { setFormPersonId(p.id); setFormNavn(`${p.fornavn} ${p.efternavn}`); setFormCpr(p.cpr); setFormPersonSearch(""); setShowFormPersonDropdown(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 text-left border-b border-border/50 last:border-0"
                            >
                              <span className="font-medium">{p.fornavn} {p.efternavn}</span>
                              <span className="text-muted-foreground font-mono text-[9px]">{p.cpr}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {editId && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Navn</label>
                      <Input value={formNavn} onChange={e => setFormNavn(e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">CPR</label>
                      <Input value={formCpr} onChange={e => setFormCpr(e.target.value)} className="h-8 text-xs" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Gruppering / Bande</label>
                  <Input
                    placeholder="Navn på gruppering..."
                    value={formBande}
                    onChange={e => setFormBande(e.target.value)}
                    className="h-8 text-xs"
                    list="bande-suggestions"
                  />
                  <datalist id="bande-suggestions">
                    {existingBander.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Rolle</label>
                    <select value={formRolle} onChange={e => setFormRolle(e.target.value)} className="h-8 w-full px-2 text-xs rounded-md border border-input bg-background text-foreground">
                      <option value="Medlem">Medlem</option>
                      <option value="Leder">Leder</option>
                      <option value="Prospect">Prospect</option>
                      <option value="Associeret">Associeret</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Status</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value)} className="h-8 w-full px-2 text-xs rounded-md border border-input bg-background text-foreground">
                      {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Noter (valgfrit)</label>
                  <Textarea placeholder="Evt. noter..." value={formNoter} onChange={e => setFormNoter(e.target.value)} className="text-xs min-h-[50px]" />
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={resetForm}>Annuller</Button>
                  <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSubmit} disabled={!formNavn || !formBande}>
                    <Check className="w-3 h-3" /> {editId ? "Opdater" : "Tilføj"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NSKAfdeling = ({ currentUser, isAdmin }: NSKAfdelingProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="nsk"
      titel="NSK — Organiseret Kriminalitet"
      beskrivelse="Tilhørsforhold, bandesporing & efterretning"
      defaultTabs={[
        { id: "tavle", label: "Opslagstavle", removable: false },
        { id: "netvaerk", label: "Tilhørsforhold", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
      customTabContent={{
        netvaerk: <TilhoersforholdContent userName={userName} />,
      }}
    />
  );
};

export default NSKAfdeling;