import { useState, useCallback } from "react";
import Sidebar from "@/components/police/Sidebar";
import TopHeader from "@/components/police/TopHeader";
import OpenTabsBar from "@/components/police/OpenTabsBar";
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
import Opslagstavle from "@/components/police/Opslagstavle";
import NSKAfdeling from "@/components/police/afdelinger/NSKAfdeling";
import LimaAfdeling from "@/components/police/afdelinger/LimaAfdeling";
import FaerdselAfdeling from "@/components/police/afdelinger/FaerdselAfdeling";
import EfterforskningSide from "@/components/police/afdelinger/EfterforskningSide";
import SIGAfdeling from "@/components/police/afdelinger/SIGAfdeling";
import RemeoAfdeling from "@/components/police/afdelinger/RemeoAfdeling";
import KortOgGPS from "@/components/police/KortOgGPS";
import Ansoegninger from "@/components/police/Ansoegninger";
import Koeretoejsregister from "@/components/police/Koeretoejsregister";
import SagEditor from "@/components/police/SagEditor";
import SagsArkiv from "@/components/police/SagsArkiv";
import { FileText, Radio, Settings, Building, BookOpen } from "lucide-react";
import { betjenteApi } from "@/lib/api";
import type { Betjent, OpenTab } from "@/types/police";

const TAB_LABELS: Record<string, string> = {
  forside: "Forside",
  opslagstavle: "Opslagstavle",
  kort: "Aktiv Patrulje",
  kr: "Personregister",
  koeretoej: "Køretøjsregister",
  ejendomme: "Ejendomsregister",
  efterlysninger: "Efterlysninger",
  opret_sag: "Opret Sag",
  boeder: "Bødetakster",
  sagsarkiv: "Sagsarkiv",
  flaade: "Flådestyring",
  patruljer: "Patruljeenheder",
  ansatte: "Ansatte",
  ansoegninger: "Ansøgninger",
  profil: "Min Profil",
  nsk: "NSK",
  lima: "Lima",
  faerdsel: "Færdsel",
  efterforskning: "Efterforskning",
  sig: "SIG",
  remeo: "Remeo",
  kontor: "Kontor",
};

const placeholderTab = (icon: typeof FileText, title: string, desc: string) => (
  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 min-h-[300px]">
    {(() => { const Icon = icon; return <Icon className="w-8 h-8 opacity-20" />; })()}
    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    <p className="text-[12px]">{desc}</p>
  </div>
);

