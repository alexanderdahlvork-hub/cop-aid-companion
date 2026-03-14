import { useState } from "react";
import { Car, Gauge, AlertTriangle, ClipboardList, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FartBeregner from "../FartBeregner";
import AfdelingsIndhold from "./AfdelingsIndhold";
import type { Betjent } from "@/types/police";

interface FaerdselAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const FaerdselAfdeling = ({ currentUser, isAdmin }: FaerdselAfdelingProps) => {
  const [tab, setTab] = useState<"tavle" | "fart" | "uheld" | "klip">("tavle");
  const [fartOpen, setFartOpen] = useState(false);

  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">Færdsel</h1>
        <p className="text-xs text-muted-foreground">Opslagstavle, fartbøder, færdselsuheld & klip-oversigt</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "tavle" as const, label: "Opslagstavle", icon: Megaphone },
          { id: "fart" as const, label: "Fartberegner", icon: Gauge },
          { id: "uheld" as const, label: "Færdselsuheld", icon: AlertTriangle },
          { id: "klip" as const, label: "Klip-oversigt", icon: ClipboardList },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tavle" && (
        <AfdelingsIndhold afdelingId="faerdsel" currentUserNavn={userName} isLeder={isLeder} />
      )}

      {tab === "fart" && (
        <div className="space-y-3">
          <Button size="sm" onClick={() => setFartOpen(true)} className="h-8 gap-1.5 text-xs">
            <Gauge className="w-3.5 h-3.5" /> Åbn fartberegner
          </Button>
          <div className="rounded-md border border-border bg-card/50 p-6 text-center">
            <Gauge className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Brug fartberegneren til at beregne bøder baseret på vejtype, grænse og hastighed.</p>
          </div>
          <FartBeregner open={fartOpen} onOpenChange={setFartOpen} />
        </div>
      )}

      {tab === "uheld" && (
        <div className="space-y-3">
          <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Registrer uheld</Button>
          <div className="text-center py-12 text-muted-foreground">
            <Car className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Ingen uheld registreret</p>
          </div>
        </div>
      )}

      {tab === "klip" && (
        <div className="text-center py-12 text-muted-foreground">
          <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Klip-oversigt</p>
          <p className="text-[10px] mt-1">Oversigt over tildelte klip på tværs af personer</p>
        </div>
      )}
    </div>
  );
};

export default FaerdselAfdeling;
