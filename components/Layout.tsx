import React from 'react';
import { Button } from './ui/Button';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setView: (v: string) => void;
  userEmail: string | null;
  isAdmin: boolean;
  onLogout: () => void;
  cash: number;
  netWorth: number;
  status: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeView, setView, userEmail, isAdmin, onLogout, cash, netWorth, status 
}) => {
  const NavItem = ({ view, label, icon }: { view: string, label: string, icon?: string }) => (
    <button
      onClick={() => setView(view)}
      className={`w-full text-left px-4 py-3 rounded-2xl font-black text-sm flex items-center gap-3 transition-all ${
        activeView === view 
        ? 'bg-brand/20 border border-brand/50 text-white' 
        : 'bg-white/5 border border-line text-muted hover:bg-white/10 hover:text-white'
      }`}
    >
      {label}
      {view === 'admin' && <span className="ml-auto text-[10px] bg-warn/20 text-warn px-2 py-0.5 rounded-full border border-warn/30">ADMIN</span>}
    </button>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-[#070A14]/80 backdrop-blur-md border-b border-line">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand2 relative overflow-hidden shadow-lg animate-[pulse_4s_ease-in-out_infinite]">
               <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,white_90deg,transparent_180deg)] opacity-30 animate-spin-slow"></div>
            </div>
            <div className="leading-tight">
              <h1 className="font-black text-lg tracking-tight">Stockism</h1>
              <div className="text-[10px] font-bold text-muted">Lookism Market</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-white/5">
                <span className="w-2 h-2 rounded-full bg-good animate-pulse"></span>
                <span className="text-xs font-bold">{status}</span>
             </div>
             {userEmail && <Button variant="ghost" onClick={onLogout} className="text-xs py-1.5 px-3">Logout</Button>}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:block sticky top-24 h-fit space-y-4">
          <div className="bg-card backdrop-blur-sm border border-line rounded-[24px] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
               <span className="text-xs font-bold text-muted">My Wallet</span>
               <span className="text-xs font-bold text-brand bg-brand/10 px-2 py-1 rounded-lg">LIVE</span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Cash</div>
                <div className="text-2xl font-black tracking-tight">₹{Math.round(cash).toLocaleString()}</div>
              </div>
              <div>
                 <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Net Worth</div>
                 <div className="text-xl font-bold tracking-tight text-white/80">₹{Math.round(netWorth).toLocaleString()}</div>
              </div>
            </div>
            <div className="h-px bg-line my-5" />
            <div className="space-y-2">
              <NavItem view="dashboard" label="Dashboard" />
              <NavItem view="market" label="Market" />
              <NavItem view="portfolio" label="Portfolio" />
              <NavItem view="trades" label="Trades" />
              <NavItem view="leaderboard" label="Leaderboard" />
              {isAdmin && <NavItem view="admin" label="Panel" />}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-[500px]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#070A14]/90 backdrop-blur-xl border-t border-line p-2 pb-safe z-50">
        <div className="grid grid-cols-5 gap-1">
          {['dashboard', 'market', 'portfolio', 'trades', 'leaderboard'].map(view => (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all ${
                activeView === view ? 'bg-brand/20 text-brand' : 'text-muted hover:bg-white/5'
              }`}
            >
              <span className="text-[10px] font-black uppercase">{view.slice(0, 4)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};