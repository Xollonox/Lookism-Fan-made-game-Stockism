
import React, { memo, useState } from 'react';
import { Character } from '../types';
import { Button } from './ui/Button';
import { formatMoney } from '../services/firebase';

interface MarketCardProps {
  char: Character;
  onTrade: (char: Character) => void;
  isFrozen: boolean;
  tradingEnabled: boolean;
  multiplier?: number;
}

export const MarketCard = memo(({ char, onTrade, isFrozen, tradingEnabled, multiplier = 1 }: MarketCardProps) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const name = char.name || "Unknown";
  const initial = (name).charAt(0).toUpperCase();
  const price = Number(char.price) || 0;
  const displayPrice = price * (Number(multiplier) || 1);
  const crew = char.crew || "Independent";
  const rarity = char.rarity || 'Common';

  const placeholder = "/assets/placeholder-character.png";

  // Visual System - Premium Rarity Grading
  const getRarityStyles = (r: string) => {
    switch(r) {
        case 'Mythic':
            return {
                border: 'border-red-600/70 hover:border-red-500',
                glow: 'shadow-[0_0_20px_-5px_rgba(220,38,38,0.25)]',
                badge: 'bg-red-950/90 text-red-200 border-red-500/60 shadow-[0_0_8px_rgba(220,38,38,0.4)] animate-pulse',
                inset: 'rgba(239, 68, 68, 0.1)'
            };
        case 'Legendary':
            return {
                border: 'border-amber-400/60 hover:border-amber-300',
                glow: 'shadow-[0_0_15px_-5px_rgba(251,191,36,0.2)]',
                badge: 'bg-amber-950/90 text-amber-200 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
                inset: 'rgba(251, 191, 36, 0.1)'
            };
        case 'Epic':
            return {
                border: 'border-fuchsia-600/50 hover:border-fuchsia-400',
                glow: 'shadow-[0_0_15px_-5px_rgba(217,70,239,0.15)]',
                badge: 'bg-fuchsia-950/90 text-fuchsia-200 border-fuchsia-500/50 shadow-[0_0_8px_rgba(192,38,211,0.2)]',
                inset: 'rgba(192, 38, 211, 0.08)'
            };
        case 'Rare':
            return {
                border: 'border-blue-500/40 hover:border-blue-400',
                glow: 'shadow-[0_0_10px_-5px_rgba(59,130,246,0.1)]',
                badge: 'bg-blue-950/80 text-blue-200 border-blue-500/40',
                inset: 'rgba(59, 130, 246, 0.05)'
            };
        default:
            return {
                border: 'border-white/10 hover:border-white/20',
                glow: 'shadow-none',
                badge: 'bg-zinc-900/90 text-zinc-400 border-zinc-700/60',
                inset: 'rgba(255, 255, 255, 0.02)'
            };
    }
  };

  const styles = getRarityStyles(rarity);

  return (
    <div 
      className={`character-card group relative flex flex-col h-full bg-card/40 backdrop-blur-xl border ${styles.border} ${styles.glow} transition-all duration-500 ease-out overflow-hidden rounded-sm hover:-translate-y-1`}
      style={{ 
        boxShadow: `0 0 0 1px inset ${styles.inset}`,
      }}
    >
      {/* Top Status Bar - Tech Decoration */}
      <div className="flex justify-between items-center px-3 py-1.5 bg-black/60 border-b border-white/5 backdrop-blur-sm z-20 relative">
         <div className="flex items-center gap-2">
            <div className={`w-1 h-1 rounded-full ${isFrozen ? 'bg-warn animate-pulse' : 'bg-good shadow-[0_0_4px_var(--color-good)]'}`} />
            <span className="text-[8px] font-mono text-white/50 uppercase tracking-widest">CL_{char.tier || 1}</span>
         </div>
         <span className="text-[8px] font-mono text-white/30 tracking-widest">ID:{char.id.substring(0,4).toUpperCase()}</span>
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/5] w-full bg-bg0/80 overflow-hidden">
        {/* Fallback Initial */}
        <div className="absolute inset-0 flex items-center justify-center bg-bg0 z-0">
            <span className="text-9xl font-heading font-black text-white/5 select-none scale-150">{initial}</span>
        </div>

        {/* Cinematic Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-10 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.3)_25%,rgba(255,255,255,.3)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.3)_75%,rgba(255,255,255,.3)_76%,transparent_77%,transparent)] [background-size:30px_30px] pointer-events-none"></div>

        <img 
          src={char.imageUrl || placeholder} 
          alt={name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.currentTarget.src = placeholder; setImgLoaded(true); }}
          className={`stockism-character-image relative z-0 w-full h-full object-cover transition-all duration-700 ease-out ${imgLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} 
        />
        
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg0 via-bg0/20 to-transparent z-10 pointer-events-none opacity-90" />
        
        {/* Rarity & Event Badges */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5 pointer-events-none">
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 tracking-[0.2em] shadow-lg backdrop-blur-md border ${styles.badge}`}>
                {rarity}
            </span>
             {multiplier !== 1 && (
               <div className="bg-brand text-white text-[8px] font-black uppercase px-2 py-0.5 tracking-widest flex items-center gap-1 shadow-brand/40 shadow-lg border border-brand/50">
                 <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                 {multiplier}x
               </div>
             )}
        </div>

        {/* Character Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 pointer-events-none transform translate-y-1 transition-transform duration-500 group-hover:translate-y-0">
            <div className="text-[9px] font-black text-brand uppercase tracking-[0.25em] mb-0.5 pl-0.5 shadow-black/80 drop-shadow-md opacity-90">{crew}</div>
            <h3 className="font-heading text-3xl leading-[0.85] text-white italic tracking-tighter drop-shadow-xl">{name}</h3>
        </div>
      </div>

      {/* Action / Price Area */}
      <div className="px-4 py-3 flex flex-col gap-3 flex-1 justify-end bg-white/[0.02] backdrop-blur-md relative border-t border-white/5 group-hover:bg-white/[0.04] transition-colors duration-300">
        <div className="flex justify-between items-end">
             <div className="flex flex-col">
                <span className="text-[8px] text-muted font-bold uppercase tracking-widest mb-1 opacity-60">Value</span>
                <span className="text-xl font-mono text-white font-black flex items-center gap-1 leading-none tracking-tight">
                    <span className="text-brand text-sm opacity-80">Φ</span>
                    {formatMoney(displayPrice)}
                </span>
             </div>
             <div className="text-right flex flex-col items-end">
                <span className="text-[8px] text-muted font-bold uppercase tracking-widest mb-1 opacity-60">Action</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${isFrozen ? 'bg-warn/10 text-warn border border-warn/20' : 'bg-good/10 text-good border border-good/20'}`}>
                  {isFrozen ? 'FROZEN' : 'ACTIVE'}
                </span>
             </div>
        </div>

        <Button 
          onClick={() => onTrade(char)} 
          disabled={!tradingEnabled || isFrozen}
          className={`w-full !py-2 shadow-lg opacity-90 group-hover:opacity-100 transition-all ${isFrozen ? 'grayscale' : ''}`}
          variant={isFrozen ? 'secondary' : 'primary'}
        >
          {isFrozen ? 'LOCKED' : 'TRADE'}
        </Button>
      </div>

      {/* Decorative Active Border on Hover */}
      <div className={`absolute inset-0 border-2 ${styles.border} opacity-0 group-hover:opacity-10 pointer-events-none rounded-sm mix-blend-overlay`} />
    </div>
  );
}, (prev, next) => {
  return (
    prev.char.id === next.char.id &&
    prev.char.price === next.char.price &&
    prev.char.name === next.char.name &&
    prev.char.imageUrl === next.char.imageUrl &&
    prev.isFrozen === next.isFrozen &&
    prev.tradingEnabled === next.tradingEnabled &&
    prev.multiplier === next.multiplier
  );
});
