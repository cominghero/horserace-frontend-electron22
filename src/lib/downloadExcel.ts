import * as XLSX from 'xlsx';

/**
 * Download Excel file containing RaceTable and MarketMovers data
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
    jockey?: string;
  }>
) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Add Race Tables sheets (one sheet per racecourse)
  racecourseData
    .filter(rc => activeRacecourses.has(rc.name))
    .forEach(rc => {
      const sheetData: any[] = [];

      if (rc.rounds && rc.rounds.length > 0) {
        rc.rounds.forEach(round => {
          // Add round header
          sheetData.push([`Round ${round.roundNumber} - ${round.time}`]);
          sheetData.push(['Horse No', 'Position', 'Horse Name', 'Jockey', 'Odds']);

          // Sort horses by odds (ascending - best favorites first)
          const sortedHorses = [...round.horses].sort((a, b) => a.odds - b.odds);

          // Add horse data
          sortedHorses.forEach(horse => {
            sheetData.push([
              horse.number,
              horse.position,
              horse.name || '',
              horse.jockey || 'N/A',
              `$${horse.odds.toFixed(2)}`
            ]);
          });

          // Add Top3 row
          if (sortedHorses.length >= 3) {
            const top3Numbers = sortedHorses.slice(0, 3).map(h => h.number).join(',');
            sheetData.push(['Top3', '', '', '', top3Numbers]);
          }

          // Add blank row between rounds
          sheetData.push([]);
        });
      }

      // Create worksheet from data
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 10 },  // Horse No
        { wch: 10 },  // Position
        { wch: 25 },  // Horse Name
        { wch: 20 },  // Jockey
        { wch: 10 }   // Odds
      ];

      // Sanitize sheet name (Excel has restrictions)
      const sheetName = rc.name.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

  // Add Market Movers sheet
  const moversData: any[] = [];
  moversData.push(['MARKET MOVERS']);
  moversData.push(['Racecourse', 'Round', 'Time', 'Horse Number', 'Horse Name', 'Jockey', 'Position', 'Odds']);

  favorites.forEach(fav => {
    moversData.push([
      fav.racecourse,
      fav.round,
      fav.time,
      fav.horseNumber,
      fav.horseName || '',
      fav.jockey || 'N/A',
      fav.position,
      `$${fav.odds.toFixed(2)}`
    ]);
  });

  const moversSheet = XLSX.utils.aoa_to_sheet(moversData);
  moversSheet['!cols'] = [
    { wch: 20 },  // Racecourse
    { wch: 8 },   // Round
    { wch: 10 },  // Time
    { wch: 12 },  // Horse Number
    { wch: 25 },  // Horse Name
    { wch: 20 },  // Jockey
    { wch: 10 },  // Position
    { wch: 10 }   // Odds
  ];

  XLSX.utils.book_append_sheet(workbook, moversSheet, 'Market Movers');

  // Generate Excel file and trigger download
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `racing-odds-${timestamp}.xlsx`;

  XLSX.writeFile(workbook, filename);
};
