import { useState } from "react";
import { Plus, UserPlus, GraduationCap, ShieldCheck, X, Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ansatteListe, rangOrder } from "@/data/ansatte";
import { canAddEducation, canCreateOfficer, canEditOfficer, canDeleteOfficer, availablePermissions } from "@/lib/permissions";
import type { Betjent, FyretMedarbejder } from "@/types/police";

interface AnsatteListeProps {
  currentUser: Betjent;
  isAdmin: boolean;
}

const uddannelserOptions = ["Betjent", "Civil", "Romeo", "Helikopter", "LIMA", "LIMA-A", "K9", "SRT", "Teknik", "Efterforskning"];

const AnsatteListe = ({ currentUser, isAdmin }: AnsatteListeProps) => {
  const [ansatte, setAnsatte] = useState<Betjent[]>(ansatteListe);
  const [fyrede, setFyrede] = useState<FyretMedarbejder[]>([]);
  const [valgt, setValgt] = useState<Betjent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showRankManager, setShowRankManager] = useState(false);
  const [showAddUdd, setShowAddUdd] = useState(false);
  const [uddTarget, setUddTarget] = useState<Betjent | null>(null);
  const [customRanks, setCustomRanks] = useState<string[]>(rangOrder);
  const [newRankName, setNewRankName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Betjent | null>(null);
  const [showFyrede, setShowFyrede] = useState(false);

  // Create form state
  const [newBadge, setNewBadge] = useState("");
  const [newFornavn, setNewFornavn] = useState("");
  const [newEfternavn, setNewEfternavn] = useState("");
  const [newRang, setNewRang] = useState("");
  const [newUddannelser, setNewUddannelser] = useState<string[]>([]);
  const [newTilladelser, setNewTilladelser] = useState<string[]>([]);

  // Education add state
  const [selectedUdd, setSelectedUdd] = useState<string[]>([]);

  const canCreate = canCreateOfficer(currentUser.rang);
  const canEducate = canAddEducation(currentUser.rang);

  // Show ALL rank categories, even empty ones
  const grouped = customRanks.map((rang) => ({
    rang,
    members: ansatte.filter((a) => a.rang === rang),
  }));

  const handleCreate = () => {
    if (!newBadge || !newFornavn || !newEfternavn || !newRang) return;
    const newBetjent: Betjent = {
      id: String(Date.now()),
      badgeNr: newBadge,
      fornavn: newFornavn,
      efternavn: newEfternavn,
      rang: newRang,
      uddannelser: newUddannelser,
      tilladelser: newTilladelser,
      kodeord: "1234",
      foersteLogin: true,
    };
    setAnsatte([...ansatte, newBetjent]);
    setShowCreate(false);
    resetCreateForm();
  };

  const resetCreateForm = () => {
    setNewBadge("");
    setNewFornavn("");
    setNewEfternavn("");
    setNewRang("");
    setNewUddannelser([]);
    setNewTilladelser([]);
  };

  const handleAddUddannelse = () => {
    if (!uddTarget || selectedUdd.length === 0) return;
    setAnsatte(ansatte.map(a =>
      a.id === uddTarget.id
        ? { ...a, uddannelser: [...new Set([...a.uddannelser, ...selectedUdd])] }
        : a
    ));
    setShowAddUdd(false);
    setUddTarget(null);
    setSelectedUdd([]);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    // Log fired employee
    const fyret: FyretMedarbejder = {
      id: deleteTarget.id,
      badgeNr: deleteTarget.badgeNr,
      fornavn: deleteTarget.fornavn,
      efternavn: deleteTarget.efternavn,
      rang: deleteTarget.rang,
      fyretDato: new Date().toLocaleString("da-DK"),
      fyretAf: `${currentUser.fornavn} ${currentUser.efternavn} (${currentUser.badgeNr})`,
    };
    setFyrede([fyret, ...fyrede]);
    setAnsatte(ansatte.filter(a => a.id !== deleteTarget.id));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setValgt(null);
  };

  const handleAddRank = () => {
    if (!newRankName.trim() || customRanks.includes(newRankName.trim())) return;
    setCustomRanks([...customRanks, newRankName.trim()]);
    setNewRankName("");
  };

  const handleRemoveRank = (rank: string) => {
    if (ansatte.some(a => a.rang === rank)) return;
    setCustomRanks(customRanks.filter(r => r !== rank));
  };

  const openAddUdd = (betjent: Betjent) => {
    setUddTarget(betjent);
    setSelectedUdd([]);
    setShowAddUdd(true);
  };

  const creatableRanks = customRanks.filter(r => {
    const userIdx = customRanks.indexOf(currentUser.rang);
    const rankIdx = customRanks.indexOf(r);
    if (isAdmin) return true;
    return rankIdx > userIdx;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-end flex-wrap">
        {fyrede.length > 0 && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowFyrede(true)}>
            <History className="w-4 h-4" /> Fyrede ({fyrede.length})
          </Button>
        )}
        {(canCreate || isAdmin) && (
          <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => setShowCreate(true)}>
            <UserPlus className="w-4 h-4" /> Opret betjent
          </Button>
        )}
        {isAdmin && (
          <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => setShowRankManager(true)}>
            <ShieldCheck className="w-4 h-4" /> Håndtere stillinger
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {grouped.map((group) => (
          <div key={group.rang} className="rounded-lg overflow-hidden border border-border">
            <div className="bg-secondary/80 px-4 py-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">{group.rang}</h3>
              <span className="text-xs text-muted-foreground">{group.members.length} ansat{group.members.length !== 1 ? "te" : ""}</span>
            </div>
            {group.members.length === 0 ? (
              <div className="px-4 py-2.5 bg-muted/30 text-sm text-muted-foreground italic border-t border-border/50">
                Ingen ansatte i denne stilling
              </div>
            ) : (
              group.members.map((betjent) => (
                <button
                  key={betjent.id}
                  onClick={() => setValgt(betjent)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-left border-t border-border/50"
                >
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground">
                    {betjent.badgeNr} - {betjent.fornavn} {betjent.efternavn}
                  </span>
                </button>
              ))
            )}
          </div>
        ))}
      </div>

      {/* View officer dialog */}
      <Dialog open={!!valgt} onOpenChange={(open) => !open && setValgt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {valgt?.fornavn} {valgt?.efternavn} — {valgt?.rang}
            </DialogTitle>
            <DialogDescription className="sr-only">Detaljer for betjent</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-lg font-semibold text-foreground">Badge: {valgt?.badgeNr}</p>
            <div>
              <h4 className="text-base font-semibold text-foreground mb-2">Uddannelser</h4>
              <ul className="space-y-1">
                {valgt?.uddannelser.map((udd) => (
                  <li key={udd} className="text-sm text-muted-foreground">— {udd}</li>
                ))}
                {valgt?.uddannelser.length === 0 && (
                  <li className="text-sm text-muted-foreground italic">Ingen uddannelser</li>
                )}
              </ul>
            </div>
            {valgt?.tilladelser && valgt.tilladelser.length > 0 && (
              <div>
                <h4 className="text-base font-semibold text-foreground mb-2">Tilladelser</h4>
                <ul className="space-y-1">
                  {valgt.tilladelser.map((t) => {
                    const perm = availablePermissions.find(p => p.id === t);
                    return <li key={t} className="text-sm text-muted-foreground">— {perm?.label || t}</li>;
                  })}
                </ul>
              </div>
            )}
            <div className="flex gap-2 pt-2 flex-wrap">
              {canEducate && valgt && canEditOfficer(currentUser.rang, valgt.rang, isAdmin) && (
                <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground" onClick={() => { setValgt(null); openAddUdd(valgt); }}>
                  <GraduationCap className="w-4 h-4" /> Tilføj uddannelse
                </Button>
              )}
              {valgt && canDeleteOfficer(currentUser.rang, valgt.rang, isAdmin) && (
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => { setDeleteTarget(valgt); setShowDeleteConfirm(true); }}>
                  <Trash2 className="w-4 h-4" /> Fyr
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setValgt(null)}>Luk</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bekræft fyring</DialogTitle>
            <DialogDescription>
              Er du sikker på at du vil fyre {deleteTarget?.fornavn} {deleteTarget?.efternavn} ({deleteTarget?.badgeNr})? Denne handling logges.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" onClick={handleDelete}>Ja, fyr</Button>
            <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}>Annuller</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create officer dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Opret ny betjent</DialogTitle>
            <DialogDescription className="sr-only">Udfyld oplysninger for ny betjent</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Badge nummer</Label>
                <Input placeholder="F.eks. A1234" value={newBadge} onChange={e => setNewBadge(e.target.value)} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Stilling</Label>
                <Select value={newRang} onValueChange={setNewRang}>
                  <SelectTrigger className="mt-1 bg-secondary border-border">
                    <SelectValue placeholder="Vælg rang" />
                  </SelectTrigger>
                  <SelectContent>
                    {creatableRanks.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Fornavn</Label>
                <Input placeholder="Fornavn" value={newFornavn} onChange={e => setNewFornavn(e.target.value)} className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Efternavn</Label>
                <Input placeholder="Efternavn" value={newEfternavn} onChange={e => setNewEfternavn(e.target.value)} className="mt-1 bg-secondary border-border" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">Standardkodeord: 1234 — betjenten skal ændre det ved første login.</p>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Uddannelser</Label>
              <div className="grid grid-cols-2 gap-2">
                {uddannelserOptions.map(udd => (
                  <label key={udd} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox
                      checked={newUddannelser.includes(udd)}
                      onCheckedChange={(checked) => {
                        setNewUddannelser(checked ? [...newUddannelser, udd] : newUddannelser.filter(u => u !== udd));
                      }}
                    />
                    {udd}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Tilladelser</Label>
              <div className="space-y-2">
                {availablePermissions.map(perm => (
                  <label key={perm.id} className="flex items-start gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={newTilladelser.includes(perm.id)}
                      onCheckedChange={(checked) => {
                        setNewTilladelser(checked ? [...newTilladelser, perm.id] : newTilladelser.filter(t => t !== perm.id));
                      }}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-foreground font-medium">{perm.label}</span>
                      <p className="text-xs text-muted-foreground">{perm.beskrivelse}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Opret</Button>
              <Button variant="secondary" onClick={() => { setShowCreate(false); resetCreateForm(); }}>Annuller</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add education dialog */}
      <Dialog open={showAddUdd} onOpenChange={setShowAddUdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tilføj uddannelse</DialogTitle>
            <DialogDescription>
              {uddTarget?.fornavn} {uddTarget?.efternavn}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              {uddannelserOptions
                .filter(u => !uddTarget?.uddannelser.includes(u))
                .map(udd => (
                  <label key={udd} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <Checkbox
                      checked={selectedUdd.includes(udd)}
                      onCheckedChange={(checked) => {
                        setSelectedUdd(checked ? [...selectedUdd, udd] : selectedUdd.filter(u => u !== udd));
                      }}
                    />
                    {udd}
                  </label>
                ))}
            </div>
            {uddannelserOptions.filter(u => !uddTarget?.uddannelser.includes(u)).length === 0 && (
              <p className="text-sm text-muted-foreground italic">Alle uddannelser er allerede tilføjet</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddUddannelse} disabled={selectedUdd.length === 0} className="bg-success hover:bg-success/90 text-success-foreground">Tilføj</Button>
              <Button variant="secondary" onClick={() => setShowAddUdd(false)}>Annuller</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rank manager dialog (admin only) */}
      <Dialog open={showRankManager} onOpenChange={setShowRankManager}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Håndtere stillinger</DialogTitle>
            <DialogDescription className="sr-only">Tilføj og fjern politistillinger</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              {customRanks.map((rank, i) => {
                const hasMember = ansatte.some(a => a.rang === rank);
                return (
                  <div key={rank} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
                    <span className="text-sm text-foreground">{i + 1}. {rank}</span>
                    {!hasMember && (
                      <button onClick={() => handleRemoveRank(rank)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input placeholder="Ny stilling..." value={newRankName} onChange={e => setNewRankName(e.target.value)} className="bg-secondary border-border" />
              <Button onClick={handleAddRank} size="sm" className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0">Tilføj</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fired employees log dialog */}
      <Dialog open={showFyrede} onOpenChange={setShowFyrede}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fyrede medarbejdere</DialogTitle>
            <DialogDescription>Log over alle fyrede betjente</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {fyrede.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ingen fyrede medarbejdere</p>
            ) : (
              fyrede.map((f) => (
                <div key={f.id + f.fyretDato} className="p-3 bg-muted/50 rounded-lg border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{f.fornavn} {f.efternavn}</span>
                    <span className="text-xs text-muted-foreground">{f.badgeNr}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Stilling: {f.rang}</p>
                  <p className="text-xs text-muted-foreground">Fyret: {f.fyretDato}</p>
                  <p className="text-xs text-muted-foreground">Af: {f.fyretAf}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnsatteListe;
