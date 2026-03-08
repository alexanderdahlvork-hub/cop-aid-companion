import { useState } from "react";
import Sidebar from "@/components/police/Sidebar";
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
import { FileText, MapPin, Radio, Settings, AlertTriangle, Building, BookOpen } from "lucide-react";
import { betjenteApi } from "@/lib/api";
import type { Betjent } from "@/types/police";

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
      case "kr": return <KRRegister />;
      case "fleet": return <FleetManagement />;
      case "ejendomme": return <Ejendomsregister />;
      case "efterlysninger": return <Efterlysninger />;
      case "radio": return placeholderTab(Radio, "Kommunikation", "Kommer snart");
      case "kort": return placeholderTab(MapPin, "Kort & GPS", "Kommer snart");
      case "kontor": return placeholderTab(Building, "Kontor", "Kommer snart");
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
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => { setCurrentUser(null); setIsAdmin(false); }}
        currentUser={currentUser}
        isAdmin={isAdmin}
      />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto relative">
        {renderContent()}
      </main>

      <ChangePasswordDialog
        open={showChangePassword}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default Index;
