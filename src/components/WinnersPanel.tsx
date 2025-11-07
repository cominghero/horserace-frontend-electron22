import { useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/config/api";
import { Button } from "@/components/ui/button";

// Helper function to subtract 3 hours from time string (HH:MM format)
const subtractThreeHours = (timeStr: string): string => {
  try {
    const [hours, minutes] = timeStr.split(":").map(Number);
    let newHours = hours;
    
    // Handle day wraparound
    if (newHours < 0) {
      newHours += 24;
    }
    
    return `${String(newHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch {
    return timeStr; // Return original if parsing fails
  }
};

// Helper function to convert number to ordinal format (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
};

interface Winner {
  racecourse: string;
  raceNumber: string;
  link: string;
  time: string;
  winner: {
    number: number;
    name: string;
    jockey: string;
    winOdds: number;
    oddsRank?: number | null;
  };
}

interface RacecourseData {
  name: string;
  rounds: Array<{
    roundNumber: number;
    time: string;
    horses: Array<{
      number: number;
      position: number;
      odds: number;
      previousOdds?: number;
      name?: string;
      jockey?: string;
    }>;
  }>;
}

interface WinnersPanelProps {
  autoRefreshInterval?: number; // milliseconds, default 5 minutes
  racecourseData?: RacecourseData[];
  onLoadingChange?: (isLoading: boolean) => void; // Callback when loading state changes
  onWinnersUpdate?: (winners: Winner[]) => void; // Callback to send winners data to parent
}

export const WinnersPanel = ({ autoRefreshInterval = 300000, racecourseData = [], onLoadingChange, onWinnersUpdate }: WinnersPanelProps) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Function to find the rank of a winner horse in the race (based on racecourseData odds)
  const getWinnerRank = (racecourse: string, raceNumber: string, horseNumber: number): number | null => {
    // Find the racecourse data
    const raceCourseInfo = racecourseData.find(rc => rc.name === racecourse);
    if (!raceCourseInfo) {
      return null;
    }

    // Extract race number from format like "R1" by taking only digits
    const raceNumberMatch = raceNumber.match(/\d+/);
    const roundIndex = raceNumberMatch ? parseInt(raceNumberMatch[0]) : parseInt(raceNumber);
    
    const round = raceCourseInfo.rounds.find(r => r.roundNumber === roundIndex);
    if (!round) {
      return null;
    }

    // Sort horses by odds (same logic as RaceTable)
    const sortedHorses = [...round.horses].sort((a, b) => a.odds - b.odds);

    // Find the position (1-indexed) of the winning horse
    const horseIndex = sortedHorses.findIndex(h => h.number === horseNumber);
    return horseIndex >= 0 ? horseIndex + 1 : null;
  };

  const fetchWinners = async () => {
    setLoading(true);
    onLoadingChange?.(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/scrape/winners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result = await response.json();
      const winnersList = result.data || [];
      setWinners(winnersList);
      
      // Send winners data to parent component
      onWinnersUpdate?.(winnersList);
      
      // Format timestamp for display
      const date = new Date(result.timestamp);
      const timeStr = date.toLocaleTimeString('en-AU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setLastUpdated(timeStr);
    } catch (err: any) {
      console.error("Failed to fetch winners:", err);
      setError(err.message || "Failed to fetch winners");
    } finally {
      setLoading(false);
      onLoadingChange?.(false);
    }
  };

  // Auto-fetch winners at specified interval
  useEffect(() => {
    // Fetch immediately on mount
    fetchWinners();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchWinners, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval]);

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-race-header px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-primary text-button tracking-wide uppercase">Today's Winners</h3>
          </div>
          <Button
            onClick={fetchWinners}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            title="Refresh winners"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Winners List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {error && (
            <div className="bg-destructive/10 border border-destructive/50 rounded-sm p-2 text-destructive text-sm">
              {error}
            </div>
          )}

          {winners.length === 0 && !error && (
            <div className="text-center py-6 text-muted-foreground text-sm">
              {loading ? "Loading winners..." : "No winners available yet"}
            </div>
          )}

          {winners.map((winner, idx) => (
            <div
              key={`${winner.racecourse}-${winner.raceNumber}-${idx}`}
              className="bg-secondary/30 border border-border/50 rounded-sm p-2 hover:bg-secondary/50 transition-colors"
            >
              {/* Racecourse & Race Number */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="font-semibold text-foreground text-table">
                  {winner.racecourse}
                </div>
                {/* Time disabled - may enable later */}
                {/* <div className="text-primary font-mono text-sm font-bold">
                  {subtractThreeHours(winner.time)}
                </div> */}
                <div className="text-accent font-mono text-sm font-bold whitespace-nowrap">
                  {winner.raceNumber}
                </div>
              </div>

              {/* Winner Details */}
              <div className="flex items-center gap-2 text-xs">
                {/* Left: Horse Number & Name */}
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {/* Horse Number */}
                  <span className="font-mono font-bold text-foreground whitespace-nowrap">
                    #{winner.winner.number}
                  </span>
                  
                  {/* Horse Name */}
                  {winner.winner.name && (
                    <span 
                      className="text-muted-foreground truncate flex-shrink" 
                      title={winner.winner.name}
                    >
                      {winner.winner.name}
                    </span>
                  )}
                </div>

                {/* Middle: Rank Box */}
                {(() => {
                  const rank = getWinnerRank(winner.racecourse, winner.raceNumber, winner.winner.number);
                  if (!rank) return null;
                  
                  const rankColor = rank === 1 ? 'text-yellow-300' : 
                                    rank === 2 ? 'text-gray-200' : 
                                    rank === 3 ? 'text-blue-300' : 
                                    'text-orange-500';
                  
                  return (
                    <>
                      <div className={`border ${rankColor} border-current rounded-sm px-2 py-1 bg-secondary/20 flex items-center justify-center whitespace-nowrap`}>
                        <span className={`font-bold text-lg ${rankColor}`}>
                          {getOrdinalSuffix(rank)}
                        </span>
                      </div>
                      {/* Right: Odds */}
                      <span className={`font-mono font-bold ${rankColor} whitespace-nowrap`}>
                        ${winner.winner.winOdds.toFixed(2)}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Jockey */}
              {winner.winner.jockey && winner.winner.jockey !== 'N/A' && (
                <div className="text-xs text-muted-foreground/70 truncate mt-1 italic">
                  {winner.winner.jockey}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Last Updated */}
      {lastUpdated && (
        <div className="bg-race-header/50 px-3 py-2 border-t border-border text-xs text-muted-foreground text-center">
          Updated: {lastUpdated}
        </div>
      )}
    </div>
  );
};