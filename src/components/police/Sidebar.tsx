import { useState } from "react";
import {
  Shield, Users, Car, FileText, Radio, MapPin, Settings,
  BadgeCheck, Scale, Home, BookOpen, Search, AlertTriangle,
  Building, ChevronDown, ChevronRight, User, Moon, LogOut,
  Target, Crosshair, Gauge, Heart, FolderOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import type { Betjent } from "@/types/police";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  currentUser: Betjent;
  isAdmin: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: typeof Home;
  children?: MenuItem[];
  afdeling?: string; // restrict to this department
}

const AFDELINGER: { id: string; label: string; icon: typeof Home; tabs: MenuItem[] }[] = [
  {
    id: "NSK", label: "NSK", icon: Target,
    tabs: [{ id: "nsk", label: "Organiseret Kriminalitet", icon: Target }],
  },
  {
    id: "Lima", label: "Lima", icon: Shield,
    tabs: [{ id: "lima", label: "Aktionsstyrken", icon: Shield }],
  },
  {
    id: "Færdsel", label: "Færdsel", icon: Gauge,
    tabs: [{ id: "faerdsel", label: "Færdselsafdeling", icon: Gauge }],
  },
  {
    id: "Efterforskning", label: "Efterforskning", icon: FolderOpen,
    tabs: [{ id: "efterforskning", label: "Efterforskning", icon: FolderOpen }],
  },
  {
    id: "SIG", label: "SIG", icon: Crosshair,
    tabs: [{ id: "sig", label: "Særlig Indsatsgruppe", icon: Crosshair }],
  },
  {
    id: "Remeo", label: "Remeo", icon: Heart,
    tabs: [{ id: "remeo", label: "Redning & Medicinsk", icon: Heart }],
  },
];

const menuItems: MenuItem[] = [
  {
    id: "hjem", label: "Hjem", icon: Home,
    children: [
      { id: "forside", label: "Forside", icon: Home },
      { id: "guides", label: "Guides & FAQ", icon: BookOpen },
    ],
  },
  {
    id: "database", label: "Database registre", icon: Search,
    children: [
      { id: "kr", label: "Personregister", icon: Users },
      { id: "fleet", label: "Køretøjsregister", icon: Car },
      { id: "ejendomme", label: "Ejendomsregister", icon: Building },
      { id: "efterlysninger", label: "Efterlysninger", icon: AlertTriangle },
    ],
  },
  {
    id: "flaade", label: "Flådestyring & Opkald", icon: Radio,
    children: [
      { id: "radio", label: "Kommunikation", icon: Radio },
      { id: "kort", label: "Kort", icon: MapPin },
    ],
  },
  { id: "boeder", label: "Bødetakster", icon: Scale },
  { id: "kontor", label: "Kontor", icon: Building },
  {
    id: "ansatte_group", label: "Ansatte", icon: BadgeCheck,
    children: [
      { id: "ansatte", label: "Alle ansatte", icon: Users },
    ],
  },
];

const Sidebar = ({ activeTab, onTabChange, onLogout, currentUser, isAdmin }: SidebarProps) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ hjem: true, database: true });
  const [showProfile, setShowProfile] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const toggleGroup = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActiveInGroup = (item: MenuItem): boolean => {
    if (item.children) return item.children.some((c) => c.id === activeTab);
    return item.id === activeTab;
  };

  return (
    <div className="w-20 lg:w-60 bg-sidebar border-r border-sidebar-border flex flex-col h-screen relative">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div className="hidden lg:block min-w-0">
          <h1 className="font-bold text-sidebar-foreground text-xs tracking-wide">Rigspolitiet</h1>
          <p className="text-[10px] text-muted-foreground truncate">Adgang baseret på stilling</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          if (item.children) {
            const isOpen = expanded[item.id] ?? false;
            const isActive = isActiveInGroup(item);
            return (
              <div key={item.id}>
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium transition-all",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="hidden lg:block flex-1 text-left">{item.label}</span>
                  <span className="hidden lg:block">
                    {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="ml-4 lg:ml-6 space-y-0.5">
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all",
                          activeTab === child.id
                            ? "bg-primary/15 text-primary font-semibold"
                            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <child.icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden lg:block">{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium transition-all",
                activeTab === item.id
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}

        {/* Afdelinger */}
        {(() => {
          const userAfd = currentUser.afdeling || "";
          const visibleAfdelinger = isAdmin
            ? AFDELINGER
            : AFDELINGER.filter((a) => userAfd.toLowerCase().includes(a.id.toLowerCase()));
          
          if (visibleAfdelinger.length === 0) return null;
          
          return (
            <div className="pt-3 mt-3 border-t border-sidebar-border">
              <p className="text-[10px] text-muted-foreground px-2 mb-1 hidden lg:block uppercase tracking-wider">Min afdeling</p>
              {visibleAfdelinger.map((afd) => (
                <div key={afd.id}>
                  {afd.tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onTabChange(t.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all",
                        activeTab === t.id
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <afd.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden lg:block">{afd.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          );
        })()}
      </nav>

      {/* Bottom user bar */}
      <div className="border-t border-sidebar-border">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="w-full p-3 flex items-center gap-2 hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-warning" />
          </div>
          <div className="hidden lg:block text-left min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {currentUser.fornavn} {currentUser.efternavn} | {currentUser.badgeNr}
            </p>
            <p className="text-[10px] text-muted-foreground">{isAdmin ? "Administrator" : currentUser.rang}</p>
          </div>
        </button>

        {/* Profile popup */}
        {showProfile && (
          <div className="absolute bottom-16 left-2 right-2 bg-card border border-border rounded-lg shadow-2xl p-3 space-y-2 z-50">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {currentUser.fornavn} {currentUser.efternavn} | {currentUser.badgeNr}
                </p>
                <p className="text-[10px] text-muted-foreground">{isAdmin ? "Administrator" : currentUser.rang}</p>
              </div>
            </div>

            <button
              onClick={() => { setShowProfile(false); onTabChange("profil"); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Mine Ansøgninger
            </button>
            <button
              onClick={() => { setShowProfile(false); onTabChange("profil"); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Min Profil
            </button>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <Moon className="w-3.5 h-3.5 text-foreground" />
              <span className="text-xs text-foreground">Mørkt Tema</span>
              <div className={cn("ml-auto w-8 h-4 rounded-full relative transition-colors", theme === "dark" ? "bg-primary" : "bg-muted-foreground/30")}>
                <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", theme === "dark" ? "right-0.5" : "left-0.5")} />
              </div>
            </button>

            <div className="border-t border-border pt-2">
              <button
                onClick={() => { setShowProfile(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Luk ned
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom status */}
      <div className="px-3 py-2 flex items-center gap-2 border-t border-sidebar-border">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
        <span className="hidden lg:block text-[10px] text-muted-foreground">Online</span>
      </div>
    </div>
  );
};

export default Sidebar;
