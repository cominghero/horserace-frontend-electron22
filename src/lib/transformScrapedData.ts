import { Round } from "@/components/RaceTable";

interface ScrapedHorse {
  rank: number;
  horseNumber: string;
  horseName: string;
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
 */
export const transformScrapedData = (
  scrapedRacetracks: ScrapedRacetrack[]
): TransformedRacecourseData[] => {
  return scrapedRacetracks.map((trackData) => {
    const { racetrack, completedRaces } = trackData;

    // Transform each race into a Round
    const rounds: Round[] = completedRaces.map((race) => {
      // Extract race number from raceNumber string (e.g., "R1" -> 1)
      const raceNumberMatch = race.raceNumber.match(/\d+/);
      const roundNumber = raceNumberMatch ? parseInt(raceNumberMatch[0]) : 0;

      // Convert scraped horses to the expected format
      // Use "placeFixed" odds as the display odds (as per requirement)
      const horses = race.horses.map((horse) => ({
        number: parseInt(horse.horseNumber) || 0,      // No: Horse saddle number
        position: horse.rank,                           // Position: Horse ranking/order
        odds: parseFloat(horse.odds.placeFixed) || 0,  // Odds: Place fixed odds
        previousOdds: undefined,                        // Scraped data doesn't have previous odds
        name: horse.horseName,                          // Name: Horse name from scraped data
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