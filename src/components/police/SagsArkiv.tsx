import { useState, useEffect } from "react";
import { FileText, Plus, Search, Loader2, FolderOpen, Clock, User, Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { sagerApi } from "@/lib/sagerApi";
import type { Sag } from "@/types/police";

interface SagsArkivProps {
  onOpenSag: (sagId: string, label: string) => void;
  onNewSag: () => void;
}

const SagsArkiv = ({ onOpenSag, onNewSag }: SagsArkivProps) => {
  const [sager, setSager] = useState<Sag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadSager = () => {
    setLoading(true);
    sagerApi.getAll()
      .then(setSager)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSager();
  }, []);

  const filtered = sager.filter(s => {
    const q = search.toLowerCase();
    return s.titel.toLowerCase().includes(q) || s.sagsnummer.toLowerCase().includes(q) ||
      (s.mistaenkte?.some(m => (m.personNavn || "").toLowerCase().includes(q)) ?? false);
  });

  const statusStyle: Record<string, string> = {
    aaben: "bg-success/15 text-success",
    under_efterforskning: "bg-primary/15 text-primary",
    afventer_retten: "bg-warning/15 text-warning",
    lukket: "bg-muted text-muted-foreground",
  };

  const statusLabel: Record<string, string> = {
    aaben: "Åben",
    under_efterforskning: "Efterforskning",
    afventer_retten: "Afventer retten",
    lukket: "Lukket",
  };

  const exportCSV = () => {
    const header = ["Sagsnummer", "Titel", "Status", "Oprettet", "Oprettet af", "Mistænkte"].join(";");
    const rows = filtered.map(s => [
      s.sagsnummer,
      `"${s.titel || ""}"`,
      statusLabel[s.status] || s.status,
      new Date(s.opdateret).toLocaleDateString("da-DK"),
      s.oprettetAf || "",
      s.mistaenkte?.map(m => m.personNavn).join(", ") || ""
    ].join(";"));
    const blob = new Blob(["\ufeff" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sagsarkiv_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const now = new Date();
    const statusCounts: Record<string, number> = {};
    filtered.forEach(s => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

    let h = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sagsarkiv</title><style>
      @page{size:A4 landscape;margin:15mm} body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a2e;margin:0;padding:0}
      .hdr{border-bottom:3px solid #3b82f6;padding-bottom:12px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-end}
      .hdr h1{font-size:18px;margin:0;color:#0f172a} .hdr .meta{font-size:10px;color:#64748b}
      .stats{display:flex;gap:10px;margin-bottom:16px}
      .stat{padding:8px 16px;border-radius:8px;border:1px solid #e2e8f0;text-align:center}
      .stat .n{font-size:18px;font-weight:800} .stat .l{font-size:9px;text-transform:uppercase;color:#64748b}
      table{width:100%;border-collapse:collapse} th{background:#1e293b;color:#f8fafc;padding:6px 10px;text-align:left;font-size:9px;text-transform:uppercase}
      td{padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:10px} tr:nth-child(even){background:#f8fafc}
      .footer{margin-top:20px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:8px}
    </style></head><body>`;
    h += `<div class="hdr"><div><h1>📁 Sagsarkiv — Rapport</h1><div class="meta">Genereret: ${now.toLocaleDateString("da-DK")} ${now.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}</div></div><div class="meta">${filtered.length} sager</div></div>`;
    h += `<div class="stats">`;
    Object.entries(statusCounts).forEach(([k, v]) => {
      h += `<div class="stat"><div class="n">${v}</div><div class="l">${statusLabel[k] || k}</div></div>`;
    });
    h += `</div>`;
    h += `<table><thead><tr><th>Sagsnr.</th><th>Titel</th><th>Status</th><th>Dato</th><th>Oprettet af</th><th>Mistænkte</th></tr></thead><tbody>`;
    filtered.forEach(s => {
      h += `<tr><td style="font-family:monospace">${s.sagsnummer}</td><td>${s.titel || "—"}</td><td>${statusLabel[s.status] || s.status}</td><td>${new Date(s.opdateret).toLocaleDateString("da-DK")}</td><td>${s.oprettetAf || ""}</td><td>${s.mistaenkte?.map(m => m.personNavn).join(", ") || "—"}</td></tr>`;
    });
    h += `</tbody></table><div class="footer">MDT Sagsarkiv · ${filtered.length} sager · ${now.toLocaleDateString("da-DK")}</div></body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(h); win.document.close(); setTimeout(() => win.print(), 400); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Indlæser sager...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Sagsarkiv
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{sager.length} sager i alt</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-1.5 h-8 text-xs" disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button variant="outline" onClick={exportPDF} className="gap-1.5 h-8 text-xs" disabled={filtered.length === 0}>
            <FileDown className="w-3.5 h-3.5" /> PDF
          </Button>
          <Button onClick={onNewSag} className="gap-1.5 h-9 text-xs">
            <Plus className="w-3.5 h-3.5" /> Opret ny sag
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Søg sagsnummer, titel, mistænkt..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-secondary border-border text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">{search ? "Ingen sager matcher søgningen" : "Ingen sager oprettet endnu"}</p>
          {!search && (
            <Button variant="outline" className="mt-3 text-xs" onClick={onNewSag}>
              <Plus className="w-3 h-3 mr-1.5" /> Opret din første sag
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map(sag => (
            <button
              key={sag.id}
              onClick={() => onOpenSag(sag.id, sag.titel || sag.sagsnummer)}
              className="w-full flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:bg-primary/5 hover:border-primary/20 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{sag.sagsnummer}</span>
                  <Badge className={cn("text-[9px] h-4 border-0 px-1.5", statusStyle[sag.status])}>
                    {statusLabel[sag.status]}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{sag.titel || "Uden titel"}</p>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{sag.mistaenkte.length} mistænkte</span>
                  <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(sag.opdateret).toLocaleDateString("da-DK")}</span>
                  <span>{sag.oprettetAf}</span>
                </div>
              </div>
              {sag.tags.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {sag.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SagsArkiv;
