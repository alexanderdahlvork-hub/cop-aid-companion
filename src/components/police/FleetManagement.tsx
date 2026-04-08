import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, Users, Car, UserPlus, UserMinus, Shield, MessageSquare, Trash2, ChevronDown, ChevronRight, Radio, Crown, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { patruljerApi, betjenteApi } from "@/lib/api";
import type { Patrulje, PatrolMember } from "@/lib/api";
import type { Betjent } from "@/types/police";
import {
  statusConfig, PATROL_TYPES, type PatrolStatus, type TaskGroup,
  STORAGE_KEY, GROUPS_KEY, GROUP_ACTIONS, loadFromStorage, saveToStorage,
} from "./fleet/FleetTypes";
import PatrolIcon from "./fleet/PatrolIcon";

interface FleetManagementProps {
  currentUser: Betjent | null;
  isAdmin?: boolean;
}

const FleetManagement = ({ currentUser, isAdmin }: FleetManagementProps) => {
  const [patrols, setPatrols] = useState<Patrulje[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocalStorage, setUseLocalStorage] = useState(false);
  const [allBetjente, setAllBetjente] = useState<Betjent[]>([]);
  const [soegning, setSoegning] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Dialog states
  const [opretDialog, setOpretDialog] = useState(false);
  const [valgtType, setValgtType] = useState("");
  const [autoTilmeld, setAutoTilmeld] = useState(true);
  const [tilfoejDialog, setTilfoejDialog] = useState<string | null>(null);
  const [betjentSoegning, setBetjentSoegning] = useState("");
  const [noteDialog, setNoteDialog] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  // Groups
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [opretGruppeDialog, setOpretGruppeDialog] = useState(false);
  const [gruppeNavn, setGruppeNavn] = useState("");
  const [gruppeRadio, setGruppeRadio] = useState("");
  const [gruppeLeder, setGruppeLeder] = useState("");
  const [gruppePatruljer, setGruppePatruljer] = useState<string[]>([]);
  const [gruppeAktion, setGruppeAktion] = useState("");

  // Transfer
  const [flytMedlemDialog, setFlytMedlemDialog] = useState<{ fromPatrolId: string; badgeNr: string; navn: string } | null>(null);

  useEffect(() => {
    patruljerApi.getAll()
      .then((data) => { setPatrols(data); setUseLocalStorage(false); })
      .catch(() => { setPatrols(loadFromStorage<Patrulje[]>(STORAGE_KEY, [])); setUseLocalStorage(true); })
      .finally(() => setLoading(false));
    betjenteApi.getAll().then(setAllBetjente).catch(() => {});
    setTaskGroups(loadFromStorage<TaskGroup[]>(GROUPS_KEY, []));
  }, []);

  const updatePatrols = useCallback((updater: (prev: Patrulje[]) => Patrulje[]) => {
    setPatrols(prev => {
      const next = updater(prev);
      if (useLocalStorage) saveToStorage(STORAGE_KEY, next);
      return next;
    });
  }, [useLocalStorage]);

  const updateGroups = useCallback((updater: (prev: TaskGroup[]) => TaskGroup[]) => {
    setTaskGroups(prev => {
      const next = updater(prev);
      saveToStorage(GROUPS_KEY, next);
      return next;
    });
  }, []);

  const tryApi = async (fn: () => Promise<void>) => {
    if (!useLocalStorage) { try { await fn(); } catch {} }
  };

  const getNextName = (prefix: string) => {
    const existing = patrols
      .filter(p => p.navn.startsWith(prefix + " "))
      .map(p => parseInt(p.navn.replace(prefix + " ", "")))
      .filter(n => !isNaN(n));
    return `${prefix} ${existing.length === 0 ? 1 : Math.max(...existing) + 1}`;
  };

  const availableTypes = currentUser
    ? isAdmin ? PATROL_TYPES : PATROL_TYPES.filter(t =>
        t.requiredUddannelser.length === 0 || t.requiredUddannelser.some(u => currentUser.uddannelser.includes(u)))
    : [];

  // Handlers
  const handleAddMember = async (patrolId: string, betjent: Betjent) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    if (patrol.medlemmer.length >= patrol.pladser) { toast.error("Patruljen er fuld"); return; }
    if (patrol.medlemmer.some(m => m.badgeNr === betjent.badgeNr)) { toast.error("Allerede tilmeldt"); return; }
    const member: PatrolMember = { badgeNr: betjent.badgeNr, navn: `${betjent.fornavn} ${betjent.efternavn}`.trim() };
    const updated = { medlemmer: [...patrol.medlemmer, member], status: "i_brug" as const };
    await tryApi(() => patruljerApi.update(patrolId, updated));
    updatePatrols(prev => prev.map(p => p.id === patrolId ? { ...p, ...updated } : p));
    toast(`${member.navn} tilmeldt`);
    setTilfoejDialog(null);
  };

  const handleSignOff = async (patrolId: string, badgeNr: string) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    const updatedMedlemmer = patrol.medlemmer.filter(m => m.badgeNr !== badgeNr);
    const updated = { medlemmer: updatedMedlemmer, status: updatedMedlemmer.length === 0 ? "ledig" as const : patrol.status };
    await tryApi(() => patruljerApi.update(patrolId, updated));
    updatePatrols(prev => prev.map(p => p.id === patrolId ? { ...p, ...updated } : p));
    toast("Afmeldt patrulje");
  };

  const handleStatusChange = async (patrolId: string, status: PatrolStatus) => {
    await tryApi(() => patruljerApi.update(patrolId, { status }));
    updatePatrols(prev => prev.map(p => p.id === patrolId ? { ...p, status } : p));
  };

  const handleSaveNote = async (patrolId: string) => {
    await tryApi(() => patruljerApi.update(patrolId, { bemærkning: noteInput }));
    updatePatrols(prev => prev.map(p => p.id === patrolId ? { ...p, bemærkning: noteInput } : p));
    setNoteDialog(null);
    setNoteInput("");
  };

  const handleCreatePatrol = async (typeId: string) => {
    const type = PATROL_TYPES.find(t => t.id === typeId);
    if (!type) return;
    const navn = getNextName(type.prefix);
    const medlemmer: PatrolMember[] = autoTilmeld && currentUser
      ? [{ badgeNr: currentUser.badgeNr, navn: `${currentUser.fornavn} ${currentUser.efternavn}`.trim() }] : [];
    const newPatrol: Patrulje = {
      id: `custom-${Date.now()}`, navn, kategori: type.kategori, pladser: type.pladser,
      medlemmer, status: medlemmer.length > 0 ? "i_brug" : "ledig", bemærkning: "",
    };
    await tryApi(() => patruljerApi.create(newPatrol));
    updatePatrols(prev => [...prev, newPatrol]);
    toast(`${navn} oprettet`);
    setOpretDialog(false); setValgtType(""); setAutoTilmeld(true);
  };

  const handleDeletePatrol = async (id: string) => {
    await tryApi(() => patruljerApi.remove(id));
    updatePatrols(prev => prev.filter(p => p.id !== id));
    updateGroups(prev => prev.map(g => ({ ...g, patruljeIds: g.patruljeIds.filter(pid => pid !== id) })));
    toast("Patrulje slettet");
  };

  const handleMoveMember = async (fromPatrolId: string, badgeNr: string, toPatrolId: string) => {
    const from = patrols.find(p => p.id === fromPatrolId);
    const to = patrols.find(p => p.id === toPatrolId);
    if (!from || !to) return;
    const member = from.medlemmer.find(m => m.badgeNr === badgeNr);
    if (!member) return;
    if (to.medlemmer.length >= to.pladser) { toast.error("Patruljen er fuld"); return; }
    const fromUpdated = { medlemmer: from.medlemmer.filter(m => m.badgeNr !== badgeNr), status: from.medlemmer.length <= 1 ? "ledig" as const : from.status };
    const toUpdated = { medlemmer: [...to.medlemmer, member], status: "i_brug" as const };
    await tryApi(() => patruljerApi.update(fromPatrolId, fromUpdated));
    await tryApi(() => patruljerApi.update(toPatrolId, toUpdated));
    updatePatrols(prev => prev.map(p => {
      if (p.id === fromPatrolId) return { ...p, ...fromUpdated };
      if (p.id === toPatrolId) return { ...p, ...toUpdated };
      return p;
    }));
    toast(`${member.navn} flyttet til ${to.navn}`);
    setFlytMedlemDialog(null);
  };

  const handleCreateGroup = () => {
    if (!gruppeNavn.trim() || !gruppeRadio.trim() || !gruppeLeder || !gruppeAktion) return;
    const lederPatrol = patrols.find(p => p.id === gruppeLeder);
    const newGroup: TaskGroup = {
      id: `grp-${Date.now()}`, navn: gruppeNavn.trim(), radioKanal: gruppeRadio.trim(),
      lederId: gruppeLeder, lederNavn: lederPatrol?.navn || "",
      patruljeIds: [gruppeLeder, ...gruppePatruljer.filter(id => id !== gruppeLeder)],
      aktion: gruppeAktion,
    };
    updateGroups(prev => [...prev, newGroup]);
    toast("Opgavegruppe oprettet");
    setGruppeNavn(""); setGruppeRadio(""); setGruppeLeder(""); setGruppePatruljer([]); setGruppeAktion("");
    setOpretGruppeDialog(false);
  };

  // Filtering
  const filtered = patrols.filter(p => {
    if (!soegning) return true;
    return `${p.navn} ${p.medlemmer.map(m => `${m.badgeNr} ${m.navn}`).join(" ")} ${p.bemærkning}`
      .toLowerCase().includes(soegning.toLowerCase());
  });

  // Group by category
  const categories = PATROL_TYPES.map(t => t.kategori);
  const usedCategories = Array.from(new Set(filtered.map(p => p.kategori)));
  const sortedCategories = categories.filter(c => usedCategories.includes(c));
  const uncategorized = filtered.filter(p => !categories.includes(p.kategori));

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const stats = {
    total: patrols.length,
    active: patrols.filter(p => p.medlemmer.length > 0).length,
    officers: patrols.reduce((sum, p) => sum + p.medlemmer.length, 0),
  };

  const bemandede = patrols.filter(p => p.medlemmer.length > 0);
  const tilfoejPatrol = tilfoejDialog ? patrols.find(p => p.id === tilfoejDialog) : null;
  const filteredBetjente = allBetjente
    .filter(b => !tilfoejPatrol?.medlemmer.some(m => m.badgeNr === b.badgeNr))
    .filter(b => {
      if (!betjentSoegning) return true;
      return `${b.badgeNr} ${b.fornavn} ${b.efternavn} ${b.rang}`.toLowerCase().includes(betjentSoegning.toLowerCase());
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" /> <span>Indlæser...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Car className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Flådestyring</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.total}</span> patruljer
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{stats.active}</span> aktive
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{stats.officers}</span> betjente ude
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-lg" onClick={() => setOpretGruppeDialog(true)}>
              <Users className="w-3.5 h-3.5" /> Ny gruppe
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5 rounded-lg" onClick={() => setOpretDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> Ny patrulje
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg patrulje, betjent eller badge..."
            value={soegning}
            onChange={(e) => setSoegning(e.target.value)}
            className="pl-10 h-9 text-sm rounded-lg bg-muted/30 border-border/40"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-4">

          {/* Task Groups */}
          {taskGroups.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-1">
                Opgavegrupper
              </h3>
              {taskGroups.map(group => {
                const groupPatrols = group.patruljeIds.map(id => patrols.find(p => p.id === id)).filter(Boolean) as Patrulje[];
                return (
                  <div key={group.id} className="rounded-lg border border-primary/20 bg-primary/[0.03] overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{group.navn}</span>
                        <Badge className="text-[9px] h-5 bg-primary/10 text-primary border-primary/20">{group.aktion}</Badge>
                        <Badge variant="outline" className="text-[9px] h-5 gap-1 border-primary/20 text-primary/70">
                          <Radio className="w-2.5 h-2.5" /> {group.radioKanal}
                        </Badge>
                      </div>
                      <button onClick={() => { updateGroups(prev => prev.filter(g => g.id !== group.id)); toast("Gruppe slettet"); }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-3 pb-2 space-y-0.5">
                      {groupPatrols.map(p => {
                        const isLeder = p.id === group.lederId;
                        const sc = statusConfig[p.status];
                        return (
                          <div key={p.id} className={cn(
                            "flex items-center justify-between px-3 py-1.5 rounded-md text-xs",
                            isLeder ? "bg-primary/8" : "hover:bg-muted/30"
                          )}>
                            <div className="flex items-center gap-2">
                              {isLeder && <Crown className="w-3 h-3 text-amber-500" />}
                              <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              <span className="font-medium text-foreground">{p.navn}</span>
                              <span className="text-muted-foreground">{p.medlemmer.map(m => m.navn).join(", ")}</span>
                            </div>
                            <button onClick={() => updateGroups(prev => prev.map(g =>
                              g.id === group.id ? { ...g, patruljeIds: g.patruljeIds.filter(id => id !== p.id) } : g
                            ))} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors">
                              <UserMinus className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Patrols by category */}
          {sortedCategories.map(cat => {
            const catPatrols = filtered.filter(p => p.kategori === cat);
            const isCollapsed = collapsedCategories.has(cat);
            const patrolType = PATROL_TYPES.find(t => t.kategori === cat);
            const activeCount = catPatrols.filter(p => p.medlemmer.length > 0).length;

            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors group mb-1"
                >
                  <div className="flex items-center gap-2.5">
                    {isCollapsed
                      ? <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    }
                    <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
                      <PatrolIcon type={patrolType?.icon || "car"} className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{cat}</span>
                    <span className="text-xs text-muted-foreground">{catPatrols.length} enheder</span>
                  </div>
                  {activeCount > 0 && (
                    <Badge className="text-[9px] h-5 bg-primary/10 text-primary border-primary/20">
                      {activeCount} aktiv{activeCount > 1 ? "e" : ""}
                    </Badge>
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1.5 ml-2">
                    {catPatrols.map(patrol => (
                      <PatrolRow
                        key={patrol.id}
                        patrol={patrol}
                        inGroup={taskGroups.some(g => g.patruljeIds.includes(patrol.id))}
                        onStatusChange={handleStatusChange}
                        onSignOff={handleSignOff}
                        onDelete={handleDeletePatrol}
                        onOpenAddMember={(id) => { setTilfoejDialog(id); setBetjentSoegning(""); }}
                        onOpenNote={(id, current) => { setNoteDialog(id); setNoteInput(current); }}
                        onOpenMoveMember={(fromId, badgeNr, name) => setFlytMedlemDialog({ fromPatrolId: fromId, badgeNr, navn: name })}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {uncategorized.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <span className="text-sm font-semibold text-muted-foreground">Andet</span>
              </div>
              <div className="space-y-1.5 ml-2">
                {uncategorized.map(patrol => (
                  <PatrolRow
                    key={patrol.id}
                    patrol={patrol}
                    inGroup={taskGroups.some(g => g.patruljeIds.includes(patrol.id))}
                    onStatusChange={handleStatusChange}
                    onSignOff={handleSignOff}
                    onDelete={handleDeletePatrol}
                    onOpenAddMember={(id) => { setTilfoejDialog(id); setBetjentSoegning(""); }}
                    onOpenNote={(id, current) => { setNoteDialog(id); setNoteInput(current); }}
                    onOpenMoveMember={(fromId, badgeNr, name) => setFlytMedlemDialog({ fromPatrolId: fromId, badgeNr, navn: name })}
                  />
                ))}
              </div>
            </div>
          )}

          {patrols.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Car className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">Ingen patruljer oprettet</p>
              <Button size="sm" className="text-xs rounded-lg" onClick={() => setOpretDialog(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Opret patrulje
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Dialogs ── */}

      {/* Create Patrol */}
      <Dialog open={opretDialog} onOpenChange={setOpretDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Opret patrulje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {availableTypes.map(type => {
                const nextName = getNextName(type.prefix);
                return (
                  <button key={type.id} onClick={() => setValgtType(type.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                      valgtType === type.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                    )}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                      valgtType === type.id ? "bg-primary/15" : "bg-muted/50")}>
                      <PatrolIcon type={type.icon} className={cn("w-4 h-4", valgtType === type.id ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block">{type.label}</span>
                      <span className="text-[10px] text-primary/70 font-mono block">{nextName}</span>
                      <span className="text-[10px] text-muted-foreground">{type.pladser} pladser</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {currentUser && valgtType && (
              <label className="flex items-center gap-2.5 rounded-lg bg-primary/5 border border-primary/15 px-4 py-3 cursor-pointer">
                <Checkbox checked={autoTilmeld} onCheckedChange={(v) => setAutoTilmeld(!!v)} />
                <div>
                  <span className="text-xs font-medium text-foreground">Tilmeld mig automatisk</span>
                  <span className="text-[10px] text-muted-foreground block">#{currentUser.badgeNr} — {currentUser.fornavn} {currentUser.efternavn}</span>
                </div>
              </label>
            )}
            <Button className="w-full h-9 text-xs rounded-lg" disabled={!valgtType} onClick={() => handleCreatePatrol(valgtType)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Opret
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member */}
      <Dialog open={!!tilfoejDialog} onOpenChange={() => setTilfoejDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Tilføj til {tilfoejPatrol?.navn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Søg betjent..." value={betjentSoegning} onChange={(e) => setBetjentSoegning(e.target.value)}
                className="pl-9 h-9 text-xs rounded-lg" />
            </div>
            <ScrollArea className="h-[260px]">
              <div className="space-y-0.5">
                {filteredBetjente.map(b => (
                  <button key={b.id} onClick={() => { if (tilfoejDialog) handleAddMember(tilfoejDialog, b); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Shield className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-foreground">{b.fornavn} {b.efternavn}</span>
                        <span className="text-[9px] text-muted-foreground block">#{b.badgeNr} · {b.rang}</span>
                      </div>
                    </div>
                    <UserPlus className="w-3.5 h-3.5 text-primary" />
                  </button>
                ))}
                {filteredBetjente.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-6">Ingen betjente fundet</p>}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Note — {patrols.find(p => p.id === noteDialog)?.navn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Skriv bemærkning..." rows={3} className="text-xs rounded-lg resize-none" />
            <Button className="w-full h-8 text-xs rounded-lg" onClick={() => noteDialog && handleSaveNote(noteDialog)}>Gem</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Group */}
      <Dialog open={opretGruppeDialog} onOpenChange={setOpretGruppeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Opret opgavegruppe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Aktionstype</Label>
              <Select value={gruppeAktion} onValueChange={setGruppeAktion}>
                <SelectTrigger className="h-8 text-xs mt-1 rounded-lg"><SelectValue placeholder="Vælg aktion" /></SelectTrigger>
                <SelectContent>{GROUP_ACTIONS.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Navn</Label>
              <Input value={gruppeNavn} onChange={(e) => setGruppeNavn(e.target.value)} placeholder="Operation Centrum" className="h-8 text-xs mt-1 rounded-lg" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Radiokanal</Label>
              <Input value={gruppeRadio} onChange={(e) => setGruppeRadio(e.target.value)} placeholder="Kanal 3" className="h-8 text-xs mt-1 rounded-lg" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Leder</Label>
              <Select value={gruppeLeder} onValueChange={(v) => { setGruppeLeder(v); if (!gruppePatruljer.includes(v)) setGruppePatruljer([...gruppePatruljer, v]); }}>
                <SelectTrigger className="h-8 text-xs mt-1 rounded-lg"><SelectValue placeholder="Vælg leder" /></SelectTrigger>
                <SelectContent>{bemandede.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.navn}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Patruljer</Label>
              <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                {bemandede.filter(p => p.id !== gruppeLeder).map(p => (
                  <label key={p.id} className="flex items-center gap-2 text-[11px] cursor-pointer hover:bg-muted/30 rounded-lg px-2 py-1.5">
                    <Checkbox checked={gruppePatruljer.includes(p.id)}
                      onCheckedChange={(v) => {
                        if (v) setGruppePatruljer([...gruppePatruljer, p.id]);
                        else setGruppePatruljer(gruppePatruljer.filter(id => id !== p.id));
                      }} />
                    {p.navn}
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full h-9 text-xs rounded-lg"
              disabled={!gruppeNavn.trim() || !gruppeRadio.trim() || !gruppeLeder || !gruppeAktion}
              onClick={handleCreateGroup}>
              <Users className="w-3.5 h-3.5 mr-1" /> Opret gruppe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Member */}
      <Dialog open={!!flytMedlemDialog} onOpenChange={() => setFlytMedlemDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Flyt {flytMedlemDialog?.navn}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[280px]">
            <div className="space-y-0.5">
              {patrols
                .filter(p => flytMedlemDialog && p.id !== flytMedlemDialog.fromPatrolId && p.medlemmer.length < p.pladser)
                .map(p => (
                  <button key={p.id} onClick={() => flytMedlemDialog && handleMoveMember(flytMedlemDialog.fromPatrolId, flytMedlemDialog.badgeNr, p.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left">
                    <div>
                      <span className="text-[11px] font-medium text-foreground">{p.navn}</span>
                      <span className="text-[9px] text-muted-foreground ml-2">{p.medlemmer.length}/{p.pladser}</span>
                    </div>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                  </button>
                ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Inline Patrol Row Component ──
interface PatrolRowProps {
  patrol: Patrulje;
  inGroup: boolean;
  onStatusChange: (id: string, status: PatrolStatus) => void;
  onSignOff: (id: string, badgeNr: string) => void;
  onDelete: (id: string) => void;
  onOpenAddMember: (id: string) => void;
  onOpenNote: (id: string, current: string) => void;
  onOpenMoveMember: (fromId: string, badgeNr: string, name: string) => void;
}

const PatrolRow = ({ patrol, inGroup, onStatusChange, onSignOff, onDelete, onOpenAddMember, onOpenNote, onOpenMoveMember }: PatrolRowProps) => {
  const sc = statusConfig[patrol.status];
  const isFull = patrol.medlemmer.length >= patrol.pladser;

  return (
    <div className={cn(
      "rounded-lg border bg-card/50 px-4 py-3 transition-all hover:bg-card",
      inGroup ? "border-primary/25" : "border-border/40"
    )}>
      {/* Top row: name + status + actions */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-2 h-2 rounded-full", sc.dot)} />
          <span className="text-sm font-semibold text-foreground">{patrol.navn}</span>
          <Select value={patrol.status} onValueChange={(v) => onStatusChange(patrol.id, v as PatrolStatus)}>
            <SelectTrigger className={cn("h-5 text-[9px] border px-1.5 py-0 gap-1 rounded-full w-auto", sc.bg)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(statusConfig) as PatrolStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{statusConfig[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {inGroup && (
            <Badge className="text-[8px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">I gruppe</Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground font-mono mr-1">{patrol.medlemmer.length}/{patrol.pladser}</span>
          <button onClick={() => onOpenNote(patrol.id, patrol.bemærkning)}
            className={cn("p-1 rounded hover:bg-muted/40 transition-colors",
              patrol.bemærkning ? "text-primary" : "text-muted-foreground/40")}>
            <MessageSquare className="w-3 h-3" />
          </button>
          {!isFull && (
            <button onClick={() => onOpenAddMember(patrol.id)}
              className="p-1 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors">
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
          {patrol.medlemmer.length === 0 && patrol.id.startsWith("custom-") && (
            <button onClick={() => onDelete(patrol.id)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Members */}
      {patrol.medlemmer.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {patrol.medlemmer.map(m => (
            <div key={m.badgeNr} className="flex items-center gap-1.5 bg-muted/30 rounded-md px-2 py-1 group">
              <Shield className="w-2.5 h-2.5 text-primary/60" />
              <span className="text-[11px] font-medium text-foreground">{m.navn}</span>
              <span className="text-[9px] text-muted-foreground">#{m.badgeNr}</span>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onOpenMoveMember(patrol.id, m.badgeNr, m.navn)}
                  className="p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRightLeft className="w-2.5 h-2.5" />
                </button>
                <button onClick={() => onSignOff(patrol.id, m.badgeNr)}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <UserMinus className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/40 italic">Ingen tilmeldte</p>
      )}

      {/* Note preview */}
      {patrol.bemærkning && (
        <p className="text-[10px] text-muted-foreground mt-1.5 truncate">📝 {patrol.bemærkning}</p>
      )}
    </div>
  );
};

export default FleetManagement;
