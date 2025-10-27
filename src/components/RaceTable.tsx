import React from 'react';

export interface Horse {
  number: number;
  position: number;
  odds: number;
  previousOdds?: number;
  name?: string;
  jockey?: string;
}

export interface Round {
  roundNumber: number;
  time: string;
  horses: Horse[];
}

interface RaceTableProps {
  racecourse: string;
  rounds: Round[];
  horseNumberFilter?: string;
}

/**
 * Calculate Dutch betting profit percentage
 * Takes array of odds and calculates equal payout return
 * Profit% = (R - S) / S * 100%, where R = S / Σ(1/odds)
 */
const calculateDutchProfit = (odds: number[]): number => {
  if (odds.length === 0 || odds.some(o => o <= 0)) return 0;
  
  const sumReciprocals = odds.reduce((sum, o) => sum + 1 / o, 0);
  if (sumReciprocals === 0) return 0;
  
  const R = 1 / sumReciprocals; // R relative to S=1
  return (R - 1) * 100; // Profit percentage
};

export const RaceTable = ({ racecourse, rounds, horseNumberFilter = "" }: RaceTableProps) => {
  // Parse comma-separated horse numbers from filter
  const getFilteredNumbers = (): Set<number> => {
    if (!horseNumberFilter.trim()) return new Set();
    return new Set(
      horseNumberFilter
        .split(",")
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num))
    );
  };

  const filteredNumbers = getFilteredNumbers();

  // Sort horses by odds (placeFixed value) - ascending order
  const getSortedHorses = (horses: Horse[]) => {
    const sorted = [...horses].sort((a, b) => a.odds - b.odds);
    // If filter is active, only return horses matching the filter
    if (filteredNumbers.size > 0) {
      return sorted.filter(horse => filteredNumbers.has(horse.number));
    }
    return sorted;
  };

  // Get horses with valid odds (not 0) for T2/T3/Top3 calculations
  const getHorsesWithValidOdds = (horses: Horse[]) => {
    return getSortedHorses(horses).filter(horse => horse.odds > 0);
  };

  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden">
      <div className="bg-race-header px-3 py-2 border-b border-border">
        <h3 className="font-semibold text-primary text-button tracking-wide uppercase">{racecourse}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-table">
          <thead>
            <tr className="bg-secondary/50">
              <th className="px-2 py-1.5 text-left font-medium text-muted-foreground border-r border-border w-16">Race</th>
              {rounds.map((round) => (
                <th
                  key={round.roundNumber}
                  colSpan={5}
                  className="px-2 py-1.5 text-center font-medium text-accent border-r border-border"
                >
                  R{round.roundNumber}
                </th>
              ))}
            </tr>
            <tr className="bg-secondary/40">
              <th className="px-2 py-1 text-left font-medium text-muted-foreground border-r border-border text-time"></th>
              {rounds.map((round) => (
                <th
                  key={`time-${round.roundNumber}`}
                  colSpan={5}
                  className="px-2 py-1 text-center font-medium text-muted-foreground border-r border-border text-time"
                >
                  {round.time}
                </th>
              ))}
            </tr>
            <tr className="bg-secondary/30">
              <th className="px-2 py-1 text-left font-medium text-muted-foreground border-r border-border text-other"></th>
              {rounds.map((round) => (
                <React.Fragment key={`header-${round.roundNumber}`}>
                  <th className="px-1 py-1 text-center font-medium text-muted-foreground border-r border-border/50 w-12 text-other">No.</th>
                  <th className="px-1 py-1 text-center font-medium text-muted-foreground border-r border-border/50 w-12 text-other">Pos</th>
                  <th className="px-1 py-1 text-left font-medium text-muted-foreground border-r border-border/50 flex-1 min-w-32 text-other">Horse Name</th>
                  <th className="px-1 py-1 text-left font-medium text-muted-foreground border-r border-border/50 flex-1 min-w-28 text-other">Jockey</th>
                  <th className="px-1 py-1 text-center font-medium text-muted-foreground border-r border-border w-16 text-other">Odds</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(...rounds.map(r => getSortedHorses(r.horses).length), 0) }).map((_, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-race-row" : "bg-race-row-alt"}>
                <td className="px-2 py-1.5 border-r border-border"></td>
                {rounds.map((round) => {
                  const sortedHorses = getSortedHorses(round.horses);
                  const horse = sortedHorses[idx];
                  
                  if (!horse) return (
                    <React.Fragment key={`${round.roundNumber}-${idx}`}>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border"></td>
                    </React.Fragment>
                  );

                  return (
                    <React.Fragment key={`${round.roundNumber}-${idx}`}>
                      <td className="px-1 py-1.5 text-center font-mono font-semibold text-foreground border-r border-border/50">
                        {horse.number}
                      </td>
                      <td className="px-1 py-1.5 text-center font-mono text-foreground border-r border-border/50">
                        {horse.position}
                      </td>
                      <td className="px-1 py-1.5 text-left font-mono text-muted-foreground border-r border-border/50 truncate text-other">
                        {horse.name}
                      </td>
                      <td className="px-1 py-1.5 text-left font-mono text-muted-foreground border-r border-border/50 truncate text-other">
                        {horse.jockey || 'N/A'}
                      </td>
                      <td className="px-1 py-1.5 text-center font-mono font-semibold text-primary border-r border-border">
                        {horse.odds === 0 ? '-' : `$${horse.odds.toFixed(2)}`}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
            
            {/* T2 Row - Dutch betting on top 2 from displayed horses (only show if at least 2 horses with valid odds) */}
            {rounds.some(round => getHorsesWithValidOdds(round.horses).length >= 2) && (
              <tr className="bg-secondary/20 border-t border-border">
                <td className="px-2 py-1.5 border-r border-border font-semibold text-accent text-table">T2</td>
                {rounds.map((round) => {
                  const horsesWithValidOdds = getHorsesWithValidOdds(round.horses);
                  const top2Odds = horsesWithValidOdds.slice(0, 2).map(h => h.odds);
                  const t2Profit = calculateDutchProfit(top2Odds);

                  return (
                    <React.Fragment key={`t2-${round.roundNumber}`}>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 text-left font-mono text-muted-foreground border-r border-border/50 text-table"></td>
                      <td className="px-1 py-1.5 text-left font-mono text-muted-foreground border-r border-border/50 text-table"></td>
                      <td className={`px-1 py-1.5 text-center font-mono font-semibold border-r border-border text-table ${
                        t2Profit >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {horsesWithValidOdds.length >= 2 ? `${t2Profit >= 0 ? '+' : ''}${t2Profit.toFixed(1)}%` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            )}

            {/* T3 Row - Dutch betting on top 3 from displayed horses (only show if at least 3 horses with valid odds) */}
            {rounds.some(round => getHorsesWithValidOdds(round.horses).length >= 3) && (
              <tr className="bg-secondary/20">
                <td className="px-2 py-1.5 border-r border-border font-semibold text-accent text-table">T3</td>
                {rounds.map((round) => {
                  const horsesWithValidOdds = getHorsesWithValidOdds(round.horses);
                  const top3Odds = horsesWithValidOdds.slice(0, 3).map(h => h.odds);
                  const t3Profit = calculateDutchProfit(top3Odds);

                  return (
                    <React.Fragment key={`t3-${round.roundNumber}`}>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 text-left font-mono text-muted-foreground border-r border-border/50 text-table"></td>
                      <td className="px-1 py-1.5 text-left font-mono text-muted-foreground border-r border-border/50 text-table"></td>
                      <td className={`px-1 py-1.5 text-center font-mono font-semibold border-r border-border text-table ${
                        t3Profit >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {horsesWithValidOdds.length >= 3 ? `${t3Profit >= 0 ? '+' : ''}${t3Profit.toFixed(1)}%` : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            )}

            {/* Top3 Row - Shows top 3 horse numbers in comma-separated format (only horses with valid odds) */}
            {rounds.some(round => getHorsesWithValidOdds(round.horses).length >= 3) && (
              <tr className="bg-secondary/30 border-t border-border">
                <td className="px-2 py-1.5 border-r border-border font-semibold text-accent text-table">Top3</td>
                {rounds.map((round) => {
                  const horsesWithValidOdds = getHorsesWithValidOdds(round.horses);
                  const top3Numbers = horsesWithValidOdds.slice(0, 3).map(h => h.number).join(',');

                  return (
                    <React.Fragment key={`top3-${round.roundNumber}`}>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 border-r border-border/50"></td>
                      <td className="px-1 py-1.5 text-center font-mono font-semibold border-r border-border text-table text-foreground">
                        {horsesWithValidOdds.length >= 3 ? top3Numbers : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
