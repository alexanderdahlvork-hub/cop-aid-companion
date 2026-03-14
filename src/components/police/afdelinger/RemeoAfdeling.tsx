import { useState } from "react";
import { Truck, Clock, Megaphone, Plus } from "lucide-react";
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
        <AfdelingsIndhold afdelingId="remeo_udrykninger" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "koeretoejer" && (
        <AfdelingsIndhold afdelingId="remeo_koeretoejer" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "vagtplan" && (
        <AfdelingsIndhold afdelingId="remeo_vagtplan" currentUserNavn={userName} isLeder={isLeder} />
      )}
    </div>
  );
};

export default RemeoAfdeling;
