import { useState, useEffect } from "react";
import { Search, Plus, Building, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ejendommeApi } from "@/lib/api";
import type { Ejendom } from "@/types/police";

const typeConfig: Record<Ejendom["type"], { label: string; className: string }> = {
  villa: { label: "Villa", className: "bg-success/20 text-success border-success/30" },
  lejlighed: { label: "Lejlighed", className: "bg-primary/20 text-primary border-primary/30" },
  erhverv: { label: "Erhverv", className: "bg-warning/20 text-warning border-warning/30" },
  grund: { label: "Grund", className: "bg-muted text-muted-foreground border-border" },
};

const Ejendomsregister = () => {
  const [ejendomme, setEjendomme] = useState<Ejendom[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [valgt, setValgt] = useState<Ejendom | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ny, setNy] = useState<Partial<Ejendom>>({ type: "villa" });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await ejendommeApi.getAll();
        setEjendomme(data);
      } catch (err) {
        console.error("Fejl ved indlæsning af ejendomme:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtreret = ejendomme.filter((e) =>
    `${e.adresse} ${e.postnr} ${e.by} ${e.ejer} ${e.ejerCpr} ${e.matrikelnr}`
      .toLowerCase()
      .includes(soegning.toLowerCase())
  );

  const opret = async () => {
    setSaving(true);
    const ejendom: Ejendom = {
      id: Date.now().toString(),
      adresse: ny.adresse || "",
      postnr: ny.postnr || "",
      by: ny.by || "",
      ejer: ny.ejer || "",
      ejerCpr: ny.ejerCpr || "",
      type: (ny.type as Ejendom["type"]) || "villa",
      vurdering: ny.vurdering || 0,
      matrikelnr: ny.matrikelnr || "",
      noter: ny.noter || "",
      oprettet: new Date().toISOString().split("T")[0],
    };
    try {
      await ejendommeApi.create(ejendom);
      setEjendomme([ejendom, ...ejendomme]);
      setNy({ type: "villa" });
      setDialogOpen(false);
    } catch (err) {
      console.error("Fejl ved oprettelse:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser ejendomme...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Søg adresse, ejer, matrikelnr..."
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Opret
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Opret ejendom</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div>
                  <Label className="text-xs">Adresse</Label>
                  <Input value={ny.adresse || ""} onChange={(e) => setNy({ ...ny, adresse: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Postnr</Label>
                    <Input value={ny.postnr || ""} onChange={(e) => setNy({ ...ny, postnr: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">By</Label>
                    <Input value={ny.by || ""} onChange={(e) => setNy({ ...ny, by: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Ejer (navn)</Label>
                    <Input value={ny.ejer || ""} onChange={(e) => setNy({ ...ny, ejer: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Ejer CPR</Label>
                    <Input value={ny.ejerCpr || ""} onChange={(e) => setNy({ ...ny, ejerCpr: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Matrikelnr</Label>
                    <Input value={ny.matrikelnr || ""} onChange={(e) => setNy({ ...ny, matrikelnr: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Vurdering (kr)</Label>
                    <Input type="number" value={ny.vurdering || ""} onChange={(e) => setNy({ ...ny, vurdering: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={ny.type || "villa"} onValueChange={(v) => setNy({ ...ny, type: v as Ejendom["type"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="lejlighed">Lejlighed</SelectItem>
                      <SelectItem value="erhverv">Erhverv</SelectItem>
                      <SelectItem value="grund">Grund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Noter</Label>
                  <Textarea value={ny.noter || ""} onChange={(e) => setNy({ ...ny, noter: e.target.value })} rows={3} />
                </div>
                <Button onClick={opret} disabled={saving} className="w-full mt-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Opret ejendom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtreret.map((e) => (
            <button
              key={e.id}
              onClick={() => setValgt(e)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                valgt?.id === e.id
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary/50 border border-transparent hover:bg-secondary"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Building className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.adresse}</p>
                <p className="text-xs text-muted-foreground">{e.postnr} {e.by} · {e.ejer}</p>
              </div>
              <Badge variant="outline" className={typeConfig[e.type].className}>
                {typeConfig[e.type].label}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
          {filtreret.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Ingen resultater fundet
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block flex-1">
        {valgt ? (
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Building className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{valgt.adresse}</CardTitle>
                    <p className="text-sm text-muted-foreground">{valgt.postnr} {valgt.by}</p>
                  </div>
                </div>
                <Badge variant="outline" className={typeConfig[valgt.type].className}>
                  {typeConfig[valgt.type].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Ejer" value={valgt.ejer} />
                <InfoField label="Ejer CPR" value={valgt.ejerCpr} />
                <InfoField label="Matrikelnr" value={valgt.matrikelnr} />
                <InfoField label="Vurdering" value={`${valgt.vurdering.toLocaleString("da-DK")} kr`} />
                <InfoField label="Oprettet" value={valgt.oprettet} />
              </div>
              {valgt.noter && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Noter</p>
                  <div className="p-3 rounded-lg bg-muted/50 text-sm">{valgt.noter}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Vælg en ejendom for at se detaljer
          </div>
        )}
      </div>
    </div>
  );
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default Ejendomsregister;
