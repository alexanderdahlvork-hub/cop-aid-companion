import { useState } from "react";
import Sidebar from "@/components/police/Sidebar";
import TopHeader from "@/components/police/TopHeader";
import TabNavigation from "@/components/police/TabNavigation";
import KRRegister from "@/components/police/KRRegister";
import FleetManagement from "@/components/police/FleetManagement";
import Ejendomsregister from "@/components/police/Ejendomsregister";
import AnsatteListe from "@/components/police/AnsatteListe";
import Bodetakster from "@/components/police/Bodetakster";
import LoginPage from "@/components/police/LoginPage";
import ChangePasswordDialog from "@/components/police/ChangePasswordDialog";
import Dashboard from "@/components/police/Dashboard";
import MinProfil from "@/components/police/MinProfil";
import Efterlysninger from "@/components/police/Efterlysninger";
import NSKAfdeling from "@/components/police/afdelinger/NSKAfdeling";
import LimaAfdeling from "@/components/police/afdelinger/LimaAfdeling";
import FaerdselAfdeling from "@/components/police/afdelinger/FaerdselAfdeling";
import EfterforskningSide from "@/components/police/afdelinger/EfterforskningSide";
import SIGAfdeling from "@/components/police/afdelinger/SIGAfdeling";
import RemeoAfdeling from "@/components/police/afdelinger/RemeoAfdeling";
import KortOgGPS from "@/components/police/KortOgGPS";
import Ansoegninger from "@/components/police/Ansoegninger";
import Koeretoejsregister from "@/components/police/Koeretoejsregister";
import OpretSag from "@/components/police/OpretSag";
import { FileText, MapPin, Radio, Settings, Building, BookOpen } from "lucide-react";
import { betjenteApi } from "@/lib/api";
import type { Betjent, Sigtelse } from "@/types/police";

const placeholderTab = (icon: typeof FileText, title: string, desc: string) => (
  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3 min-h-[400px]">
    {(() => { const Icon = icon; return <Icon className="w-10 h-10 opacity-30" />; })()}
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <p className="text-sm">{desc}</p>
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("forside");
  const [currentUser, setCurrentUser] = useState<Betjent | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [krInitialPersonId, setKrInitialPersonId] = useState<string | null>(null);
  const [sagInitialPersonId, setSagInitialPersonId] = useState<string | null>(null);
  const [sagInitialSigtelser, setSagInitialSigtelser] = useState<Sigtelse[]>([]);

  const handleLogin = (betjent: Betjent, admin: boolean) => {
    setCurrentUser(betjent);
    setIsAdmin(admin);
    if (betjent.foersteLogin) {
      setShowChangePassword(true);
    }
  };

  const handleChangePassword = async (newPassword: string) => {
    if (!currentUser) return;
    try {
      await betjenteApi.update(currentUser.id, { kodeord: newPassword, foersteLogin: false });
    } catch (err) {
      console.error("Fejl ved ændring af kodeord:", err);
    }
    setCurrentUser({ ...currentUser, kodeord: newPassword, foersteLogin: false });
    setShowChangePassword(false);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "forside": return <Dashboard currentUser={currentUser} />;
      case "guides": return placeholderTab(BookOpen, "Guides & FAQ", "Hjælp og vejledninger");
      case "ansatte": return <AnsatteListe currentUser={currentUser} isAdmin={isAdmin} />;
      case "boeder": return <Bodetakster />;
      case "sagsarkiv": return placeholderTab(FileText, "Sagsarkiv", "Her vil gamle og afsluttede sager blive vist");
      case "opret_sag": return <OpretSag currentUser={currentUser} />;
      case "kr": return <KRRegister initialPersonId={krInitialPersonId} />;
      case "koeretoej": return <Koeretoejsregister />;
      case "flaade": return <FleetManagement currentUser={currentUser} isAdmin={isAdmin} />;
      case "ejendomme": return <Ejendomsregister />;
      case "efterlysninger": return <Efterlysninger onSigtPerson={(personId) => { setKrInitialPersonId(personId); setActiveTab("kr"); }} />;
      case "nsk": return <NSKAfdeling />;
      case "lima": return <LimaAfdeling />;
      case "faerdsel": return <FaerdselAfdeling />;
      case "efterforskning": return <EfterforskningSide />;
      case "sig": return <SIGAfdeling />;
      case "remeo": return <RemeoAfdeling />;
      case "patruljer": return placeholderTab(Radio, "Patruljeenheder", "Kommer snart");
      case "kort": return <KortOgGPS />;
      case "kontor": return placeholderTab(Building, "Kontor", "Kommer snart");
      case "ansoegninger": return <Ansoegninger currentUser={currentUser} isAdmin={isAdmin} onBetjentUpdated={(b) => { if (b.id === currentUser.id) setCurrentUser(b); }} />;
      case "profil": return (
        <MinProfil
          currentUser={currentUser}
          isAdmin={isAdmin}
          onUserUpdate={(updated) => setCurrentUser(updated)}
        />
      );
      default: return placeholderTab(Settings, "Side", "Kommer snart");
    }
  };

  return (
    <div className="h-screen w-screen bg-[hsl(220,16%,7%)] p-4">
      <div className="relative w-full h-full rounded-2xl bg-background overflow-hidden border-2 border-[hsl(220,12%,22%)] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="flex h-full overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={() => { setCurrentUser(null); setIsAdmin(false); }}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TopHeader currentUser={currentUser} isAdmin={isAdmin} />
            {activeTab === "forside" && <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
            <main className="flex-1 p-5 overflow-y-auto">
              {renderContent()}
            </main>
          </div>
        </div>

        <ChangePasswordDialog
          open={showChangePassword}
          onChangePassword={handleChangePassword}
        />
      </div>
    </div>
  );
};

export default Index;
