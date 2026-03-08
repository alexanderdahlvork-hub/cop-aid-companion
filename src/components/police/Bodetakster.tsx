import { useState } from "react";
import { Plus, Minus, Search, AlertTriangle, Car, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { standardBoeder } from "@/data/bodetakster";
import type { BoedKategori } from "@/types/police";

const Bodetakster = () => {
  const [openKat, setOpenKat] = useState<string | null>(null);
  const [soegning, setSoegning] = useState("");

  const boeder = standardBoeder;

  const filtreret = soegning
    ? boeder.filter((b) =>
        `${b.paragraf} ${b.beskrivelse}`.toLowerCase().includes(soegning.toLowerCase())
      )
    : boeder;

  // Group by kategori
  const kategorier: BoedKategori[] = [];
  const seen = new Set<string>();
  for (const b of filtreret) {
    if (!seen.has(b.kategori)) {
      seen.add(b.kategori);
      kategorier.push({ navn: b.kategori, boeder: filtreret.filter(x => x.kategori === b.kategori) });
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søg paragraf eller sigtelse..."
          value={soegning}
          onChange={(e) => setSoegning(e.target.value)}
          className="pl-9 bg-secondary border-border"
        />
      </div>

      {kategorier.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Ingen bødetakster fundet
        </div>
      ) : (
        <div className="space-y-2">
          {kategorier.map((kat) => (
            <div key={kat.navn} className="rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => setOpenKat(openKat === kat.navn ? null : kat.navn)}
                className="w-full flex items-center justify-between px-4 py-3 bg-secondary/80 hover:bg-secondary transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{kat.navn}</span>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">{kat.boeder.length}</Badge>
                </div>
                {openKat === kat.navn ? (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Plus className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {openKat === kat.navn && (
                <div className="divide-y divide-border/50">
                  {kat.boeder.map((b) => (
                    <div key={b.id} className="px-4 py-3 bg-muted/30 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {b.paragraf && <span className="text-muted-foreground">{b.paragraf} — </span>}
                            {b.beskrivelse}
                          </p>
                          {b.information && (
                            <p className="text-xs text-muted-foreground mt-0.5">{b.information}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {(b.klip ?? 0) > 0 && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {b.klip} klip
                            </Badge>
                          )}
                          {b.frakendelse && (
                            <Badge variant="outline" className={`text-[10px] gap-1 ${
                              b.frakendelse === "Ubetinget"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            }`}>
                              <Car className="w-2.5 h-2.5" />
                              {b.frakendelse}
                            </Badge>
                          )}
                          {(b.faengselMaaneder ?? 0) > 0 && (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {b.faengselMaaneder} md.
                            </Badge>
                          )}
                          <span className="text-sm font-mono font-semibold text-warning min-w-[80px] text-right">
                            {b.beloeb.toLocaleString("da-DK")} kr
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bodetakster;
