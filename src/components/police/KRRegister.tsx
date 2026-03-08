import { useState, useEffect } from "react";
import { Search, Plus, User, AlertTriangle, ChevronRight, Loader2, Scale, MapPin, Phone, Calendar, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { personerApi } from "@/lib/api";
import type { Person, Sigtelse } from "@/types/police";
import OpretSigtelseDialog from "./OpretSigtelseDialog";
import { toast } from "@/components/ui/sonner";

const statusConfig: Record<Person["status"], { label: string; className: string }> = {
  aktiv: { label: "Aktiv", className: "bg-success/20 text-success border-success/30" },
  eftersøgt: { label: "Eftersøgt", className: "bg-warning/20 text-warning border-warning/30" },
  anholdt: { label: "Anholdt", className: "bg-destructive/20 text-destructive border-destructive/30" },
  sigtet: { label: "Sigtet", className: "bg-primary/20 text-primary border-primary/30" },
};

const KRRegister = () => {
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [soegning, setSoegning] = useState("");
  const [valgtPerson, setValgtPerson] = useState<Person | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nyPerson, setNyPerson] = useState<Partial<Person>>({ status: "aktiv" });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sigtelseDialogOpen, setSigtelseDialogOpen] = useState(false);
  const [sigtelser, setSigtelser] = useState<Sigtelse[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await personerApi.getAll();
        setPersoner(data);
      } catch (err) {
        console.error("Fejl ved indlæsning af personer:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtreret = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  const opretPerson = async () => {
    setSaving(true);
    const person: Person = {
      id: Date.now().toString(),
      cpr: nyPerson.cpr || "",
      fornavn: nyPerson.fornavn || "",
      efternavn: nyPerson.efternavn || "",
      adresse: nyPerson.adresse || "",
      postnr: nyPerson.postnr || "",
      by: nyPerson.by || "",
      telefon: nyPerson.telefon || "",
      status: nyPerson.status as Person["status"] || "aktiv",
      noter: nyPerson.noter || "",
      oprettet: new Date().toISOString().split("T")[0],
    };
    try {
      await personerApi.create(person);
      setPersoner([person, ...personer]);
      setNyPerson({ status: "aktiv" });
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
        <span>Indlæser personer...</span>
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
              placeholder="Søg navn, CPR..."
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
                <DialogTitle>Opret person i KR</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fornavn</Label>
                    <Input value={nyPerson.fornavn || ""} onChange={(e) => setNyPerson({ ...nyPerson, fornavn: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Efternavn</Label>
                    <Input value={nyPerson.efternavn || ""} onChange={(e) => setNyPerson({ ...nyPerson, efternavn: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">CPR-nummer</Label>
                  <Input placeholder="DDMMÅÅ-XXXX" value={nyPerson.cpr || ""} onChange={(e) => setNyPerson({ ...nyPerson, cpr: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Adresse</Label>
                  <Input value={nyPerson.adresse || ""} onChange={(e) => setNyPerson({ ...nyPerson, adresse: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Postnr</Label>
                    <Input value={nyPerson.postnr || ""} onChange={(e) => setNyPerson({ ...nyPerson, postnr: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">By</Label>
                    <Input value={nyPerson.by || ""} onChange={(e) => setNyPerson({ ...nyPerson, by: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Telefon</Label>
                  <Input value={nyPerson.telefon || ""} onChange={(e) => setNyPerson({ ...nyPerson, telefon: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={nyPerson.status || "aktiv"} onValueChange={(v) => setNyPerson({ ...nyPerson, status: v as Person["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktiv">Aktiv</SelectItem>
                      <SelectItem value="eftersøgt">Eftersøgt</SelectItem>
                      <SelectItem value="anholdt">Anholdt</SelectItem>
                      <SelectItem value="sigtet">Sigtet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Noter</Label>
                  <Textarea value={nyPerson.noter || ""} onChange={(e) => setNyPerson({ ...nyPerson, noter: e.target.value })} rows={3} />
                </div>
                <Button onClick={opretPerson} disabled={saving} className="w-full mt-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Opret person
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1.5 overflow-y-auto flex-1">
          {filtreret.map((person) => (
            <button
              key={person.id}
              onClick={() => setValgtPerson(person)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                valgtPerson?.id === person.id
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-secondary/50 border border-transparent hover:bg-secondary"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{person.fornavn} {person.efternavn}</p>
                <p className="text-xs text-muted-foreground font-mono">{person.cpr}</p>
              </div>
              <Badge variant="outline" className={statusConfig[person.status].className}>
                {statusConfig[person.status].label}
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
        {valgtPerson ? (
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{valgtPerson.fornavn} {valgtPerson.efternavn}</CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">{valgtPerson.cpr}</p>
                  </div>
                </div>
                <Badge variant="outline" className={statusConfig[valgtPerson.status].className}>
                  {statusConfig[valgtPerson.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {valgtPerson.status === "eftersøgt" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-sm text-warning font-medium">Person er registreret som eftersøgt</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Adresse" value={valgtPerson.adresse} />
                <InfoField label="Postnr / By" value={`${valgtPerson.postnr} ${valgtPerson.by}`} />
                <InfoField label="Telefon" value={valgtPerson.telefon} />
                <InfoField label="Oprettet" value={valgtPerson.oprettet} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Noter</p>
                <div className="p-3 rounded-lg bg-muted/50 text-sm">{valgtPerson.noter}</div>
              </div>

              {/* Status ændring */}
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-xs text-muted-foreground">Skift status</p>
                <div className="flex flex-wrap gap-2">
                  {(["aktiv", "eftersøgt", "anholdt", "sigtet"] as Person["status"][]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={valgtPerson.status === s ? "default" : "outline"}
                      disabled={valgtPerson.status === s || updatingStatus}
                      onClick={async () => {
                        setUpdatingStatus(true);
                        try {
                          await personerApi.update(valgtPerson.id, { status: s });
                          const updated = { ...valgtPerson, status: s };
                          setValgtPerson(updated);
                          setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
                        } catch (err) {
                          console.error("Fejl ved statusændring:", err);
                        }
                        setUpdatingStatus(false);
                      }}
                    >
                      {s === "eftersøgt" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {statusConfig[s].label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Opret sigtelse */}
              <div className="pt-2 border-t border-border">
                <Button
                  size="sm"
                  onClick={() => setSigtelseDialogOpen(true)}
                  className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Scale className="w-4 h-4" />
                  Opret sigtelse
                </Button>
              </div>

              {/* Sigtelse historik */}
              {sigtelser.filter((s) => s.personId === valgtPerson.id).length > 0 && (
                <div className="pt-2 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tidligere sigtelser</p>
                  {sigtelser.filter((s) => s.personId === valgtPerson.id).map((sig) => (
                    <div key={sig.id} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1.5">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-foreground">Sigtelse — {sig.dato}</p>
                        <div className="flex gap-1">
                          {sig.erkender === true && <Badge className="bg-success/20 text-success border-success/30 text-[10px]">Erkender</Badge>}
                          {sig.erkender === false && <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px]">Erkender ikke</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-warning font-mono font-semibold">{sig.totalBoede.toLocaleString("da-DK")} kr</span>
                        {sig.faengselMaaneder > 0 && <span className="text-destructive font-semibold">{sig.faengselMaaneder} md. fængsel</span>}
                        {sig.fratagKoerekort && <span className="text-destructive">Kørekort frataget</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sig.sigtelseBoeder.map((b) => b.paragraf).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Vælg en person for at se detaljer
          </div>
        )}
      </div>

      {valgtPerson && (
        <OpretSigtelseDialog
          open={sigtelseDialogOpen}
          onOpenChange={setSigtelseDialogOpen}
          person={valgtPerson}
          onSigtelseOprettet={(sig) => {
            setSigtelser((prev) => [sig, ...prev]);
            // Auto-set status to sigtet
            const updated = { ...valgtPerson, status: "sigtet" as const };
            setValgtPerson(updated);
            setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            personerApi.update(valgtPerson.id, { status: "sigtet" }).catch(console.error);
            toast("Sigtelse oprettet");
          }}
        />
      )}
    </div>
  );
};

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value}</p>
  </div>
);

export default KRRegister;
