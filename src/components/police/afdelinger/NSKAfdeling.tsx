import { useState, useEffect } from "react";
import { Search, Users, Network, Eye, Plus, X, Trash2, Edit2, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import AfdelingLayout from "./AfdelingLayout";
import type { Betjent, Person } from "@/types/police";
import { personerApi, tilhoersforholdApi, type TilhoersforholdDB } from "@/lib/api";

interface BandeTilhoer {
  id: string;
  personNavn: string;
  personCpr: string;
  bande: string;
  rolle: string;
  status: "aktiv" | "inaktiv" | "fængslet" | "eftersøgt";
  noter: string;
  tilfojetAf: string;
  tilfojetDato: string;
}

const statusConfig = {
  aktiv: { label: "Aktiv", dot: "bg-success" },
  inaktiv: { label: "Inaktiv", dot: "bg-muted-foreground" },
  fængslet: { label: "Fængslet", dot: "bg-warning" },
  eftersøgt: { label: "Eftersøgt", dot: "bg-destructive" },
};

const STORAGE_KEY = "nsk_netvaerk"; // kept as fallback key

interface NSKAfdelingProps {
  currentUser?: Betjent;
  isAdmin?: boolean;
}

const NetvaerkskortContent = ({ userName }: { userName: string }) => {
  const [tilhoer, setTilhoer] = useState<BandeTilhoer[]>([]);
  const [soegning, setSoegning] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formPersonId, setFormPersonId] = useState("");
  const [formNavn, setFormNavn] = useState("");
  const [formCpr, setFormCpr] = useState("");
  const [formBande, setFormBande] = useState("");
  const [formRolle, setFormRolle] = useState("");
  const [formStatus, setFormStatus] = useState<BandeTilhoer["status"]>("aktiv");
  const [formNoter, setFormNoter] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [personer, setPersoner] = useState<Person[]>([]);
  const [loadingPersoner, setLoadingPersoner] = useState(true);
  const [personSoegning, setPersonSoegning] = useState("");
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setTilhoer(JSON.parse(saved));
    personerApi.getAll()
      .then(setPersoner)
      .catch(console.error)
      .finally(() => setLoadingPersoner(false));
  }, []);

  const filteredPersoner = personer.filter(p => {
    if (!personSoegning) return true;
    const q = personSoegning.toLowerCase();
    return `${p.fornavn} ${p.efternavn}`.toLowerCase().includes(q) || p.cpr.includes(q);
  }).slice(0, 10);

  const selectPerson = (p: Person) => {
    setFormPersonId(p.id);
    setFormNavn(`${p.fornavn} ${p.efternavn}`);
    setFormCpr(p.cpr);
    setPersonSoegning("");
    setShowPersonDropdown(false);
  };

  const save = (items: BandeTilhoer[]) => {
    setTilhoer(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setFormPersonId(""); setFormNavn(""); setFormCpr(""); setFormBande(""); setFormRolle(""); setFormStatus("aktiv"); setFormNoter("");
    setPersonSoegning(""); setShowPersonDropdown(false);
  };

  const handleSubmit = () => {
    if (!formNavn.trim() || !formBande.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      save(tilhoer.map(t => t.id === editId ? {
        ...t, personNavn: formNavn, personCpr: formCpr, bande: formBande,
        rolle: formRolle, status: formStatus, noter: formNoter,
      } : t));
    } else {
      save([{
        id: crypto.randomUUID(), personNavn: formNavn, personCpr: formCpr, bande: formBande,
        rolle: formRolle, status: formStatus, noter: formNoter, tilfojetAf: userName, tilfojetDato: now,
      }, ...tilhoer]);
    }
    resetForm();
  };

  const startEdit = (t: BandeTilhoer) => {
    setEditId(t.id); setFormNavn(t.personNavn); setFormCpr(t.personCpr); setFormBande(t.bande);
    setFormRolle(t.rolle); setFormStatus(t.status); setFormNoter(t.noter); setShowForm(true);
  };

  const slet = (id: string) => save(tilhoer.filter(t => t.id !== id));

  const filtered = tilhoer.filter(t => {
    if (!soegning) return true;
    const q = soegning.toLowerCase();
    return t.personNavn.toLowerCase().includes(q) || t.bande.toLowerCase().includes(q) || t.personCpr.includes(q);
  });

  const bander = [...new Set(filtered.map(t => t.bande))];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Søg navn, CPR eller bande..." value={soegning} onChange={e => setSoegning(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>
        <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Tilføj tilhørsforhold
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
          <p className="text-xs font-semibold text-foreground">{editId ? "Rediger" : "Nyt"} bandetilhørsforhold</p>
          {/* Person search from register */}
          {!editId && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Søg person fra registeret..."
                value={formPersonId ? formNavn : personSoegning}
                onChange={e => { setPersonSoegning(e.target.value); setShowPersonDropdown(true); setFormPersonId(""); setFormNavn(""); setFormCpr(""); }}
                onFocus={() => setShowPersonDropdown(true)}
                className="pl-8 h-8 text-xs"
              />
              {showPersonDropdown && personSoegning && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {loadingPersoner ? (
                    <div className="p-2 text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Indlæser...</div>
                  ) : filteredPersoner.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground">Ingen personer fundet</div>
                  ) : (
                    filteredPersoner.map(p => (
                      <button key={p.id} onClick={() => selectPerson(p)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 text-left">
                        <span className="font-medium">{p.fornavn} {p.efternavn}</span>
                        <span className="text-muted-foreground font-mono text-[10px]">{p.cpr}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {editId && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Personens fulde navn" value={formNavn} onChange={e => setFormNavn(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="CPR-nummer" value={formCpr} onChange={e => setFormCpr(e.target.value)} className="h-8 text-xs" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Bandenavn / Gruppe" value={formBande} onChange={e => setFormBande(e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Rolle (leder, medlem, associeret...)" value={formRolle} onChange={e => setFormRolle(e.target.value)} className="h-8 text-xs" />
          </div>
          <select value={formStatus} onChange={e => setFormStatus(e.target.value as BandeTilhoer["status"])} className="h-8 px-2 text-xs rounded-md border border-input bg-background text-foreground">
            {Object.entries(statusConfig).map(([k, v]) => (<option key={k} value={k}>{v.label}</option>))}
          </select>
          <Textarea placeholder="Noter..." value={formNoter} onChange={e => setFormNoter(e.target.value)} className="text-xs min-h-[50px]" />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={resetForm}><X className="w-3 h-3 mr-1" /> Annuller</Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit}><Check className="w-3 h-3 mr-1" /> {editId ? "Opdater" : "Tilføj"}</Button>
          </div>
        </div>
      )}

      {filtered.length === 0 && !showForm && (
        <div className="text-center py-12 text-muted-foreground">
          <Network className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">Ingen registrerede bandetilhørsforhold</p>
          <p className="text-[10px] mt-1">Tilføj tilhørsforhold for at opbygge netværkskortet</p>
        </div>
      )}

      {bander.map(bande => (
        <div key={bande} className="rounded-lg border border-border bg-card/50 overflow-hidden">
          <div className="px-3 py-2 bg-muted/30 border-b border-border flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">{bande}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 ml-auto">
              {filtered.filter(t => t.bande === bande).length} medlemmer
            </Badge>
          </div>
          <div className="divide-y divide-border">
            {filtered.filter(t => t.bande === bande).map(t => (
              <div key={t.id} className="px-3 py-2 flex items-center gap-3">
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusConfig[t.status].dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">{t.personNavn}</span>
                    {t.rolle && <Badge variant="outline" className="text-[9px] px-1 py-0">{t.rolle}</Badge>}
                    <span className="text-[9px] text-muted-foreground font-mono">{t.personCpr}</span>
                  </div>
                  {t.noter && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.noter}</p>}
                </div>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{statusConfig[t.status].label}</Badge>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(t)} className="p-1 rounded hover:bg-muted transition-colors"><Edit2 className="w-3 h-3 text-muted-foreground" /></button>
                  <button onClick={() => slet(t.id)} className="p-1 rounded hover:bg-muted transition-colors"><Trash2 className="w-3 h-3 text-destructive" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const NSKAfdeling = ({ currentUser, isAdmin }: NSKAfdelingProps) => {
  const userName = currentUser ? `${currentUser.fornavn} ${currentUser.efternavn}` : "Ukendt";
  const isLeder = isAdmin || (currentUser?.rang?.toLowerCase().includes("leder") ?? false);

  return (
    <AfdelingLayout
      afdelingId="nsk"
      titel="NSK — Organiseret Kriminalitet"
      beskrivelse="Netværkskort, bandesporing & efterforskning"
      defaultTabs={[
        { id: "tavle", label: "Opslagstavle", removable: false },
        { id: "netvaerk", label: "Tilhørsforhold", removable: false },
        { id: "observationer", label: "Observationer", removable: false },
      ]}
      currentUserNavn={userName}
      isLeder={isLeder}
      customTabContent={{
        netvaerk: <NetvaerkskortContent userName={userName} />,
      }}
    />
  );
};

export default NSKAfdeling;
