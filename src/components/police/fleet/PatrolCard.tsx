import { UserPlus, UserMinus, Shield, MessageSquare, Trash2, Users, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { statusConfig, type PatrolStatus, PATROL_TYPES } from "./FleetTypes";
import PatrolIcon from "./PatrolIcon";
import type { Patrulje } from "@/lib/api";

interface PatrolCardProps {
  patrol: Patrulje;
  inGroup: boolean;
  hasGroups: boolean;
  onStatusChange: (id: string, status: PatrolStatus) => void;
  onSignOff: (id: string, badgeNr: string) => void;
  onDelete: (id: string) => void;
  onOpenAddMember: (id: string) => void;
  onOpenNote: (id: string, current: string) => void;
  onOpenMoveToGroup: (id: string) => void;
  onOpenMoveMember: (fromId: string, badgeNr: string, name: string) => void;
}

const PatrolCard = ({
  patrol, inGroup, hasGroups,
  onStatusChange, onSignOff, onDelete,
  onOpenAddMember, onOpenNote, onOpenMoveToGroup, onOpenMoveMember,
}: PatrolCardProps) => {
  const sc = statusConfig[patrol.status];
  const isFull = patrol.medlemmer.length >= patrol.pladser;
  const patrolType = PATROL_TYPES.find(t => t.kategori === patrol.kategori);
  const iconType = patrolType?.icon || "car";
  const fillPercent = (patrol.medlemmer.length / patrol.pladser) * 100;

  return (
    <div className={cn(
      "rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md",
      inGroup ? "border-primary/30 ring-1 ring-primary/10" : "border-border/60"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            patrol.medlemmer.length > 0 ? "bg-primary/10" : "bg-muted/60"
          )}>
            <PatrolIcon type={iconType} className={cn(
              "w-4 h-4",
              patrol.medlemmer.length > 0 ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{patrol.navn}</span>
              {inGroup && (
                <Badge className="text-[8px] h-4 px-1.5 bg-primary/10 text-primary border-primary/20">
                  <Users className="w-2.5 h-2.5 mr-0.5" /> Gruppe
                </Badge>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{patrol.kategori}</span>
          </div>
        </div>
        <Select value={patrol.status} onValueChange={(v) => onStatusChange(patrol.id, v as PatrolStatus)}>
          <SelectTrigger className={cn("h-6 text-[10px] border px-2 py-0 gap-1 rounded-full w-auto", sc.bg)}>
            <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(statusConfig) as PatrolStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">{statusConfig[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Capacity bar */}
      <div className="px-3.5 pt-2.5 pb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-muted-foreground font-medium">Bemanding</span>
          <span className="text-[10px] font-mono text-muted-foreground">{patrol.medlemmer.length}/{patrol.pladser}</span>
        </div>
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isFull ? "bg-amber-500" : "bg-primary"
            )}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Members */}
      <div className="px-3.5 py-2 space-y-1 min-h-[44px]">
        {patrol.medlemmer.length === 0 && (
          <p className="text-[11px] text-muted-foreground/50 italic py-1">Ingen tilmeldte</p>
        )}
        {patrol.medlemmer.map((m) => (
          <div key={m.badgeNr} className="flex items-center justify-between group rounded-md hover:bg-muted/30 px-1.5 py-1 -mx-1.5 transition-colors">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-primary" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-foreground">{m.navn}</span>
                <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">#{m.badgeNr}</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onOpenMoveMember(patrol.id, m.badgeNr, m.navn)}
                className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                title="Flyt til anden patrulje"
              >
                <ArrowRightLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() => onSignOff(patrol.id, m.badgeNr)}
                className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Afmeld"
              >
                <UserMinus className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {/* Empty slots */}
        {Array.from({ length: patrol.pladser - patrol.medlemmer.length }).map((_, i) => (
          <div key={`e-${i}`} className="flex items-center gap-2 px-1.5 py-1">
            <div className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/20 flex items-center justify-center">
              <Shield className="w-2.5 h-2.5 text-muted-foreground/20" />
            </div>
            <span className="text-[10px] text-muted-foreground/30 italic">Ledig plads</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3.5 py-2 border-t border-border/30 bg-muted/5">
        <button
          onClick={() => onOpenNote(patrol.id, patrol.bemærkning)}
          className={cn(
            "text-[10px] flex items-center gap-1 rounded-md px-2 py-1 transition-colors max-w-[45%] truncate",
            patrol.bemærkning
              ? "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/30"
          )}
        >
          <MessageSquare className="w-3 h-3 shrink-0" />
          {patrol.bemærkning || "Tilføj note"}
        </button>
        <div className="flex items-center gap-1.5">
          {hasGroups && !inGroup && (
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 gap-1 text-muted-foreground hover:text-primary"
              onClick={() => onOpenMoveToGroup(patrol.id)}>
              <Users className="w-3 h-3" /> Gruppe
            </Button>
          )}
          {!isFull && (
            <Button size="sm" className="h-6 text-[10px] px-2.5 gap-1 rounded-full"
              onClick={() => onOpenAddMember(patrol.id)}>
              <UserPlus className="w-3 h-3" /> Tilføj
            </Button>
          )}
          {patrol.medlemmer.length === 0 && patrol.id.startsWith("custom-") && (
            <button onClick={() => onDelete(patrol.id)}
              className="p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatrolCard;
