import { Home, Users, FileText, AlertTriangle, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "forside", label: "Forside", icon: Home },
  { id: "kr", label: "Personregister", icon: Users },
  { id: "opret_sag", label: "Opret Sag", icon: FileText },
  { id: "efterlysninger", label: "Efterlysninger", icon: AlertTriangle },
  { id: "flaade", label: "Flådestyring", icon: Radio },
];

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="h-9 bg-card/50 border-b border-border flex items-center px-3 gap-0.5 shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-colors whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabNavigation;
