import { useState, useEffect } from "react";
import { Plus, Minus, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { boederApi } from "@/lib/api";
import type { Boede, BoedKategori } from "@/types/police";

const Bodetakster = () => {
  const [boeder, setBoeder] = useState<Boede[]>([]);
  const [loading, setLoading] = useState(true);
  const [openKat, setOpenKat] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await boederApi.getAll();
        setBoeder(data);
      } catch (err) {
        console.error("Fejl ved indlæsning af bøder:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Group by kategori
  const kategorier: BoedKategori[] = [];
  const seen = new Set<string>();
  for (const b of boeder) {
    if (!seen.has(b.kategori)) {
      seen.add(b.kategori);
      kategorier.push({ navn: b.kategori, boeder: boeder.filter(x => x.kategori === b.kategori) });
    }
  }

  const toggle = (navn: string) => {
    setOpenKat(openKat === navn ? null : navn);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser bødetakster...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-end">
        <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <FileText className="w-4 h-4" /> Håndtere Bødeemner
        </Button>
        <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <Plus className="w-4 h-4" /> Opret en ny Bøde
        </Button>
      </div>

      {kategorier.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          Ingen bødetakster registreret endnu
        </div>
      ) : (
        <div className="space-y-2">
          {kategorier.map((kat) => (
            <div key={kat.navn} className="rounded-lg overflow-hidden border border-border">
              <button
                onClick={() => toggle(kat.navn)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-secondary/80 hover:bg-secondary transition-colors text-left"
              >
                <span className="text-base font-medium text-foreground">{kat.navn}</span>
                {openKat === kat.navn ? (
                  <Minus className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Plus className="w-5 h-5 text-muted-foreground" />
                )}
              </button>
              {openKat === kat.navn && (
                <div className="divide-y divide-border/50">
                  {kat.boeder.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-3 bg-muted/30">
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.paragraf} — {b.beskrivelse}</p>
                      </div>
                      <span className="text-sm font-mono font-semibold text-warning">{b.beloeb.toLocaleString("da-DK")} kr</span>
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
