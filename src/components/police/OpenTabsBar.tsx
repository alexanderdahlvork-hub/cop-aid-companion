import { X, Home, Users, FileText, Car, Radio, AlertTriangle, Building, Shield, User, FolderOpen, Megaphone, MapPin, Target, Crosshair, Gauge, Heart, Settings, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenTab } from "@/types/police";

interface OpenTabsBarProps {
  tabs: OpenTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

const iconMap: Record<string, typeof Home> = {
  forside: Home,
  opslagstavle: Megaphone,
  kort: Radio,
  kr: Users,
  koeretoej: Car,
  ejendomme: Building,
  efterlysninger: AlertTriangle,
  opret_sag: FileText,
  sag: FileText,
  boeder: FolderOpen,
  sagsarkiv: FolderOpen,
  flaade: Radio,
  patruljer: MapPin,
  ansatte: Shield,
  ansoegninger: FileText,
  profil: User,
  nsk: Target,
  lima: Shield,
  faerdsel: Gauge,
  efterforskning: FolderOpen,
  sig: Crosshair,
  remeo: Heart,
  kontor: Building,
};

const OpenTabsBar = ({ tabs, activeTabId, onSelectTab, onCloseTab }: OpenTabsBarProps) => {
  if (tabs.length === 0) return null;

  return (
    <div className="h-8 bg-card/30 border-b border-border flex items-center px-1 gap-0.5 shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const Icon = iconMap[tab.type] || Settings;
        const isCloseable = tab.type !== "forside";

        return (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md text-[11px] font-medium transition-all whitespace-nowrap font-mono group cursor-pointer max-w-[180px]",
              isActive
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
            )}
            onClick={() => onSelectTab(tab.id)}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="truncate">{tab.label}</span>
            {isCloseable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className={cn(
                  "ml-0.5 p-0.5 rounded hover:bg-destructive/15 hover:text-destructive transition-colors shrink-0",
                  isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OpenTabsBar;
