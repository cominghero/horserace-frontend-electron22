import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface ScrapeButtonProps {
  onDataFetched: (data: any, title: string) => void;
  isGlobalLoading: boolean;
  setIsGlobalLoading: (loading: boolean) => void;
  disabled?: boolean;
}

export const ScrapeButton = ({ onDataFetched, isGlobalLoading, setIsGlobalLoading, disabled = false }: ScrapeButtonProps) => {
  const [hasScraped, setHasScraped] = useState(false);
  const [isThisButtonLoading, setIsThisButtonLoading] = useState(false);

  const handleScrape = async () => {
    setIsGlobalLoading(true);
    setIsThisButtonLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/scrape/all-races", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("🎯 Raw API response:", result);
      
      if (result.data && Array.isArray(result.data)) {
        console.log("✅ Scraped data received:", result.data);
        onDataFetched(result.data, "Today's Result");
        setHasScraped(true);
      } else {
        console.error("❌ Invalid response format. Expected result.data as array:", result);
      }
    } catch (error) {
      console.error("Scraping failed:", error);
      alert("Failed to scrape races. Check console for details.");
    } finally {
      setIsGlobalLoading(false);
      setIsThisButtonLoading(false);
    }
  };

  const buttonText = hasScraped ? "Refresh" : "Start";

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleScrape}
        disabled={isGlobalLoading || disabled}
        className="font-semibold tracking-wide"
        size="default"
      >
        {isThisButtonLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Scraping...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      {isThisButtonLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span>Scraping races...</span>
        </div>
      )}
    </div>
  );
};