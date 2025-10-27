import { Round } from "@/components/RaceTable";
import { Favorite } from "@/components/MarketMovers";

const horseNames = [
  "Thunder Strike", "Blazing Fire", "Swift Wind", "Golden Star", "Midnight Shadow",
  "Bright Hope", "Lucky Charm", "Bold Venture", "Noble Knight", "Fleeting Dream",
  "Steady Pace", "Quick Silver", "Mighty Force", "Silent Strength", "Brave Soul",
  "Fancy Dancer", "Perfect Match", "Royal Crown", "Supreme Power", "True Friend",
  "Clear View", "Strong Will", "Loyal Heart", "Smart Choice", "Peak Performance"
];

export const generateMockRounds = (startHour: number, numRounds: number): Round[] => {
  return Array.from({ length: numRounds }, (_, i) => {
    const hour = startHour + i;
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const numHorses = 8 + Math.floor(Math.random() * 6); // 8-13 horses
    
    const horses = Array.from({ length: numHorses }, (_, j) => ({
      number: j + 1,
      position: j + 1,
      odds: 2 + Math.random() * 18, // $2-$20
      previousOdds: Math.random() > 0.5 ? 2 + Math.random() * 18 : undefined,
      name: horseNames[Math.floor(Math.random() * horseNames.length)],
    })).sort((a, b) => a.odds - b.odds);
    
    // // Update positions after sorting
    // horses.forEach((horse, idx) => {
    //   horse.position = idx + 1;
    // });
    
    return {
      roundNumber: i + 1,
      time,
      horses,
    };
  });
};

export const racecourses = [
  { name: "Flemington", startHour: 12, rounds: 8 },
  { name: "Randwick", startHour: 11, rounds: 9 },
  { name: "Caulfield", startHour: 13, rounds: 7 },
  { name: "Rosehill", startHour: 12, rounds: 8 },
  { name: "Moonee Valley", startHour: 14, rounds: 6 },
  { name: "Eagle Farm", startHour: 11, rounds: 7 },
];

export const generateFavorites = (racecourseData: { name: string; rounds: Round[] }[]): Favorite[] => {
  const favorites: Favorite[] = [];

  racecourseData.forEach(({ name, rounds }) => {
    rounds.forEach((round) => {
      if (round.horses.length > 0) {
        // Filter out horses with 0 odds
        const horsesWithValidOdds = round.horses.filter(horse => horse.odds > 0);

        // Skip if no horses have valid odds
        if (horsesWithValidOdds.length === 0) {
          return;
        }

        // Find horse with lowest odds (favorite) from horses with valid odds
        const favorite = horsesWithValidOdds.reduce((lowest, horse) =>
          horse.odds < lowest.odds ? horse : lowest
        , horsesWithValidOdds[0]);

        const movement = favorite.previousOdds
          ? favorite.odds < favorite.previousOdds
            ? 'down'
            : favorite.odds > favorite.previousOdds
              ? 'up'
              : 'neutral'
          : 'neutral';

        favorites.push({
          racecourse: name,
          round: round.roundNumber,
          time: round.time,
          horseNumber: favorite.number,
          horseName: favorite.name,
          jockey: favorite.jockey,
          position: favorite.position,
          odds: favorite.odds,
          previousOdds: favorite.previousOdds,
          movement,
        });
      }
    });
  });

  // Return horse with lowest odds from each round (the favorite)
  // One favorite per round per racetrack (excluding horses with 0 odds)
  return favorites;
};
