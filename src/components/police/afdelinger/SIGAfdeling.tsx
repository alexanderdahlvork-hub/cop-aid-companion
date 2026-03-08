import { useState } from "react";
import { Shield, Crosshair, Eye, Radio, MapPin, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIGAfdeling = () => {
  const [tab, setTab] = useState<"operationer" | "overvågning" | "rapporter">("operationer");

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">SIG — Særlig Indsatsgruppe</h1>
        <p className="text-xs text-muted-foreground">Operationer, overvågning & taktiske rapporter</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "operationer" as const, label: "Operationer", icon: Crosshair },
          { id: "overvågning" as const, label: "Overvågning", icon: Eye },
          { id: "rapporter" as const, label: "Rapporter", icon: FileText },
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

      {tab === "operationer" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Aktive", value: "0", color: "text-success" },
              { label: "Planlagte", value: "0", color: "text-warning" },
              { label: "Afsluttede", value: "0", color: "text-muted-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-border bg-card/50 p-3 text-center">
                <p className="text-[9px] uppercase text-muted-foreground">{s.label}</p>
                <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <Crosshair className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Ingen aktive operationer</p>
          </div>
        </div>
      )}

      {tab === "overvågning" && (
        <div className="text-center py-12 text-muted-foreground">
          <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Overvågningslog</p>
          <p className="text-[10px] mt-1">Registrer observationer og overvågningsdata</p>
        </div>
      )}

      {tab === "rapporter" && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Taktiske rapporter</p>
          <p className="text-[10px] mt-1">Indsats- og situationsrapporter</p>
        </div>
      )}
    </div>
  );
};

export default SIGAfdeling;
