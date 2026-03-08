import { useState } from "react";
import { Gauge, Car, AlertTriangle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Vejtype = "by" | "landevej" | "motorvej";

interface FartResultat {
  overskridelse: number;
  procentOver: number;
  boede: number;
  klip: number;
  frakendelse: "" | "Betinget" | "Ubetinget";
  frakendelseTid: string;
  faengsel: boolean;
}

// Based on https://www.sikkertrafik.dk/rad-og-viden/bil/fart/beregn-din-fartbode/
function beregnFartboede(
  fart: number,
  graense: number,
  vejtype: Vejtype,
  vejarbejde: boolean
): FartResultat | null {
  const effektivGraense = vejarbejde ? graense : graense;
  const overskridelse = fart - effektivGraense;
  if (overskridelse <= 0) return null;

  const procentOver = Math.round((overskridelse / effektivGraense) * 100);

  let boede = 0;
  let klip = 0;
  let frakendelse: "" | "Betinget" | "Ubetinget" = "";
  let frakendelseTid = "";
  let faengsel = false;

  // Bødeberegning baseret på danske regler
  if (overskridelse <= 20) {
    // Op til 20 km/t over: fast bøde
    if (overskridelse <= 10) boede = 1000;
    else if (overskridelse <= 15) boede = 1500;
    else boede = 2000;
  } else if (overskridelse <= 30) {
    // 21-30 km/t over
    boede = 2500;
    klip = 1;
  } else if (overskridelse <= 40) {
    // 31-40 km/t over
    boede = 3500;
    klip = 1;
  } else if (overskridelse <= 50) {
    // 41-50 km/t over
    boede = 5000;
    klip = 1;
  } else if (overskridelse <= 60) {
    // 51-60 km/t over
    boede = 6000;
    klip = 1;
  } else {
    // Over 60 km/t
    boede = 7000 + (overskridelse - 60) * 200;
    klip = 1;
  }

  // Procentoverskridelse: skærpet straf
  if (procentOver >= 100) {
    // Over 100% = ubetinget frakendelse + fængsel
    frakendelse = "Ubetinget";
    frakendelseTid = "Min. 3 år + fængselsstraf";
    faengsel = true;
    boede = Math.max(boede, 10000);
    klip = 3;
  } else if (procentOver >= 60) {
    // 60-99% over = ubetinget frakendelse
    frakendelse = "Ubetinget";
    frakendelseTid = "Min. 6 måneder";
    klip = Math.max(klip, 2);
  } else if (procentOver >= 40 || overskridelse > 40) {
    // 40-59% over eller >40 km/t = betinget frakendelse
    if (procentOver >= 40) {
      frakendelse = "Betinget";
      frakendelseTid = "Betinget frakendelse i 3 år";
      klip = Math.max(klip, 1);
    }
  }

  // Vejarbejde: dobbelt bøde
  if (vejarbejde) {
    boede = boede * 2;
  }

  return {
    overskridelse,
    procentOver,
    boede,
    klip,
    frakendelse,
    frakendelseTid,
    faengsel,
  };
}

interface FartBeregnerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTilfoejBoede?: (beskrivelse: string, beloeb: number, klip: number, frakendelse: string) => void;
}

