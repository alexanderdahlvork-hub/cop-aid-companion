import AfdelingLayout from "./AfdelingLayout";
import type { Betjent } from "@/types/police";

interface RemeoAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const RemeoAfdeling = ({ currentUser, isAdmin }: RemeoAfdelingProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="remeo"
      titel="Remeo — Redning & Medicinsk"
      beskrivelse="Informationstavle, udrykninger, køretøjer & vagtplanlægning"
      defaultTabs={[
        { id: "tavle", label: "Informationstavle", removable: false },
        { id: "udrykninger", label: "Udrykninger", removable: false },
        { id: "koeretoejer", label: "Køretøjer", removable: false },
        { id: "vagtplan", label: "Vagtplan", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
    />
  );
};

export default RemeoAfdeling;
