import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ChangePasswordDialogProps {
  open: boolean;
  onChangePassword: (newPassword: string) => void;
}

const ChangePasswordDialog = ({ open, onChangePassword }: ChangePasswordDialogProps) => {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (newPass.length < 4) {
      setError("Kodeord skal være mindst 4 tegn");
      return;
    }
    if (newPass !== confirmPass) {
      setError("Kodeordene matcher ikke");
      return;
    }
    if (newPass === "1234") {
      setError("Vælg et andet kodeord end standardkoden");
      return;
    }
    onChangePassword(newPass);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Skift kodeord</DialogTitle>
          <DialogDescription>
            Det er dit første login — vælg venligst et nyt kodeord.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs text-muted-foreground">Nyt kodeord</Label>
            <Input
              type="password"
              placeholder="••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Bekræft kodeord</Label>
            <Input
              type="password"
              placeholder="••••••"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="mt-1 bg-secondary border-border"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={handleSubmit} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Gem nyt kodeord
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;
