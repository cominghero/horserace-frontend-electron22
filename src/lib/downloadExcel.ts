import * as XLSX from 'xlsx';
import { API_BASE_URL } from '@/config/api';

/**
 * Calculate Dutch betting profit percentage
 */
const calculateDutchProfit = (odds: number[]): number => {
  if (odds.length === 0 || odds.some(o => o <= 0)) return 0;
  const sumReciprocals = odds.reduce((sum, o) => sum + 1 / o, 0);
  if (sumReciprocals === 0) return 0;
  const R = 1 / sumReciprocals;
  return (R - 1) * 100;
};

/**
 * Convert number to ordinal format (1st, 2nd, 3rd, etc)
 */
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  return `${num}th`;
};

/**
 * Parse time string (HH:MM) to minutes for sorting
 */
const timeToMinutes = (timeStr: string): number => {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  } catch {
    return 0;
  }
};

/**
 * Download Excel file containing RaceTable and Today's Winner data
 */
export const downloadDashboardData = async (
  racecourseData: Array<{ name: string; rounds: any[] }>,
  activeRacecourses?: Set<string>,
  dataTitle?: string,
  winners?: Array<any>
) => {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();

  // Add Winners sheet first (if winners data is provided)
  if (winners && winners.length > 0) {
    const winnersSheetData: any[] = [];
    
    // Add header
    winnersSheetData.push(['Racecourse', 'Race', 'Time', 'Horse #', 'Horse Name', 'Jockey', 'Win Odds', 'Rank']);
    
    // Sort winners by time
    const sortedWinners = [...winners].sort((a, b) => {
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
    
    // Add winner rows
    sortedWinners.forEach(winner => {
      winnersSheetData.push([
        winner.racecourse || '',
        winner.raceNumber || '',
        winner.time || '',
        winner.winner?.number || '',
        winner.winner?.name || '',
        winner.winner?.jockey || 'N/A',
        winner.winner?.winOdds ? `$${winner.winner.winOdds.toFixed(2)}` : '',
        winner.winner?.oddsRank ? getOrdinalSuffix(winner.winner.oddsRank) : ''
      ]);
    });
    
    // Create worksheet from data
    const winnersWorksheet = XLSX.utils.aoa_to_sheet(winnersSheetData);
    
    // Set column widths
    winnersWorksheet['!cols'] = [
      { wch: 15 },  // Racecourse
      { wch: 8 },   // Race
      { wch: 8 },   // Time
      { wch: 10 },  // Horse #
      { wch: 20 },  // Horse Name
      { wch: 18 },  // Jockey
      { wch: 12 },  // Win Odds
      { wch: 10 }   // Rank
    ];
    
    // Add Winners sheet at the beginning
    XLSX.utils.book_append_sheet(workbook, winnersWorksheet, "Today's Winners");
  }

  // Add Race Tables sheets (one sheet per racecourse)
  // If no active racecourses specified, download ALL data
  const racecourcesToExport = activeRacecourses && activeRacecourses.size > 0
    ? racecourseData.filter(rc => activeRacecourses.has(rc.name))
    : racecourseData;

  racecourcesToExport.forEach(rc => {
      const sheetData: any[] = [];

      if (rc.rounds && rc.rounds.length > 0) {
        rc.rounds.forEach(round => {
          // Add round header with time
          sheetData.push([`Round ${round.roundNumber}`, `Time: ${round.time}`]);
          sheetData.push(['Horse No', 'Rank', 'Horse Name', 'Jockey', 'Odds']);

          // Sort horses by odds (ascending - best favorites first), filter valid odds
          const sortedHorses = [...round.horses]
            .sort((a, b) => a.odds - b.odds)
            .filter(h => h.odds > 0);

          // Add horse data with display rank (1st, 2nd, 3rd...)
          sortedHorses.forEach((horse, idx) => {
            sheetData.push([
              horse.number,
              getOrdinalSuffix(idx + 1),
              horse.name || '',
              horse.jockey || 'N/A',
              `$${horse.odds.toFixed(2)}`
            ]);
          });

          // Add blank row between analysis rows
          sheetData.push([]);

          // Add T2 row (Top 2)
          if (sortedHorses.length >= 2) {
            const top2Odds = sortedHorses.slice(0, 2).map(h => h.odds);
            const t2Profit = calculateDutchProfit(top2Odds);
            sheetData.push(['T2', '', 'Top 2 Dutch', '', `${t2Profit >= 0 ? '+' : ''}${t2Profit.toFixed(1)}%`]);
          }

          // Add T3 row (Top 3)
          if (sortedHorses.length >= 3) {
            const top3Odds = sortedHorses.slice(0, 3).map(h => h.odds);
            const t3Profit = calculateDutchProfit(top3Odds);
            sheetData.push(['T3', '', 'Top 3 Dutch', '', `${t3Profit >= 0 ? '+' : ''}${t3Profit.toFixed(1)}%`]);
          }

          // Add Top6 row (Top 6 numbers)
          if (sortedHorses.length >= 6) {
            const top6Numbers = sortedHorses.slice(0, 6).map(h => h.number).join(',');
            sheetData.push(['Top6', '', 'Top 6 Numbers', '', top6Numbers]);
          }

          // Add blank row between rounds
          sheetData.push([]);
        });
      }

      // Create worksheet from data
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 },  // Horse No / T2/T3/Top6
        { wch: 12 },  // Rank
        { wch: 28 },  // Horse Name
        { wch: 20 },  // Jockey
        { wch: 15 }   // Odds
      ];

      // Sanitize sheet name (Excel has restrictions)
      const sheetName = rc.name.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, '');
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });



  // Generate Excel file and trigger download
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `racing-odds-${timestamp}.xlsx`;

  XLSX.writeFile(workbook, filename);
};
