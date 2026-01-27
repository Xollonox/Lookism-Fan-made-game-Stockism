
import React from 'react';
import { Announcement } from '../types';
import { formatTime } from '../services/firebase';
import { Button } from './ui/Button';

interface NewsCardProps {
  item: Announcement;
  onJumpToMarket?: (charName: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, onJumpToMarket }) => {
  let borderColor = 'border-l-4 border-l-line';
  let textColor = 'text-white';
  let badgeColor = 'bg-line text-muted';
  let typeLabel = item.type;

  if (item.type === 'character') {
      if (item.priceChange && item.priceChange > 0) {
        borderColor = 'border-l-4 border-l-good';
        textColor = 'text-good';
        badgeColor = 'bg-good text-black';
      } else if (item.priceChange && item.priceChange < 0) {
        borderColor = 'border-l-4 border-l-bad';
        textColor = 'text-bad';
        badgeColor = 'bg-bad text-black';
      } else {
        borderColor = 'border-l-4 border-l-brand';
        textColor = 'text-brand';
        badgeColor = 'bg-brand text-white';
      }
  } else if (item.type === 'event') {
    borderColor = 'border-l-4 border-l-warn';
    textColor = 'text-warn';
    badgeColor = 'bg-warn text-black';
  }

  return (
    <div className={`p-6 glass-panel ${borderColor} mb-4 relative hover:bg-white/5 transition-colors rounded-r-lg`}>
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 tracking-widest rounded ${badgeColor}`}>
                    {typeLabel}
                </span>
                {item.priceChange !== undefined && item.priceChange !== 0 && (
                    <span className={`font-mono font-bold text-sm ${item.priceChange > 0 ? 'text-good' : 'text-bad'}`}>
                        {item.priceChange > 0 ? '+' : ''}{item.priceChange}%
                    </span>
                )}
            </div>
            <span className="text-[10px] text-muted font-mono">{formatTime(item.createdAt)}</span>
        </div>
        
        <h3 className="text-xl font-heading mb-2 leading-none text-white uppercase tracking-wide">{item.title}</h3>
        <p className="text-sm text-muted font-mono leading-relaxed mb-4 border-l-2 border-line pl-3">{item.body}</p>
        
        {item.relatedCharacterId && item.characterName && onJumpToMarket && (
            <div className="flex justify-end">
                <Button 
                    variant="ghost" 
                    className="text-xs !p-0 hover:text-brand"
                    onClick={() => onJumpToMarket(item.characterName || "")}
                >
                    CHECK MARKET DATA &gt;&gt;
                </Button>
            </div>
        )}
    </div>
  );
};
