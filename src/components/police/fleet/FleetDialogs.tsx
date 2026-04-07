import { Search, UserPlus, Shield, Plus, Users, ArrowRightLeft } from "lucide-react";
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
import { statusConfig, PATROL_TYPES, GROUP_ACTIONS, type PatrolStatus, type TaskGroup } from "./FleetTypes";
import PatrolIcon from "./PatrolIcon";
import type { Patrulje } from "@/lib/api";
import type { Betjent } from "@/types/police";

// ── Create Patrol Dialog ──
interface CreatePatrolDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  availableTypes: typeof PATROL_TYPES;
  getNextName: (prefix: string) => string;
  valgtType: string;
  setValgtType: (v: string) => void;
  autoTilmeld: boolean;
  setAutoTilmeld: (v: boolean) => void;
  currentUser: Betjent | null;
  onSubmit: (typeId: string) => void;
}

export const CreatePatrolDialog = ({
  open, onOpenChange, availableTypes, getNextName,
  valgtType, setValgtType, autoTilmeld, setAutoTilmeld,
  currentUser, onSubmit,
}: CreatePatrolDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-base font-bold">Opret ny patrulje</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {availableTypes.map(type => {
            const nextName = getNextName(type.prefix);
            return (
              <button
                key={type.id}
                onClick={() => setValgtType(type.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left",
                  valgtType === type.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-primary/30 hover:bg-muted/20"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  valgtType === type.id ? "bg-primary/15" : "bg-muted/60"
                )}>
                  <PatrolIcon type={type.icon} className={cn("w-4 h-4", valgtType === type.id ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block">{type.label}</span>
                  <span className="text-[10px] text-primary/70 font-mono block mt-0.5">{nextName}</span>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[8px] h-4">{type.pladser} pladser</Badge>
                    {type.requiredUddannelser.map(u => (
                      <Badge key={u} className="text-[8px] h-4 bg-primary/10 text-primary border-primary/20">{u}</Badge>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
          {availableTypes.length === 0 && (
            <p className="col-span-2 text-xs text-muted-foreground italic text-center py-6">
              Ingen patruljtyper tilgængelige for dine uddannelser
            </p>
          )}
        </div>

        {currentUser && valgtType && (
          <label className="flex items-center gap-2.5 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3 cursor-pointer hover:bg-primary/8 transition-colors">
            <Checkbox id="autoTilmeld" checked={autoTilmeld} onCheckedChange={(v) => setAutoTilmeld(!!v)} />
            <div>
              <span className="text-xs font-medium text-foreground">Tilmeld mig automatisk</span>
              <span className="text-[10px] text-muted-foreground block">
                {currentUser.badgeNr} — {currentUser.fornavn} {currentUser.efternavn}
              </span>
            </div>
          </label>
        )}

        <Button className="w-full h-9 text-xs gap-2 rounded-xl" disabled={!valgtType}
          onClick={() => onSubmit(valgtType)}>
          <Plus className="w-3.5 h-3.5" /> Opret {valgtType ? PATROL_TYPES.find(t => t.id === valgtType)?.label : "patrulje"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// ── Add Member Dialog ──
interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patrolName: string;
  betjentSoegning: string;
  setBetjentSoegning: (v: string) => void;
  filteredBetjente: Betjent[];
  onAdd: (b: Betjent) => void;
}

export const AddMemberDialog = ({
  open, onOpenChange, patrolName,
  betjentSoegning, setBetjentSoegning, filteredBetjente, onAdd,
}: AddMemberDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-sm">Tilføj til {patrolName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Søg badge, navn, rang..." value={betjentSoegning}
            onChange={(e) => setBetjentSoegning(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl" />
        </div>
        <ScrollArea className="h-[260px]">
          <div className="space-y-0.5">
            {filteredBetjente.map(b => (
              <button key={b.id} onClick={() => onAdd(b)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-foreground">
                      {b.fornavn} {b.efternavn}
                    </div>
                    <div className="text-[9px] text-muted-foreground">#{b.badgeNr} · {b.rang}</div>
                  </div>
                </div>
                <UserPlus className="w-3.5 h-3.5 text-primary" />
              </button>
            ))}
            {filteredBetjente.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-6">Ingen betjente fundet</p>
            )}
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
);

// ── Note Dialog ──
interface NoteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patrolName: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
}

export const NoteDialog = ({ open, onOpenChange, patrolName, value, onChange, onSave }: NoteDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-sm">Note — {patrolName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <Textarea value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Skriv bemærkning..." rows={3} className="text-xs rounded-xl resize-none" />
        <Button className="w-full h-8 text-xs rounded-xl" onClick={onSave}>Gem note</Button>
      </div>
    </DialogContent>
  </Dialog>
);

// ── Create Group Dialog ──
interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gruppeNavn: string; setGruppeNavn: (v: string) => void;
  gruppeRadio: string; setGruppeRadio: (v: string) => void;
  gruppeLeder: string; setGruppeLeder: (v: string) => void;
  gruppeAktion: string; setGruppeAktion: (v: string) => void;
  gruppePatruljer: string[]; setGruppePatruljer: (v: string[]) => void;
  bemandede: Patrulje[];
  onSubmit: () => void;
}

export const CreateGroupDialog = ({
  open, onOpenChange,
  gruppeNavn, setGruppeNavn, gruppeRadio, setGruppeRadio,
  gruppeLeder, setGruppeLeder, gruppeAktion, setGruppeAktion,
  gruppePatruljer, setGruppePatruljer, bemandede, onSubmit,
}: CreateGroupDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Opret opgavegruppe
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3 pt-1">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Aktionstype</Label>
          <Select value={gruppeAktion} onValueChange={setGruppeAktion}>
            <SelectTrigger className="h-8 text-xs mt-1 rounded-xl"><SelectValue placeholder="Vælg aktion" /></SelectTrigger>
            <SelectContent>
              {GROUP_ACTIONS.map(a => <SelectItem key={a} value={a} className="text-xs">{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gruppenavn</Label>
          <Input value={gruppeNavn} onChange={(e) => setGruppeNavn(e.target.value)} placeholder="F.eks. Operation Centrum"
            className="h-8 text-xs mt-1 rounded-xl" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Radiokanal</Label>
          <Input value={gruppeRadio} onChange={(e) => setGruppeRadio(e.target.value)} placeholder="F.eks. Kanal 3"
            className="h-8 text-xs mt-1 rounded-xl" />
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Leder (patrulje)</Label>
          <Select value={gruppeLeder} onValueChange={(v) => {
            setGruppeLeder(v);
            if (!gruppePatruljer.includes(v)) setGruppePatruljer([...gruppePatruljer, v]);
          }}>
            <SelectTrigger className="h-8 text-xs mt-1 rounded-xl"><SelectValue placeholder="Vælg leder" /></SelectTrigger>
            <SelectContent>
              {bemandede.map(p => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.navn} ({p.medlemmer.map(m => m.navn).join(", ")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Tilføj patruljer</Label>
          <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
            {bemandede.filter(p => p.id !== gruppeLeder).map(p => (
              <label key={p.id} className="flex items-center gap-2 text-[11px] text-foreground cursor-pointer hover:bg-muted/30 rounded-lg px-2 py-1.5">
                <Checkbox
                  checked={gruppePatruljer.includes(p.id)}
                  onCheckedChange={(v) => {
                    if (v) setGruppePatruljer([...gruppePatruljer, p.id]);
                    else setGruppePatruljer(gruppePatruljer.filter(id => id !== p.id));
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
        <Button className="w-full h-9 text-xs gap-2 rounded-xl"
          disabled={!gruppeNavn.trim() || !gruppeRadio.trim() || !gruppeLeder || !gruppeAktion}
          onClick={onSubmit}>
          <Users className="w-3.5 h-3.5" /> Opret gruppe
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

// ── Simple list picker dialog ──
interface ListPickerDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  items: { id: string; label: string; sublabel?: string; badge?: string }[];
  onSelect: (id: string) => void;
  emptyText?: string;
  icon?: "plus" | "move";
}

export const ListPickerDialog = ({ open, onOpenChange, title, items, onSelect, emptyText, icon = "plus" }: ListPickerDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-sm">{title}</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[280px]">
        <div className="space-y-0.5 pt-1">
          {items.map(item => (
            <button key={item.id} onClick={() => onSelect(item.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors text-left">
              <div>
                <span className="text-[11px] font-medium text-foreground">{item.label}</span>
                {item.sublabel && <span className="text-[9px] text-muted-foreground ml-2">({item.sublabel})</span>}
                {item.badge && <Badge className="text-[8px] ml-2 bg-primary/10 text-primary border-primary/20">{item.badge}</Badge>}
              </div>
              {icon === "plus" ? <Plus className="w-3.5 h-3.5 text-primary" /> : <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-6">{emptyText || "Ingen tilgængelige"}</p>
          )}
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
