import { Bike, Car, Dog, Eye, Crosshair, Plane, Siren, ShieldCheck, Search } from "lucide-react";

const PatrolIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case "bike": return <Bike className={className} />;
    case "car": return <Car className={className} />;
    case "dog": return <Dog className={className} />;
    case "eye": return <Eye className={className} />;
    case "crosshair": return <Crosshair className={className} />;
    case "plane": return <Plane className={className} />;
    case "siren": return <Siren className={className} />;
    case "shield": return <ShieldCheck className={className} />;
    case "search": return <Search className={className} />;
    default: return <Car className={className} />;
  }
};

export default PatrolIcon;
