import { useState } from "react";
import { Search, Plus, User, AlertTriangle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Person } from "@/types/police";

const demoPersoner: Person[] = [
  {
    id: "1", cpr: "010185-1234", fornavn: "Anders", efternavn: "Jensen",
    adresse: "Vestergade 12", postnr: "8000", by: "Aarhus C",
    telefon: "12345678", status: "aktiv", noter: "Ingen bemærkninger",
    oprettet: "2024-01-15",
  },
  {
    id: "2", cpr: "150990-5678", fornavn: "Maria", efternavn: "Nielsen",
    adresse: "Nørregade 45", postnr: "1165", by: "København K",
    telefon: "87654321", status: "eftersøgt", noter: "Eftersøgt ifm. sag #4521",
    oprettet: "2024-03-22",
  },
  {
    id: "3", cpr: "200375-9012", fornavn: "Thomas", efternavn: "Pedersen",
    adresse: "Søndergade 8", postnr: "5000", by: "Odense C",
    telefon: "11223344", status: "sigtet", noter: "Sigtet for tyveri §276",
    oprettet: "2024-06-10",
  },
];

const statusConfig: Record<Person["status"], { label: string; className: string }> = {
  aktiv: { label: "Aktiv", className: "bg-success/20 text-success border-success/30" },
  eftersøgt: { label: "Eftersøgt", className: "bg-warning/20 text-warning border-warning/30" },
  anholdt: { label: "Anholdt", className: "bg-destructive/20 text-destructive border-destructive/30" },
  sigtet: { label: "Sigtet", className: "bg-primary/20 text-primary border-primary/30" },
};

const KRRegister = () => {
  const [personer, setPersoner] = useState<Person[]>(demoPersoner);
  const [soegning, setSoegning] = useState("");
  const [valgtPerson, setValgtPerson] = useState<Person | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nyPerson, setNyPerson] = useState<Partial<Person>>({ status: "aktiv" });

  const filtreret = personer.filter((p) =>
    `${p.fornavn} ${p.efternavn} ${p.cpr}`.toLowerCase().includes(soegning.toLowerCase())
  );

  const opretPerson = () => {
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
    setPersoner([person, ...personer]);
    setNyPerson({ status: "aktiv" });
    setDialogOpen(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* List */}
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
                <Button onClick={opretPerson} className="w-full mt-2">Opret person</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Person list */}
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

      {/* Detail */}
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
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Vælg en person for at se detaljer
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

export default KRRegister;
