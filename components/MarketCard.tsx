import React from 'react';
import { Character } from '../types';
import { Button } from './ui/Button';
import { formatMoney } from '../services/firebase';

interface MarketCardProps {
  char: Character;
  onTrade: (char: Character) => void;
  isFrozen: boolean;
  tradingEnabled: boolean;
}

export const MarketCard: React.FC<MarketCardProps> = ({ char, onTrade, isFrozen, tradingEnabled }) => {
  const initial = (char.name || "S").charAt(0).toUpperCase();

  return (
    <div className="relative group overflow-hidden rounded-[22px] border border-line bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-lg hover:border-brand/30 transition-all duration-300">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute -inset-[1px] bg-gradient-to-b from-brand/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-brand2 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shrink-0 font-black text-xl text-white">
          {char.imageUrl && char.imageUrl.startsWith('http') ? (
            <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-base truncate leading-tight text-white">{char.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {char.crew && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 text-muted">{char.crew}</span>}
            {char.rarity && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 text-brand">{char.rarity}</span>}
            {isFrozen && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-warn/30 bg-warn/10 text-warn">FROZEN</span>}
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 mt-4">
        <div>
          <div className="text-[10px] uppercase font-bold text-muted mb-0.5">Price</div>
          <div className="text-xl font-black text-white">₹{formatMoney(char.price)}</div>
        </div>
        <Button 
          onClick={() => onTrade(char)} 
          disabled={!tradingEnabled || isFrozen}
          className="px-6 py-2 text-xs"
        >
          Trade
        </Button>
      </div>
    </div>
  );
};