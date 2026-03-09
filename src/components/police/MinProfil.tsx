import { useState, useEffect } from "react";
import {
  Shield, Camera, Lock, FileText, Award, BadgeCheck, Briefcase,
  Star, ChevronDown, ChevronRight, CheckCircle2, X, Pencil
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { betjenteApi } from "@/lib/api";
import type { Betjent } from "@/types/police";
import { toast } from "@/components/ui/sonner";
import { getDefaultTilladelser, availablePermissions } from "@/lib/permissions";

interface MinProfilProps {
  currentUser: Betjent;
  isAdmin: boolean;
  onUserUpdate: (user: Betjent) => void;
  onTabChange?: (tab: string) => void;
}

const MinProfil = ({ currentUser, isAdmin, onUserUpdate, onTabChange }: MinProfilProps) => {
  const [imageUrl, setImageUrl] = useState(currentUser.profilBillede || "");
  const [savingImage, setSavingImage] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleSaveImage = async () => {
    setSavingImage(true);
    try {
      await betjenteApi.update(currentUser.id, { profilBillede: imageUrl } as any);
      onUserUpdate({ ...currentUser, profilBillede: imageUrl });
      toast("Profilbillede opdateret");
    } catch {
      toast("Fejl ved opdatering af billede");
    }
    setSavingImage(false);
  };

  const handleChangePassword = async () => {
    setPassError("");
    if (oldPass !== currentUser.kodeord) {
      setPassError("Nuværende kodeord er forkert");
      return;
    }
    if (newPass.length < 4) {
      setPassError("Nyt kodeord skal være mindst 4 tegn");
      return;
    }
    if (newPass !== confirmPass) {
      setPassError("Kodeordene matcher ikke");
      return;
    }
    setSavingPass(true);
    try {
      await betjenteApi.update(currentUser.id, { kodeord: newPass });
      onUserUpdate({ ...currentUser, kodeord: newPass });
      toast("Kodeord ændret");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch {
      toast("Fejl ved ændring af kodeord");
    }
    setSavingPass(false);
  };

  // Compute effective permissions (user's own + rank defaults)
  const rankDefaults = getDefaultTilladelser(currentUser.rang);
  const userTilladelser = currentUser.tilladelser || [];
  const effectiveTilladelser = [...new Set([...rankDefaults, ...userTilladelser])];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const [ansoegninger, setAnsoegninger] = useState<{ id: string; skabelonTitel: string; status: string; dato: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("ansoegninger_indsendelser");
    if (stored) {
      try {
        const all = JSON.parse(stored) as { id: string; skabelonTitel: string; ansoegerBadge: string; status: string; dato: string }[];
        setAnsoegninger(all.filter(a => a.ansoegerBadge === currentUser.badgeNr));
      } catch { /* ignore */ }
    }
  }, [currentUser.badgeNr]);

  return (
    <div className="space-y-6 w-full">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            {currentUser.profilBillede ? (
              <img
                src={currentUser.profilBillede}
                alt="Profil"
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center border-2 border-warning/30">
                <Shield className="w-8 h-8 text-warning" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-success-foreground" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground">
              {currentUser.fornavn} {currentUser.efternavn}
            </h1>
            <p className="text-sm text-muted-foreground">Badge: {currentUser.badgeNr}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                <BadgeCheck className="w-3 h-3" />
                {isAdmin ? "Administrator" : currentUser.rang}
              </span>
              {currentUser.afdeling && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                  <Briefcase className="w-3 h-3" />
                  {currentUser.afdeling}
                </span>
              )}
              {(currentUser.titler || []).map((titel, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium">
                  <Star className="w-3 h-3 text-warning" />
                  {titel}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-foreground">{currentUser.antalSager ?? 0}</p>
            <p className="text-xs text-muted-foreground">Sager skrevet</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile image */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" /> Profilbillede
          </h2>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Billede URL</Label>
            <Input
              placeholder="https://eksempel.dk/billede.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-secondary border-border text-sm"
            />
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-full object-cover border border-border"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
            <Button
              size="sm"
              onClick={handleSaveImage}
              disabled={savingImage}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {savingImage ? "Gemmer..." : "Gem billede"}
            </Button>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Skift adgangskode
          </h2>
          <div className="space-y-2">
            <div>
              <Label className="text-xs text-muted-foreground">Nuværende kodeord</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className="mt-1 bg-secondary border-border text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nyt kodeord</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="mt-1 bg-secondary border-border text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Bekræft nyt kodeord</Label>
              <Input
                type="password"
                placeholder="••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="mt-1 bg-secondary border-border text-sm"
              />
            </div>
            {passError && <p className="text-xs text-destructive">{passError}</p>}
            <Button
              size="sm"
              onClick={handleChangePassword}
              disabled={savingPass}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {savingPass ? "Gemmer..." : "Skift kodeord"}
            </Button>
          </div>
        </div>
      </div>

      {/* Uddannelser & Certifikater & Titler */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Uddannelser */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <button
            onClick={() => toggleSection("udd")}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Award className="w-4 h-4 text-warning" /> Uddannelser
            </h2>
            {expandedSection === "udd" ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex flex-wrap gap-1.5">
            {currentUser.uddannelser.length > 0 ? (
              currentUser.uddannelser.map((u, i) => (
                <span key={i} className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-medium border border-warning/20">
                  {u}
                </span>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Ingen uddannelser</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{currentUser.uddannelser.length} uddannelse(r)</p>
        </div>

        {/* Certifikater */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <button
            onClick={() => toggleSection("cert")}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Certifikater
            </h2>
            {expandedSection === "cert" ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex flex-wrap gap-1.5">
            {(currentUser.certifikater || []).length > 0 ? (
              (currentUser.certifikater || []).map((c, i) => (
                <span key={i} className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium border border-success/20">
                  {c}
                </span>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Ingen certifikater</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{(currentUser.certifikater || []).length} certifikat(er)</p>
        </div>

        {/* Titler */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <button
            onClick={() => toggleSection("titler")}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Titler & Specialroller
            </h2>
            {expandedSection === "titler" ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <div className="flex flex-wrap gap-1.5">
            {(currentUser.titler || []).length > 0 ? (
              (currentUser.titler || []).map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                  {t}
                </span>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Ingen titler tildelt</p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">{(currentUser.titler || []).length} titel(er)</p>
        </div>
      </div>

      {/* Tilladelser */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-accent-foreground" /> Tilladelser
          <span className="text-[10px] text-muted-foreground font-normal ml-1">
            (baseret på rang: {currentUser.rang})
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {availablePermissions.map((perm) => {
            const hasAccess = effectiveTilladelser.includes(perm.id);
            const isRankDefault = rankDefaults.includes(perm.id);
            return (
              <div
                key={perm.id}
                className={`px-3 py-2 rounded-md border text-xs transition-colors ${
                  hasAccess
                    ? "bg-success/10 border-success/30 text-success"
                    : "bg-muted/30 border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${hasAccess ? "bg-success" : "bg-muted-foreground/40"}`} />
                  <span className="font-medium">{perm.label}</span>
                </div>
                {isRankDefault && hasAccess && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Standard for rang</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Applications */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Mine Ansøgninger
        </h2>
        <div className="space-y-2">
          {ansoegninger.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Du har ingen ansøgninger endnu</p>
          ) : (
            ansoegninger.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-secondary/50 border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.skabelonTitel}</p>
                  <p className="text-xs text-muted-foreground">{a.dato}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    a.status === "godkendt"
                      ? "bg-success/15 text-success"
                      : a.status === "afvist"
                      ? "bg-destructive/15 text-destructive"
                      : "bg-warning/15 text-warning"
                  }`}>
                    {a.status === "godkendt" ? "Godkendt" : a.status === "afvist" ? "Afvist" : "Afventer"}
                  </span>
                  {a.status === "afventer" && (
                    <>
                      <button
                        onClick={() => onTabChange?.("ansoegninger")}
                        className="p-1 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors"
                        title="Rediger"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const stored = localStorage.getItem("ansoegninger_indsendelser");
                          if (stored) {
                            const all = JSON.parse(stored).filter((i: any) => i.id !== a.id);
                            localStorage.setItem("ansoegninger_indsendelser", JSON.stringify(all));
                            setAnsoegninger(ansoegninger.filter(x => x.id !== a.id));
                            toast("Ansøgning trukket tilbage");
                          }
                        }}
                        className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                        title="Træk tilbage"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MinProfil;
