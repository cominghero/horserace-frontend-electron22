import { Round } from "@/components/RaceTable";

interface ScrapedHorse {
  rank: number;
  horseNumber: string;
  horseName: string;
  jockey: string;
  odds: {
    open: string;
    fluc1: string;
    fluc2: string;
    winFixed: string;
    placeFixed: string;
    eachWayFixed: string;
  };
}

interface ScrapedRaceWithHorses {
  raceNumber: string;
  time: string;
  result: string;
  link: string;
  horses: ScrapedHorse[];
  horseCount: number;
}

interface ScrapedRacetrack {
  racetrack: string;
  tracklinkUrl: string;
  completedRaces: ScrapedRaceWithHorses[];
}

export interface TransformedRacecourseData {
  name: string;
  rounds: Round[];
}

/**
 * Convert scraped race data to the format expected by RaceTable
 * Handles the merged structure: racetrack -> completedRaces array with horses
 * @param scrapedRacetracks - Array of racetrack data from scraper
 * @param isScheduleView - Whether this is a schedule view (upcoming races). If true, skip first race.
 */
export const transformScrapedData = (
  scrapedRacetracks: ScrapedRacetrack[],
  isScheduleView: boolean = false
): TransformedRacecourseData[] => {
  return scrapedRacetracks.map((trackData, trackIndex) => {
    const { racetrack, completedRaces } = trackData;

    // Skip the first race of the first racetrack only if it's a schedule view
    const racesToProcess = (trackIndex === 0 && isScheduleView)
      ? completedRaces.slice(1)  // Skip first race for first racetrack in schedule view
      : completedRaces;          // Keep all races otherwise

    // Transform each race into a Round
    const rounds: Round[] = racesToProcess.map((race) => {
      // Extract race number from raceNumber string (e.g., "R1" -> 1)
      const raceNumberMatch = race.raceNumber.match(/\d+/);
      const roundNumber = raceNumberMatch ? parseInt(raceNumberMatch[0]) : 0;

      // Convert scraped horses to the expected format
      // Use "winFixed" odds as the display odds
      const horses = race.horses.map((horse) => ({
        number: parseInt(horse.horseNumber) || 0,      // No: Horse saddle number
        position: horse.rank,                           // Position: Horse ranking/order
        odds: parseFloat(horse.odds.winFixed) || 0,    // Odds: Win fixed odds
        previousOdds: undefined,                        // Scraped data doesn't have previous odds
        name: horse.horseName,                          // Name: Horse name from scraped data
        jockey: horse.jockey || 'N/A',                 // Jockey: Jockey name from scraped data
      }));

      return {
        roundNumber,
        time: race.time || "N/A", // Use time from scraped data
        horses,
      };
    });

    return {
      name: racetrack,
      rounds,
    };
  });
};