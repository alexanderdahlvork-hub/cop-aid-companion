import { useState } from "react";
import Sidebar from "@/components/police/Sidebar";
import KRRegister from "@/components/police/KRRegister";
import FleetManagement from "@/components/police/FleetManagement";
import { FileText, MapPin, Radio, Settings } from "lucide-react";

const placeholderTab = (icon: typeof FileText, title: string, desc: string) => (
  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
    {(() => { const Icon = icon; return <Icon className="w-10 h-10 opacity-30" />; })()}
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    <p className="text-sm">{desc}</p>
  </div>
);

const Index = () => {
  const [activeTab, setActiveTab] = useState("kr");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold">
            {activeTab === "kr" && "KR — Kriminalregisteret"}
            {activeTab === "fleet" && "Flådestyring"}
            {activeTab === "rapporter" && "Rapporter"}
            {activeTab === "kort" && "Kort & GPS"}
            {activeTab === "radio" && "Kommunikation"}
            {activeTab === "indstillinger" && "Indstillinger"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "kr" && "Søg og opret personer i registeret"}
            {activeTab === "fleet" && "Oversigt over patruljekøretøjer"}
          </p>
        </div>
        {activeTab === "kr" && <KRRegister />}
        {activeTab === "fleet" && <FleetManagement />}
        {activeTab === "rapporter" && placeholderTab(FileText, "Rapporter", "Kommer snart")}
        {activeTab === "kort" && placeholderTab(MapPin, "Kort & GPS", "Kommer snart")}
        {activeTab === "radio" && placeholderTab(Radio, "Kommunikation", "Kommer snart")}
        {activeTab === "indstillinger" && placeholderTab(Settings, "Indstillinger", "Kommer snart")}
      </main>
    </div>
  );
};

export default Index;
