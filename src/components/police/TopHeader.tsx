import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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

  const tidStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const dagNavn = ["søn", "man", "tir", "ons", "tor", "fre", "lør"];
  const datoStr = `${dagNavn[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}`;

  return (
    <div className="h-11 bg-card/80 border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Søg person, nummerplade, sag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-7 bg-muted/40 border-border text-[12px]"
        />
      </div>

      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <div className="w-1.5 h-1.5 rounded-full bg-success" />
        <span>I tjeneste</span>
      </div>

      {/* Time */}
      <div className="text-right">
        <p className="text-[13px] font-semibold text-foreground font-mono leading-none">{tidStr}</p>
        <p className="text-[9px] text-muted-foreground leading-none mt-0.5">{datoStr}</p>
      </div>
    </div>
  );
};

export default TopHeader;
