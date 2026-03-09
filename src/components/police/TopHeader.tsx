import { useState, useEffect } from "react";
import { Search, MoreHorizontal, Circle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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

  const dagNavn = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
  const maanedNavn = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  const tidStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  const datoStr = `${dagNavn[now.getDay()]}, ${now.getDate()} ${maanedNavn[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div className="h-14 bg-card border-b border-border flex items-center px-4 gap-4 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg person / nummerplade / sag"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-muted/50 border-border text-sm"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Date/Time */}
      <div className="text-right mr-4">
        <p className="text-sm font-medium text-foreground font-mono">{tidStr}</p>
        <p className="text-[10px] text-muted-foreground">{datoStr}</p>
      </div>

      {/* User */}
      <button className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
          {currentUser.fornavn[0]}{currentUser.efternavn[0]}
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-sm font-semibold text-foreground">{isAdmin ? "Admin" : currentUser.fornavn}</p>
          <p className="text-[10px] text-muted-foreground">{currentUser.badgeNr} {isAdmin ? "Administrator" : currentUser.rang}</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    </div>
  );
};

export default TopHeader;
