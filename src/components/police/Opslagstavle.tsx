import { useState, useEffect } from "react";
import {
  Megaphone, Plus, Pencil, Trash2, X, Clock, User
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Betjent } from "@/types/police";
import { toast } from "@/components/ui/sonner";
import { opslagApi, type OpslagDB } from "@/lib/api";

interface OpslagstavleProps {
  currentUser: Betjent;
  isAdmin: boolean;
}

type Opslag = OpslagDB;

const kategorier: { id: Opslag["kategori"]; label: string; color: string }[] = [
  { id: "info", label: "Information", color: "bg-primary/15 text-primary border-primary/30" },
  { id: "rekruttering", label: "Rekruttering", color: "bg-success/15 text-success border-success/30" },
  { id: "advarsel", label: "Advarsel", color: "bg-destructive/15 text-destructive border-destructive/30" },
  { id: "nyhed", label: "Nyhed", color: "bg-warning/15 text-warning border-warning/30" },
];

const Opslagstavle = ({ currentUser, isAdmin }: OpslagstavleProps) => {
  const [opslag, setOpslag] = useState<Opslag[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titel, setTitel] = useState("");
  const [indhold, setIndhold] = useState("");
  const [kategori, setKategori] = useState<Opslag["kategori"]>("info");

  const canManage = isAdmin || currentUser.rang === "Rigspolitichef";

  useEffect(() => {
    opslagApi.getAll().then(data => {
      if (data.length > 0) {
        setOpslag(data);
      } else {
        const defaults: Opslag[] = [
          {
            id: "op1",
            titel: "Banden 'Løverne' er blevet ulovliggjort",
            indhold: "Pr. dags dato er banden 'Løverne' blevet erklæret ulovlig af Justitsministeriet.",
            kategori: "advarsel",
            forfatterNavn: "Rigspolitiet",
            forfatterBadge: "ADM221",
            oprettetDato: new Date().toISOString().split("T")[0],
          },
        ];
        setOpslag(defaults);
      }
    });
  }, []);

  const saveOpslag = (updated: Opslag[]) => {
    setOpslag(updated);
  };

  const resetForm = () => {
    setTitel("");
    setIndhold("");
    setKategori("info");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!titel.trim() || !indhold.trim()) {
      toast("Udfyld både titel og indhold");
      return;
    }

    if (editingId) {
      const updated = opslag.map((o) =>
        o.id === editingId
          ? { ...o, titel, indhold, kategori, redigeretDato: new Date().toISOString().split("T")[0] }
          : o
      );
      saveOpslag(updated);
      toast("Opslag opdateret");
    } else {
      const nyt: Opslag = {
        id: `op_${Date.now()}`,
        titel,
        indhold,
        kategori,
        forfatterNavn: `${currentUser.fornavn} ${currentUser.efternavn}`,
        forfatterBadge: currentUser.badgeNr,
        oprettetDato: new Date().toISOString().split("T")[0],
      };
      saveOpslag([nyt, ...opslag]);
      toast("Opslag oprettet");
    }
    resetForm();
  };

  const handleEdit = (o: Opslag) => {
    setTitel(o.titel);
    setIndhold(o.indhold);
    setKategori(o.kategori);
    setEditingId(o.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    saveOpslag(opslag.filter((o) => o.id !== id));
    toast("Opslag slettet");
  };

  const getKategoriStyle = (kat: Opslag["kategori"]) =>
    kategorier.find((k) => k.id === kat)?.color || "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-foreground">Opslagstavle</h1>
          <span className="text-xs text-muted-foreground">{opslag.length} opslag</span>
        </div>
        {canManage && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-4 h-4" /> Nyt opslag
          </Button>
        )}
      </div>

      {/* Create/Edit form */}
      {showForm && canManage && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {editingId ? "Rediger opslag" : "Opret nyt opslag"}
            </h2>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Titel</Label>
              <Input
                value={titel}
                onChange={(e) => setTitel(e.target.value)}
                placeholder="Overskrift på opslaget..."
                className="mt-1 bg-secondary border-border"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Kategori</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {kategorier.map((kat) => (
                  <button
                    key={kat.id}
                    onClick={() => setKategori(kat.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      kategori === kat.id
                        ? kat.color
                        : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {kat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Indhold</Label>
              <Textarea
                value={indhold}
                onChange={(e) => setIndhold(e.target.value)}
                placeholder="Skriv opslagets indhold her..."
                rows={5}
                className="mt-1 bg-secondary border-border resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Annuller
              </Button>
              <Button size="sm" onClick={handleSubmit}>
                {editingId ? "Gem ændringer" : "Opret opslag"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Posts list */}
      {opslag.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Ingen opslag endnu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {opslag.map((o) => (
            <div
              key={o.id}
              className="bg-card border border-border rounded-lg p-5 space-y-3 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getKategoriStyle(o.kategori)}`}>
                      {kategorier.find((k) => k.id === o.kategori)?.label}
                    </span>
                    {o.redigeretDato && (
                      <span className="text-[10px] text-muted-foreground italic">redigeret</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{o.titel}</h3>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(o)}
                      className="p-1.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors"
                      title="Rediger"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="p-1.5 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                      title="Slet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
                {o.indhold}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {o.forfatterNavn}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {o.oprettetDato}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Opslagstavle;
