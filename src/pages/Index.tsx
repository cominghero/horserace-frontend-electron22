import { useState, useEffect, useRef } from "react";
import { RaceTable } from "@/components/RaceTable";
import { MarketMovers } from "@/components/MarketMovers";
import { Button } from "@/components/ui/button";
import { ScrapeButton } from "@/components/ScrapeButton";
import { ScheduleButton } from "@/components/ScheduleButton";
import { AutoRefreshTimer } from "@/components/AutoRefreshTimer";
import { TextZoomSlider } from "@/components/TextZoomSlider";
import { racecourses, generateMockRounds, generateFavorites } from "@/data/mockRaceData";
import { transformScrapedData } from "@/lib/transformScrapedData";
import { downloadDashboardData } from "@/lib/downloadExcel";
import { Activity, Download } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

const Index = () => {
  const [activeRacecourses, setActiveRacecourses] = useState<Set<string>>(new Set());
  const [racecourseData, setRacecourseData] = useState<{ name: string; rounds: any[] }[]>([]);
  const [scrapedData, setScrapedData] = useState<{ name: string; rounds: any[] }[] | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");
  const [dataTitle, setDataTitle] = useState<string>("");
  const [isGlobalLoading, setIsGlobalLoading] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // AbortController to cancel ongoing fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const toggleRacecourse = (name) => {
    
    setActiveRacecourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(name)) {
        newSet.delete(name);
      } else {
        newSet.add(name);
      }
      return newSet;
    });
  };

  const handleDataFetched = (data: any, title: string) => {
    // Transform scraped data to the expected format
    const transformed = transformScrapedData(data);
    console.log("✨ Transformed data:", transformed);

    // Verify structure
    if (transformed.length > 0) {
      console.log("🔍 First racetrack:", transformed[0]);
      console.log("   - name:", transformed[0].name);
      console.log("   - rounds count:", transformed[0].rounds?.length);
    }

    setScrapedData(transformed);
    setDataTitle(title);

    // Auto-select first track if available
    if (transformed.length > 0) {
      setActiveRacecourses(new Set([transformed[0].name]));
    }
  };

  // Handle auto-refresh triggered by timer
  const handleAutoRefresh = async () => {
    console.log("🔄 Auto-refresh triggered by timer");

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsGlobalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/all-races`, {
        method: "POST",
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        handleDataFetched(result.data, dataTitle || "Today's Result");
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("🛑 Auto-refresh request was cancelled");
      } else {
        console.error("Auto-refresh failed:", error);
      }
    } finally {
      setIsGlobalLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle cancel - stop timer and abort any ongoing requests
  const handleTimerStateChange = (isActive: boolean) => {
    setIsTimerActive(isActive);

    // If timer is being stopped, abort any ongoing request
    if (!isActive && abortControllerRef.current) {
      console.log("🛑 Cancelling timer - aborting ongoing request");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGlobalLoading(false);
    }
  };

  // Use scraped data if available and not empty, otherwise use mock data
  const displayData = (scrapedData && scrapedData.length > 0) ? scrapedData : racecourseData;
  const favorites = generateFavorites(displayData.filter(rc => activeRacecourses.has(rc.name)));

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4 font-sans w-full">
      <div className="mb-6 border-b border-border pb-4 w-full">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="text-title font-bold text-foreground tracking-tight">
              Australian Racing Odds Monitor
            </h1>
          </div>
          
        </div>
        
        <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center justify-between w-full">
          <div className="flex flex-row justify-between items-center w-full gap-2 flex-wrap">
          <ScrapeButton
            onDataFetched={handleDataFetched}
            isGlobalLoading={isGlobalLoading}
            setIsGlobalLoading={setIsGlobalLoading}
            disabled={isTimerActive}
          />
           <AutoRefreshTimer
            onRefresh={handleAutoRefresh}
            onTimerStateChange={handleTimerStateChange}
            disabled={isGlobalLoading}
          />
          <ScheduleButton
            onDataFetched={handleDataFetched}
            isGlobalLoading={isGlobalLoading}
            setIsGlobalLoading={setIsGlobalLoading}
            disabled={isTimerActive}
          />         
          
          <Button
              onClick={() => downloadDashboardData(displayData, activeRacecourses, favorites)}
              variant="outline"
              size="sm"
              className="text-button sm:hidden"
              disabled={activeRacecourses.size === 0 || isGlobalLoading}
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 items-start sm:items-center w-full sm:w-auto">

          <Button
              onClick={() => downloadDashboardData(displayData, activeRacecourses, favorites)}
              variant="outline"
              size="sm"
              className="text-button max-sm:hidden"
              disabled={activeRacecourses.size === 0 || isGlobalLoading}
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </Button>

            <div className="w-full">
              <TextZoomSlider />
            </div>
          <input
            type="text"
            placeholder="Filter horses (e.g., 1,3,5)"
            value={searchInput}
            onChange={(e) => {
              // Only allow numbers and commas
              const filtered = e.target.value.replace(/[^0-9,]/g, '');
              setSearchInput(filtered);
            }}
            className="px-4 py-2 text-button border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary max-sm:w-full sm:w-30"
          />
          </div>
        </div>
         
        <div className="flex justify-between items-center gap-2 w-full">
          <div className="flex flex-wrap gap-2 w-full">
            {
            displayData.map(rc => (
              <Button
                key={rc.name}
                onClick={() => toggleRacecourse(rc.name)}
                variant={activeRacecourses.has(rc.name) ? "default" : "secondary"}
                size="sm"
                className="font-semibold tracking-wide text-button"
              >
                {rc.name}
              </Button>
            ))}
          </div>
          
          
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_25%] gap-2 sm:gap-4 xl:h-[calc(100vh-200px)] w-full">
        <div className="space-y-2 sm:space-y-4 overflow-y-auto pr-2 w-full">
          {dataTitle && activeRacecourses.size > 0 && (
            <div className="bg-primary/10 border border-primary/20 rounded-md p-3 mb-4">
              <h2 className="text-lg font-bold text-primary tracking-tight">
                {dataTitle}
              </h2>
            </div>
          )}

          {displayData
            .filter(rc => activeRacecourses.has(rc.name))
            .map(rc => (
              <RaceTable
                key={rc.name}
                racecourse={rc.name}
                rounds={rc.rounds}
                horseNumberFilter={searchInput}
              />
            ))}
          
          {activeRacecourses.size === 0 && (
            <div className="bg-card border border-border rounded-sm p-12 text-center">
              <p className="text-other text-muted-foreground">
                {scrapedData && scrapedData.length > 0
                  ? "Select a racecourse above to view odds"
                  : "Click 'Refresh' button to scrape live race data"}
              </p>
            </div>
          )}
        </div>

        {activeRacecourses.size > 0 && (
          <div className="sticky top-4 self-start">
            <MarketMovers favorites={favorites} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
