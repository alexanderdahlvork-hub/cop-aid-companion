import { useState } from "react";
import { Heart, Truck, Clock, Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AfdelingsIndhold from "./AfdelingsIndhold";
import type { Betjent } from "@/types/police";

interface RemeoAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const RemeoAfdeling = ({ currentUser, isAdmin }: RemeoAfdelingProps) => {
  const [tab, setTab] = useState<"tavle" | "udrykninger" | "koeretoejer" | "vagtplan">("tavle");

  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">Remeo — Redning & Medicinsk</h1>
        <p className="text-xs text-muted-foreground">Informationstavle, udrykninger, køretøjer & vagtplanlægning</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "tavle" as const, label: "Informationstavle", icon: Megaphone },
          { id: "udrykninger" as const, label: "Udrykninger", icon: Truck },
          { id: "koeretoejer" as const, label: "Køretøjer", icon: Truck },
          { id: "vagtplan" as const, label: "Vagtplan", icon: Clock },
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
        <AfdelingsIndhold afdelingId="remeo" currentUserNavn={userName} isLeder={isLeder} />
      )}

      {tab === "udrykninger" && (
        <div className="space-y-3">
          <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Ny udrykning</Button>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Aktive", value: "0", color: "text-destructive" },
              { label: "I dag", value: "0", color: "text-warning" },
              { label: "Total", value: "0", color: "text-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card/50 p-3 text-center">
                <p className="text-[9px] uppercase text-muted-foreground">{s.label}</p>
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Ingen aktive udrykninger</p>
          </div>
        </div>
      )}

      {tab === "koeretoejer" && (
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Afdelingens køretøjer</p>
          <p className="text-[10px] mt-1">Ambulancer, redningskøretøjer & udstyr</p>
        </div>
      )}

      {tab === "vagtplan" && (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Vagtplanlægning</p>
          <p className="text-[10px] mt-1">Vagtskemaer og personalefordeling</p>
        </div>
      )}
    </div>
  );
};

export default RemeoAfdeling;
