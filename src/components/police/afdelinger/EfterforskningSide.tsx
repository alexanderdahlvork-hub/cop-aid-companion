import { useState } from "react";
import { Search, FileText, FolderOpen, MessageSquare, Plus, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import AfdelingsIndhold from "./AfdelingsIndhold";
import type { Betjent } from "@/types/police";

interface EfterforskningSideProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const EfterforskningSide = ({ currentUser, isAdmin }: EfterforskningSideProps) => {
  const [tab, setTab] = useState<"tavle" | "sager" | "bevis" | "afhoering">("tavle");

  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">Efterforskning</h1>
        <p className="text-xs text-muted-foreground">Opslagstavle, sagsstyring, bevismateriale & afhøringer</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "tavle" as const, label: "Opslagstavle", icon: Megaphone },
          { id: "sager" as const, label: "Sager", icon: FolderOpen },
          { id: "bevis" as const, label: "Bevismateriale", icon: FileText },
          { id: "afhoering" as const, label: "Afhøringer", icon: MessageSquare },
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
        <AfdelingsIndhold afdelingId="efterforskning" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "sager" && (
        <AfdelingsIndhold afdelingId="efterforskning_sager" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "bevis" && (
        <AfdelingsIndhold afdelingId="efterforskning_bevis" currentUserNavn={userName} isLeder={isLeder} />
      )}
      {tab === "afhoering" && (
        <AfdelingsIndhold afdelingId="efterforskning_afhoering" currentUserNavn={userName} isLeder={isLeder} />
      )}
    </div>
  );
};

export default EfterforskningSide;
