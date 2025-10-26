import { TrendingDown } from "lucide-react";

export interface Favorite {
  racecourse: string;
  round: number;
  time: string;
  horseNumber: number;
  horseName?: string;
  jockey?: string;
  position: number;
  odds: number;
  previousOdds?: number;
  movement?: 'up' | 'down' | 'neutral';
}

interface MarketMoversProps {
  favorites: Favorite[];
}

export const MarketMovers = ({ favorites }: MarketMoversProps) => {
  return (
    <div className="bg-card border border-border rounded-sm overflow-hidden h-full flex flex-col">
      <div className="bg-race-header px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-primary text-button tracking-wide uppercase">Market Movers</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-2">
          {favorites.map((fav, idx) => (
            <div
              key={`${fav.racecourse}-${fav.round}-${idx}`}
              className="bg-secondary/30 border border-border/50 rounded-sm p-2 hover:bg-secondary/50 transition-colors"
            >
              <div className="font-semibold text-foreground text-table mb-1">
                {fav.racecourse}
                
              </div>
              <div className="flex items-center justify-between gap-2 text-time">
                <div className="flex items-center gap-2 text-muted-foreground font-mono flex-shrink-0">
                  <span>R{fav.round}</span>
                  <span className="text-primary">{fav.time}</span>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {fav.horseName && (
                      <span className="text-muted-foreground truncate flex-shrink" title={fav.horseName}>
                        {fav.horseName}
                      </span>
                    )}
                    {fav.jockey && (
                      <span className="text-muted-foreground/70 truncate flex-shrink text-xs" title={fav.jockey}>
                        ({fav.jockey})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono font-semibold text-foreground whitespace-nowrap">#{fav.horseNumber}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{fav.position}{fav.position === 1 ? 'st' : fav.position === 2 ? 'nd' : fav.position === 3 ? 'rd' : 'th'}</span>
                    <span className="font-mono font-bold text-primary whitespace-nowrap">
                      ${fav.odds.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
