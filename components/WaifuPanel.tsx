
import React, { useMemo, useState } from 'react';
import { Character, GameSettings } from '../types';
import { MarketCard } from './MarketCard';
import { Input, Select } from './ui/Input';

interface WaifuPanelProps {
  market: Character[];
  search: string;
  setSearch: (s: string) => void;
  onTrade: (c: Character) => void;
  settings: GameSettings;
  frozenIds: string[];
}

export const WaifuPanel: React.FC<WaifuPanelProps> = React.memo(({ market, search, setSearch, onTrade, settings, frozenIds }) => {
  const [sortBy, setSortBy] = useState("name");

  const filteredMarket = useMemo(() => {
    let res = market.filter(c => c.isWaifu);

    const searchLower = search.toLowerCase();
    res = res.filter(c => 
      (c.name || "").toLowerCase().includes(searchLower)
    );

    if (sortBy === 'price') res.sort((a,b) => (b.price || 0) - (a.price || 0));
    else res.sort((a,b) => (a.name || "").localeCompare(b.name || ""));

    return res;
  }, [market, search, sortBy]);

  const multiplier = settings.event?.active ? settings.event.priceMultiplier : 1;
  const tradingEnabled = settings.tradingEnabled;

  return (
    <div className="space-y-8 animate-fade-in-up">
       {/* Premium Header */}
       <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-brand/10 to-transparent border-l-4 border-brand p-8 shadow-2xl group">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
               <div>
                   <h2 className="text-5xl font-heading text-white italic tracking-tighter drop-shadow-lg">WAIFU <span className="text-brand text-transparent bg-clip-text bg-gradient-to-r from-brand to-pink-500">INDEX</span></h2>
                   <p className="text-xs text-brand/80 font-mono font-bold tracking-[0.3em] uppercase mt-2 pl-1">Premium Character Exchange • Elite Tier</p>
               </div>
               <div className="flex items-center gap-3">
                   <div className="px-3 py-1 bg-brand/20 border border-brand/30 text-brand text-[10px] font-bold uppercase tracking-widest rounded-sm backdrop-blur-md shadow-lg">
                       Verified Only
                   </div>
                   <div className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 text-[10px] font-bold uppercase tracking-widest rounded-sm backdrop-blur-md">
                       {filteredMarket.length} Assets
                   </div>
               </div>
           </div>
           
           {/* Decorative Elements */}
           <div className="absolute -right-10 -bottom-10 text-[12rem] text-brand/5 select-none font-heading italic pointer-events-none group-hover:scale-105 transition-transform duration-1000 ease-out">♥</div>
           <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand/5 to-transparent pointer-events-none" />
           <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
       </div>

      <div className="flex flex-col md:flex-row gap-0 glass-panel border border-line p-0 overflow-hidden sticky top-4 z-30 shadow-xl rounded-sm">
         <Input placeholder="SEARCH WAIFU DATABASE..." value={search} onChange={e => setSearch(e.target.value)} className="!bg-bg0/80 !backdrop-blur-md !border-0 !border-r !border-line focus:!ring-0 !rounded-none h-12" />
         <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="!bg-bg0/80 !backdrop-blur-md !border-0 !rounded-none min-w-[140px] h-12">
            <option value="name">SORT: A-Z</option>
            <option value="price">SORT: PRICE</option>
         </Select>
      </div>

      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1px 400px' }}
      >
        {filteredMarket.map(char => (
          <MarketCard 
            key={char.id} 
            char={char} 
            onTrade={onTrade} 
            isFrozen={frozenIds.includes(char.id)}
            tradingEnabled={tradingEnabled}
            multiplier={multiplier}
          />
        ))}
        {filteredMarket.length === 0 && (
            <div className="col-span-full py-20 text-center glass-panel border-dashed border-2 border-line">
                <div className="text-4xl mb-4 grayscale opacity-20 animate-pulse">♥</div>
                <div className="text-muted font-heading text-xl tracking-widest">NO ASSETS FOUND</div>
            </div>
        )}
      </div>
    </div>
  );
});
