import AfdelingLayout from "./AfdelingLayout";
import type { Betjent } from "@/types/police";

interface LimaAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const LimaAfdeling = ({ currentUser, isAdmin }: LimaAfdelingProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="lima"
      titel="Lima — Aktionsstyrken"
      beskrivelse="Opslagstavle, taktiske planer, indsatser & træning"
      defaultTabs={[
        { id: "tavle", label: "Opslagstavle", removable: false },
        { id: "planer", label: "Taktiske planer", removable: false },
        { id: "udstyr", label: "Udstyr", removable: false },
        { id: "traening", label: "Træning", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
    />
  );
};

export default LimaAfdeling;