const Index = () => {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([
    { id: "forside", label: "Forside", type: "forside" },
  ]);
  const [activeTabId, setActiveTabId] = useState("forside");
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

  const openTab = useCallback((type: string, data?: any) => {
    // For sag tabs, always open a new one
    if (type === "sag") {
      const id = `sag-${data?.sagId || Date.now()}`;
      const existing = openTabs.find(t => t.id === id);
      if (existing) {
        setActiveTabId(id);
        return;
      }
      const newTab: OpenTab = {
        id,
        label: data?.label || "Ny Sag",
        type: "sag",
        data,
      };
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(id);
      return;
    }

    // For regular tabs, reuse existing or create new
    const existing = openTabs.find(t => t.type === type && !t.id.startsWith("sag-"));
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }
    const newTab: OpenTab = {
      id: type,
      label: TAB_LABELS[type] || type,
      type,
      data,
    };
    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(type);
  }, [openTabs]);

  const closeTab = useCallback((id: string) => {
    if (id === "forside") return; // Can't close home
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (activeTabId === id) {
        // Switch to previous tab or forside
        const idx = prev.findIndex(t => t.id === id);
        const newActive = filtered[Math.min(idx, filtered.length - 1)]?.id || "forside";
        setActiveTabId(newActive);
      }
      return filtered;
    });
  }, [activeTabId]);

  // Sidebar compatibility: when sidebar changes tab, use openTab
  const handleTabChange = useCallback((tab: string) => {
    if (tab === "opret_sag") {
      openTab("sag", { label: "Ny Sag" });
    } else {
      openTab(tab);
    }
  }, [openTab]);

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const activeTab = openTabs.find(t => t.id === activeTabId);
  const activeType = activeTab?.type || "forside";

  const renderContent = () => {
    switch (activeType) {
      case "forside": return <Dashboard currentUser={currentUser} onTabChange={handleTabChange} />;
      case "opslagstavle": return <Opslagstavle currentUser={currentUser} isAdmin={isAdmin} />;
      case "ansatte": return <AnsatteListe currentUser={currentUser} isAdmin={isAdmin} />;
      case "boeder": return <Bodetakster />;
      case "sagsarkiv": return (
        <SagsArkiv
          onOpenSag={(sagId, label) => openTab("sag", { sagId, label })}
          onNewSag={() => openTab("sag", { label: "Ny Sag" })}
        />
      );
      case "sag": return (
        <SagEditor
          key={activeTabId}
          sagId={activeTab?.data?.sagId}
          currentUser={currentUser}
          initialPersonId={activeTab?.data?.initialPersonId}
          onSagSaved={(sag) => {
            // Update tab label
            setOpenTabs(prev => prev.map(t =>
              t.id === activeTabId ? { ...t, label: sag.titel || sag.sagsnummer } : t
            ));
          }}
        />
      );
      case "kr": return <KRRegister />;
      case "koeretoej": return <Koeretoejsregister />;
      case "flaade": return <FleetManagement currentUser={currentUser} isAdmin={isAdmin} />;
      case "ejendomme": return <Ejendomsregister />;
      case "efterlysninger": return (
        <Efterlysninger
          onSigtPerson={(personId, _sigtelser) => {
            openTab("sag", { initialPersonId: personId, label: "Ny Sag" });
          }}
        />
      );
      case "nsk": return <NSKAfdeling currentUser={currentUser} isAdmin={isAdmin} />;
      case "lima": return <LimaAfdeling currentUser={currentUser} isAdmin={isAdmin} />;
      case "faerdsel": return <FaerdselAfdeling currentUser={currentUser} isAdmin={isAdmin} />;
      case "efterforskning": return <EfterforskningSide currentUser={currentUser} isAdmin={isAdmin} />;
      case "sig": return <SIGAfdeling currentUser={currentUser} isAdmin={isAdmin} />;
      case "remeo": return <RemeoAfdeling currentUser={currentUser} isAdmin={isAdmin} />;
      case "patruljer": return placeholderTab(Radio, "Patruljeenheder", "Kommer snart");
      case "kort": return <KortOgGPS />;
      case "kontor": return placeholderTab(Building, "Kontor", "Kommer snart");
      case "ansoegninger": return <Ansoegninger currentUser={currentUser} isAdmin={isAdmin} onBetjentUpdated={(b) => { if (b.id === currentUser.id) setCurrentUser(b); }} />;
      case "profil": return (
        <MinProfil
          currentUser={currentUser}
          isAdmin={isAdmin}
          onUserUpdate={(updated) => setCurrentUser(updated)}
          onTabChange={handleTabChange}
        />
      );
      default: return placeholderTab(Settings, "Side", "Kommer snart");
    }
  };

  return (
    <div className="h-screen w-screen bg-black p-2">
      <div className="relative w-full h-full rounded-2xl bg-background overflow-hidden border border-primary/20 glow-primary">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-primary/60 to-transparent z-10" />
        <div className="absolute top-0 left-0 w-[1px] h-16 bg-gradient-to-b from-primary/60 to-transparent z-10" />
        <div className="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-primary/60 to-transparent z-10" />
        <div className="absolute bottom-0 right-0 w-[1px] h-16 bg-gradient-to-t from-primary/60 to-transparent z-10" />

        <div className="flex h-full overflow-hidden">
          <Sidebar
            activeTab={activeType}
            onTabChange={handleTabChange}
            onLogout={() => { setCurrentUser(null); setIsAdmin(false); setOpenTabs([{ id: "forside", label: "Forside", type: "forside" }]); setActiveTabId("forside"); }}
            currentUser={currentUser}
            isAdmin={isAdmin}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <TopHeader currentUser={currentUser} isAdmin={isAdmin} />
            <OpenTabsBar
              tabs={openTabs}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={closeTab}
            />
            <main className="flex-1 p-4 overflow-y-auto">
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
