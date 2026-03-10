import { useState, useEffect } from "react";
import { Search, Signal } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Betjent } from "@/types/police";

interface TopHeaderProps {
  currentUser: Betjent;
  isAdmin: boolean;
  onSearch?: (query: string) => void;
}

const TopHeader = ({ currentUser, isAdmin }: TopHeaderProps) => {
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const tidStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const dagNavn = ["SØN", "MAN", "TIR", "ONS", "TOR", "FRE", "LØR"];
  const datoStr = `${dagNavn[now.getDay()]} ${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="h-10 bg-card/60 backdrop-blur-sm border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Søg person, nummerplade, sag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-7 bg-muted/40 border-border text-[12px] rounded-lg"
        />
      </div>

      <div className="flex-1" />

      {/* Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/8 border border-primary/10">
        <span className="text-[10px] font-mono text-primary font-medium">{currentUser.badgeNr}</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5">
        <Signal className="w-3 h-3 text-success" />
        <span className="text-[10px] text-muted-foreground font-mono">ONLINE</span>
      </div>

      {/* Time */}
      <div className="text-right flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-mono">{datoStr}</span>
        <span className="text-[13px] font-bold text-primary font-mono tracking-wider">{tidStr}</span>
      </div>
    </div>
  );
};

export default TopHeader;
