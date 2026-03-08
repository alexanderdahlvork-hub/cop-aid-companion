import { useState } from "react";
import Sidebar from "@/components/police/Sidebar";
import KRRegister from "@/components/police/KRRegister";
import FleetManagement from "@/components/police/FleetManagement";
import AnsatteListe from "@/components/police/AnsatteListe";
import Bodetakster from "@/components/police/Bodetakster";
import LoginPage from "@/components/police/LoginPage";
import ChangePasswordDialog from "@/components/police/ChangePasswordDialog";
import Dashboard from "@/components/police/Dashboard";
import { FileText, MapPin, Radio, Settings, AlertTriangle, Building, BookOpen } from "lucide-react";
import { ansatteListe } from "@/data/ansatte";
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

  const handleChangePassword = (newPassword: string) => {
    if (!currentUser) return;
    const idx = ansatteListe.findIndex(a => a.id === currentUser.id);
    if (idx !== -1) {
      ansatteListe[idx].kodeord = newPassword;
      ansatteListe[idx].foersteLogin = false;
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
      case "efterlysninger": return placeholderTab(AlertTriangle, "Efterlysninger", "Kommer snart");
      case "radio": return placeholderTab(Radio, "Kommunikation", "Kommer snart");
      case "kort": return placeholderTab(MapPin, "Kort & GPS", "Kommer snart");
      case "kontor": return placeholderTab(Building, "Kontor", "Kommer snart");
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
