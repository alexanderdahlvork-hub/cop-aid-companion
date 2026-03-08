import { useState, useEffect } from "react";
import { Search, Plus, User, AlertTriangle, Loader2, Scale, X, FileText, Package, Link2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { personerApi, sigtelserApi } from "@/lib/api";
import type { Person, Sigtelse } from "@/types/police";
import OpretSigtelseDialog from "./OpretSigtelseDialog";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<Person["status"], { label: string; dot: string; bg: string }> = {
  aktiv: { label: "Aktiv", dot: "bg-success", bg: "bg-success/10 text-success border-success/20" },
  eftersøgt: { label: "Eftersøgt", dot: "bg-warning", bg: "bg-warning/10 text-warning border-warning/20" },
  anholdt: { label: "Anholdt", dot: "bg-destructive", bg: "bg-destructive/10 text-destructive border-destructive/20" },
  sigtet: { label: "Sigtet", dot: "bg-primary", bg: "bg-primary/10 text-primary border-primary/20" },
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

  // Document fields (local state, for UI)
  const [dokNavn, setDokNavn] = useState("");
  const [dokUrl, setDokUrl] = useState("");
  const [dokumenter, setDokumenter] = useState<{ navn: string; url: string }[]>([]);

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

  const totalBoede = personSigtelser.reduce((sum, s) => sum + s.totalBoede, 0);
  const totalFaengsel = personSigtelser.reduce((sum, s) => sum + s.faengselMaaneder, 0);
  const totalKlip = personSigtelser.reduce((sum, s) => {
    return sum + s.sigtelseBoeder.reduce((k, b) => k, 0);
  }, 0);

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
        valgtPerson ? "w-64 shrink-0 hidden lg:flex" : "flex-1"
      )}>
        <div className="p-3 border-b border-border flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Søg navn eller CPR..."
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

        <div className="flex-1 overflow-y-auto">
          {filtreret.map((person) => {
            const active = valgtPerson?.id === person.id;
            const pSigtelser = sigtelser.filter(s => s.personId === person.id);
            return (
              <button
                key={person.id}
                onClick={() => setValgtPerson(person)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-b border-border/30 transition-colors",
                  active ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/30"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusConfig[person.status].dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{person.fornavn} {person.efternavn}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{person.cpr}</p>
                </div>
                {pSigtelser.length > 0 && (
                  <span className="text-[9px] text-muted-foreground">{pSigtelser.length}</span>
                )}
              </button>
            );
          })}
          {filtreret.length === 0 && (
            <p className="text-center py-8 text-xs text-muted-foreground">Ingen resultater</p>
          )}
        </div>
      </div>

      {/* Right: Detail view — inspired by reference but custom design */}
      {valgtPerson ? (
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5 max-w-3xl">
            {/* Back button on mobile */}
            <button
              onClick={() => setValgtPerson(null)}
              className="lg:hidden flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
            >
              <X className="w-3.5 h-3.5" /> Tilbage
            </button>

            {/* Person header row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {valgtPerson.fornavn[0]}{valgtPerson.efternavn[0]}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">{valgtPerson.fornavn} {valgtPerson.efternavn}</h2>
                  <p className="text-xs text-muted-foreground font-mono">{valgtPerson.cpr}</p>
                </div>
              </div>
              <Badge className={cn("text-[10px] border", statusConfig[valgtPerson.status].bg)}>
                {statusConfig[valgtPerson.status].label}
              </Badge>
            </div>

            {valgtPerson.status === "eftersøgt" && (
              <div className="flex items-center gap-2 p-2.5 rounded-md bg-warning/8 border border-warning/15">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <span className="text-xs text-warning font-medium">Denne person er eftersøgt</span>
              </div>
            )}

            {/* Info fields — dark input style like reference */}
            <div className="space-y-3">
              <SectionTitle>Personoplysninger</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <ReadonlyField label="Fornavn" value={valgtPerson.fornavn} />
                <ReadonlyField label="Efternavn" value={valgtPerson.efternavn} />
                <ReadonlyField label="CPR-nummer" value={valgtPerson.cpr} />
                <ReadonlyField label="Telefon" value={valgtPerson.telefon || "—"} />
                <ReadonlyField label="Adresse" value={valgtPerson.adresse} />
                <ReadonlyField label="Postnr / By" value={`${valgtPerson.postnr} ${valgtPerson.by}`} />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <SectionTitle>Status</SectionTitle>
              <Select
                value={valgtPerson.status}
                onValueChange={async (v) => {
                  const s = v as Person["status"];
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
                <SelectTrigger className="h-9 text-xs bg-muted/30 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["aktiv", "eftersøgt", "anholdt", "sigtet"] as const).map((s) => (
                    <SelectItem key={s} value={s}>
                      <span className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", statusConfig[s].dot)} />
                        {statusConfig[s].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beskrivelse / noter */}
            {valgtPerson.noter && (
              <div className="space-y-2">
                <SectionTitle>Beskrivelse</SectionTitle>
                <div className="bg-muted/30 border border-border rounded-md p-3 text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[60px]">
                  {valgtPerson.noter}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <ReadonlyField label="Oprettet af" value="System" />
              <ReadonlyField label="Oprettet" value={valgtPerson.oprettet} />
            </div>

            {/* Sigtelser — table style like reference */}
            <div className="space-y-3">
              <SectionTitle>Sigtelser</SectionTitle>

              {personSigtelser.length > 0 ? (
                <div className="rounded-md border border-border overflow-hidden">
                  {/* Table header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 bg-muted/40 border-b border-border px-3 py-2">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Beskrivelse</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Lovhenvisning</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Dato</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Bøde (DKK)</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Fængsel</span>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">Handlinger</span>
                  </div>

                  {/* Rows */}
                  {personSigtelser.map((sig) =>
                    sig.sigtelseBoeder.map((b, i) => (
                      <div key={`${sig.id}-${i}`} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 px-3 py-2 border-b border-border/30 hover:bg-muted/10 transition-colors">
                        <span className="text-xs text-foreground truncate pr-2">{b.beskrivelse}</span>
                        <span className="text-xs text-muted-foreground font-mono">{b.paragraf || "—"}</span>
                        <span className="text-xs text-muted-foreground">{sig.dato}</span>
                        <span className="text-xs font-mono text-warning">{b.beloeb.toLocaleString("da-DK")} kr</span>
                        <span className="text-xs text-foreground">{b.faengselMaaneder > 0 ? `${b.faengselMaaneder} måneder` : "—"}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {sig.erkender === true ? "✓ Erk." : sig.erkender === false ? "✗ Nægter" : "—"}
                        </span>
                      </div>
                    ))
                  )}

                  {/* Total row */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr] gap-0 px-3 py-2.5 bg-primary/5 border-t border-primary/15">
                    <span className="text-xs font-semibold text-foreground">Total</span>
                    <span />
                    <span />
                    <span className="text-xs font-bold font-mono text-warning">{totalBoede.toLocaleString("da-DK")} DKK</span>
                    <span className="text-xs font-bold text-foreground">{totalFaengsel > 0 ? `${totalFaengsel} måneder` : "—"}</span>
                    <span />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Ingen sigtelser registreret</p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setSigtelseDialogOpen(true)}
                  className="h-8 text-xs gap-1.5"
                >
                  <Plus className="w-3 h-3" /> Tilføj sigtelse
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 ml-auto"
                  onClick={() => {
                    // Future: generate bødeforlæg
                    toast("Bødeforlæg-funktion kommer snart");
                  }}
                >
                  <FileText className="w-3 h-3" /> Opret bødeforlæg
                </Button>
              </div>
            </div>

            {/* Dokumenter section */}
            <div className="space-y-3">
              <SectionTitle>Dokumenter</SectionTitle>
              {dokumenter.length > 0 ? (
                <div className="space-y-1.5">
                  {dokumenter.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/30 border border-border rounded-md px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs text-foreground">{d.navn}</span>
                      </div>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> Åbn
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Ingen dokumenter tilknyttet denne sag.</p>
              )}
              <div className="space-y-2">
                <Input
                  placeholder="Dokumentnavn"
                  value={dokNavn}
                  onChange={(e) => setDokNavn(e.target.value)}
                  className="h-8 text-xs bg-muted/30 border-border"
                />
                <Input
                  placeholder="Dokument URL"
                  value={dokUrl}
                  onChange={(e) => setDokUrl(e.target.value)}
                  className="h-8 text-xs bg-muted/30 border-border"
                />
                <Button
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5"
                  disabled={!dokNavn.trim()}
                  onClick={() => {
                    setDokumenter([...dokumenter, { navn: dokNavn, url: dokUrl }]);
                    setDokNavn("");
                    setDokUrl("");
                    toast("Dokument tilføjet");
                  }}
                >
                  <Plus className="w-3 h-3" /> Tilføj dokument
                </Button>
              </div>
            </div>

            {/* Beslaglagte genstande */}
            <div className="space-y-3">
              <SectionTitle>Beslaglagte genstande</SectionTitle>
              {personSigtelser.some(s => s.rapport.konfiskeredeGenstande) ? (
                <div className="space-y-1">
                  {personSigtelser.filter(s => s.rapport.konfiskeredeGenstande).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 bg-muted/30 border border-border rounded-md px-3 py-2">
                      <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-foreground">{s.rapport.konfiskeredeGenstande}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{s.dato}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Ingen beslaglagte genstande registreret</p>
              )}
            </div>
          </div>
        </ScrollArea>
      ) : (
        filtreret.length > 0 && (
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

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-foreground">{children}</h3>
);

const ReadonlyField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
    <div className="bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-foreground min-h-[34px] flex items-center">
      {value || "—"}
    </div>
  </div>
);

export default KRRegister;
