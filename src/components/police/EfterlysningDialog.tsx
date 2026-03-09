import { useState } from "react";
import {
  AlertTriangle, Search, Check, ChevronDown, Loader2, Gavel, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { standardBoeder } from "@/data/bodetakster";
import type { Person, Boede, SigtelseBoede } from "@/types/police";
import { cn } from "@/lib/utils";

interface EfterlysningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: Person;
  onEfterlysningOprettet: (data: {
    begrundelse: string;
    sigtelseBoeder: SigtelseBoede[];
    totalBoede: number;
    totalFaengsel: number;
  }) => void;
}

const EfterlysningDialog = ({ open, onOpenChange, person, onEfterlysningOprettet }: EfterlysningDialogProps) => {
  const [begrundelse, setBegrundelse] = useState("");
  const [valgteBoeder, setValgteBoeder] = useState<SigtelseBoede[]>([]);
  const [straffeOpen, setStraffeOpen] = useState(false);
  const [openKat, setOpenKat] = useState<string | null>(null);
  const [soegning, setSoegning] = useState("");
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const boeder = standardBoeder;

  const totalBoede = valgteBoeder.reduce((s, b) => s + b.beloeb, 0);
  const totalFaengsel = valgteBoeder.reduce((s, b) => s + b.faengselMaaneder, 0);

  const filtreretBoeder = soegning
    ? boeder.filter((b) => `${b.paragraf} ${b.beskrivelse}`.toLowerCase().includes(soegning.toLowerCase()))
    : boeder;
  const kategorier = Array.from(new Set(filtreretBoeder.map((b) => b.kategori)));

  const toggleBoede = (b: Boede) => {
    const exists = valgteBoeder.find((v) => v.boedeId === b.id);
    if (exists) {
      setValgteBoeder(valgteBoeder.filter((v) => v.boedeId !== b.id));
    } else {
      setValgteBoeder([...valgteBoeder, {
        boedeId: b.id, paragraf: b.paragraf, beskrivelse: b.beskrivelse,
        beloeb: b.beloeb, faengselMaaneder: b.faengselMaaneder || 0,
      }]);
    }
  };

  const handleSubmit = () => {
    setSaving(true);
    onEfterlysningOprettet({
      begrundelse,
      sigtelseBoeder: valgteBoeder,
      totalBoede,
      totalFaengsel,
    });
    setSaving(false);
    onOpenChange(false);
    // Reset
    setBegrundelse("");
    setValgteBoeder([]);
    setStraffeOpen(false);
    setSoegning("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[620px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-center text-base font-semibold flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Opret Efterlysning
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Person info */}
            <div className="rounded-lg bg-warning/5 border border-warning/20 p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/20 border border-warning/30 flex items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-warning">{person.fornavn[0]}{person.efternavn[0]}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{person.fornavn} {person.efternavn}</p>
                  <p className="text-xs text-muted-foreground font-mono">{person.cpr}</p>
                  <p className="text-xs text-muted-foreground">{person.adresse}, {person.postnr} {person.by}</p>
                </div>
              </div>
            </div>

            {/* Begrundelse */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <h4 className="text-xs font-semibold text-foreground">Begrundelse for efterlysning</h4>
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              </div>
              <Textarea
                placeholder="Beskriv hvorfor personen efterlyses, fx sidst set, omstændigheder, fare for omgivelser..."
                value={begrundelse}
                onChange={(e) => setBegrundelse(e.target.value)}
                className="bg-muted/30 border-border text-sm min-h-[80px]"
              />
            </div>

            {/* Straffe / hvad personen skal straffes for */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <h4 className="text-xs font-semibold text-foreground">Eftersøgt for (straffe)</h4>
                <Gavel className="w-4 h-4 text-muted-foreground" />
              </div>
              <Collapsible open={straffeOpen} onOpenChange={setStraffeOpen}>
                <CollapsibleTrigger asChild>
                  <Button className="w-full h-10 text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="w-3.5 h-3.5" /> Vælg Straffe
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    <Input placeholder="Søg paragraf eller beskrivelse..." value={soegning}
                      onChange={(e) => setSoegning(e.target.value)} className="bg-muted/30 border-border text-xs h-8" />
                    <div className="space-y-1 max-h-[250px] overflow-y-auto">
                      {kategorier.map((kat) => {
                        const katBoeder = filtreretBoeder.filter((b) => b.kategori === kat);
                        const isOpen = openKat === kat;
                        const selCount = katBoeder.filter(b => valgteBoeder.some(v => v.boedeId === b.id)).length;
                        return (
                          <Collapsible key={kat} open={isOpen} onOpenChange={() => setOpenKat(isOpen ? null : kat)}>
                            <CollapsibleTrigger className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-muted/40 hover:bg-muted/60 transition-colors">
                              <span className="text-[11px] font-medium text-foreground">{kat}</span>
                              <div className="flex items-center gap-2">
                                {selCount > 0 && <Badge className="text-[8px] h-4 bg-primary/20 text-primary">{selCount}</Badge>}
                                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="space-y-0.5 mt-1 ml-2">
                                {katBoeder.map((b) => {
                                  const sel = valgteBoeder.some((v) => v.boedeId === b.id);
                                  return (
                                    <button key={b.id} onClick={() => toggleBoede(b)}
                                      className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-all text-xs",
                                        sel ? "bg-primary/8 border border-primary/20" : "hover:bg-muted/30 border border-transparent"
                                      )}>
                                      <div className={cn("w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0",
                                        sel ? "bg-primary border-primary" : "border-muted-foreground/25"
                                      )}>{sel && <Check className="w-2 h-2 text-primary-foreground" />}</div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-[10px] text-muted-foreground">{b.paragraf}</span>
                                          <span className="truncate">{b.beskrivelse}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                        {b.beloeb > 0 && <span className="text-warning font-mono">{b.beloeb.toLocaleString("da-DK")} kr</span>}
                                        {(b.faengselMaaneder || 0) > 0 && <span className="text-destructive font-mono">{b.faengselMaaneder} mdr</span>}
                                      </div>
                                    </button>
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
              {valgteBoeder.length > 0 && !straffeOpen && (
                <div className="space-y-1.5 mt-2">
                  {valgteBoeder.map((b) => (
                    <div key={b.boedeId} className="flex items-center justify-between px-3 py-1.5 rounded-md bg-muted/30 border border-border text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[10px] text-muted-foreground">{b.paragraf}</span>
                        <span className="truncate">{b.beskrivelse}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.beloeb > 0 && <span className="text-warning font-mono text-[10px]">{b.beloeb.toLocaleString("da-DK")} kr</span>}
                        {b.faengselMaaneder > 0 && <span className="text-destructive font-mono text-[10px]">{b.faengselMaaneder} mdr</span>}
                        <button onClick={() => setValgteBoeder(valgteBoeder.filter(v => v.boedeId !== b.boedeId))}
                          className="text-muted-foreground hover:text-destructive ml-1">×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            {valgteBoeder.length > 0 && (
              <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 space-y-1.5">
                <h4 className="text-xs font-semibold text-warning flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Oversigt
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} kr</p>
                    <p className="text-[10px] text-muted-foreground">Samlet bøde</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono text-foreground">{totalFaengsel} mdr</p>
                    <p className="text-[10px] text-muted-foreground">Fængsel</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono text-foreground">{valgteBoeder.length}</p>
                    <p className="text-[10px] text-muted-foreground">Forhold</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-border bg-muted/10 gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">Annuller</Button>
          <Button size="sm" onClick={handleSubmit}
            disabled={saving || (valgteBoeder.length === 0 && !begrundelse.trim())}
            className="h-8 text-xs bg-warning hover:bg-warning/90 text-warning-foreground gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            Opret efterlysning
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EfterlysningDialog;
