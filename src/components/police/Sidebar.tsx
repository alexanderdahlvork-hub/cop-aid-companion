import { useState } from "react";
import {
  Shield, Users, Car, FileText, Radio, MapPin, Settings,
  BadgeCheck, Scale, Home, BookOpen, Search, AlertTriangle,
  Building, ChevronDown, ChevronRight, User, Moon, LogOut,
  Target, Crosshair, Gauge, Heart, FolderOpen, Circle, FileText as FileTextIcon
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

interface SidebarSection {
  label: string;
  icon: typeof Home;
  items: { id: string; label: string; icon: typeof Home }[];
}

const sections: SidebarSection[] = [
  {
    label: "OVERSIGT",
    icon: Circle,
    items: [
      { id: "forside", label: "Forside", icon: Home },
      { id: "guides", label: "Seneste Sager", icon: FileText },
      { id: "kort", label: "Aktiv Patrulje", icon: Radio },
    ],
  },
  {
    label: "DATABASE",
    icon: Search,
    items: [
      { id: "kr", label: "Personregister", icon: Users },
      { id: "ejendomme", label: "Ejendomsregister", icon: Building },
      { id: "efterlysninger", label: "Efterlysninger", icon: AlertTriangle },
    ],
  },
  {
    label: "SAGER",
    icon: FileText,
    items: [
      { id: "opret_sag", label: "Opret Sag", icon: FileText },
      { id: "boeder", label: "Sagsarkiv", icon: FolderOpen },
    ],
  },
  {
    label: "FLÅDESTYRING",
    icon: Car,
    items: [
      { id: "fleet", label: "Køretøjsregister", icon: Car },
      { id: "flaade", label: "Flådestyring", icon: Radio },
      { id: "patruljer", label: "Patruljeenheder", icon: MapPin },
    ],
  },
];

const AFDELINGER = [
  { id: "NSK", label: "NSK", icon: Target, tab: "nsk" },
  { id: "Lima", label: "Lima", icon: Shield, tab: "lima" },
  { id: "Færdsel", label: "Færdsel", icon: Gauge, tab: "faerdsel" },
  { id: "Efterforskning", label: "Efterforskning", icon: FolderOpen, tab: "efterforskning" },
  { id: "SIG", label: "SIG", icon: Crosshair, tab: "sig" },
  { id: "Remeo", label: "Remeo", icon: Heart, tab: "remeo" },
];

const bottomLinks = [
  { id: "ansatte", label: "Ansatte", icon: BadgeCheck },
  { id: "kontor", label: "Kontor", icon: Building },
  { id: "guides_faq", label: "Guides & FAQ", icon: BookOpen },
  { id: "profil", label: "Systemindstillinger", icon: Settings },
];

const Sidebar = ({ activeTab, onTabChange, onLogout, currentUser, isAdmin }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  const userAfd = currentUser.afdeling || "";
  const visibleAfdelinger = isAdmin
    ? AFDELINGER
    : AFDELINGER.filter((a) => userAfd.toLowerCase().includes(a.id.toLowerCase()));

  return (
    <div className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Title */}
      <div className="px-4 py-5">
        <h1 className="text-2xl font-black text-foreground tracking-wide">POLITI</h1>
      </div>

      {/* Sections */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-4">
        {sections.map((section, sectionIdx) => (
          <div key={section.label}>
            {sectionIdx > 0 && (
              <div className="my-3 mx-2 border-t border-sidebar-border" />
            )}
            <div className="flex items-center gap-2 px-2 mb-2">
              <section.icon className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{section.label}</span>
            </div>
            <div className="space-y-0.5 ml-1">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all",
                    activeTab === item.id
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <span className="text-muted-foreground/50">•</span>
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Afdelinger */}
        {visibleAfdelinger.length > 0 && (
          <div>
            <div className="my-3 mx-2 border-t border-sidebar-border" />
            <div className="flex items-center gap-2 px-2 mb-2">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">AFDELINGER</span>
            </div>
            <div className="space-y-0.5 ml-1">
              {visibleAfdelinger.map((afd) => (
                <button
                  key={afd.id}
                  onClick={() => onTabChange(afd.tab)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all",
                    activeTab === afd.tab
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <span className="text-muted-foreground/50">•</span>
                  <afd.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{afd.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-0.5">
        {bottomLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onTabChange(link.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-all",
              activeTab === link.id
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
            )}
          >
            <link.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{link.label}</span>
          </button>
        ))}
      </div>

      {/* User bar */}
      <div className="border-t border-sidebar-border relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="w-full p-3 flex items-center gap-2 hover:bg-sidebar-accent transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-warning" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {currentUser.fornavn} {currentUser.efternavn}
            </p>
            <p className="text-[10px] text-muted-foreground">{isAdmin ? "Administrator" : currentUser.rang}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
        </button>

        {/* Profile popup */}
        {showProfile && (
          <div className="absolute bottom-full left-2 right-2 mb-1 bg-card border border-border rounded-lg shadow-2xl p-3 space-y-2 z-50">
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
              <User className="w-3.5 h-3.5" /> Min Profil
            </button>

            <button
              onClick={() => { setShowProfile(false); onTabChange("ansoegninger"); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-foreground hover:bg-muted transition-colors"
            >
              <FileTextIcon className="w-3.5 h-3.5" /> Ansøgninger
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
    </div>
  );
};

export default Sidebar;
