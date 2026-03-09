import { useState, useEffect } from "react";
import { Search, Users, FileText, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { personerApi } from "@/lib/api";
import type { Person, Sigtelse } from "@/types/police";
import OpretSigtelseDialog from "./OpretSigtelseDialog";
import { toast } from "@/components/ui/sonner";
import { sigtelserApi } from "@/lib/api";

interface OpretSagProps {
  currentUser: { badgeNr: string; fornavn: string; efternavn: string };
  initialPersonId?: string | null;
  initialSigtelser?: Sigtelse[];
}

const OpretSag = ({ currentUser, initialPersonId, initialSigtelser }: OpretSagProps) => {
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showSigtelse, setShowSigtelse] = useState(false);

  useEffect(() => {
    personerApi.getAll()
      .then((data) => {
        setPersoner(data);
        if (initialPersonId) {
          const found = data.find(p => p.id === initialPersonId);
          if (found) {
            setSelectedPerson(found);
            setShowSigtelse(true);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [initialPersonId]);

  const filtered = personer.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.fornavn.toLowerCase().includes(q) ||
      p.efternavn.toLowerCase().includes(q) ||
      p.cpr.includes(q) ||
      `${p.fornavn} ${p.efternavn}`.toLowerCase().includes(q)
    );
  });

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      aktiv: "bg-success/15 text-success",
      eftersøgt: "bg-destructive/15 text-destructive",
      anholdt: "bg-warning/15 text-warning",
      sigtet: "bg-primary/15 text-primary",
    };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", styles[status] || "bg-muted text-muted-foreground")}>
        {status}
      </span>
    );
  };

  const handleSigtelseOprettet = async (sigtelse: Sigtelse) => {
    try {
      await sigtelserApi.create(sigtelse);
      toast("Sag oprettet succesfuldt");
    } catch (err) {
      console.error("Fejl ved oprettelse:", err);
      toast("Fejl ved oprettelse af sag");
    }
    setShowSigtelse(false);
    setSelectedPerson(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser personregister...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Opret Sag
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vælg en person fra registeret for at oprette en ny sag
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium",
          !selectedPerson ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
        )}>
          <Users className="w-4 h-4" />
          1. Vælg person
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium",
          selectedPerson ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground/50"
        )}>
          <FileText className="w-4 h-4" />
          2. Opret sigtelse
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søg navn, CPR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-sm"
        />
      </div>

      {/* Person list */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-2.5 bg-secondary/80 text-xs font-semibold text-muted-foreground uppercase">
          <span>Navn</span>
          <span>CPR</span>
          <span>Adresse</span>
          <span>Status</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {search ? "Ingen personer matcher søgningen" : "Ingen personer i registeret"}
          </div>
        ) : (
          filtered.slice(0, 50).map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPerson(p); setShowSigtelse(true); }}
              className={cn(
                "w-full grid grid-cols-[1fr_1fr_0.8fr_0.6fr] gap-2 px-4 py-3 border-t border-border/50 hover:bg-primary/5 transition-colors text-left text-sm",
                selectedPerson?.id === p.id && "bg-primary/10"
              )}
            >
              <span className="font-medium text-foreground">{p.fornavn} {p.efternavn}</span>
              <span className="font-mono text-muted-foreground">{p.cpr}</span>
              <span className="text-muted-foreground truncate">{p.adresse}, {p.postnr} {p.by}</span>
              <span>{statusBadge(p.status)}</span>
            </button>
          ))
        )}
        {filtered.length > 50 && (
          <div className="px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/50">
            Viser 50 af {filtered.length} — præcisér din søgning
          </div>
        )}
      </div>

      {/* Sigtelse dialog */}
      {selectedPerson && (
        <OpretSigtelseDialog
          open={showSigtelse}
          onOpenChange={(open) => { setShowSigtelse(open); if (!open) setSelectedPerson(null); }}
          person={selectedPerson}
          onSigtelseOprettet={handleSigtelseOprettet}
          currentUser={currentUser}
          initialSigtelser={initialPersonId === selectedPerson?.id ? initialSigtelser : undefined}
        />
      )}
    </div>
  );
};

export default OpretSag;
