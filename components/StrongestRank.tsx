
import React, { useMemo } from 'react';
import { Character, GameSettings } from '../types';
import { Button } from './ui/Button';

interface StrongestRankProps {
  market: Character[];
  settings: GameSettings;
  onVote: (charId: string) => void;
}

export const StrongestRank: React.FC<StrongestRankProps> = React.memo(({ market, settings, onVote }) => {
  const placeholder = "/assets/placeholder-character.png";

  const sortedMarket = useMemo(() => {
    return [...market].sort((a,b) => (b.strengthVotes || 0) - (a.strengthVotes || 0));
  }, [market]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
            <h2 className="text-4xl font-heading text-white italic tracking-tighter">STRONGEST <span className="text-brand">RANK</span></h2>
            <div className="text-xs text-muted font-bold tracking-widest uppercase mt-2">
                {settings.strongestVotingEnabled ? "POWER RANKING: ACTIVE (1 VOTE/DAY)" : "POWER RANKING: FROZEN"}
            </div>
        </div>

        <div className="space-y-3" style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 100px' }}>
            {sortedMarket.map((c, i) => {
                const currentRank = i + 1;
                const prevRank = c.prevStrengthRank || 0;
                let moveIcon = '-';
                let moveColor = 'text-muted';
                
                if (prevRank > 0) {
                    if (currentRank < prevRank) { moveIcon = '▲ ' + (prevRank - currentRank); moveColor = 'text-good'; }
                    else if (currentRank > prevRank) { moveIcon = '▼ ' + (currentRank - prevRank); moveColor = 'text-bad'; }
                }

                return (
                <div key={c.id} className="character-card flex items-center justify-between p-4 glass-panel hover:border-brand transition-all rounded-none relative overflow-hidden group will-change-transform">
                    {/* Rank Number */}
                    <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                        <div className="font-black text-4xl w-16 text-center text-white/20 italic">{currentRank}</div>
                        
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-black border border-line overflow-hidden shrink-0 shadow-md">
                                <img 
                                    src={c.imageUrl || placeholder} 
                                    className="stockism-character-image w-full h-full object-cover" 
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => { e.currentTarget.src = placeholder; }}
                                />
                            </div>
                            <div>
                                <h4 className="font-black text-xl leading-none text-white uppercase">{c.name}</h4>
                                <div className="text-xs text-muted font-mono mt-1">{c.crew}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats & Vote */}
                    <div className="flex items-center gap-8 relative z-10 mt-4 sm:mt-0">
                        {/* Movement Indicator */}
                        <div className={`text-xs font-black font-mono ${moveColor} w-12 text-center`}>
                            {moveIcon}
                        </div>
                        
                        <div className="text-right">
                            <div className="text-2xl font-mono text-white font-bold">{c.strengthVotes || 0}</div>
                            <div className="text-[8px] text-muted font-black tracking-widest uppercase">POWER</div>
                        </div>
                        <Button 
                            onClick={() => onVote(c.id)}
                            disabled={!settings.strongestVotingEnabled}
                            variant={settings.strongestVotingEnabled ? 'primary' : 'secondary'}
                            className="!py-2 !px-6 text-sm clip-path-slant"
                        >
                            VOTE
                        </Button>
                    </div>
                    
                    {/* Top 3 Effects */}
                    {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-brand/20 to-transparent pointer-events-none" />}
                    {i === 1 && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />}
                    {i === 2 && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />}
                </div>
              )})}
        </div>
    </div>
  );
});
