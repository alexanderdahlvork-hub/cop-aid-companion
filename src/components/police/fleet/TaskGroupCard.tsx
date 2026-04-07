import { Plus, Trash2, Users, Radio, Crown, ArrowRightLeft, UserMinus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusConfig, type TaskGroup } from "./FleetTypes";
import type { Patrulje } from "@/lib/api";

interface TaskGroupCardProps {
  group: TaskGroup;
  patrols: Patrulje[];
  totalGroups: number;
  onAddPatrol: (groupId: string) => void;
  onRemovePatrol: (patrolId: string, groupId: string) => void;
  onMovePatrol: (patrolId: string, groupId: string) => void;
  onDeleteGroup: (groupId: string) => void;
}

const TaskGroupCard = ({
  group, patrols, totalGroups,
  onAddPatrol, onRemovePatrol, onMovePatrol, onDeleteGroup,
}: TaskGroupCardProps) => {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/15">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Users className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{group.navn}</span>
              <Badge className="text-[9px] h-5 bg-primary/10 text-primary border-primary/20 rounded-full">
                {group.aktion}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[9px] gap-1 border-primary/20 text-primary/80 h-4 rounded-full">
                <Radio className="w-2.5 h-2.5" /> {group.radioKanal}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{group.patruljeIds.length} enheder</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onAddPatrol(group.id)}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors" title="Tilføj patrulje">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteGroup(group.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Patrols in group */}
      <div className="px-3 py-2 space-y-1">
        {group.patruljeIds.map((pid) => {
          const p = patrols.find(pt => pt.id === pid);
          if (!p) return null;
          const isLeder = pid === group.lederId;
          const sc = statusConfig[p.status];
          return (
            <div key={pid} className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
              isLeder ? "bg-primary/8 border border-primary/20" : "hover:bg-muted/30 border border-transparent"
            )}>
              <div className="flex items-center gap-2.5">
                {isLeder && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                <div className={cn("w-2 h-2 rounded-full", sc.dot)} />
                <div>
                  <span className="text-[12px] font-semibold text-foreground">{p.navn}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">
                    {p.medlemmer.map(m => m.navn).join(", ") || "Tom"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {totalGroups > 1 && (
                  <button
                    onClick={() => onMovePatrol(pid, group.id)}
                    className="p-1 rounded-md hover:bg-muted/40 text-muted-foreground/50 hover:text-primary transition-colors"
                    title="Flyt til anden gruppe"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => onRemovePatrol(pid, group.id)}
                  className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <UserMinus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
        {group.patruljeIds.length === 0 && (
          <p className="text-[11px] text-muted-foreground/50 italic text-center py-3">Ingen patruljer tilknyttet</p>
        )}
      </div>
    </div>
  );
};

export default TaskGroupCard;
