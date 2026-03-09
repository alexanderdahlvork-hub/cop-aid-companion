import { useState } from "react";
import {
  FileText, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight,
  Send, Clock, CheckCircle2, XCircle, MessageSquare, GripVertical, Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { alleUddannelser, alleCertifikater, alleTitler } from "@/data/ansatte";
import type { Betjent } from "@/types/police";
import { toast } from "@/components/ui/sonner";
import { getRangIndex } from "@/lib/permissions";
import { betjenteApi } from "@/lib/api";

interface AnsoegingerProps {
  currentUser: Betjent;
  isAdmin: boolean;
  alleBetjente?: Betjent[];
  onBetjentUpdated?: (betjent: Betjent) => void;
}

interface AnsoeningSkabelon {
  id: string;
  titel: string;
  kategori: "uddannelse" | "certifikat" | "titel";
  beskrivelse: string;
  spoergsmaal: string[];
  aktiv: boolean;
  oprettetAf: string;
}

interface IndsendelseData {
  id: string;
  skabelonId: string;
  skabelonTitel: string;
  ansoegerNavn: string;
  ansoegerBadge: string;
  svar: Record<string, string>;
  status: "afventer" | "godkendt" | "afvist";
  dato: string;
  behandletAf?: string;
  kommentar?: string;
}

const defaultSkabeloner: AnsoeningSkabelon[] = [
  {
    id: "1",
    titel: "Efterforskningsuddannelse",
    kategori: "uddannelse",
    beskrivelse: "Ansøgning om at deltage i den avancerede efterforskningsuddannelse.",
    spoergsmaal: [
      "Hvorfor ønsker du at tage denne uddannelse?",
      "Hvilken relevant erfaring har du?",
      "Hvor længe har du arbejdet i politiet?",
    ],
    aktiv: true,
    oprettetAf: "ADM221",
  },
  {
    id: "2",
    titel: "Udrykningscertifikat",
    kategori: "certifikat",
    beskrivelse: "Ansøg om at opnå udrykningscertifikat til blålyskørsel.",
    spoergsmaal: [
      "Har du tidligere erfaring med udrykningskørsel?",
      "Har du bestået køreprøve inden for de sidste 2 år?",
      "Er du villig til at deltage i det 3-ugers kursus?",
    ],
    aktiv: true,
    oprettetAf: "ADM221",
  },
  {
    id: "3",
    titel: "Reaktionspatruljechef",
    kategori: "titel",
    beskrivelse: "Ansøg om titlen som Reaktionspatruljechef i din afdeling.",
    spoergsmaal: [
      "Hvilken afdeling tilhører du?",
      "Beskriv din ledelseserfaring.",
      "Hvilke certifikater har du?",
      "Hvordan vil du håndtere en krisesituation?",
    ],
    aktiv: true,
    oprettetAf: "ADM221",
  },
  {
    id: "4",
    titel: "Våbencertifikat A (Pistol)",
    kategori: "certifikat",
    beskrivelse: "Ansøg om våbencertifikat for standardtjenestevåben.",
    spoergsmaal: [
      "Har du gennemført grundlæggende våbentræning?",
      "Hvornår bestod du senest en skydeprøve?",
    ],
    aktiv: true,
    oprettetAf: "ADM221",
  },
  {
    id: "5",
    titel: "Uddannelsesansvarlig",
    kategori: "titel",
    beskrivelse: "Ansøg om at blive uddannelsesansvarlig i din enhed.",
    spoergsmaal: [
      "Hvilke uddannelser har du selv gennemført?",
      "Har du erfaring med undervisning eller instruktion?",
      "Beskriv hvordan du vil strukturere træningsprogrammer.",
    ],
    aktiv: true,
    oprettetAf: "ADM221",
  },
];

const defaultIndsendelser: IndsendelseData[] = [
  {
    id: "ind1",
    skabelonId: "1",
    skabelonTitel: "Efterforskningsuddannelse",
    ansoegerNavn: "Lars Jensen",
    ansoegerBadge: "PB1042",
    svar: {
      "Hvorfor ønsker du at tage denne uddannelse?": "Jeg ønsker at specialisere mig inden for efterforskning.",
      "Hvilken relevant erfaring har du?": "3 års erfaring med patrulje og mindre efterforskningsopgaver.",
      "Hvor længe har du arbejdet i politiet?": "5 år.",
    },
    status: "afventer",
    dato: "2026-03-05",
  },
  {
    id: "ind2",
    skabelonId: "3",
    skabelonTitel: "Reaktionspatruljechef",
    ansoegerNavn: "Mette Andersen",
    ansoegerBadge: "PA2017",
    svar: {
      "Hvilken afdeling tilhører du?": "NSK",
      "Beskriv din ledelseserfaring.": "Har ledet et hold på 6 betjente i 2 år.",
      "Hvilke certifikater har du?": "Udrykningscertifikat, Våbencertifikat A & B.",
      "Hvordan vil du håndtere en krisesituation?": "Prioritere sikkerhed, koordinere med indsatsleder.",
    },
    status: "afventer",
    dato: "2026-03-07",
  },
];

type View = "liste" | "opret" | "rediger" | "vis_indsendelse" | "ansog";

const Ansoegninger = ({ currentUser, isAdmin }: AnsoegingerProps) => {
  const [skabeloner, setSkabeloner] = useState<AnsoeningSkabelon[]>(defaultSkabeloner);
  const [indsendelser, setIndsendelser] = useState<IndsendelseData[]>(defaultIndsendelser);
  const [view, setView] = useState<View>("liste");
  const [activeTab, setActiveTab] = useState<"skabeloner" | "indsendelser" | "mine">("skabeloner");
  const [selectedSkabelon, setSelectedSkabelon] = useState<AnsoeningSkabelon | null>(null);
  const [selectedIndsendelse, setSelectedIndsendelse] = useState<IndsendelseData | null>(null);

  // Edit/create form state
  const [formTitel, setFormTitel] = useState("");
  const [formKategori, setFormKategori] = useState<"uddannelse" | "certifikat" | "titel">("uddannelse");
  const [formBeskrivelse, setFormBeskrivelse] = useState("");
  const [formSpoergsmaal, setFormSpoergsmaal] = useState<string[]>([""]);

  // Application form state
  const [ansogSvar, setAnsogSvar] = useState<Record<string, string>>({});

  const canManage = isAdmin || getRangIndex(currentUser.rang) <= 2; // Rigspolitichef, Politidirektør, Politimester

  const openCreate = () => {
    setFormTitel("");
    setFormKategori("uddannelse");
    setFormBeskrivelse("");
    setFormSpoergsmaal([""]);
    setSelectedSkabelon(null);
    setView("opret");
  };

  const openEdit = (skabelon: AnsoeningSkabelon) => {
    setFormTitel(skabelon.titel);
    setFormKategori(skabelon.kategori);
    setFormBeskrivelse(skabelon.beskrivelse);
    setFormSpoergsmaal([...skabelon.spoergsmaal]);
    setSelectedSkabelon(skabelon);
    setView("rediger");
  };

  const openApply = (skabelon: AnsoeningSkabelon) => {
    setSelectedSkabelon(skabelon);
    setAnsogSvar({});
    setView("ansog");
  };

  const openIndsendelse = (ind: IndsendelseData) => {
    setSelectedIndsendelse(ind);
    setView("vis_indsendelse");
  };

  const handleSave = () => {
    if (!formTitel.trim()) { toast("Titel er påkrævet"); return; }
    const filtered = formSpoergsmaal.filter((s) => s.trim());
    if (filtered.length === 0) { toast("Tilføj mindst ét spørgsmål"); return; }

    if (view === "opret") {
      const ny: AnsoeningSkabelon = {
        id: Date.now().toString(),
        titel: formTitel,
        kategori: formKategori,
        beskrivelse: formBeskrivelse,
        spoergsmaal: filtered,
        aktiv: true,
        oprettetAf: currentUser.badgeNr,
      };
      setSkabeloner([...skabeloner, ny]);
      toast("Ansøgning oprettet");
    } else if (view === "rediger" && selectedSkabelon) {
      setSkabeloner(skabeloner.map((s) =>
        s.id === selectedSkabelon.id
          ? { ...s, titel: formTitel, kategori: formKategori, beskrivelse: formBeskrivelse, spoergsmaal: filtered }
          : s
      ));
      toast("Ansøgning opdateret");
    }
    setView("liste");
  };

  const handleDelete = (id: string) => {
    setSkabeloner(skabeloner.filter((s) => s.id !== id));
    toast("Ansøgning slettet");
  };

  const handleToggleActive = (id: string) => {
    setSkabeloner(skabeloner.map((s) =>
      s.id === id ? { ...s, aktiv: !s.aktiv } : s
    ));
  };

  const handleSubmitApplication = () => {
    if (!selectedSkabelon) return;
    const unanswered = selectedSkabelon.spoergsmaal.filter((q) => !(ansogSvar[q] || "").trim());
    if (unanswered.length > 0) { toast("Besvar alle spørgsmål"); return; }

    const ny: IndsendelseData = {
      id: Date.now().toString(),
      skabelonId: selectedSkabelon.id,
      skabelonTitel: selectedSkabelon.titel,
      ansoegerNavn: `${currentUser.fornavn} ${currentUser.efternavn}`,
      ansoegerBadge: currentUser.badgeNr,
      svar: { ...ansogSvar },
      status: "afventer",
      dato: new Date().toISOString().split("T")[0],
    };
    setIndsendelser([ny, ...indsendelser]);
    toast("Ansøgning indsendt!");
    setView("liste");
    setActiveTab("mine");
  };

  const handleApprove = (id: string, kommentar: string) => {
    setIndsendelser(indsendelser.map((i) =>
      i.id === id ? { ...i, status: "godkendt" as const, behandletAf: currentUser.badgeNr, kommentar } : i
    ));
    toast("Ansøgning godkendt");
    setView("liste");
  };

  const handleReject = (id: string, kommentar: string) => {
    setIndsendelser(indsendelser.map((i) =>
      i.id === id ? { ...i, status: "afvist" as const, behandletAf: currentUser.badgeNr, kommentar } : i
    ));
    toast("Ansøgning afvist");
    setView("liste");
  };

  const addSpoergsmaal = () => setFormSpoergsmaal([...formSpoergsmaal, ""]);
  const removeSpoergsmaal = (idx: number) => setFormSpoergsmaal(formSpoergsmaal.filter((_, i) => i !== idx));
  const updateSpoergsmaal = (idx: number, val: string) => {
    const copy = [...formSpoergsmaal];
    copy[idx] = val;
    setFormSpoergsmaal(copy);
  };

  const mineIndsendelser = indsendelser.filter((i) => i.ansoegerBadge === currentUser.badgeNr);
  const afventendeIndsendelser = indsendelser.filter((i) => i.status === "afventer");

  const kategoriLabel = (k: string) => {
    switch (k) {
      case "uddannelse": return "Uddannelse";
      case "certifikat": return "Certifikat";
      case "titel": return "Titel";
      default: return k;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "afventer": return <Clock className="w-3.5 h-3.5 text-warning" />;
      case "godkendt": return <CheckCircle2 className="w-3.5 h-3.5 text-success" />;
      case "afvist": return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "afventer": return "bg-warning/15 text-warning";
      case "godkendt": return "bg-success/15 text-success";
      case "afvist": return "bg-destructive/15 text-destructive";
      default: return "";
    }
  };

  // ─── Create/Edit form ─────────────────────
  if (view === "opret" || view === "rediger") {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">
            {view === "opret" ? "Opret ny ansøgningsskabelon" : "Rediger ansøgning"}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => setView("liste")}>
            <X className="w-4 h-4 mr-1" /> Annuller
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Titel</Label>
            <Input
              value={formTitel}
              onChange={(e) => setFormTitel(e.target.value)}
              placeholder="F.eks. Efterforskningsuddannelse"
              className="mt-1 bg-secondary border-border text-sm"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Kategori</Label>
            <div className="flex gap-2 mt-1">
              {(["uddannelse", "certifikat", "titel"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setFormKategori(k)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                    formKategori === k
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {kategoriLabel(k)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Beskrivelse</Label>
            <Textarea
              value={formBeskrivelse}
              onChange={(e) => setFormBeskrivelse(e.target.value)}
              placeholder="Beskriv hvad denne ansøgning dækker..."
              className="mt-1 bg-secondary border-border text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Spørgsmål</Label>
              <Button variant="ghost" size="sm" onClick={addSpoergsmaal} className="text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tilføj spørgsmål
              </Button>
            </div>
            {formSpoergsmaal.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-2.5 shrink-0" />
                <span className="text-xs text-muted-foreground mt-2.5 shrink-0 w-5">{i + 1}.</span>
                <Input
                  value={s}
                  onChange={(e) => updateSpoergsmaal(i, e.target.value)}
                  placeholder="Skriv dit spørgsmål..."
                  className="bg-secondary border-border text-sm flex-1"
                />
                {formSpoergsmaal.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeSpoergsmaal(i)} className="shrink-0 text-muted-foreground hover:text-destructive h-9 w-9">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Check className="w-4 h-4 mr-1" />
              {view === "opret" ? "Opret ansøgning" : "Gem ændringer"}
            </Button>
            <Button variant="outline" onClick={() => setView("liste")}>Annuller</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Apply form ────────────────────────────
  if (view === "ansog" && selectedSkabelon) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Ansøg: {selectedSkabelon.titel}</h1>
          <Button variant="ghost" size="sm" onClick={() => setView("liste")}>
            <X className="w-4 h-4 mr-1" /> Annuller
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
              selectedSkabelon.kategori === "uddannelse" ? "bg-warning/15 text-warning" :
              selectedSkabelon.kategori === "certifikat" ? "bg-success/15 text-success" :
              "bg-primary/15 text-primary"
            )}>
              {kategoriLabel(selectedSkabelon.kategori)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{selectedSkabelon.beskrivelse}</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          {selectedSkabelon.spoergsmaal.map((q, i) => (
            <div key={i}>
              <Label className="text-xs text-foreground font-medium">{i + 1}. {q}</Label>
              <Textarea
                value={ansogSvar[q] || ""}
                onChange={(e) => setAnsogSvar({ ...ansogSvar, [q]: e.target.value })}
                placeholder="Skriv dit svar..."
                className="mt-1 bg-secondary border-border text-sm min-h-[70px]"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSubmitApplication} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Send className="w-4 h-4 mr-1" /> Indsend ansøgning
            </Button>
            <Button variant="outline" onClick={() => setView("liste")}>Annuller</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── View submission ───────────────────────
  if (view === "vis_indsendelse" && selectedIndsendelse) {
    const ReviewComment = () => {
      const [kommentar, setKommentar] = useState("");
      return (
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> Behandling
          </h2>
          <Textarea
            value={kommentar}
            onChange={(e) => setKommentar(e.target.value)}
            placeholder="Skriv en kommentar (valgfrit)..."
            className="bg-secondary border-border text-sm min-h-[60px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleApprove(selectedIndsendelse.id, kommentar)}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Godkend
            </Button>
            <Button
              onClick={() => handleReject(selectedIndsendelse.id, kommentar)}
              variant="destructive"
            >
              <XCircle className="w-4 h-4 mr-1" /> Afvis
            </Button>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Ansøgning: {selectedIndsendelse.skabelonTitel}</h1>
          <Button variant="ghost" size="sm" onClick={() => setView("liste")}>
            <X className="w-4 h-4 mr-1" /> Tilbage
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{selectedIndsendelse.ansoegerNavn}</p>
              <p className="text-xs text-muted-foreground">Badge: {selectedIndsendelse.ansoegerBadge} · {selectedIndsendelse.dato}</p>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", statusColor(selectedIndsendelse.status))}>
              {statusIcon(selectedIndsendelse.status)}
              {selectedIndsendelse.status === "afventer" ? "Afventer" : selectedIndsendelse.status === "godkendt" ? "Godkendt" : "Afvist"}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          {Object.entries(selectedIndsendelse.svar).map(([q, a], i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-foreground mb-1">{i + 1}. {q}</p>
              <p className="text-sm text-muted-foreground bg-secondary/50 rounded-md px-3 py-2 border border-border">{a}</p>
            </div>
          ))}
        </div>

        {selectedIndsendelse.kommentar && (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-xs font-semibold text-foreground mb-1">Kommentar fra {selectedIndsendelse.behandletAf}:</p>
            <p className="text-sm text-muted-foreground">{selectedIndsendelse.kommentar}</p>
          </div>
        )}

        {canManage && selectedIndsendelse.status === "afventer" && <ReviewComment />}
      </div>
    );
  }

  // ─── List view ─────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Ansøgninger
        </h1>
        {canManage && (
          <Button size="sm" onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Opret ansøgning
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-1 w-fit">
        {[
          { id: "skabeloner" as const, label: "Ansøgninger", count: skabeloner.filter(s => s.aktiv).length },
          ...(canManage ? [{ id: "indsendelser" as const, label: "Indsendte", count: afventendeIndsendelser.length }] : []),
          { id: "mine" as const, label: "Mine ansøgninger", count: mineIndsendelser.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === tab.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Skabeloner */}
      {activeTab === "skabeloner" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skabeloner.filter(s => s.aktiv || canManage).map((skabelon) => (
            <div key={skabelon.id} className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                    skabelon.kategori === "uddannelse" ? "bg-warning/15 text-warning" :
                    skabelon.kategori === "certifikat" ? "bg-success/15 text-success" :
                    "bg-primary/15 text-primary"
                  )}>
                    {kategoriLabel(skabelon.kategori)}
                  </span>
                  {!skabelon.aktiv && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">Inaktiv</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(skabelon)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleToggleActive(skabelon.id)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      {skabelon.aktiv ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(skabelon.id)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{skabelon.titel}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{skabelon.beskrivelse}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] text-muted-foreground">{skabelon.spoergsmaal.length} spørgsmål</p>
                {skabelon.aktiv && (
                  <Button size="sm" variant="outline" onClick={() => openApply(skabelon)} className="text-xs h-7">
                    <Send className="w-3 h-3 mr-1" /> Ansøg
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Indsendte (admin view) */}
      {activeTab === "indsendelser" && canManage && (
        <div className="space-y-2">
          {indsendelser.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Ingen indsendelser endnu</p>
          ) : (
            indsendelser.map((ind) => (
              <button
                key={ind.id}
                onClick={() => openIndsendelse(ind)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                    {ind.ansoegerNavn.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{ind.ansoegerNavn}</p>
                    <p className="text-xs text-muted-foreground">{ind.skabelonTitel} · {ind.dato}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", statusColor(ind.status))}>
                    {statusIcon(ind.status)}
                    {ind.status === "afventer" ? "Afventer" : ind.status === "godkendt" ? "Godkendt" : "Afvist"}
                  </span>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Mine ansøgninger */}
      {activeTab === "mine" && (
        <div className="space-y-2">
          {mineIndsendelser.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Du har ikke indsendt nogen ansøgninger endnu</p>
          ) : (
            mineIndsendelser.map((ind) => (
              <button
                key={ind.id}
                onClick={() => openIndsendelse(ind)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{ind.skabelonTitel}</p>
                  <p className="text-xs text-muted-foreground">Indsendt: {ind.dato}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1", statusColor(ind.status))}>
                    {statusIcon(ind.status)}
                    {ind.status === "afventer" ? "Afventer" : ind.status === "godkendt" ? "Godkendt" : "Afvist"}
                  </span>
                  {ind.kommentar && <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Ansoegninger;
