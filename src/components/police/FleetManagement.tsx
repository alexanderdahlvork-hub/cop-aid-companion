import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Shield, MessageSquare, Search, AlertCircle, Plus, Trash2, Loader2, Users, Radio, Crown, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/sonner";
import { patruljerApi } from "@/lib/api";
import type { Patrulje } from "@/lib/api";
import type { Betjent } from "@/types/police";

type PatrolStatus = Patrulje['status'];

const statusConfig: Record<PatrolStatus, { label: string; dot: string; bg: string }> = {
  ledig: { label: "Ledig", dot: "bg-success", bg: "bg-success/10 text-success border-success/20" },
  i_brug: { label: "I brug", dot: "bg-primary", bg: "bg-primary/10 text-primary border-primary/20" },
  optaget: { label: "Optaget", dot: "bg-warning", bg: "bg-warning/10 text-warning border-warning/20" },
  ude_af_drift: { label: "Ude af drift", dot: "bg-destructive", bg: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface TaskGroup {
  id: string;
  navn: string;
  radioKanal: string;
  lederId: string;
  lederNavn: string;
  patruljeIds: string[];
}

interface FleetManagementProps {
  currentUser: Betjent | null;
}

const FleetManagement = ({ currentUser }: FleetManagementProps) => {
  const [patrols, setPatrols] = useState<Patrulje[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [signOnDialog, setSignOnDialog] = useState<string | null>(null);
  const [badgeInput, setBadgeInput] = useState("");
  const [navnInput, setNavnInput] = useState("");
  const [bemærkningDialog, setBemærkningDialog] = useState<string | null>(null);
  const [bemærkningInput, setBemærkningInput] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("alle");
  const [opretDialog, setOpretDialog] = useState(false);
  const [nyNavn, setNyNavn] = useState("");
  const [nyKategori, setNyKategori] = useState("");
  const [nyKategoriCustom, setNyKategoriCustom] = useState("");
  const [nyPladser, setNyPladser] = useState("2");
  const [autoTilmeld, setAutoTilmeld] = useState(true);

  // Task groups (local state for now)
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [opretGruppeDialog, setOpretGruppeDialog] = useState(false);
  const [gruppeNavn, setGruppeNavn] = useState("");
  const [gruppeRadio, setGruppeRadio] = useState("");
  const [gruppeLeder, setGruppeLeder] = useState("");
  const [gruppePatruljer, setGruppePatruljer] = useState<string[]>([]);
  const [flytDialog, setFlytDialog] = useState<{ patrolId: string; gruppeId: string } | null>(null);
  const [flytTilGruppe, setFlytTilGruppe] = useState("");

  useEffect(() => {
    patruljerApi.getAll()
      .then(setPatrols)
      .catch((err) => { console.error("Fejl ved indlæsning af patruljer:", err); toast.error("Kunne ikke indlæse patruljer"); })
      .finally(() => setLoading(false));
  }, []);

  const kategorier = Array.from(new Set(patrols.map((p) => p.kategori)));

  const filtreret = patrols.filter((p) => {
    const matchSoegning = `${p.navn} ${p.medlemmer.map((m) => `${m.badgeNr} ${m.navn}`).join(" ")} ${p.bemærkning}`
      .toLowerCase().includes(soegning.toLowerCase());
    const matchKategori = filterKategori === "alle" || p.kategori === filterKategori;
    return matchSoegning && matchKategori;
  });

  const grupperet = kategorier
    .filter((k) => filterKategori === "alle" || k === filterKategori)
    .map((k) => ({ kategori: k, patrols: filtreret.filter((p) => p.kategori === k) }))
    .filter((g) => g.patrols.length > 0);

  const stats = {
    total: patrols.length,
    bemandet: patrols.filter((p) => p.medlemmer.length > 0).length,
    ledig: patrols.filter((p) => p.status === "ledig" && p.medlemmer.length === 0).length,
  };

  const handleSignOn = async (patrolId: string) => {
    if (!badgeInput.trim() || !navnInput.trim()) return;
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    if (patrol.medlemmer.length >= patrol.pladser) { toast.error("Patruljen er fuld"); return; }
    const updated = {
      medlemmer: [...patrol.medlemmer, { badgeNr: badgeInput.trim(), navn: navnInput.trim() }],
      status: "i_brug" as const,
    };
    try {
      await patruljerApi.update(patrolId, updated);
      setPatrols(prev => prev.map(p => p.id === patrolId ? { ...p, ...updated } : p));
      toast("Tilmeldt patrulje");
    } catch (err) { console.error(err); toast.error("Fejl ved tilmelding"); }
    setBadgeInput("");
    setNavnInput("");
    setSignOnDialog(null);
  };

  const handleSignOff = async (patrolId: string, badgeNr: string) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    const updatedMedlemmer = patrol.medlemmer.filter(m => m.badgeNr !== badgeNr);
    const updated = { medlemmer: updatedMedlemmer, status: updatedMedlemmer.length === 0 ? "ledig" as const : patrol.status };
    try {
      await patruljerApi.update(patrolId, updated);
      setPatrols(prev => prev.map(p => p.id === patrolId ? { ...p, ...updated } : p));
      toast("Afmeldt patrulje");
    } catch (err) { console.error(err); toast.error("Fejl ved afmelding"); }
  };

  const handleStatusChange = async (patrolId: string, status: PatrolStatus) => {
    try {
      await patruljerApi.update(patrolId, { status });
      setPatrols(prev => prev.map(p => p.id === patrolId ? { ...p, status } : p));
    } catch (err) { console.error(err); toast.error("Fejl ved statusændring"); }
  };

  const handleBemærkning = async (patrolId: string) => {
    try {
      await patruljerApi.update(patrolId, { bemærkning: bemærkningInput });
      setPatrols(prev => prev.map(p => p.id === patrolId ? { ...p, bemærkning: bemærkningInput } : p));
    } catch (err) { console.error(err); toast.error("Fejl"); }
    setBemærkningDialog(null);
    setBemærkningInput("");
  };

  const handleOpretPatrulje = async () => {
    const kat = nyKategori === "_custom" ? nyKategoriCustom.trim() : nyKategori;
    if (!nyNavn.trim() || !kat) return;

    const medlemmer = autoTilmeld && currentUser
      ? [{ badgeNr: currentUser.badgeNr, navn: `${currentUser.fornavn} ${currentUser.efternavn}`.trim() }]
      : [];

    const newPatrol: Patrulje = {
      id: `custom-${Date.now()}`,
      navn: nyNavn.trim(),
      kategori: kat,
      pladser: Math.max(1, Math.min(6, parseInt(nyPladser) || 2)),
      medlemmer,
      status: medlemmer.length > 0 ? "i_brug" : "ledig",
      bemærkning: "",
    };
    try {
      await patruljerApi.create(newPatrol);
      setPatrols(prev => [...prev, newPatrol]);
      toast(autoTilmeld && currentUser ? "Patrulje oprettet — du er tilmeldt" : "Patrulje oprettet");
    } catch (err) { console.error(err); toast.error("Fejl ved oprettelse"); }
    setNyNavn("");
    setNyKategori("");
    setNyKategoriCustom("");
    setNyPladser("2");
    setAutoTilmeld(true);
    setOpretDialog(false);
  };

  const handleSletPatrulje = async (id: string) => {
    try {
      await patruljerApi.remove(id);
      setPatrols(prev => prev.filter(p => p.id !== id));
      setTaskGroups(prev => prev.map(g => ({ ...g, patruljeIds: g.patruljeIds.filter(pid => pid !== id) })));
      toast("Patrulje slettet");
    } catch (err) { console.error(err); toast.error("Fejl ved sletning"); }
  };

  const handleOpretGruppe = () => {
    if (!gruppeNavn.trim() || !gruppeRadio.trim() || !gruppeLeder) return;
    const lederPatrol = patrols.find(p => p.id === gruppeLeder);
    const newGroup: TaskGroup = {
      id: `grp-${Date.now()}`,
      navn: gruppeNavn.trim(),
      radioKanal: gruppeRadio.trim(),
      lederId: gruppeLeder,
      lederNavn: lederPatrol?.navn || "",
      patruljeIds: [gruppeLeder, ...gruppePatruljer.filter(id => id !== gruppeLeder)],
    };
    setTaskGroups(prev => [...prev, newGroup]);
    toast("Opgavegruppe oprettet");
    setGruppeNavn("");
    setGruppeRadio("");
    setGruppeLeder("");
    setGruppePatruljer([]);
    setOpretGruppeDialog(false);
  };

  const handleFlytPatrol = (patrolId: string, fromGruppeId: string, toGruppeId: string) => {
    setTaskGroups(prev => prev.map(g => {
      if (g.id === fromGruppeId) return { ...g, patruljeIds: g.patruljeIds.filter(id => id !== patrolId) };
      if (g.id === toGruppeId) return { ...g, patruljeIds: [...g.patruljeIds, patrolId] };
      return g;
    }));
    toast("Patrulje flyttet");
    setFlytDialog(null);
    setFlytTilGruppe("");
  };

  const handleSletGruppe = (gruppeId: string) => {
    setTaskGroups(prev => prev.filter(g => g.id !== gruppeId));
    toast("Opgavegruppe slettet");
  };

  const handleFjernFraGruppe = (patrolId: string, gruppeId: string) => {
    setTaskGroups(prev => prev.map(g =>
      g.id === gruppeId ? { ...g, patruljeIds: g.patruljeIds.filter(id => id !== patrolId) } : g
    ));
  };

  const bemandede = patrols.filter(p => p.medlemmer.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser patruljer...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Patrulje Skema</h2>
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/40">
              <span className="text-muted-foreground">Bemandede:</span>
              <span className="font-bold text-primary">{stats.bemandet}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted/40">
              <span className="text-muted-foreground">Ledige:</span>
              <span className="font-bold text-success">{stats.ledig}</span>
            </div>
            <Button size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setOpretDialog(true)}>
              <Plus className="w-3 h-3" /> Opret patrulje
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2" onClick={() => setOpretGruppeDialog(true)}>
              <Users className="w-3 h-3" /> Ny gruppe
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-md bg-warning/8 border border-warning/15 px-3 py-2">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-[11px] text-warning font-medium">HUSK at fjerne dig selv igen når du er afgående!</p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Søg patrulje, badge, navn..." value={soegning} onChange={(e) => setSoegning(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border" />
          </div>
          <Select value={filterKategori} onValueChange={setFilterKategori}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle enheder</SelectItem>
              {kategorier.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Task Groups */}
          {taskGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Opgavegrupper
              </h3>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {taskGroups.map((group) => (
                  <div key={group.id} className="rounded-lg border-2 border-primary/30 bg-primary/5 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-primary/10 border-b border-primary/20">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-foreground">{group.navn}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] gap-1 border-primary/30 text-primary">
                          <Radio className="w-2.5 h-2.5" /> {group.radioKanal}
                        </Badge>
                        <button onClick={() => handleSletGruppe(group.id)} className="text-muted-foreground/50 hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="px-3 py-2 space-y-1.5">
                      {group.patruljeIds.map((pid) => {
                        const p = patrols.find(pt => pt.id === pid);
                        if (!p) return null;
                        const isLeder = pid === group.lederId;
                        const sc = statusConfig[p.status];
                        return (
                          <div key={pid} className={cn(
                            "flex items-center justify-between rounded-md px-2 py-1.5 border",
                            isLeder ? "border-primary/40 bg-primary/10" : "border-border/50 bg-card/50"
                          )}>
                            <div className="flex items-center gap-2">
                              {isLeder && <Crown className="w-3 h-3 text-primary" />}
                              <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                              <span className="text-[11px] font-medium text-foreground">{p.navn}</span>
                              <span className="text-[9px] text-muted-foreground">
                                ({p.medlemmer.map(m => m.navn).join(", ") || "Ingen"})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {taskGroups.length > 1 && (
                                <button
                                  onClick={() => { setFlytDialog({ patrolId: pid, gruppeId: group.id }); setFlytTilGruppe(""); }}
                                  className="text-muted-foreground/60 hover:text-primary transition-colors"
                                  title="Flyt til anden gruppe"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => handleFjernFraGruppe(pid, group.id)}
                                className="text-muted-foreground/50 hover:text-destructive transition-colors"
                              >
                                <UserMinus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {group.patruljeIds.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">Ingen patruljer i gruppen</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patrol grid */}
          {grupperet.map((g) => (
            <div key={g.kategori}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{g.kategori}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {g.patrols.map((patrol) => {
                  const sc = statusConfig[patrol.status];
                  const isFull = patrol.medlemmer.length >= patrol.pladser;
                  return (
                    <div key={patrol.id} className="rounded-lg border border-border bg-card/50 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/20 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full shrink-0", sc.dot,
                            patrol.medlemmer.length > 0 && "animate-pulse")} />
                          <span className="text-xs font-bold text-foreground">{patrol.navn}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Select value={patrol.status} onValueChange={(v) => handleStatusChange(patrol.id, v as PatrolStatus)}>
                            <SelectTrigger className={cn("h-5 text-[9px] border px-1.5 py-0 gap-1 rounded", sc.bg)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(statusConfig) as PatrolStatus[]).map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">{statusConfig[s].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="px-3 py-2 space-y-1 min-h-[40px]">
                        {patrol.medlemmer.length === 0 && (
                          <p className="text-[10px] text-muted-foreground italic">Ingen tilmeldt</p>
                        )}
                        {patrol.medlemmer.map((m) => (
                          <div key={m.badgeNr} className="flex items-center justify-between group">
                            <div className="flex items-center gap-1.5">
                              <Shield className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[11px] text-foreground">
                                <span className="font-mono text-muted-foreground">{m.badgeNr}</span> — {m.navn}
                              </span>
                            </div>
                            <button onClick={() => handleSignOff(patrol.id, m.badgeNr)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80">
                              <UserMinus className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {Array.from({ length: patrol.pladser - patrol.medlemmer.length }).map((_, i) => (
                          <div key={`empty-${i}`} className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
                            <Shield className="w-3 h-3" />
                            <span className="italic">Ledig plads</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/30 bg-muted/10">
                        {patrol.bemærkning ? (
                          <button onClick={() => { setBemærkningDialog(patrol.id); setBemærkningInput(patrol.bemærkning); }}
                            className="text-[9px] text-muted-foreground truncate max-w-[60%] hover:text-foreground flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 shrink-0" /> {patrol.bemærkning}
                          </button>
                        ) : (
                          <button onClick={() => { setBemærkningDialog(patrol.id); setBemærkningInput(""); }}
                            className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5" /> Bemærkning
                          </button>
                        )}
                        <div className="flex items-center gap-1">
                          {!isFull && (
                            <Button size="sm" className="h-5 text-[9px] px-2 gap-1" onClick={() => setSignOnDialog(patrol.id)}>
                              <UserPlus className="w-2.5 h-2.5" /> Tilmeld
                            </Button>
                          )}
                          {patrol.medlemmer.length === 0 && patrol.id.startsWith("custom-") && (
                            <button onClick={() => handleSletPatrulje(patrol.id)}
                              className="text-muted-foreground/50 hover:text-destructive transition-colors ml-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Sign-on dialog */}
      <Dialog open={!!signOnDialog} onOpenChange={() => setSignOnDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Tilmeld patrulje — {patrols.find((p) => p.id === signOnDialog)?.navn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Badge nr.</Label>
              <Input value={badgeInput} onChange={(e) => setBadgeInput(e.target.value)} placeholder="F.eks. 1234"
                className="h-8 text-xs mt-0.5 bg-muted/30 border-border" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Navn</Label>
              <Input value={navnInput} onChange={(e) => setNavnInput(e.target.value)} placeholder="Fornavn Efternavn"
                className="h-8 text-xs mt-0.5 bg-muted/30 border-border" />
            </div>
            <Button className="w-full h-8 text-xs gap-1.5" disabled={!badgeInput.trim() || !navnInput.trim()}
              onClick={() => signOnDialog && handleSignOn(signOnDialog)}>
              <UserPlus className="w-3 h-3" /> Tilmeld
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bemærkning dialog */}
      <Dialog open={!!bemærkningDialog} onOpenChange={() => setBemærkningDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Bemærkning — {patrols.find((p) => p.id === bemærkningDialog)?.navn}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Textarea value={bemærkningInput} onChange={(e) => setBemærkningInput(e.target.value)}
              placeholder="Skriv bemærkning..." rows={3} className="text-xs bg-muted/30 border-border resize-none" />
            <Button className="w-full h-8 text-xs" onClick={() => bemærkningDialog && handleBemærkning(bemærkningDialog)}>
              Gem bemærkning
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opret patrulje dialog */}
      <Dialog open={opretDialog} onOpenChange={setOpretDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Opret ny patrulje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Patrulje navn</Label>
              <Input value={nyNavn} onChange={(e) => setNyNavn(e.target.value)} placeholder="F.eks. Bravo 41"
                className="h-8 text-xs mt-0.5 bg-muted/30 border-border" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Kategori</Label>
              <Select value={nyKategori} onValueChange={setNyKategori}>
                <SelectTrigger className="h-8 text-xs mt-0.5 bg-muted/30 border-border"><SelectValue placeholder="Vælg kategori" /></SelectTrigger>
                <SelectContent>
                  {kategorier.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                  <SelectItem value="_custom">+ Ny kategori</SelectItem>
                </SelectContent>
              </Select>
              {nyKategori === "_custom" && (
                <Input value={nyKategoriCustom} onChange={(e) => setNyKategoriCustom(e.target.value)} placeholder="Kategorinavn"
                  className="h-8 text-xs mt-1.5 bg-muted/30 border-border" />
              )}
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Antal pladser</Label>
              <Input type="number" min="1" max="6" value={nyPladser} onChange={(e) => setNyPladser(e.target.value)}
                className="h-8 text-xs mt-0.5 bg-muted/30 border-border" />
            </div>
            {currentUser && (
              <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/15 px-3 py-2">
                <Checkbox id="autoTilmeld" checked={autoTilmeld} onCheckedChange={(v) => setAutoTilmeld(!!v)} />
                <label htmlFor="autoTilmeld" className="text-[11px] text-foreground cursor-pointer">
                  Tilmeld mig automatisk ({currentUser.badgeNr} — {currentUser.fornavn} {currentUser.efternavn})
                </label>
              </div>
            )}
            <Button className="w-full h-8 text-xs gap-1.5"
              disabled={!nyNavn.trim() || (!nyKategori || (nyKategori === "_custom" && !nyKategoriCustom.trim()))}
              onClick={handleOpretPatrulje}>
              <Plus className="w-3 h-3" /> Opret patrulje
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opret gruppe dialog */}
      <Dialog open={opretGruppeDialog} onOpenChange={setOpretGruppeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Opret opgavegruppe
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gruppe navn</Label>
              <Input value={gruppeNavn} onChange={(e) => setGruppeNavn(e.target.value)} placeholder="F.eks. Operation Centrum"
                className="h-8 text-xs mt-0.5 bg-muted/30 border-border" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Radiokanal</Label>
              <Input value={gruppeRadio} onChange={(e) => setGruppeRadio(e.target.value)} placeholder="F.eks. Kanal 3"
                className="h-8 text-xs mt-0.5 bg-muted/30 border-border" />
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Leder (patrulje)</Label>
              <Select value={gruppeLeder} onValueChange={(v) => {
                setGruppeLeder(v);
                if (!gruppePatruljer.includes(v)) setGruppePatruljer(prev => [...prev, v]);
              }}>
                <SelectTrigger className="h-8 text-xs mt-0.5 bg-muted/30 border-border"><SelectValue placeholder="Vælg leder" /></SelectTrigger>
                <SelectContent>
                  {bemandede.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.navn} ({p.medlemmer.map(m => m.navn).join(", ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tilføj patruljer</Label>
              <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                {bemandede.filter(p => p.id !== gruppeLeder).map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer hover:bg-muted/30 rounded px-2 py-1">
                    <Checkbox
                      checked={gruppePatruljer.includes(p.id)}
                      onCheckedChange={(v) => {
                        if (v) setGruppePatruljer(prev => [...prev, p.id]);
                        else setGruppePatruljer(prev => prev.filter(id => id !== p.id));
                      }}
                    />
                    {p.navn} — {p.medlemmer.map(m => m.navn).join(", ")}
                  </label>
                ))}
                {bemandede.filter(p => p.id !== gruppeLeder).length === 0 && (
                  <p className="text-[10px] text-muted-foreground italic px-2">Ingen andre bemandede patruljer</p>
                )}
              </div>
            </div>
            <Button className="w-full h-8 text-xs gap-1.5"
              disabled={!gruppeNavn.trim() || !gruppeRadio.trim() || !gruppeLeder}
              onClick={handleOpretGruppe}>
              <Users className="w-3 h-3" /> Opret gruppe
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Flyt patrulje dialog */}
      <Dialog open={!!flytDialog} onOpenChange={() => setFlytDialog(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Flyt patrulje til anden gruppe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Select value={flytTilGruppe} onValueChange={setFlytTilGruppe}>
              <SelectTrigger className="h-8 text-xs bg-muted/30 border-border"><SelectValue placeholder="Vælg gruppe" /></SelectTrigger>
              <SelectContent>
                {taskGroups.filter(g => flytDialog && g.id !== flytDialog.gruppeId).map((g) => (
                  <SelectItem key={g.id} value={g.id} className="text-xs">{g.navn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full h-8 text-xs gap-1.5" disabled={!flytTilGruppe}
              onClick={() => flytDialog && handleFlytPatrol(flytDialog.patrolId, flytDialog.gruppeId, flytTilGruppe)}>
              <ArrowRightLeft className="w-3 h-3" /> Flyt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FleetManagement;
