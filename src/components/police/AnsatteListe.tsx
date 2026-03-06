import { useState } from "react";
import { Plus, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Betjent } from "@/types/police";

const demoAnsatte: Betjent[] = [
  { id: "1", badgeNr: "01", fornavn: "Karlo", efternavn: "Leibrandt", rang: "Rigspolitichef", uddannelser: ["Betjent", "Civil", "Romeo", "Helikopter", "LIMA", "LIMA-A"] },
  { id: "2", badgeNr: "D1089", fornavn: "Balder", efternavn: "Sørensen", rang: "Politidirektør", uddannelser: ["Betjent", "Civil", "Romeo"] },
  { id: "3", badgeNr: "Z0999", fornavn: "Klaes", efternavn: "Franc", rang: "Politidirektør", uddannelser: ["Betjent", "Civil"] },
  { id: "4", badgeNr: "X3009", fornavn: "Birk", efternavn: "Gregersen", rang: "Politimester", uddannelser: ["Betjent", "Civil", "LIMA"] },
  { id: "5", badgeNr: "Q3037", fornavn: "Jesper", efternavn: "Brøndum", rang: "Chefpolitiinspektør", uddannelser: ["Betjent", "Civil", "Romeo", "Helikopter"] },
  { id: "6", badgeNr: "X2110", fornavn: "Kalle", efternavn: "Krudt", rang: "Politiinspektør", uddannelser: ["Betjent", "Civil"] },
  { id: "7", badgeNr: "B1412", fornavn: "Claus", efternavn: "Christensen", rang: "Vicepolitiinspektør", uddannelser: ["Betjent", "Civil", "Romeo", "Helikopter", "LIMA", "LIMA-A"] },
];

const rangOrder = [
  "Rigspolitichef",
  "Politidirektør",
  "Politimester",
  "Chefpolitiinspektør",
  "Politiinspektør",
  "Vicepolitiinspektør",
  "Politikommissær",
  "Politiassistent",
  "Politibetjent",
];

const AnsatteListe = () => {
  const [ansatte] = useState<Betjent[]>(demoAnsatte);
  const [valgt, setValgt] = useState<Betjent | null>(null);

  // Group by rang
  const grouped = rangOrder
    .map((rang) => ({
      rang,
      members: ansatte.filter((a) => a.rang === rang),
    }))
    .filter((g) => g.members.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-end">
        <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <UserPlus className="w-4 h-4" /> Opret en ny betjent
        </Button>
        <Button size="sm" className="gap-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          Håndtere afdelinger
        </Button>
      </div>

      <div className="space-y-2">
        {grouped.map((group) => (
          <div key={group.rang} className="rounded-lg overflow-hidden border border-border">
            <div className="bg-secondary/80 px-4 py-3">
              <h3 className="text-base font-semibold text-foreground">{group.rang}</h3>
            </div>
            {group.members.map((betjent) => (
              <button
                key={betjent.id}
                onClick={() => setValgt(betjent)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors text-left border-t border-border/50"
              >
                <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">
                  {betjent.badgeNr} - {betjent.fornavn} {betjent.efternavn}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!valgt} onOpenChange={(open) => !open && setValgt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {valgt?.fornavn} {valgt?.efternavn} - {valgt?.rang}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-lg font-semibold text-foreground">Badge nummer: {valgt?.badgeNr}</p>
            </div>
            <div>
              <h4 className="text-base font-semibold text-foreground mb-2">Uddannelser</h4>
              <ul className="space-y-1">
                {valgt?.uddannelser.map((udd) => (
                  <li key={udd} className="text-sm text-muted-foreground">- {udd}</li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                Tjek aktivitet
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setValgt(null)}>
                Luk menuen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnsatteListe;
