import { useState, useEffect } from "react";
import { RaceTable } from "@/components/RaceTable";
import { MarketMovers } from "@/components/MarketMovers";
import { Button } from "@/components/ui/button";
import { ScrapeButton } from "@/components/ScrapeButton";
import { TextZoomSlider } from "@/components/TextZoomSlider";
import { racecourses, generateMockRounds, generateFavorites } from "@/data/mockRaceData";
import { transformScrapedData } from "@/lib/transformScrapedData";
import { downloadDashboardData } from "@/lib/downloadCSV";
import { Activity, Download } from "lucide-react";

const Index = () => {
  const [activeRacecourses, setActiveRacecourses] = useState<Set<string>>(new Set());
  const [racecourseData, setRacecourseData] = useState<{ name: string; rounds: any[] }[]>([]);
  const [scrapedData, setScrapedData] = useState<{ name: string; rounds: any[] }[] | null>(null);
  const [searchInput, setSearchInput] = useState<string>("");

  // Remove mock data initialization - start with empty data
  // useEffect(() => {
  //   // Initialize data for all racecourses
  //   const data = racecourses.map(rc => ({
  //     name: rc.name,
  //     rounds: generateMockRounds(rc.startHour, rc.rounds)
  //   }));
  //   setRacecourseData(data);
  // }, []);

  const toggleRacecourse = (name) => {
    // console.log('aaaaaaaaaaaaaaaa',name);
    
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

  const handleDataFetched = (data: any) => {
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
    
    // Auto-select first track if available
    if (transformed.length > 0) {
      setActiveRacecourses(new Set([transformed[0].name]));
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
          <div className="flex flex-row justify-between items-center w-full">
          <ScrapeButton onDataFetched={handleDataFetched} />
          <Button
              onClick={() => downloadDashboardData(displayData, activeRacecourses, favorites)}
              variant="outline"
              size="sm"
              className="text-button sm:hidden"
              disabled={activeRacecourses.size === 0}
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
              disabled={activeRacecourses.size === 0}
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
            ))

            // <Button onClick={() => toggleRacecourse(displayData)}
            // >test</Button>
            }
           
          </div>
          
          
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_25%] gap-2 sm:gap-4 xl:h-[calc(100vh-200px)] w-full">
        <div className="space-y-2 sm:space-y-4 overflow-y-auto pr-2 w-full">
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
