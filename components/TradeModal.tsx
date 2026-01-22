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

  const total = char.price * qty;
  const cooldownRemaining = Math.max(0, (lastTradeAt + (settings.cooldownSeconds * 1000)) - Date.now());
  const maxShares = settings.maxSharesPerUser;
  
  // Validation
  let canTrade = true;
  let guardMsg = "Ready to trade.";

  if (!settings.tradingEnabled) {
    canTrade = false;
    guardMsg = "Trading disabled by Admin.";
  } else if (settings.frozenCharacters.includes(char.id)) {
    canTrade = false;
    guardMsg = "This character is frozen.";
  } else if (side === 'BUY' && cash < total) {
    canTrade = false;
    guardMsg = "Insufficient funds.";
  } else if (side === 'SELL' && holdings < qty) {
    canTrade = false;
    guardMsg = "Insufficient shares.";
  } else if (side === 'BUY' && maxShares > 0 && (holdings + qty) > maxShares) {
    canTrade = false;
    guardMsg = `Max ownership limit: ${maxShares}.`;
  }

  const handleExecute = async () => {
    if (!canTrade || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onExecute(char.id, side, qty);
      onClose();
    } catch (e: any) {
      setError(e.message || "Trade failed");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121a42] border border-line rounded-[24px] shadow-2xl p-6 relative overflow-hidden">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Trade Request</h2>
          <Button variant="ghost" onClick={onClose} className="!p-2 h-8 w-8 rounded-full">✕</Button>
        </div>

        <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-2xl border border-line">
           <div className="w-14 h-14 rounded-xl bg-brand flex items-center justify-center font-black text-2xl text-white">
             {char.imageUrl ? <img src={char.imageUrl} className="w-full h-full object-cover rounded-xl"/> : char.name[0]}
           </div>
           <div>
             <div className="font-black text-lg leading-none">{char.name}</div>
             <div className="text-muted text-xs mt-1 font-bold">{char.crew || "No Crew"}</div>
           </div>
           <div className="ml-auto text-right">
             <div className="text-[10px] font-bold text-muted">CURRENT PRICE</div>
             <div className="text-xl font-black">₹{formatMoney(char.price)}</div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-black text-muted mb-2">ACTION</label>
            <div className="flex bg-white/5 p-1 rounded-2xl border border-line">
              <button 
                onClick={() => setSide('BUY')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${side === 'BUY' ? 'bg-good text-black shadow-lg' : 'text-muted hover:text-white'}`}
              >
                BUY
              </button>
              <button 
                onClick={() => setSide('SELL')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${side === 'SELL' ? 'bg-bad text-white shadow-lg' : 'text-muted hover:text-white'}`}
              >
                SELL
              </button>
            </div>
          </div>
          <Input 
             label="QUANTITY" 
             type="number" 
             min="1" 
             value={qty} 
             onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-line mb-6">
           <span className="text-sm font-bold text-muted">Total Value</span>
           <span className={`text-xl font-black ${side === 'BUY' ? 'text-bad' : 'text-good'}`}>
             {side === 'BUY' ? '-' : '+'} ₹{formatMoney(total)}
           </span>
        </div>

        {error && <div className="text-bad text-xs font-bold text-center mb-4 bg-bad/10 p-2 rounded-lg">{error}</div>}
        
        <div className="text-xs text-center text-muted font-bold mb-4">{guardMsg}</div>

        <Button 
          onClick={handleExecute} 
          disabled={!canTrade || loading} 
          variant={side === 'BUY' ? 'primary' : 'danger'}
          className="w-full py-4 text-base"
        >
          {loading ? 'Processing...' : `Confirm ${side}`}
        </Button>
      </div>
    </div>
  );
};