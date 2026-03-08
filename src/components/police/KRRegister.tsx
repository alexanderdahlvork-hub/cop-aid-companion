import { useState, useEffect } from "react";
import { Search, Plus, User, AlertTriangle, Loader2, Scale, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { personerApi, sigtelserApi } from "@/lib/api";
import type { Person, Sigtelse } from "@/types/police";
import OpretSigtelseDialog from "./OpretSigtelseDialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<Person["status"], { label: string; dot: string; bg: string }> = {
  aktiv: { label: "Aktiv", dot: "bg-success", bg: "bg-success/10 text-success" },
  eftersøgt: { label: "Eftersøgt", dot: "bg-warning", bg: "bg-warning/10 text-warning" },
  anholdt: { label: "Anholdt", dot: "bg-destructive", bg: "bg-destructive/10 text-destructive" },
  sigtet: { label: "Sigtet", dot: "bg-primary", bg: "bg-primary/10 text-primary" },
};

type DetailTab = "info" | "sigtelser";

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
  const [tab, setTab] = useState<DetailTab>("info");

  useEffect(() => {
    const load = async () => {
      try {
        const [personData, sigtelseData] = await Promise.all([
          personerApi.getAll(),
          sigtelserApi.getAll(),
        ]);
        setPersoner(personData);
        setSigtelser(sigtelseData);
      } catch (err) {
        console.error("Fejl ved indlæsning:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtreret = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  const personSigtelser = valgtPerson ? sigtelser.filter((s) => s.personId === valgtPerson.id) : [];

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
        <span>Indlæser...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: Person list */}
      <div className={cn(
        "flex flex-col border-r border-border bg-card/30",
        valgtPerson ? "w-72 shrink-0 hidden lg:flex" : "flex-1"
      )}>
        {/* Search + create */}
        <div className="p-3 border-b border-border flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Søg..."
              value={soegning}
              onChange={(e) => setSoegning(e.target.value)}
              className="pl-8 h-8 text-xs bg-background border-border"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 w-8 p-0 shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm">Opret person</DialogTitle>
              </DialogHeader>
              <div className="grid gap-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fornavn</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.fornavn || ""} onChange={(e) => setNyPerson({ ...nyPerson, fornavn: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Efternavn</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.efternavn || ""} onChange={(e) => setNyPerson({ ...nyPerson, efternavn: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">CPR</Label>
                  <Input className="h-8 text-sm mt-0.5" placeholder="DDMMÅÅ-XXXX" value={nyPerson.cpr || ""} onChange={(e) => setNyPerson({ ...nyPerson, cpr: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Adresse</Label>
                  <Input className="h-8 text-sm mt-0.5" value={nyPerson.adresse || ""} onChange={(e) => setNyPerson({ ...nyPerson, adresse: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Postnr</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.postnr || ""} onChange={(e) => setNyPerson({ ...nyPerson, postnr: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">By</Label>
                    <Input className="h-8 text-sm mt-0.5" value={nyPerson.by || ""} onChange={(e) => setNyPerson({ ...nyPerson, by: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Telefon</Label>
                  <Input className="h-8 text-sm mt-0.5" value={nyPerson.telefon || ""} onChange={(e) => setNyPerson({ ...nyPerson, telefon: e.target.value })} />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={nyPerson.status || "aktiv"} onValueChange={(v) => setNyPerson({ ...nyPerson, status: v as Person["status"] })}>
                    <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(["aktiv", "eftersøgt", "anholdt", "sigtet"] as const).map((s) => (
                        <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Noter</Label>
                  <Textarea className="text-sm mt-0.5" rows={2} value={nyPerson.noter || ""} onChange={(e) => setNyPerson({ ...nyPerson, noter: e.target.value })} />
                </div>
                <Button onClick={opretPerson} disabled={saving} className="h-8 text-xs mt-1">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Opret
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtreret.map((person) => {
            const active = valgtPerson?.id === person.id;
            return (
              <button
                key={person.id}
                onClick={() => { setValgtPerson(person); setTab("info"); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-border/40 transition-colors",
                  active ? "bg-primary/8" : "hover:bg-muted/40"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusConfig[person.status].dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{person.fornavn} {person.efternavn}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{person.cpr}</p>
                </div>
              </button>
            );
          })}
          {filtreret.length === 0 && (
            <p className="text-center py-8 text-xs text-muted-foreground">Ingen resultater</p>
          )}
        </div>
      </div>

      {/* Right: Detail */}
      {valgtPerson ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Detail header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card/50">
            <button
              onClick={() => setValgtPerson(null)}
              className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{valgtPerson.fornavn} {valgtPerson.efternavn}</h2>
              <p className="text-[10px] text-muted-foreground font-mono">{valgtPerson.cpr}</p>
            </div>
            <div className={cn("px-2 py-0.5 rounded text-[10px] font-medium", statusConfig[valgtPerson.status].bg)}>
              {statusConfig[valgtPerson.status].label}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border bg-card/30">
            {([
              { id: "info" as const, label: "Oplysninger" },
              { id: "sigtelser" as const, label: `Sigtelser${personSigtelser.length > 0 ? ` (${personSigtelser.length})` : ""}` },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px",
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
            <div className="flex-1" />
            <div className="pr-3 py-1.5">
              <Button
                size="sm"
                onClick={() => setSigtelseDialogOpen(true)}
                className="h-7 text-[10px] gap-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Scale className="w-3 h-3" />
                Opret sigtelse
              </Button>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-5">
            {tab === "info" && (
              <div className="space-y-5 max-w-xl">
                {valgtPerson.status === "eftersøgt" && (
                  <div className="flex items-center gap-2 p-2 rounded bg-warning/8 border border-warning/15">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                    <span className="text-[11px] text-warning font-medium">Eftersøgt person</span>
                  </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Adresse" value={valgtPerson.adresse} />
                  <Field label="Postnr / By" value={`${valgtPerson.postnr} ${valgtPerson.by}`} />
                  <Field label="Telefon" value={valgtPerson.telefon || "—"} />
                  <Field label="Oprettet" value={valgtPerson.oprettet} />
                </div>

                {valgtPerson.noter && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Noter</p>
                    <p className="text-xs text-foreground/80 bg-muted/20 rounded p-2.5 leading-relaxed">{valgtPerson.noter}</p>
                  </div>
                )}

                {/* Status change */}
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Skift status</p>
                  <div className="flex gap-1.5">
                    {(["aktiv", "eftersøgt", "anholdt", "sigtet"] as Person["status"][]).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={valgtPerson.status === s ? "default" : "outline"}
                        disabled={valgtPerson.status === s || updatingStatus}
                        className="h-7 text-[10px] px-2.5"
                        onClick={async () => {
                          setUpdatingStatus(true);
                          try {
                            await personerApi.update(valgtPerson.id, { status: s });
                            const updated = { ...valgtPerson, status: s };
                            setValgtPerson(updated);
                            setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
                          } catch (err) {
                            console.error(err);
                          }
                          setUpdatingStatus(false);
                        }}
                      >
                        {statusConfig[s].label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "sigtelser" && (
              <div className="space-y-3 max-w-2xl">
                {personSigtelser.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">Ingen sigtelser registreret</p>
                ) : (
                  personSigtelser.map((sig) => (
                    <div key={sig.id} className="rounded-md border border-border bg-card/50 overflow-hidden">
                      {/* Sigtelse header */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-muted/20">
                        <span className="text-xs font-medium text-foreground">{sig.dato}</span>
                        <div className="flex items-center gap-2">
                          {sig.erkender === true && <span className="text-[10px] text-success font-medium">Erkender</span>}
                          {sig.erkender === false && <span className="text-[10px] text-destructive font-medium">Nægter</span>}
                        </div>
                      </div>
                      {/* Stats */}
                      <div className="grid grid-cols-3 divide-x divide-border/40 text-center py-2.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Bøde</p>
                          <p className="text-xs font-bold font-mono text-warning">{sig.totalBoede.toLocaleString("da-DK")} kr</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Fængsel</p>
                          <p className="text-xs font-bold text-foreground">{sig.faengselMaaneder > 0 ? `${sig.faengselMaaneder} md.` : "—"}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground uppercase">Kørekort</p>
                          <p className={cn("text-xs font-bold", sig.fratagKoerekort ? "text-destructive" : "text-success")}>
                            {sig.fratagKoerekort ? "Frataget" : "OK"}
                          </p>
                        </div>
                      </div>
                      {/* Charges list */}
                      <div className="px-4 pb-3">
                        <div className="space-y-0.5">
                          {sig.sigtelseBoeder.map((b, i) => (
                            <div key={i} className="flex justify-between text-[10px] py-0.5">
                              <span className="text-muted-foreground">{b.paragraf && `${b.paragraf} — `}{b.beskrivelse}</span>
                              <span className="font-mono text-foreground ml-2 shrink-0">{b.beloeb.toLocaleString("da-DK")} kr</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        !valgtPerson && filtreret.length > 0 && (
          <div className="hidden lg:flex flex-1 items-center justify-center text-muted-foreground text-xs">
            Vælg en person fra listen
          </div>
        )
      )}

      {valgtPerson && (
        <OpretSigtelseDialog
          open={sigtelseDialogOpen}
          onOpenChange={setSigtelseDialogOpen}
          person={valgtPerson}
          onSigtelseOprettet={async (sig) => {
            setSigtelser((prev) => [sig, ...prev]);
            const updated = { ...valgtPerson, status: "sigtet" as const };
            setValgtPerson(updated);
            setPersoner((prev) => prev.map((p) => p.id === updated.id ? updated : p));
            try {
              await Promise.all([
                sigtelserApi.create(sig),
                personerApi.update(valgtPerson.id, { status: "sigtet" }),
              ]);
            } catch (err) {
              console.error("Fejl ved gemning af sigtelse:", err);
              toast.error("Kunne ikke gemme sigtelsen");
            }
            toast("Sigtelse oprettet og gemt");
          }}
        />
      )}
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
    <p className="text-xs text-foreground">{value}</p>
  </div>
);

export default KRRegister;
