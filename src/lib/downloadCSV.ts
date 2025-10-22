/**
 * Download CSV file containing RaceTable and MarketMovers data
 */
export const downloadDashboardData = (
  racecourseData: Array<{ name: string; rounds: any[] }>,
  activeRacecourses: Set<string>,
  favorites: Array<{
    racecourse: string;
    round: number;
    time: string;
    horseNumber: number;
    horseName?: string;
    position: number;
    odds: number;
    previousOdds?: number;
    movement?: string;
  }>
) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add Race Tables Section
  csvContent += "RACE TABLES\n\n";
  
  racecourseData
    .filter(rc => activeRacecourses.has(rc.name))
    .forEach(rc => {
      csvContent += `Racecourse: ${rc.name}\n`;
      
      // Get all unique rounds for this racecourse
      if (rc.rounds && rc.rounds.length > 0) {
        const headers = ["Horse No", "Position", "Horse Name", "Odds"];
        const roundHeaders = rc.rounds.map(r => `Round ${r.roundNumber}`).join(",");
        
        // Create table for each round
        rc.rounds.forEach(round => {
          csvContent += `Round ${round.roundNumber} - ${round.time}\n`;
          csvContent += "Horse No,Position,Horse Name,Odds\n";
          
          // Sort horses by odds
          const sortedHorses = [...round.horses].sort((a, b) => a.odds - b.odds);
          
          sortedHorses.forEach(horse => {
            const name = (horse.name || "").replace(/,/g, ";"); // Replace commas in names
            csvContent += `${horse.number},${horse.position},"${name}",${horse.odds.toFixed(2)}\n`;
          });
          
          csvContent += "\n";
        });
      }
      
      csvContent += "\n";
    });
  
  // Add Market Movers Section
  csvContent += "\n\nMARKET MOVERS\n\n";
  csvContent += "Racecourse,Round,Time,Horse Number,Horse Name,Position,Odds\n";
  
  favorites.forEach(fav => {
    const name = (fav.horseName || "").replace(/,/g, ";");
    csvContent += `${fav.racecourse},${fav.round},"${fav.time}",${fav.horseNumber},"${name}",${fav.position},${fav.odds.toFixed(2)}\n`;
  });
  
  // Create and trigger download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  link.setAttribute("download", `racing-odds-${timestamp}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};