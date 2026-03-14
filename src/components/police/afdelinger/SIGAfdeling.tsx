import { useState } from "react";
import { Crosshair, Eye, FileText, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import AfdelingsIndhold from "./AfdelingsIndhold";
import type { Betjent } from "@/types/police";

interface SIGAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const SIGAfdeling = ({ currentUser, isAdmin }: SIGAfdelingProps) => {
  const [tab, setTab] = useState<"tavle" | "operationer" | "overvågning" | "rapporter">("tavle");

  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">SIG — Særlig Indsatsgruppe</h1>
        <p className="text-xs text-muted-foreground">Opslagstavle, operationer, overvågning & taktiske rapporter</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "tavle" as const, label: "Opslagstavle", icon: Megaphone },
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

      {tab === "tavle" && (
        <AfdelingsIndhold afdelingId="sig" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "operationer" && (
        <AfdelingsIndhold afdelingId="sig_operationer" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "overvågning" && (
        <AfdelingsIndhold afdelingId="sig_overvaagning" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "rapporter" && (
        <AfdelingsIndhold afdelingId="sig_rapporter" currentUserNavn={userName} isLeder={isLeder} />
      )}
    </div>
  );
};

export default SIGAfdeling;
