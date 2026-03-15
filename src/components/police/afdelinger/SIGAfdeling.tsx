import AfdelingLayout from "./AfdelingLayout";
import type { Betjent } from "@/types/police";

interface SIGAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const SIGAfdeling = ({ currentUser, isAdmin }: SIGAfdelingProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="sig"
      titel="SIG — Særlig Indsatsgruppe"
      beskrivelse="Opslagstavle, operationer, overvågning & taktiske rapporter"
      defaultTabs={[
        { id: "tavle", label: "Opslagstavle", removable: false },
        { id: "operationer", label: "Operationer", removable: false },
        { id: "overvaagning", label: "Overvågning", removable: false },
        { id: "rapporter", label: "Rapporter", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
    />
  );
};

export default SIGAfdeling;
