import React, { useMemo, useState } from 'react';
import { Character, GameSettings } from '../types';
import { MarketCard } from './MarketCard';
import { Input, Select } from './ui/Input';
import { CREWS } from '../constants';

interface MarketProps {
  market: Character[];
  search: string;
  setSearch: (s: string) => void;
  onTrade: (c: Character) => void;
  settings: GameSettings;
  frozenIds: string[];
}

export const Market: React.FC<MarketProps> = React.memo(({ market, search, setSearch, onTrade, settings, frozenIds }) => {
  const [crewFilter, setCrewFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");

  const filteredMarket = useMemo(() => {
    let res = market.filter(c => !c.isWaifu);
    
    // Filter
    const searchLower = search.toLowerCase();
    res = res.filter(c => 
      (c.name || "").toLowerCase().includes(searchLower) && 
      (crewFilter === "All" || (c.crew || "Unknown") === crewFilter)
    );

    // Sort
    if (sortBy === 'price') res.sort((a,b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === 'crew') res.sort((a,b) => (a.crew || "").localeCompare(b.crew || ""));
    else res.sort((a,b) => (a.name || "").localeCompare(b.name || ""));

    return res;
  }, [market, search, crewFilter, sortBy]);

  const multiplier = settings.event?.active ? settings.event.priceMultiplier : 1;
  const tradingEnabled = settings.tradingEnabled;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-0 border border-line bg-black sticky top-4 z-20 shadow-lg">
         <Input placeholder="SEARCH TARGET..." value={search} onChange={e => setSearch(e.target.value)} className="!border-0 !border-r !border-line focus:!ring-0" />
         <Select value={crewFilter} onChange={e => setCrewFilter(e.target.value)} className="!border-0 !border-r !border-line">
            <option value="All">ALL CREWS</option>
            {CREWS.map(c => <option key={c} value={c}>{c}</option>)}
         </Select>
         <Select value={sortBy} onChange={e => setSortBy(e.target.value)} className="!border-0">
            <option value="name">A-Z</option>
            <option value="price">PRICE</option>
            <option value="crew">CREW</option>
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
      </div>
    </div>
  );
});