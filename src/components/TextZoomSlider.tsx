import { useTextZoom } from "@/context/TextZoomContext";
import { Slider } from "@/components/ui/slider";
import { ZoomIn } from "lucide-react";

export const TextZoomSlider = () => {
  const { zoomLevel, setZoomLevel } = useTextZoom();

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-md">
      <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <Slider
        value={[zoomLevel]}
        onValueChange={(value) => setZoomLevel(value[0])}
        min={0.8}
        max={1.3}
        step={0.1}
        className="w-32"
      />
      <span className="text-xs text-muted-foreground min-w-12 text-right">
        {Math.round(zoomLevel * 100)}%
      </span>
    </div>
  );
};