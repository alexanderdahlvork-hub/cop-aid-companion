import { Home, Users, FileText, AlertTriangle, Radio, Target, MoreHorizontal } from "lucide-react";
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
  { id: "fleet", label: "Flådestyring", icon: Radio },
  { id: "nsk", label: "NSK", icon: Target },
];

const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="h-12 bg-card border-b border-border flex items-center px-4 gap-1 shrink-0 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
      
      {/* Status indicator */}
      <div className="flex items-center gap-2 ml-2">
        <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
      </div>

      <button className="ml-1 p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TabNavigation;
