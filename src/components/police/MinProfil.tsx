import { useState } from "react";
import { Shield, Camera, Lock, FileText, Award, BadgeCheck, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { betjenteApi } from "@/lib/api";
import type { Betjent } from "@/types/police";
import { toast } from "@/components/ui/sonner";

interface MinProfilProps {
  currentUser: Betjent;
  isAdmin: boolean;
  onUserUpdate: (user: Betjent) => void;
}

const MinProfil = ({ currentUser, isAdmin, onUserUpdate }: MinProfilProps) => {
  const [imageUrl, setImageUrl] = useState(currentUser.profilBillede || "");
  const [savingImage, setSavingImage] = useState(false);

  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [savingPass, setSavingPass] = useState(false);

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

  // Mock applications data
  const ansoegninger = [
    { id: 1, titel: "Ansøgning om forfremmelse", status: "Afventer", dato: "2025-12-01" },
    { id: 2, titel: "Kursus: Avanceret efterforskning", status: "Godkendt", dato: "2025-11-15" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
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
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono text-foreground">{currentUser.antalSager ?? 0}</p>
            <p className="text-xs text-muted-foreground">Sager skrevet</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Certificates & permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award className="w-4 h-4 text-warning" /> Uddannelser & Certifikater
          </h2>
          {currentUser.uddannelser.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {currentUser.uddannelser.map((u, i) => (
                <span key={i} className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-medium border border-warning/20">
                  {u}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Ingen uddannelser registreret</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-accent" /> Tilladelser
          </h2>
          {currentUser.tilladelser && currentUser.tilladelser.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {currentUser.tilladelser.map((t, i) => (
                <span key={i} className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium border border-accent/20">
                  {t}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Ingen specielle tilladelser</p>
          )}
        </div>
      </div>

      {/* Applications */}
      <div className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> Mine Ansøgninger
        </h2>
        <div className="space-y-2">
          {ansoegninger.map((a) => (
            <div key={a.id} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-secondary/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">{a.titel}</p>
                <p className="text-xs text-muted-foreground">{a.dato}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                a.status === "Godkendt"
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning"
              }`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MinProfil;
