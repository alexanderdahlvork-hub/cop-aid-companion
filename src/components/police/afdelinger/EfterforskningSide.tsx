import { useState } from "react";
import { Search, FileText, Users, Clock, Plus, FolderOpen, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EfterforskningSide = () => {
  const [tab, setTab] = useState<"sager" | "bevis" | "afhoering">("sager");

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">Efterforskning</h1>
        <p className="text-xs text-muted-foreground">Sagsstyring, bevismateriale & afhøringer</p>
      </div>

      <div className="flex gap-1 mb-4 border-b border-border">
        {[
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

      {tab === "sager" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Søg sagsnummer..." className="pl-8 h-8 text-xs" />
            </div>
            <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Ny sag</Button>
          </div>
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Ingen aktive sager</p>
            <p className="text-[10px] mt-1">Opret en ny sag for at starte efterforskning</p>
          </div>
        </div>
      )}

      {tab === "bevis" && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Bevismateriale</p>
          <p className="text-[10px] mt-1">Upload og administrer beviser knyttet til sager</p>
        </div>
      )}

      {tab === "afhoering" && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Afhøringsprotokoller</p>
          <p className="text-[10px] mt-1">Registrer og gennemse afhøringer</p>
        </div>
      )}
    </div>
  );
};

export default EfterforskningSide;