const FartBeregner = ({ open, onOpenChange, onTilfoejBoede }: FartBeregnerProps) => {
  const [vejtype, setVejtype] = useState<Vejtype>("by");
  const [vejarbejde, setVejarbejde] = useState(false);
  const [graense, setGraense] = useState(50);
  const [fart, setFart] = useState("");
  const [resultat, setResultat] = useState<FartResultat | null>(null);
  const [beregnet, setBeregnet] = useState(false);

  const vejtypeConfig: Record<Vejtype, { label: string; graenser: number[] }> = {
    by: { label: "Byzone", graenser: [30, 40, 50, 60, 70] },
    landevej: { label: "Landevej / Motortrafikvej", graenser: [60, 70, 80, 90] },
    motorvej: { label: "Motorvej", graenser: [80, 90, 100, 110, 120, 130] },
  };

  const handleVejtype = (v: Vejtype) => {
    setVejtype(v);
    setGraense(vejtypeConfig[v].graenser[Math.floor(vejtypeConfig[v].graenser.length / 2)]);
    setResultat(null);
    setBeregnet(false);
  };

  const beregn = () => {
    const f = parseInt(fart);
    if (isNaN(f) || f <= 0) return;
    const res = beregnFartboede(f, graense, vejtype, vejarbejde);
    setResultat(res);
    setBeregnet(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <div className="px-5 pt-5 pb-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Gauge className="w-4 h-4 text-primary" />
              Fartbøde-beregner
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Vejtype */}
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Vejtype</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["by", "landevej", "motorvej"] as Vejtype[]).map((v) => (
                <button
                  key={v}
                  onClick={() => handleVejtype(v)}
                  className={cn(
                    "py-2 rounded-md text-xs font-medium transition-colors border",
                    vejtype === v
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                  )}
                >
                  {vejtypeConfig[v].label}
                </button>
              ))}
            </div>
          </div>

          {/* Vejarbejde */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVejarbejde(!vejarbejde)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                vejarbejde
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
              )}
            >
              <AlertTriangle className="w-3 h-3" />
              Vejarbejde {vejarbejde ? "(aktiv)" : ""}
            </button>
          </div>

          {/* Hastighedsgrænse */}
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Hastighedsgrænse</Label>
            <div className="flex gap-1.5 flex-wrap">
              {vejtypeConfig[vejtype].graenser.map((g) => (
                <button
                  key={g}
                  onClick={() => { setGraense(g); setResultat(null); setBeregnet(false); }}
                  className={cn(
                    "w-11 h-11 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                    graense === g
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Fart */}
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Målt hastighed (km/t)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={`Over ${graense} km/t...`}
                value={fart}
                onChange={(e) => { setFart(e.target.value); setBeregnet(false); }}
                className="bg-muted/30 border-border text-sm h-9"
                onKeyDown={(e) => e.key === "Enter" && beregn()}
              />
              <Button onClick={beregn} size="sm" className="h-9 px-4">
                Beregn
              </Button>
            </div>
          </div>

          {/* Resultat */}
          {beregnet && !resultat && (
            <div className="p-3 rounded-md bg-success/10 border border-success/20 text-center">
              <p className="text-sm text-success font-medium">Ingen overskridelse</p>
              <p className="text-xs text-muted-foreground">Hastigheden er inden for grænsen.</p>
            </div>
          )}

          {resultat && (
            <div className="space-y-3">
              <div className="p-4 rounded-md bg-card border border-border">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Overskridelse</p>
                    <p className="text-lg font-bold text-destructive">+{resultat.overskridelse} km/t</p>
                    <p className="text-[10px] text-muted-foreground">{resultat.procentOver}% over</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Bøde</p>
                    <p className="text-lg font-bold font-mono text-warning">{resultat.boede.toLocaleString("da-DK")} kr</p>
                    {vejarbejde && <p className="text-[10px] text-destructive">Dobbelt (vejarbejde)</p>}
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-3">
                  {resultat.klip > 0 && (
                    <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px]">
                      {resultat.klip} klip
                    </Badge>
                  )}
                  {resultat.frakendelse && (
                    <Badge className={cn(
                      "text-[10px]",
                      resultat.frakendelse === "Ubetinget"
                        ? "bg-destructive/15 text-destructive border-destructive/20"
                        : "bg-warning/15 text-warning border-warning/20"
                    )}>
                      {resultat.frakendelse} frakendelse
                    </Badge>
                  )}
                  {resultat.faengsel && (
                    <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-[10px]">
                      Fængselsstraf
                    </Badge>
                  )}
                </div>

                {resultat.frakendelseTid && (
                  <div className="mt-3 p-2 rounded bg-destructive/8 border border-destructive/15">
                    <div className="flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-destructive shrink-0" />
                      <p className="text-[11px] text-destructive font-medium">{resultat.frakendelseTid}</p>
                    </div>
                  </div>
                )}
              </div>

              {onTilfoejBoede && (
                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  onClick={() => {
                    onTilfoejBoede(
                      `Fartoverskridelse: ${parseInt(fart)} km/t i ${graense}-zone (${vejtypeConfig[vejtype].label})${vejarbejde ? " [vejarbejde]" : ""}`,
                      resultat.boede,
                      resultat.klip,
                      resultat.frakendelse
                    );
                    onOpenChange(false);
                  }}
                >
                  <ChevronRight className="w-3 h-3 mr-1" />
                  Tilføj til sigtelse
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FartBeregner;
