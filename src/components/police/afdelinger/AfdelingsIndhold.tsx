import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Pin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { afdelingsIndholdApi, type AfdelingsIndholdDB } from "@/lib/api";

export interface AfdelingsOpslag {
  id: string;
  titel: string;
  indhold: string;
  type: "info" | "mission" | "vigtig" | "notat";
  pinned: boolean;
  oprettetAf: string;
  oprettetDato: string;
  opdateretDato?: string;
}

interface AfdelingsIndholdProps {
  afdelingId: string;
  currentUserNavn: string;
  isLeder: boolean;
}

const typeConfig = {
  info: { label: "Information", color: "bg-primary/10 text-primary border-primary/20" },
  mission: { label: "Mission", color: "bg-warning/10 text-warning border-warning/20" },
  vigtig: { label: "Vigtig", color: "bg-destructive/10 text-destructive border-destructive/20" },
  notat: { label: "Notat", color: "bg-muted text-muted-foreground border-border" },
};

const AfdelingsIndhold = ({ afdelingId, currentUserNavn, isLeder }: AfdelingsIndholdProps) => {
  const storageKey = `afd_indhold_${afdelingId}`;
  const [opslag, setOpslag] = useState<AfdelingsOpslag[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [titel, setTitel] = useState("");
  const [indhold, setIndhold] = useState("");
  const [type, setType] = useState<AfdelingsOpslag["type"]>("info");

  useEffect(() => {
    afdelingsIndholdApi.getAll(afdelingId).then(data => {
      if (data.length > 0) {
        setOpslag(data.map(d => ({
          id: d.id, titel: d.titel, indhold: d.indhold,
          type: d.type as AfdelingsOpslag["type"],
          pinned: d.pinned === 1, oprettetAf: d.oprettetAf,
          oprettetDato: d.oprettetDato, opdateretDato: d.opdateretDato,
        })));
      } else {
        const saved = localStorage.getItem(storageKey);
        if (saved) setOpslag(JSON.parse(saved));
      }
    }).catch(() => {
      const saved = localStorage.getItem(storageKey);
      if (saved) setOpslag(JSON.parse(saved));
    });
  }, [storageKey, afdelingId]);

  const save = (items: AfdelingsOpslag[]) => {
    setOpslag(items);
    localStorage.setItem(storageKey, JSON.stringify(items));
  };

  const handleSubmit = () => {
    if (!titel.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      save(opslag.map(o => o.id === editId ? { ...o, titel, indhold, type, opdateretDato: now } : o));
    } else {
      const nyt: AfdelingsOpslag = {
        id: crypto.randomUUID(),
        titel, indhold, type,
        pinned: false,
        oprettetAf: currentUserNavn,
        oprettetDato: now,
      };
      save([nyt, ...opslag]);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setTitel("");
    setIndhold("");
    setType("info");
  };

  const startEdit = (o: AfdelingsOpslag) => {
    setEditId(o.id);
    setTitel(o.titel);
    setIndhold(o.indhold);
    setType(o.type);
    setShowForm(true);
  };

  const togglePin = (id: string) => {
    save(opslag.map(o => o.id === id ? { ...o, pinned: !o.pinned } : o));
  };

  const slet = (id: string) => {
    save(opslag.filter(o => o.id !== id));
  };

  const sorted = [...opslag].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.oprettetDato).getTime() - new Date(a.oprettetDato).getTime();
  });

  return (
    <div className="space-y-3">
      {isLeder && (
        <div className="flex justify-end">
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-3.5 h-3.5" /> Tilføj opslag
          </Button>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Titel..." value={titel} onChange={e => setTitel(e.target.value)} className="h-8 text-xs flex-1" />
            <select
              value={type}
              onChange={e => setType(e.target.value as AfdelingsOpslag["type"])}
              className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground"
            >
              {Object.entries(typeConfig).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <Textarea
            placeholder="Skriv indhold her..."
            value={indhold}
            onChange={e => setIndhold(e.target.value)}
            className="text-xs min-h-[80px]"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetForm}>
              <X className="w-3 h-3 mr-1" /> Annuller
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}>
              <Check className="w-3 h-3 mr-1" /> {editId ? "Opdater" : "Opret"}
            </Button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showForm && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-xs">Ingen opslag endnu</p>
          {isLeder && <p className="text-[10px] mt-1">Klik "Tilføj opslag" for at komme i gang</p>}
        </div>
      )}

      {sorted.map(o => (
        <div
          key={o.id}
          className={cn(
            "rounded-lg border p-3 space-y-2 transition-colors",
            o.pinned ? "border-primary/30 bg-primary/5" : "border-border bg-card/50"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {o.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 shrink-0", typeConfig[o.type].color)}>
                {typeConfig[o.type].label}
              </Badge>
              <h3 className="text-xs font-semibold text-foreground truncate">{o.titel}</h3>
            </div>
            {isLeder && (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => togglePin(o.id)} className="p-1 rounded hover:bg-muted transition-colors">
                  <Pin className={cn("w-3 h-3", o.pinned ? "text-primary" : "text-muted-foreground")} />
                </button>
                <button onClick={() => startEdit(o)} className="p-1 rounded hover:bg-muted transition-colors">
                  <Edit2 className="w-3 h-3 text-muted-foreground" />
                </button>
                <button onClick={() => slet(o.id)} className="p-1 rounded hover:bg-muted transition-colors">
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            )}
          </div>
          {o.indhold && (
            <p className="text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{o.indhold}</p>
          )}
          <div className="flex items-center gap-3 text-[9px] text-muted-foreground/70">
            <span className="flex items-center gap-1"><Calendar className="w-2.5 h-2.5" />{new Date(o.oprettetDato).toLocaleDateString("da-DK")}</span>
            <span>af {o.oprettetAf}</span>
            {o.opdateretDato && <span>(redigeret)</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AfdelingsIndhold;
