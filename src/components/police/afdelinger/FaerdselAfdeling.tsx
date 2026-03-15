import { useState } from "react";
import { Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import FartBeregner from "../FartBeregner";
import AfdelingLayout from "./AfdelingLayout";
import type { Betjent } from "@/types/police";

interface FaerdselAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const FartberegnerContent = () => {
  const [fartOpen, setFartOpen] = useState(false);
  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => setFartOpen(true)} className="h-8 gap-1.5 text-xs">
        <Gauge className="w-3.5 h-3.5" /> Åbn fartberegner
      </Button>
      <div className="rounded-md border border-border bg-card/50 p-6 text-center">
        <Gauge className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Brug fartberegneren til at beregne bøder baseret på vejtype, grænse og hastighed.</p>
      </div>
      <FartBeregner open={fartOpen} onOpenChange={setFartOpen} />
    </div>
  );
};

const FaerdselAfdeling = ({ currentUser, isAdmin }: FaerdselAfdelingProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="faerdsel"
      titel="Færdsel"
      beskrivelse="Opslagstavle, fartbøder, færdselsuheld & klip-oversigt"
      defaultTabs={[
        { id: "tavle", label: "Opslagstavle", removable: false },
        { id: "fart", label: "Fartberegner", removable: false },
        { id: "uheld", label: "Færdselsuheld", removable: false },
        { id: "klip", label: "Klip-oversigt", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
      customTabContent={{
        fart: <FartberegnerContent />,
      }}
    />
  );
};

export default FaerdselAfdeling;
