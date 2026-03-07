import { useState } from "react";
import Sidebar from "@/components/police/Sidebar";
import KRRegister from "@/components/police/KRRegister";
import FleetManagement from "@/components/police/FleetManagement";
import AnsatteListe from "@/components/police/AnsatteListe";
import Bodetakster from "@/components/police/Bodetakster";
import LoginPage from "@/components/police/LoginPage";
import ChangePasswordDialog from "@/components/police/ChangePasswordDialog";
import { FileText, MapPin, Radio, Settings } from "lucide-react";
import { ansatteListe } from "@/data/ansatte";
import type { Betjent } from "@/types/police";

const placeholderTab = (icon: typeof FileText, title: string, desc: string) => (
  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
    {(() => { const Icon = icon; return <Icon className="w-10 h-10 opacity-30" />; })()}
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <p className="text-sm">{desc}</p>
  </div>
);

const tabTitles: Record<string, { title: string; desc: string }> = {
  ansatte: { title: "Ansatte", desc: "Oversigt over alle betjente" },
  boeder: { title: "Bødetakster", desc: "Lovgivning og bødebeløb" },
  kr: { title: "KR — Kriminalregisteret", desc: "Søg og opret personer i registeret" },
  fleet: { title: "Flådestyring", desc: "Oversigt over patruljekøretøjer" },
  rapporter: { title: "Rapporter", desc: "" },
  kort: { title: "Kort & GPS", desc: "" },
  radio: { title: "Kommunikation", desc: "" },
  indstillinger: { title: "Indstillinger", desc: "" },
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("ansatte");
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
    // Update password in the data
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

  const tab = tabTitles[activeTab];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => { setCurrentUser(null); setIsAdmin(false); }}
        badgeNr={currentUser.badgeNr}
      />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{tab?.title}</h1>
            {tab?.desc && <p className="text-sm text-muted-foreground">{tab.desc}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{currentUser.fornavn} {currentUser.efternavn}</p>
            <p className="text-xs text-muted-foreground">{currentUser.rang}{isAdmin ? " — Admin" : ""}</p>
          </div>
        </div>
        {activeTab === "ansatte" && <AnsatteListe currentUser={currentUser} isAdmin={isAdmin} />}
        {activeTab === "boeder" && <Bodetakster />}
        {activeTab === "kr" && <KRRegister />}
        {activeTab === "fleet" && <FleetManagement />}
        {activeTab === "rapporter" && placeholderTab(FileText, "Rapporter", "Kommer snart")}
        {activeTab === "kort" && placeholderTab(MapPin, "Kort & GPS", "Kommer snart")}
        {activeTab === "radio" && placeholderTab(Radio, "Kommunikation", "Kommer snart")}
        {activeTab === "indstillinger" && placeholderTab(Settings, "Indstillinger", "Kommer snart")}
      </main>

      <ChangePasswordDialog
        open={showChangePassword}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default Index;
