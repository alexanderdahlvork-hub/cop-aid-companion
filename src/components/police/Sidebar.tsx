import { Shield, Users, Car, FileText, Radio, MapPin, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "kr", label: "KR Register", icon: Users },
  { id: "fleet", label: "Flådestyring", icon: Car },
  { id: "rapporter", label: "Rapporter", icon: FileText },
  { id: "kort", label: "Kort", icon: MapPin },
  { id: "radio", label: "Kommunikation", icon: Radio },
  { id: "indstillinger", label: "Indstillinger", icon: Settings },
];

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <div className="w-20 lg:w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div className="hidden lg:block">
          <h1 className="font-bold text-sidebar-foreground text-sm tracking-wide uppercase">Politi MDT</h1>
          <p className="text-xs text-muted-foreground">Mobile Data Terminal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
          <span className="hidden lg:block text-xs text-muted-foreground">Online — P12</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
