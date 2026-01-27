
import React, { useState, useEffect } from 'react';
import { Character, GameSettings } from '../types';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { formatMoney } from '../services/firebase';

interface TradeModalProps {
  char: Character;
  onClose: () => void;
  onExecute: (charId: string, side: 'BUY' | 'SELL', qty: number) => Promise<void>;
  holdings: number;
  cash: number;
  settings: GameSettings;
  lastTradeAt: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({ 
  char, onClose, onExecute, holdings, cash, settings, lastTradeAt 
}) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeholder = "/assets/placeholder-character.png";

  const total = char.price * qty;
  const maxShares = settings.maxSharesPerUser;
  
  // Validation
  let canTrade = true;
  let guardMsg = "Order parameters verified.";

  if (!settings.tradingEnabled) {
    canTrade = false;
    guardMsg = "Exchange currently offline.";
  } else if (settings.frozenCharacters.includes(char.id)) {
    canTrade = false;
    guardMsg = "Asset restricted by governance.";
  } else if (side === 'BUY' && cash < total) {
    canTrade = false;
    guardMsg = "Insufficient Phi liquidity.";
  } else if (side === 'SELL' && holdings < qty) {
    canTrade = false;
    guardMsg = "Insufficient asset holdings.";
  } else if (side === 'BUY' && maxShares > 0 && (holdings + qty) > maxShares) {
    canTrade = false;
    guardMsg = `Position limit reached (${maxShares}).`;
  }

  const handleExecute = async () => {
    if (!canTrade || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onExecute(char.id, side, qty);
      onClose();
    } catch (e: any) {
      setError(e.message || "Execution Error");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-bg0/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-card border border-line shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden clip-corner animate-in zoom-in-95 duration-200">
        
        {/* Header Ticker */}
        <div className="bg-black/40 border-b border-line px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-heading italic text-white leading-none">TRANSACTION_INIT</h2>
            <span className="text-[8px] font-mono text-muted uppercase mt-1 tracking-widest">Protocol Version: 2.1.0</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 text-muted hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Asset Info Card */}
          <div className="flex items-center gap-5 p-4 bg-bg0 border border-line">
             <div className="w-16 h-16 bg-white/5 border border-line flex items-center justify-center overflow-hidden shrink-0">
                <img 
                  src={char.imageUrl || placeholder} 
                  alt={char.name} 
                  className="w-full h-full object-cover grayscale-[0.2]"
                  onError={(e) => { e.currentTarget.src = placeholder; }}
                />
             </div>
             <div className="flex-1">
               <div className="text-[9px] font-bold text-brand uppercase tracking-widest mb-1">{char.crew || "Independent"}</div>
               <div className="font-heading text-xl text-white leading-none tracking-tight">{char.name}</div>
             </div>
             <div className="text-right">
               <div className="text-[8px] font-bold text-muted uppercase mb-1">Unit Price</div>
               <div className="text-lg font-mono font-black text-white">Φ {formatMoney(char.price)}</div>
             </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-muted uppercase tracking-widest">Order Type</label>
              <div className="flex bg-bg0 p-1 border border-line">
                <button 
                  onClick={() => setSide('BUY')}
                  className={`flex-1 py-2 text-[10px] font-black tracking-widest transition-all ${side === 'BUY' ? 'bg-good text-black' : 'text-muted hover:text-white'}`}
                >
                  BUY
                </button>
                <button 
                  onClick={() => setSide('SELL')}
                  className={`flex-1 py-2 text-[10px] font-black tracking-widest transition-all ${side === 'SELL' ? 'bg-bad text-white' : 'text-muted hover:text-white'}`}
                >
                  SELL
                </button>
              </div>
            </div>
            <Input 
               label="Units Qty" 
               type="number" 
               min="1" 
               value={qty} 
               onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
               className="!py-2.5 text-center"
            />
          </div>

          {/* Summation */}
          <div className="bg-bg0 p-5 border-l-2 border-brand relative">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Total Value</span>
                <span className={`text-2xl font-mono font-black ${side === 'BUY' ? 'text-white' : 'text-good'}`}>
                   Φ {formatMoney(total)}
                </span>
             </div>
             <div className="absolute top-2 right-2 opacity-5 text-4xl font-black italic tracking-tighter">TOTAL</div>
          </div>

          {error && <div className="text-bad text-[10px] font-bold text-center bg-bad/5 p-3 border border-bad/20">{error.toUpperCase()}</div>}
          
          <div className="space-y-4">
            <div className="text-[9px] text-center text-muted font-bold uppercase tracking-widest opacity-60 italic">{guardMsg}</div>
            <Button 
              onClick={handleExecute} 
              disabled={!canTrade || loading} 
              variant={side === 'BUY' ? 'primary' : 'danger'}
              className="w-full py-4 text-sm"
            >
              {loading ? 'EXECUTING...' : `AUTHORIZE ${side} ORDER`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
