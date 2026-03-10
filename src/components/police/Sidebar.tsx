import { useState, useEffect, useRef } from "react";
import {
  Shield, Users, Car, FileText, Radio, MapPin, Settings,
  BadgeCheck, Home, Search, AlertTriangle,
  Building, User, Moon, LogOut,
  Target, Crosshair, Gauge, Heart, FolderOpen, Circle,
  FileText as FileTextIcon, Megaphone, ChevronRight
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
  items: { id: string; label: string; icon: typeof Home }[];
}

const sections: SidebarSection[] = [
  {
    label: "OVERSIGT",
    items: [
      { id: "forside", label: "Forside", icon: Home },
      { id: "opslagstavle", label: "Opslagstavle", icon: Megaphone },
      { id: "kort", label: "Aktiv Patrulje", icon: Radio },
    ],
  },
  {
    label: "DATABASE",
    items: [
      { id: "kr", label: "Personregister", icon: Users },
      { id: "koeretoej", label: "Køretøjsregister", icon: Car },
      { id: "ejendomme", label: "Ejendomsregister", icon: Building },
      { id: "efterlysninger", label: "Efterlysninger", icon: AlertTriangle },
    ],
  },
  {
    label: "SAGER",
    items: [
      { id: "opret_sag", label: "Opret Sag", icon: FileText },
      { id: "boeder", label: "Bødetakster", icon: FolderOpen },
      { id: "sagsarkiv", label: "Sagsarkiv", icon: FolderOpen },
    ],
  },
  {
    label: "FLÅDESTYRING",
    items: [
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
  { id: "ansoegninger", label: "Ansøgninger", icon: FileTextIcon },
];

const Sidebar = ({ activeTab, onTabChange, onLogout, currentUser, isAdmin }: SidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showProfile) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProfile]);

  const userAfd = currentUser.afdeling || "";
  const visibleAfdelinger = isAdmin
    ? AFDELINGER
    : AFDELINGER.filter((a) => userAfd.toLowerCase().includes(a.id.toLowerCase()));

  return (
    <div className="w-56 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-[13px] font-bold text-foreground tracking-wide block leading-none">POLITI MDT</span>
            <span className="text-[9px] text-primary font-mono tracking-widest">COMMAND v2.0</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {sections.map((section, sectionIdx) => (
          <div key={section.label}>
            {sectionIdx > 0 && <div className="my-2.5 mx-2 h-[1px] bg-gradient-to-r from-primary/20 via-sidebar-border to-transparent" />}
            <p className="text-[9px] font-semibold text-primary/60 uppercase tracking-[0.2em] px-2 mb-1.5 font-mono">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-[6px] rounded-lg text-[12px] transition-all duration-150 group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5 shrink-0 transition-colors", isActive && "text-primary")} />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        ))}

        {/* Afdelinger */}
        {visibleAfdelinger.length > 0 && (
          <div>
            <div className="my-2.5 mx-2 h-[1px] bg-gradient-to-r from-primary/20 via-sidebar-border to-transparent" />
            <p className="text-[9px] font-semibold text-primary/60 uppercase tracking-[0.2em] px-2 mb-1.5 font-mono">
              AFDELINGER
            </p>
            {visibleAfdelinger.map((afd) => {
              const isActive = activeTab === afd.tab;
              return (
                <button
                  key={afd.id}
                  onClick={() => onTabChange(afd.tab)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-[6px] rounded-lg text-[12px] transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent"
                  )}
                >
                  <afd.icon className={cn("w-3.5 h-3.5 shrink-0", isActive && "text-primary")} />
                  <span className="truncate flex-1 text-left">{afd.label}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-sidebar-border px-2 py-2 space-y-0.5">
        {bottomLinks.map((link) => {
          const isActive = activeTab === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-[6px] rounded-lg text-[12px] transition-all duration-150",
                isActive
                  ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent border border-transparent"
              )}
            >
              <link.icon className={cn("w-3.5 h-3.5 shrink-0", isActive && "text-primary")} />
              <span>{link.label}</span>
            </button>
          );
        })}
      </div>

      {/* User bar */}
      <div ref={profileRef} className="border-t border-sidebar-border relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-sidebar-accent transition-colors"
        >
          {currentUser.profilBillede ? (
            <img src={currentUser.profilBillede} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 border border-primary/20" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <div className="text-left min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-sidebar-foreground truncate">
              {currentUser.fornavn} {currentUser.efternavn}
            </p>
            <p className="text-[9px] text-muted-foreground font-mono">{isAdmin ? "ADMIN" : currentUser.rang}</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
        </button>

        {/* Profile popup */}
        {showProfile && (
          <div className="absolute bottom-full left-1 right-1 mb-1 bg-card border border-primary/15 rounded-xl shadow-2xl p-2.5 space-y-1 z-50">
            <div className="flex items-center gap-2 pb-2 mb-1 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  {currentUser.fornavn} {currentUser.efternavn}
                </p>
                <p className="text-[9px] text-muted-foreground font-mono">{currentUser.badgeNr} · {isAdmin ? "Admin" : currentUser.rang}</p>
              </div>
            </div>

            <button
              onClick={() => { setShowProfile(false); onTabChange("profil"); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-foreground hover:bg-muted transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Min Profil
            </button>

            <button
              onClick={() => { setShowProfile(false); onTabChange("ansoegninger"); }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-foreground hover:bg-muted transition-colors"
            >
              <FileTextIcon className="w-3.5 h-3.5" /> Ansøgninger
            </button>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] hover:bg-muted transition-colors"
            >
              <Moon className="w-3.5 h-3.5 text-foreground" />
              <span className="text-foreground">{theme === "dark" ? "Lyst tema" : "Mørkt tema"}</span>
              <div className={cn("ml-auto w-7 h-3.5 rounded-full relative transition-colors", theme === "dark" ? "bg-primary" : "bg-muted-foreground/30")}>
                <div className={cn("absolute top-[2px] w-2.5 h-2.5 bg-white rounded-full transition-all", theme === "dark" ? "right-[2px]" : "left-[2px]")} />
              </div>
            </button>

            <div className="border-t border-border pt-1 mt-1">
              <button
                onClick={() => { setShowProfile(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Log ud
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
