import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Loader2, Users, Car, Siren, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { patruljerApi, betjenteApi } from "@/lib/api";
import type { Patrulje, PatrolMember } from "@/lib/api";
import type { Betjent } from "@/types/police";

import {
  statusConfig, PATROL_TYPES, type PatrolStatus, type TaskGroup,
  STORAGE_KEY, GROUPS_KEY, loadFromStorage, saveToStorage,
} from "./fleet/FleetTypes";
import PatrolCard from "./fleet/PatrolCard";
import TaskGroupCard from "./fleet/TaskGroupCard";
import {
  CreatePatrolDialog, AddMemberDialog, NoteDialog,
  CreateGroupDialog, ListPickerDialog,
} from "./fleet/FleetDialogs";

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
  const [filterKategori, setFilterKategori] = useState<string>("alle");
  const [filterStatus, setFilterStatus] = useState<string>("alle");

  // Dialog states
  const [opretDialog, setOpretDialog] = useState(false);
  const [valgtType, setValgtType] = useState("");
  const [autoTilmeld, setAutoTilmeld] = useState(true);
  const [tilfoejDialog, setTilfoejDialog] = useState<string | null>(null);
  const [betjentSoegning, setBetjentSoegning] = useState("");
  const [bemærkningDialog, setBemærkningDialog] = useState<string | null>(null);
  const [bemærkningInput, setBemærkningInput] = useState("");

  // Groups
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [opretGruppeDialog, setOpretGruppeDialog] = useState(false);
  const [gruppeNavn, setGruppeNavn] = useState("");
  const [gruppeRadio, setGruppeRadio] = useState("");
  const [gruppeLeder, setGruppeLeder] = useState("");
  const [gruppePatruljer, setGruppePatruljer] = useState<string[]>([]);
  const [gruppeAktion, setGruppeAktion] = useState("");

  // Transfer dialogs
  const [flytMedlemDialog, setFlytMedlemDialog] = useState<{ fromPatrolId: string; badgeNr: string; navn: string } | null>(null);
  const [flytPatrulTilGruppeDialog, setFlytPatrulTilGruppeDialog] = useState<string | null>(null);
  const [tilfoejTilGruppeDialog, setTilfoejTilGruppeDialog] = useState<string | null>(null);
  const [flytDialog, setFlytDialog] = useState<{ patrolId: string; gruppeId: string } | null>(null);

  useEffect(() => {
    patruljerApi.getAll()
      .then((data) => { setPatrols(data); setUseLocalStorage(false); })
      .catch(() => { setPatrols(loadFromStorage<Patrulje[]>(STORAGE_KEY, [])); setUseLocalStorage(true); })
      .finally(() => setLoading(false));
    betjenteApi.getAll().then(setAllBetjente).catch(() => {});
    setTaskGroups(loadFromStorage<TaskGroup[]>(GROUPS_KEY, []));
  }, []);

  const kategorier = Array.from(new Set(patrols.map((p) => p.kategori)));

  const filtreret = patrols.filter((p) => {
    const matchSoegning = `${p.navn} ${p.medlemmer.map(m => `${m.badgeNr} ${m.navn}`).join(" ")} ${p.bemærkning}`
      .toLowerCase().includes(soegning.toLowerCase());
    const matchKategori = filterKategori === "alle" || p.kategori === filterKategori;
    const matchStatus = filterStatus === "alle" || p.status === filterStatus
      || (filterStatus === "bemandet" && p.medlemmer.length > 0)
      || (filterStatus === "tom" && p.medlemmer.length === 0);
    return matchSoegning && matchKategori && matchStatus;
  });

  const stats = {
    total: patrols.length,
    bemandet: patrols.filter(p => p.medlemmer.length > 0).length,
    ledig: patrols.filter(p => p.status === "ledig" && p.medlemmer.length === 0).length,
    totalBetjente: patrols.reduce((sum, p) => sum + p.medlemmer.length, 0),
  };

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

  // ── Handlers ──
  const handleTilfoejBetjent = async (patrolId: string, betjent: Betjent) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    if (patrol.medlemmer.length >= patrol.pladser) { toast.error("Patruljen er fuld"); return; }
    if (patrol.medlemmer.some(m => m.badgeNr === betjent.badgeNr)) { toast.error("Allerede tilmeldt"); return; }
    const member: PatrolMember = { badgeNr: betjent.badgeNr, navn: `${betjent.fornavn} ${betjent.efternavn}`.trim() };
    const updated = { medlemmer: [...patrol.medlemmer, member], status: "i_brug" as const };
    await tryApi(() => patruljerApi.update(patrolId, updated));
    updatePatrols(prev => prev.map(p => p.id === patrolId ? { ...p, ...updated } : p));
    toast(`${member.navn} tilmeldt`);
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

  const handleBemærkning = async (patrolId: string) => {
    await tryApi(() => patruljerApi.update(patrolId, { bemærkning: bemærkningInput }));
    updatePatrols(prev => prev.map(p => p.id === patrolId ? { ...p, bemærkning: bemærkningInput } : p));
    setBemærkningDialog(null);
    setBemærkningInput("");
  };

  const handleOpretPatrulje = async (typeId: string) => {
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
    toast(`${navn} oprettet${autoTilmeld && currentUser ? " — du er tilmeldt" : ""}`);
    setOpretDialog(false); setValgtType(""); setAutoTilmeld(true);
  };

  const handleSletPatrulje = async (id: string) => {
    await tryApi(() => patruljerApi.remove(id));
    updatePatrols(prev => prev.filter(p => p.id !== id));
    updateGroups(prev => prev.map(g => ({ ...g, patruljeIds: g.patruljeIds.filter(pid => pid !== id) })));
    toast("Patrulje slettet");
  };

  const handleFlytMedlem = async (fromPatrolId: string, badgeNr: string, toPatrolId: string) => {
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

  // Group handlers
  const handleOpretGruppe = () => {
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
        <Loader2 className="w-5 h-5 animate-spin" /> <span>Indlæser patruljer...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-border/60 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground">Flådestyring</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Administrer patruljer og opgavegrupper</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 text-xs gap-1.5 px-3 rounded-xl" onClick={() => setOpretDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> Ny patrulje
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 px-3 rounded-xl" onClick={() => setOpretGruppeDialog(true)}>
              <Users className="w-3.5 h-3.5" /> Ny gruppe
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Patruljer", value: stats.total, color: "text-foreground" },
            { label: "Bemandede", value: stats.bemandet, color: "text-primary" },
            { label: "Ledige", value: stats.ledig, color: "text-emerald-500" },
            { label: "Betjente ude", value: stats.totalBetjente, color: "text-amber-500" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-muted/30 border border-border/40 px-3 py-2 text-center">
              <div className={cn("text-lg font-bold", s.color)}>{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/8 border border-amber-500/15 px-3.5 py-2">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-500 font-medium">Husk at afmelde dig når du er afgående!</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Søg patrulje, badge, navn..." value={soegning} onChange={(e) => setSoegning(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl" />
          </div>
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="h-9 w-40 text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle typer</SelectItem>
              {kategorier.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 w-36 text-xs rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle status</SelectItem>
              <SelectItem value="bemandet">Bemandede</SelectItem>
              <SelectItem value="tom">Tomme</SelectItem>
              {(Object.keys(statusConfig) as PatrolStatus[]).map(s => (
                <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Content ── */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Task Groups */}
          {taskGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" /> Aktive opgavegrupper ({taskGroups.length})
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {taskGroups.map(group => (
                  <TaskGroupCard
                    key={group.id}
                    group={group}
                    patrols={patrols}
                    totalGroups={taskGroups.length}
                    onAddPatrol={(gid) => setTilfoejTilGruppeDialog(gid)}
                    onRemovePatrol={(pid, gid) => updateGroups(prev => prev.map(g =>
                      g.id === gid ? { ...g, patruljeIds: g.patruljeIds.filter(id => id !== pid) } : g
                    ))}
                    onMovePatrol={(pid, gid) => setFlytDialog({ patrolId: pid, gruppeId: gid })}
                    onDeleteGroup={(gid) => { updateGroups(prev => prev.filter(g => g.id !== gid)); toast("Gruppe slettet"); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Patrol Grid */}
          {filtreret.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Siren className="w-4 h-4" /> Patruljer ({filtreret.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtreret.map(patrol => (
                  <PatrolCard
                    key={patrol.id}
                    patrol={patrol}
                    inGroup={taskGroups.some(g => g.patruljeIds.includes(patrol.id))}
                    hasGroups={taskGroups.length > 0}
                    onStatusChange={handleStatusChange}
                    onSignOff={handleSignOff}
                    onDelete={handleSletPatrulje}
                    onOpenAddMember={(id) => { setTilfoejDialog(id); setBetjentSoegning(""); }}
                    onOpenNote={(id, current) => { setBemærkningDialog(id); setBemærkningInput(current); }}
                    onOpenMoveToGroup={setFlytPatrulTilGruppeDialog}
                    onOpenMoveMember={(fromId, badgeNr, name) => setFlytMedlemDialog({ fromPatrolId: fromId, badgeNr, navn: name })}
                  />
                ))}
              </div>
            </div>
          )}

          {patrols.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Car className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-semibold">Ingen patruljer oprettet</p>
              <p className="text-xs text-muted-foreground/60">Tryk "Ny patrulje" for at komme i gang</p>
            </div>
          )}

          {filtreret.length === 0 && patrols.length > 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">Ingen patruljer matcher dine filtre</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs"
                onClick={() => { setSoegning(""); setFilterKategori("alle"); setFilterStatus("alle"); }}>
                Nulstil filtre
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Dialogs ── */}
      <CreatePatrolDialog
        open={opretDialog} onOpenChange={setOpretDialog}
        availableTypes={availableTypes} getNextName={getNextName}
        valgtType={valgtType} setValgtType={setValgtType}
        autoTilmeld={autoTilmeld} setAutoTilmeld={setAutoTilmeld}
        currentUser={currentUser} onSubmit={handleOpretPatrulje}
      />

      <AddMemberDialog
        open={!!tilfoejDialog}
        onOpenChange={() => setTilfoejDialog(null)}
        patrolName={tilfoejPatrol?.navn || ""}
        betjentSoegning={betjentSoegning}
        setBetjentSoegning={setBetjentSoegning}
        filteredBetjente={filteredBetjente}
        onAdd={(b) => { if (tilfoejDialog) handleTilfoejBetjent(tilfoejDialog, b); }}
      />

      <NoteDialog
        open={!!bemærkningDialog}
        onOpenChange={() => setBemærkningDialog(null)}
        patrolName={patrols.find(p => p.id === bemærkningDialog)?.navn || ""}
        value={bemærkningInput}
        onChange={setBemærkningInput}
        onSave={() => bemærkningDialog && handleBemærkning(bemærkningDialog)}
      />

      <CreateGroupDialog
        open={opretGruppeDialog} onOpenChange={setOpretGruppeDialog}
        gruppeNavn={gruppeNavn} setGruppeNavn={setGruppeNavn}
        gruppeRadio={gruppeRadio} setGruppeRadio={setGruppeRadio}
        gruppeLeder={gruppeLeder} setGruppeLeder={setGruppeLeder}
        gruppeAktion={gruppeAktion} setGruppeAktion={setGruppeAktion}
        gruppePatruljer={gruppePatruljer} setGruppePatruljer={setGruppePatruljer}
        bemandede={bemandede} onSubmit={handleOpretGruppe}
      />

      {/* Move member to another patrol */}
      <ListPickerDialog
        open={!!flytMedlemDialog}
        onOpenChange={() => setFlytMedlemDialog(null)}
        title={`Flyt ${flytMedlemDialog?.navn || ""}`}
        icon="move"
        items={patrols
          .filter(p => flytMedlemDialog && p.id !== flytMedlemDialog.fromPatrolId && p.medlemmer.length < p.pladser)
          .map(p => ({ id: p.id, label: p.navn, sublabel: `${p.medlemmer.length}/${p.pladser}` }))}
        onSelect={(toId) => flytMedlemDialog && handleFlytMedlem(flytMedlemDialog.fromPatrolId, flytMedlemDialog.badgeNr, toId)}
        emptyText="Ingen patruljer med ledige pladser"
      />

      {/* Add patrol to group (from patrol card) */}
      <ListPickerDialog
        open={!!flytPatrulTilGruppeDialog}
        onOpenChange={() => setFlytPatrulTilGruppeDialog(null)}
        title="Tilføj til gruppe"
        items={taskGroups
          .filter(g => !g.patruljeIds.includes(flytPatrulTilGruppeDialog || ""))
          .map(g => ({ id: g.id, label: g.navn, badge: g.aktion }))}
        onSelect={(gid) => {
          if (flytPatrulTilGruppeDialog) {
            updateGroups(prev => prev.map(g =>
              g.id === gid && !g.patruljeIds.includes(flytPatrulTilGruppeDialog)
                ? { ...g, patruljeIds: [...g.patruljeIds, flytPatrulTilGruppeDialog] } : g
            ));
            toast("Patrulje tilføjet til gruppe");
          }
          setFlytPatrulTilGruppeDialog(null);
        }}
        emptyText="Ingen tilgængelige grupper"
      />

      {/* Add patrol to group (from group card) */}
      <ListPickerDialog
        open={!!tilfoejTilGruppeDialog}
        onOpenChange={() => setTilfoejTilGruppeDialog(null)}
        title="Tilføj patrulje til gruppe"
        items={bemandede
          .filter(p => !taskGroups.find(g => g.id === tilfoejTilGruppeDialog)?.patruljeIds.includes(p.id))
          .map(p => ({ id: p.id, label: p.navn, sublabel: p.medlemmer.map(m => m.navn).join(", ") }))}
        onSelect={(pid) => {
          if (tilfoejTilGruppeDialog) {
            updateGroups(prev => prev.map(g =>
              g.id === tilfoejTilGruppeDialog && !g.patruljeIds.includes(pid)
                ? { ...g, patruljeIds: [...g.patruljeIds, pid] } : g
            ));
            toast("Tilføjet til gruppe");
          }
          setTilfoejTilGruppeDialog(null);
        }}
        emptyText="Ingen tilgængelige patruljer"
      />

      {/* Move patrol between groups */}
      <ListPickerDialog
        open={!!flytDialog}
        onOpenChange={() => setFlytDialog(null)}
        title="Flyt til anden gruppe"
        icon="move"
        items={taskGroups
          .filter(g => flytDialog && g.id !== flytDialog.gruppeId)
          .map(g => ({ id: g.id, label: g.navn, badge: g.aktion }))}
        onSelect={(toGid) => {
          if (flytDialog) {
            updateGroups(prev => prev.map(g => {
              if (g.id === flytDialog.gruppeId) return { ...g, patruljeIds: g.patruljeIds.filter(id => id !== flytDialog.patrolId) };
              if (g.id === toGid) return { ...g, patruljeIds: [...g.patruljeIds, flytDialog.patrolId] };
              return g;
            }));
            toast("Patrulje flyttet");
          }
          setFlytDialog(null);
        }}
        emptyText="Ingen andre grupper"
      />
    </div>
  );
};

export default FleetManagement;
