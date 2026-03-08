import { useState } from "react";
import { Search, Users, Target, Network, Eye, Plus, MapPin, Clock, AlertTriangle, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BandeMedlem {
  id: string;
  navn: string;
  alias: string;
  bande: string;
  rolle: string;
  status: "aktiv" | "fængslet" | "eftersøgt" | "inaktiv";
  noter: string;
  sidstSet: string;
}

interface Observation {
  id: string;
  dato: string;
  lokation: string;
  beskrivelse: string;
  involverede: string;
  prioritet: "lav" | "middel" | "høj" | "kritisk";
}

const prioritetConfig = {
  lav: { label: "Lav", color: "text-muted-foreground bg-muted/30" },
  middel: { label: "Middel", color: "text-primary bg-primary/10" },
  høj: { label: "Høj", color: "text-warning bg-warning/10" },
  kritisk: { label: "Kritisk", color: "text-destructive bg-destructive/10" },
};

const statusConfig = {
  aktiv: { label: "Aktiv", dot: "bg-success" },
  fængslet: { label: "Fængslet", dot: "bg-muted-foreground" },
  eftersøgt: { label: "Eftersøgt", dot: "bg-warning" },
  inaktiv: { label: "Inaktiv", dot: "bg-border" },
};

const NSKAfdeling = () => {
  const [tab, setTab] = useState<"medlemmer" | "observationer" | "netvaerk">("medlemmer");
  const [medlemmer] = useState<BandeMedlem[]>([]);
  const [observationer] = useState<Observation[]>([]);
  const [soegning, setSoegning] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">NSK — Organiseret Kriminalitet</h1>
          <p className="text-xs text-muted-foreground">Bandesporing, netværksanalyse & efterforskning</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {[
          { id: "medlemmer" as const, label: "Bandemedlemmer", icon: Users },
          { id: "observationer" as const, label: "Observationer", icon: Eye },
          { id: "netvaerk" as const, label: "Netværkskort", icon: Network },
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

      {tab === "medlemmer" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Søg navn, alias, bande..." value={soegning} onChange={(e) => setSoegning(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
            <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Tilføj</Button>
          </div>
          {medlemmer.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Ingen bandemedlemmer registreret</p>
              <p className="text-[10px] mt-1">Tilføj medlemmer for at starte bandesporing</p>
            </div>
          )}
        </div>
      )}

      {tab === "observationer" && (
        <div className="space-y-3">
          <Button size="sm" className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Ny observation</Button>
          {observationer.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Ingen observationer endnu</p>
            </div>
          )}
        </div>
      )}

      {tab === "netvaerk" && (
        <div className="text-center py-12 text-muted-foreground">
          <Network className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Netværkskort</p>
          <p className="text-[10px] mt-1">Visualisering af forbindelser mellem bandemedlemmer</p>
        </div>
      )}
    </div>
  );
};

export default NSKAfdeling;
