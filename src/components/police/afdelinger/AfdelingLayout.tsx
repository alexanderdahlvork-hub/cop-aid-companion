import { useState, useEffect, ReactNode } from "react";
import { Plus, X, Edit2, Check, GripVertical, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AfdelingsIndhold from "./AfdelingsIndhold";

export interface TabConfig {
  id: string;
  label: string;
  removable: boolean; // default tabs can't be removed
}

interface AfdelingLayoutProps {
  afdelingId: string;
  titel: string;
  beskrivelse: string;
  defaultTabs: TabConfig[];
  currentUserNavn: string;
  isLeder: boolean;
  /** Render custom content for specific tab IDs (e.g. NSK netværkskort) */
  customTabContent?: Record<string, ReactNode>;
}

const AfdelingLayout = ({
  afdelingId,
  titel,
  beskrivelse,
  defaultTabs,
  currentUserNavn,
  isLeder,
  customTabContent,
}: AfdelingLayoutProps) => {
  const tabsKey = `afd_tabs_${afdelingId}`;
  const [tabs, setTabs] = useState<TabConfig[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState(defaultTabs[0]?.id || "");
  const [showAddTab, setShowAddTab] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabLabel, setEditTabLabel] = useState("");

  // Load custom tabs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(tabsKey);
    if (saved) {
      try {
        const savedTabs: TabConfig[] = JSON.parse(saved);
        // Merge: keep defaults, add custom ones
        const defaultIds = defaultTabs.map(t => t.id);
        const customTabs = savedTabs.filter(t => !defaultIds.includes(t.id));
        // Also apply renamed default tabs
        const mergedDefaults = defaultTabs.map(dt => {
          const saved = savedTabs.find(st => st.id === dt.id);
          return saved ? { ...dt, label: saved.label } : dt;
        });
        setTabs([...mergedDefaults, ...customTabs]);
      } catch {
        setTabs(defaultTabs);
      }
    }
  }, [tabsKey]);

  const saveTabs = (newTabs: TabConfig[]) => {
    setTabs(newTabs);
    localStorage.setItem(tabsKey, JSON.stringify(newTabs));
  };

  const addTab = () => {
    if (!newTabLabel.trim()) return;
    const id = `custom_${Date.now()}`;
    const newTab: TabConfig = { id, label: newTabLabel.trim(), removable: true };
    saveTabs([...tabs, newTab]);
    setNewTabLabel("");
    setShowAddTab(false);
    setActiveTab(id);
  };

  const removeTab = (id: string) => {
    const updated = tabs.filter(t => t.id !== id);
    saveTabs(updated);
    if (activeTab === id) {
      setActiveTab(updated[0]?.id || "");
    }
    // Also remove content from localStorage
    localStorage.removeItem(`afd_indhold_${afdelingId}_${id}`);
  };

  const startRenameTab = (tab: TabConfig) => {
    setEditingTabId(tab.id);
    setEditTabLabel(tab.label);
  };

  const confirmRenameTab = () => {
    if (!editTabLabel.trim() || !editingTabId) return;
    saveTabs(tabs.map(t => t.id === editingTabId ? { ...t, label: editTabLabel.trim() } : t));
    setEditingTabId(null);
    setEditTabLabel("");
  };

  const getContentId = (tabId: string) => `${afdelingId}_${tabId}`;

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-foreground">{titel}</h1>
        <p className="text-xs text-muted-foreground">{beskrivelse}</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {tabs.map((t) => (
            <div key={t.id} className="flex items-center group relative">
              {editingTabId === t.id ? (
                <div className="flex items-center gap-1 px-1 py-1">
                  <Input
                    value={editTabLabel}
                    onChange={e => setEditTabLabel(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && confirmRenameTab()}
                    className="h-6 text-xs w-24 px-1"
                    autoFocus
                  />
                  <button onClick={confirmRenameTab} className="p-0.5 text-primary">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditingTabId(null)} className="p-0.5 text-muted-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                    activeTab === t.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              )}
              {/* Edit/Remove controls for leaders */}
              {isLeder && editingTabId !== t.id && (
                <div className="hidden group-hover:flex items-center gap-0.5 absolute -top-1 -right-1 z-10">
                  <button
                    onClick={() => startRenameTab(t)}
                    className="p-0.5 rounded bg-muted border border-border shadow-sm"
                    title="Omdøb"
                  >
                    <Edit2 className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                  {t.removable && (
                    <button
                      onClick={() => removeTab(t.id)}
                      className="p-0.5 rounded bg-muted border border-border shadow-sm"
                      title="Fjern tab"
                    >
                      <X className="w-2.5 h-2.5 text-destructive" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add tab button for leaders */}
        {isLeder && (
          <div className="flex items-center shrink-0 ml-1">
            {showAddTab ? (
              <div className="flex items-center gap-1 py-1">
                <Input
                  value={newTabLabel}
                  onChange={e => setNewTabLabel(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTab()}
                  placeholder="Tab navn..."
                  className="h-6 text-xs w-28 px-2"
                  autoFocus
                />
                <button onClick={addTab} className="p-0.5 text-primary">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setShowAddTab(false); setNewTabLabel(""); }} className="p-0.5 text-muted-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTab(true)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground -mb-px"
                title="Tilføj ny tab"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab content — all rendered but hidden to preserve state */}
      <div className="flex-1 overflow-y-auto">
        {tabs.map((t) => (
          <div key={t.id} className={activeTab === t.id ? "" : "hidden"}>
            {customTabContent && customTabContent[t.id]
              ? customTabContent[t.id]
              : <AfdelingsIndhold
                  afdelingId={getContentId(t.id)}
                  currentUserNavn={currentUserNavn}
                  isLeder={isLeder}
                />
            }
          </div>
        ))}
      </div>
    </div>
  );
};

export default AfdelingLayout;
