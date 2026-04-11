import { useState, useEffect } from "react";
import { FileText, Plus, Search, Loader2, FolderOpen, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sagerApi } from "@/lib/sagerApi";
import type { Sag } from "@/types/police";

interface SagsArkivProps {
  onOpenSag: (sagId: string, label: string) => void;
  onNewSag: () => void;
}

const SagsArkiv = ({ onOpenSag, onNewSag }: SagsArkivProps) => {
  const [sager, setSager] = useState<Sag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSager = () => {
    setLoading(true);
    sagerApi.getAll()
      .then(setSager)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSager();
  }, []);

  const filtered = sager.filter(s => {
    const q = search.toLowerCase();
    return s.titel.toLowerCase().includes(q) || s.sagsnummer.toLowerCase().includes(q) ||
      s.mistaenkte.some(m => m.personNavn.toLowerCase().includes(q));
  });

  const statusStyle: Record<string, string> = {
    aaben: "bg-success/15 text-success",
    under_efterforskning: "bg-primary/15 text-primary",
    afventer_retten: "bg-warning/15 text-warning",
    lukket: "bg-muted text-muted-foreground",
  };

  const statusLabel: Record<string, string> = {
    aaben: "Åben",
    under_efterforskning: "Efterforskning",
    afventer_retten: "Afventer retten",
    lukket: "Lukket",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser sager...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Sagsarkiv
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{sager.length} sager i alt</p>
        </div>
        <Button onClick={onNewSag} className="gap-1.5 h-9 text-xs">
          <Plus className="w-3.5 h-3.5" /> Opret ny sag
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søg sagsnummer, titel, mistænkt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{search ? "Ingen sager matcher søgningen" : "Ingen sager oprettet endnu"}</p>
          {!search && (
            <Button variant="outline" className="mt-3 text-xs" onClick={onNewSag}>
              <Plus className="w-3 h-3 mr-1.5" /> Opret din første sag
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(sag => (
            <button
              key={sag.id}
              onClick={() => onOpenSag(sag.id, sag.titel || sag.sagsnummer)}
              className="w-full flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:bg-primary/5 hover:border-primary/20 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{sag.sagsnummer}</span>
                  <Badge className={cn("text-[9px] h-4 border-0 px-1.5", statusStyle[sag.status])}>
                    {statusLabel[sag.status]}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{sag.titel || "Uden titel"}</p>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{sag.mistaenkte.length} mistænkte</span>
                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(sag.opdateret).toLocaleDateString("da-DK")}</span>
                  <span>{sag.oprettetAf}</span>
                </div>
              </div>
              {sag.tags.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {sag.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SagsArkiv;
