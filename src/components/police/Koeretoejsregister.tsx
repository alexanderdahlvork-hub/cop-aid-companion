import { useState, useEffect } from "react";
import { Car, Search, Plus, X, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { koeretoejerApi, personerApi } from "@/lib/api";
import type { Koeretoej, Person } from "@/types/police";
import { toast } from "@/components/ui/sonner";

const Koeretoejsregister = () => {
  const [koeretoejer, setKoeretoejer] = useState<Koeretoej[]>([]);
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Koeretoej | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const [formPlade, setFormPlade] = useState("");
  const [formMaerke, setFormMaerke] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formAargang, setFormAargang] = useState("");
  const [formFarve, setFormFarve] = useState("");
  const [formEjer, setFormEjer] = useState("");
  const [formStatus, setFormStatus] = useState<string>("aktiv");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [k, p] = await Promise.all([
          koeretoejerApi.getAll(),
          personerApi.getAll(),
        ]);
        setKoeretoejer(k);
        setPersoner(p);
      } catch (err) {
        console.error("Fejl ved indlæsning:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = koeretoejer.filter((k) => {
    const q = search.toLowerCase();
    return (
      k.nummerplade.toLowerCase().includes(q) ||
      k.maerke.toLowerCase().includes(q) ||
      k.model.toLowerCase().includes(q) ||
      k.farve.toLowerCase().includes(q) ||
      (k.tildelt || "").toLowerCase().includes(q)
    );
  });

  const getEjerNavn = (ejerId: string) => {
    const person = personer.find((p) => p.id === ejerId || p.cpr === ejerId || `${p.fornavn} ${p.efternavn}` === ejerId);
    return person ? `${person.fornavn} ${person.efternavn}` : ejerId || "Ukendt";
  };

  const handleCreate = async () => {
    if (!formPlade || !formMaerke || !formModel) {
      toast("Udfyld alle påkrævede felter");
      return;
    }
    setSaving(true);
    const nyt: Koeretoej = {
      id: Date.now().toString(),
      nummerplade: formPlade.toUpperCase(),
      maerke: formMaerke,
      model: formModel,
      aargang: formAargang,
      farve: formFarve,
      status: formStatus as Koeretoej["status"],
      tildelt: formEjer,
      sidstService: "",
      km: 0,
    };
    try {
      await koeretoejerApi.create(nyt);
      setKoeretoejer([...koeretoejer, nyt]);
      toast("Køretøj registreret");
      setShowCreate(false);
      resetForm();
    } catch (err) {
      console.error("Fejl:", err);
      toast("Fejl ved oprettelse");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormPlade("");
    setFormMaerke("");
    setFormModel("");
    setFormAargang("");
    setFormFarve("");
    setFormEjer("");
    setFormStatus("aktiv");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      aktiv: "bg-success/15 text-success",
      eftersøgt: "bg-destructive/15 text-destructive",
      i_brug: "bg-primary/15 text-primary",
      vedligehold: "bg-warning/15 text-warning",
      ude_af_drift: "bg-muted text-muted-foreground",
    };
    const labels: Record<string, string> = {
      aktiv: "Aktiv",
      eftersøgt: "Eftersøgt",
      i_brug: "I brug",
      vedligehold: "Vedligehold",
      ude_af_drift: "Ude af drift",
    };
    return (
      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", styles[status] || "bg-muted text-muted-foreground")}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser køretøjer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søg nummerplade, mærke, model, ejer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-sm"
          />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
          <Plus className="w-4 h-4" /> Registrer køretøj
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-3">
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-foreground">{koeretoejer.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2">
          <p className="text-xs text-muted-foreground">Eftersøgte</p>
          <p className="text-lg font-bold text-destructive">{koeretoejer.filter(k => k.status === "eftersøgt").length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_1fr_0.7fr_0.7fr_1fr] gap-2 px-4 py-2.5 bg-secondary/80 text-xs font-semibold text-muted-foreground uppercase">
          <span>Nummerplade</span>
          <span>Mærke / Model</span>
          <span>Farve</span>
          <span>Årgang</span>
          <span>Status</span>
          <span>Ejer</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {search ? "Ingen køretøjer matcher søgningen" : "Ingen køretøjer registreret"}
          </div>
        ) : (
          filtered.map((k) => (
            <button
              key={k.id}
              onClick={() => setSelected(k)}
              className="w-full grid grid-cols-[1fr_1fr_1fr_0.7fr_0.7fr_1fr] gap-2 px-4 py-2.5 border-t border-border/50 hover:bg-muted/50 transition-colors text-left text-sm"
            >
              <span className="font-mono font-semibold text-foreground">{k.nummerplade}</span>
              <span className="text-foreground">{k.maerke} {k.model}</span>
              <span className="text-muted-foreground">{k.farve}</span>
              <span className="text-muted-foreground">{k.aargang}</span>
              <span>{statusBadge(k.status)}</span>
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                {getEjerNavn(k.tildelt)}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-mono">{selected?.nummerplade}</DialogTitle>
            <DialogDescription>{selected?.maerke} {selected?.model} ({selected?.aargang})</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Mærke</p>
                  <p className="font-medium text-foreground">{selected.maerke}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Model</p>
                  <p className="font-medium text-foreground">{selected.model}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Årgang</p>
                  <p className="font-medium text-foreground">{selected.aargang}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Farve</p>
                  <p className="font-medium text-foreground">{selected.farve}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Kilometer</p>
                  <p className="font-medium text-foreground">{selected.km.toLocaleString("da-DK")} km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  {statusBadge(selected.status)}
                </div>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-xs text-muted-foreground mb-1">Ejer</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{getEjerNavn(selected.tildelt)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrer køretøj</DialogTitle>
            <DialogDescription>Tilføj et nyt køretøj til registeret</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Nummerplade *</Label>
                <Input value={formPlade} onChange={(e) => setFormPlade(e.target.value)} placeholder="AB 12 345" className="mt-1 bg-secondary border-border text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mærke *</Label>
                <Input value={formMaerke} onChange={(e) => setFormMaerke(e.target.value)} placeholder="Toyota" className="mt-1 bg-secondary border-border text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Model *</Label>
                <Input value={formModel} onChange={(e) => setFormModel(e.target.value)} placeholder="Corolla" className="mt-1 bg-secondary border-border text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Årgang</Label>
                <Input value={formAargang} onChange={(e) => setFormAargang(e.target.value)} placeholder="2024" className="mt-1 bg-secondary border-border text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Farve</Label>
                <Input value={formFarve} onChange={(e) => setFormFarve(e.target.value)} placeholder="Sort" className="mt-1 bg-secondary border-border text-sm" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="mt-1 bg-secondary border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktiv">Aktiv</SelectItem>
                    <SelectItem value="eftersøgt">Eftersøgt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ejer (navn eller CPR)</Label>
              <Input value={formEjer} onChange={(e) => setFormEjer(e.target.value)} placeholder="Søg ejer..." className="mt-1 bg-secondary border-border text-sm" />
              {formEjer && (
                <div className="mt-1 max-h-24 overflow-y-auto border border-border rounded-md">
                  {personer
                    .filter((p) => `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(formEjer.toLowerCase()))
                    .slice(0, 5)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setFormEjer(`${p.fornavn} ${p.efternavn}`)}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted transition-colors text-foreground"
                      >
                        {p.fornavn} {p.efternavn} <span className="text-muted-foreground">({p.cpr})</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Registrer
              </Button>
              <Button variant="outline" onClick={() => { setShowCreate(false); resetForm(); }}>Annuller</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Koeretoejsregister;
