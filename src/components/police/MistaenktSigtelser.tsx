import { useState } from "react";
import {
  Plus, X, Check, Gavel, ChevronDown, AlertTriangle, Gauge, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { standardBoeder } from "@/data/bodetakster";
import type { SagMistaenkt, SigtelseBoede, Boede } from "@/types/police";
import FartBeregner from "./FartBeregner";

interface MistaenktSigtelserProps {
  mistaenkt: SagMistaenkt;
  onUpdate: (data: Partial<SagMistaenkt>) => void;
}

const MistaenktSigtelser = ({ mistaenkt, onUpdate }: MistaenktSigtelserProps) => {
  const [straffeOpen, setStraffeOpen] = useState(false);
  const [openKat, setOpenKat] = useState<string | null>(null);
  const [soegning, setSoegning] = useState("");
  const [fartOpen, setFartOpen] = useState(false);

  const boeder = standardBoeder;
  const sigtelser = mistaenkt.sigtelser;

  const totalBoede = sigtelser.reduce((s, b) => s + b.beloeb, 0);
  const totalFaengsel = sigtelser.reduce((s, b) => s + b.faengselMaaneder, 0);

  const getCount = (boedeId: string) => sigtelser.filter(v => v.boedeId === boedeId).length;

  const addBoede = (b: Boede) => {
    const newSigtelser = [...sigtelser, {
      boedeId: b.id, paragraf: b.paragraf, beskrivelse: b.beskrivelse,
      beloeb: b.beloeb, faengselMaaneder: b.faengselMaaneder || 0,
    }];
    const total = newSigtelser.reduce((s, x) => s + x.beloeb, 0);
    const totalF = newSigtelser.reduce((s, x) => s + x.faengselMaaneder, 0);
    onUpdate({ sigtelser: newSigtelser, totalBoede: total, totalFaengsel: totalF });
  };

  const removeBoede = (boedeId: string) => {
    const idx = sigtelser.findIndex(v => v.boedeId === boedeId);
    if (idx >= 0) {
      const newSigtelser = sigtelser.filter((_, i) => i !== idx);
      onUpdate({
        sigtelser: newSigtelser,
        totalBoede: newSigtelser.reduce((s, x) => s + x.beloeb, 0),
        totalFaengsel: newSigtelser.reduce((s, x) => s + x.faengselMaaneder, 0),
      });
    }
  };

  const removeAllOfType = (boedeId: string) => {
    const newSigtelser = sigtelser.filter(v => v.boedeId !== boedeId);
    onUpdate({
      sigtelser: newSigtelser,
      totalBoede: newSigtelser.reduce((s, x) => s + x.beloeb, 0),
      totalFaengsel: newSigtelser.reduce((s, x) => s + x.faengselMaaneder, 0),
    });
  };

  const filtreretBoeder = soegning
    ? boeder.filter(b => `${b.paragraf} ${b.beskrivelse}`.toLowerCase().includes(soegning.toLowerCase()))
    : boeder;
  const kategorier = Array.from(new Set(filtreretBoeder.map(b => b.kategori)));

  return (
    <div className="space-y-3">
      {/* Status toggles */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px]", mistaenkt.erkender === null ? "text-destructive font-semibold" : "text-muted-foreground")}>
            Erkender {mistaenkt.erkender === null && "*"}
          </span>
          <Button size="sm" variant={mistaenkt.erkender === true ? "default" : "outline"} onClick={() => onUpdate({ erkender: true })}
            className={cn("h-6 w-6 p-0", mistaenkt.erkender === true && "bg-success hover:bg-success/90")}>
            <Check className="w-3 h-3" />
          </Button>
          <Button size="sm" variant={mistaenkt.erkender === false ? "default" : "outline"} onClick={() => onUpdate({ erkender: false })}
            className={cn("h-6 w-6 p-0", mistaenkt.erkender === false && "bg-destructive hover:bg-destructive/90")}>
            <X className="w-3 h-3" />
          </Button>
        </div>
        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
          <Checkbox checked={mistaenkt.behandlet} onCheckedChange={(v) => onUpdate({ behandlet: !!v })} className="w-3.5 h-3.5" />
          Behandlet
        </label>
        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
          <Checkbox checked={mistaenkt.tilkendegivelseAfgivet} onCheckedChange={(v) => onUpdate({ tilkendegivelseAfgivet: !!v })} className="w-3.5 h-3.5" />
          Tilkendegivelse afgivet
        </label>
        <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
          <Checkbox checked={mistaenkt.fratagKoerekort} onCheckedChange={(v) => onUpdate({ fratagKoerekort: !!v })} className="w-3.5 h-3.5" />
          Fratag kørekort
        </label>
      </div>

      {/* Sigtelser selector */}
      <Collapsible open={straffeOpen} onOpenChange={setStraffeOpen}>
        <CollapsibleTrigger asChild>
          <Button className="w-full h-8 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-3.5 h-3.5" /> Tilføj sigtelse
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="Søg paragraf eller beskrivelse..." value={soegning}
                onChange={(e) => setSoegning(e.target.value)} className="bg-muted/30 border-border text-xs h-7 flex-1" />
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shrink-0" onClick={() => setFartOpen(true)}>
                <Gauge className="w-3 h-3" /> Fart
              </Button>
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {kategorier.map((kat) => {
                const katBoeder = filtreretBoeder.filter(b => b.kategori === kat);
                const isOpen = openKat === kat;
                const selCount = katBoeder.filter(b => sigtelser.some(v => v.boedeId === b.id)).length;
                return (
                  <Collapsible key={kat} open={isOpen} onOpenChange={() => setOpenKat(isOpen ? null : kat)}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1 rounded bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-foreground">{kat}</span>
                        {selCount > 0 && <Badge className="bg-primary/15 text-primary border-0 text-[9px] h-3.5 px-1">{selCount}</Badge>}
                      </div>
                      <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-0.5 rounded border border-border overflow-hidden divide-y divide-border/30">
                        {katBoeder.map((b) => {
                          const count = getCount(b.id);
                          return (
                            <div key={b.id} className={cn("w-full flex items-center gap-2 px-2.5 py-1 transition-colors",
                              count > 0 ? "bg-primary/5" : "hover:bg-muted/20")}>
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button onClick={() => removeBoede(b.id)} disabled={count === 0}
                                  className={cn("w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold",
                                    count > 0 ? "bg-destructive/15 text-destructive hover:bg-destructive/25" : "bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
                                  )}>−</button>
                                <span className={cn("w-5 text-center text-[10px] font-mono font-semibold", count > 0 ? "text-primary" : "text-muted-foreground/50")}>{count}</span>
                                <button onClick={() => addBoede(b)}
                                  className="w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold bg-primary/15 text-primary hover:bg-primary/25">+</button>
                              </div>
                              <span className="flex-1 text-[10px] truncate">
                                {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}{b.beskrivelse}
                              </span>
                              <div className="flex items-center gap-1 shrink-0 text-[9px]">
                                {(b.faengselMaaneder ?? 0) > 0 && <span className="text-destructive">{b.faengselMaaneder}md</span>}
                                <span className="font-mono text-warning">{b.beloeb.toLocaleString("da-DK")}kr</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Selected charges summary */}
      {sigtelser.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="divide-y divide-border/30">
            {Array.from(new Set(sigtelser.map(b => b.boedeId))).map(boedeId => {
              const items = sigtelser.filter(v => v.boedeId === boedeId);
              const b = items[0];
              const count = items.length;
              return (
                <div key={boedeId} className="flex items-center justify-between px-2.5 py-1 text-[10px]">
                  <span className="text-foreground truncate pr-2">
                    {count > 1 && <span className="text-primary font-semibold mr-1">{count}×</span>}
                    {b.paragraf && `${b.paragraf} — `}{b.beskrivelse}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.faengselMaaneder > 0 && <span className="text-destructive">{b.faengselMaaneder * count}md</span>}
                    <span className="font-mono text-warning">{(b.beloeb * count).toLocaleString("da-DK")} kr</span>
                    <button onClick={() => removeAllOfType(boedeId)}
                      className="text-muted-foreground hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-primary/5 border-t border-primary/15 text-[10px]">
            <span className="font-semibold">Total</span>
            <div className="flex items-center gap-3">
              <span className="font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</span>
              {totalFaengsel > 0 && <span className="font-bold text-destructive">{totalFaengsel} md.</span>}
            </div>
          </div>
        </div>
      )}

      <FartBeregner open={fartOpen} onOpenChange={setFartOpen}
        onTilfoejBoede={(beskrivelse, beloeb) => {
          const newSigtelser = [...sigtelser, { boedeId: `fart-${Date.now()}`, paragraf: "Fartoverskridelse", beskrivelse, beloeb, faengselMaaneder: 0 }];
          onUpdate({
            sigtelser: newSigtelser,
            totalBoede: newSigtelser.reduce((s, x) => s + x.beloeb, 0),
            totalFaengsel: newSigtelser.reduce((s, x) => s + x.faengselMaaneder, 0),
          });
        }} />
    </div>
  );
};

export default MistaenktSigtelser;
