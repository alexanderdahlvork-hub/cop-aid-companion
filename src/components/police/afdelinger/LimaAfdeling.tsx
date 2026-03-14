import { useState } from "react";
import { Shield, FileText, Target, Plus, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import AfdelingsIndhold from "./AfdelingsIndhold";
import type { Betjent } from "@/types/police";

interface LimaAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const LimaAfdeling = ({ currentUser, isAdmin }: LimaAfdelingProps) => {
  const [tab, setTab] = useState<"tavle" | "planer" | "udstyr" | "traening">("tavle");

  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">Lima — Aktionsstyrken</h1>
        <p className="text-xs text-muted-foreground">Opslagstavle, taktiske planer, indsatser & træning</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "tavle" as const, label: "Opslagstavle", icon: Megaphone },
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

      {tab === "tavle" && (
        <AfdelingsIndhold afdelingId="lima" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "planer" && (
        <AfdelingsIndhold afdelingId="lima_planer" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "udstyr" && (
        <AfdelingsIndhold afdelingId="lima_udstyr" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "traening" && (
        <AfdelingsIndhold afdelingId="lima_traening" currentUserNavn={userName} isLeder={isLeder} />
      )}
    </div>
  );
};

export default LimaAfdeling;
