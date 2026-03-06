import { useState } from "react";
import { Plus, Minus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BoedKategori } from "@/types/police";

const demoKategorier: BoedKategori[] = [
  {
    navn: "Færdselsloven",
    boeder: [
      { id: "1", paragraf: "§ 4, stk. 1", beskrivelse: "Kørsel over for rødt lys", beloeb: 2000, kategori: "Færdselsloven" },
      { id: "2", paragraf: "§ 41, stk. 1", beskrivelse: "Hastighedsoverskridelse (under 30%)", beloeb: 1500, kategori: "Færdselsloven" },
      { id: "3", paragraf: "§ 41, stk. 2", beskrivelse: "Hastighedsoverskridelse (over 30%)", beloeb: 3000, kategori: "Færdselsloven" },
      { id: "4", paragraf: "§ 53", beskrivelse: "Spirituskørsel", beloeb: 5000, kategori: "Færdselsloven" },
    ],
  },
  {
    navn: "Straffeloven",
    boeder: [
      { id: "5", paragraf: "§ 119", beskrivelse: "Vold mod tjenestemand", beloeb: 10000, kategori: "Straffeloven" },
      { id: "6", paragraf: "§ 244", beskrivelse: "Simpel vold", beloeb: 5000, kategori: "Straffeloven" },
      { id: "7", paragraf: "§ 276", beskrivelse: "Tyveri", beloeb: 3000, kategori: "Straffeloven" },
    ],
  },
  {
    navn: "Bek. euf. stoffer",
    boeder: [
      { id: "8", paragraf: "§ 1", beskrivelse: "Besiddelse af euforiserende stoffer", beloeb: 2500, kategori: "Bek. euf. stoffer" },
    ],
  },
  {
    navn: "Våbenloven",
    boeder: [
      { id: "9", paragraf: "§ 1", beskrivelse: "Ulovlig besiddelse af skydevåben", beloeb: 10000, kategori: "Våbenloven" },
    ],
  },
  {
    navn: "Kniv & Blankvåben",
    boeder: [
      { id: "10", paragraf: "§ 1", beskrivelse: "Besiddelse af kniv på offentligt sted", beloeb: 3000, kategori: "Kniv & Blankvåben" },
    ],
  },
  {
    navn: "Bek. våben & ammunition",
    boeder: [
      { id: "11", paragraf: "§ 1", beskrivelse: "Ulovlig besiddelse af ammunition", beloeb: 5000, kategori: "Bek. våben & ammunition" },
    ],
  },
  {
    navn: "Ordensbekendtgørelsen",
    boeder: [
      { id: "12", paragraf: "§ 3", beskrivelse: "Forstyrrelse af den offentlige orden", beloeb: 1000, kategori: "Ordensbekendtgørelsen" },
    ],
  },
  {
    navn: "Retsplejeloven",
    boeder: [
      { id: "13", paragraf: "§ 750", beskrivelse: "Nægtelse af at opgive navn", beloeb: 1500, kategori: "Retsplejeloven" },
    ],
  },
  {
    navn: "Markedsføringsloven",
    boeder: [
      { id: "14", paragraf: "§ 6", beskrivelse: "Vildledende markedsføring", beloeb: 5000, kategori: "Markedsføringsloven" },
    ],
  },
];

const Bodetakster = () => {
  const [openKat, setOpenKat] = useState<string | null>(null);

  const toggle = (navn: string) => {
    setOpenKat(openKat === navn ? null : navn);
  };

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

      <div className="space-y-2">
        {demoKategorier.map((kat) => (
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
    </div>
  );
};

export default Bodetakster;
