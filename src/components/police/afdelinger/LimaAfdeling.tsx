import { useState } from "react";
import { Shield, FileText, MapPin, Users, Clock, Plus, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaktiskPlan {
  id: string;
  navn: string;
  type: "bankrøveri" | "gidsel" | "razzia" | "eskorte" | "anden";
  status: "klar" | "igangværende" | "afsluttet";
  prioritet: "normal" | "høj" | "kritisk";
  beskrivelse: string;
  dato: string;
}

const planTypeConfig = {
  bankrøveri: { label: "Bankrøveri", color: "bg-destructive/10 text-destructive" },
  gidsel: { label: "Gidseltagning", color: "bg-warning/10 text-warning" },
  razzia: { label: "Razzia", color: "bg-primary/10 text-primary" },
  eskorte: { label: "Eskorte", color: "bg-success/10 text-success" },
  anden: { label: "Anden", color: "bg-muted text-muted-foreground" },
};

const LimaAfdeling = () => {
  const [tab, setTab] = useState<"planer" | "udstyr" | "traening">("planer");
  const [planer] = useState<TaktiskPlan[]>([]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">Lima — Aktionsstyrken</h1>
        <p className="text-xs text-muted-foreground">Taktiske planer, indsatser & træning</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "planer" as const, label: "Taktiske planer", icon: FileText },
          { id: "udstyr" as const, label: "Udstyr", icon: Shield },
          { id: "traening" as const, label: "Træning", icon: Target },
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

      {tab === "planer" && (
        <div className="space-y-3">
          <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Ny plan</Button>

          {/* Placeholder plan types */}
          <div className="grid grid-cols-2 gap-3">
            {(["bankrøveri", "gidsel", "razzia", "eskorte"] as const).map((type) => (
              <div key={type} className="rounded-md border border-border bg-card/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("px-2 py-0.5 rounded text-[10px] font-medium", planTypeConfig[type].color)}>
                    {planTypeConfig[type].label}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Ingen aktive planer</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "udstyr" && (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Udstyrsadministration</p>
          <p className="text-[10px] mt-1">Våben, beskyttelsesudstyr & køretøjer</p>
        </div>
      )}

      {tab === "traening" && (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Træningsprotokoller</p>
          <p className="text-[10px] mt-1">Skydetræning, taktik & fysisk træning</p>
        </div>
      )}
    </div>
  );
};

export default LimaAfdeling;
