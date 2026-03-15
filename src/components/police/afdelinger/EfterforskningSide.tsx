import AfdelingLayout from "./AfdelingLayout";
import type { Betjent } from "@/types/police";

interface EfterforskningSideProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const EfterforskningSide = ({ currentUser, isAdmin }: EfterforskningSideProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="efterforskning"
      titel="Efterforskning"
      beskrivelse="Opslagstavle, sagsstyring, bevismateriale & afhøringer"
      defaultTabs={[
        { id: "tavle", label: "Opslagstavle", removable: false },
        { id: "sager", label: "Sager", removable: false },
        { id: "bevis", label: "Bevismateriale", removable: false },
        { id: "afhoering", label: "Afhøringer", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
    />
  );
};

export default EfterforskningSide;
