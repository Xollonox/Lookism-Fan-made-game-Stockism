
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { formatMoney } from '../services/firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  setView: (v: string) => void;
  userEmail: string | null;
  isAdmin: boolean;
  onLogout: () => void;
  onLoginRequest?: () => void;
  cash: number;
  netWorth: number;
  isTradingEnabled: boolean;
  bannerImageUrl?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeView, setView, userEmail, isAdmin, onLogout, onLoginRequest, cash, netWorth, isTradingEnabled, bannerImageUrl 
}) => {
  
  const isGuest = !userEmail;
  const [theme, setTheme] = useState(() => localStorage.getItem('stockism-theme') || 'dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBannerError, setIsBannerError] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('stockism-theme', theme);
  }, [theme]);

  // Reset error if URL changes
  useEffect(() => {
    setIsBannerError(false);
  }, [bannerImageUrl]);

  // Handle body scroll lock on mobile when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isMenuOpen]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const NavItem = ({ view, label, icon, hidden = false }: { view: string, label: string, icon?: string, hidden?: boolean }) => {
    if (hidden) return null;
    const isActive = activeView === view;
    return (
      <button
        onClick={() => {
          setView(view);
          setIsMenuOpen(false);
        }}
        className={`group relative flex items-center gap-4 px-5 py-3.5 w-full text-left transition-all duration-300 rounded-lg ${
          isActive 
            ? 'bg-white/5 text-white shadow-inner' 
            : 'text-muted hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className={`w-5 text-center font-mono text-[10px] font-bold ${isActive ? 'text-brand' : 'text-muted/50 group-hover:text-white'}`}>
            {icon}
        </div>
        <span className="font-heading text-[13px] tracking-widest uppercase">{label}</span>
        {isActive && <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-brand rounded-r" />}
      </button>
    );
  };

  const BannerLogo = ({ mobile = false }: { mobile?: boolean }) => {
    if (bannerImageUrl && !isBannerError) {
      return (
        <div className={`${mobile ? 'h-8' : 'h-10'} flex items-center justify-center overflow-hidden`}>
          <img 
            src={bannerImageUrl} 
            alt="Stockism Logo" 
            className="h-full object-contain"
            loading="lazy"
            onError={() => setIsBannerError(true)}
          />
        </div>
      );
    }

    return (
      <div className="relative inline-block">
        <div className={`${mobile ? 'text-xl' : 'text-3xl'} font-heading italic tracking-tighter text-white uppercase`}>
          STOCK<span className="text-brand">ISM</span>
        </div>
        {!mobile && (
          <span className="absolute -top-3 -right-6 text-[8px] font-mono font-bold px-1.5 py-0.5 bg-brand text-white clip-corner">PREMIUM</span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bg0 text-white font-body selection:bg-brand flex flex-col lg:flex-row transition-colors duration-500 overflow-hidden relative">
      
      {/* Universal Theme Toggle - Fixed Top Right */}
      <div className="fixed top-5 right-20 lg:right-10 z-[110] flex items-center">
        <button 
          onClick={toggleTheme}
          className="p-2.5 glass-panel border border-line hover:border-brand text-muted hover:text-brand transition-all flex items-center justify-center shadow-lg group active:scale-95 rounded-lg"
          title="Toggle System Theme"
        >
          <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold uppercase hidden md:block opacity-60 group-hover:opacity-100">{theme} MODE</span>
              {theme === 'dark' ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
          </div>
        </button>
      </div>

      {/* Mobile Bar - Glass Effect */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-line px-6 py-4 flex justify-between items-center transition-colors duration-500">
        <BannerLogo mobile />
        <div className="flex items-center gap-4">
           {!isGuest && (
             <div className="text-[11px] font-mono font-bold text-good px-2 py-0.5 border border-good/20 bg-good/5 rounded">Φ {formatMoney(cash)}</div>
           )}
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)} 
             className="flex flex-col gap-1.5 p-2 z-[110]"
             aria-label="Toggle Menu"
           >
             <span className={`w-5 h-0.5 bg-white transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
             <span className={`w-5 h-0.5 bg-brand transition-opacity ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
             <span className={`w-5 h-0.5 bg-white transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
           </button>
        </div>
      </div>

      {/* Sidebar Desktop - Glass Effect */}
      <aside className="hidden lg:flex flex-col w-[300px] sticky top-0 h-screen border-r border-line bg-card backdrop-blur-md z-20 overflow-y-auto custom-scrollbar transition-colors duration-500">
          <div className="p-8 pb-6 text-center border-b border-line flex-shrink-0">
            <BannerLogo />
            <div className="mt-8 px-4 py-2 bg-black/20 border border-line rounded flex items-center justify-between">
               <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Exchange Status</span>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isTradingEnabled ? 'bg-good shadow-[0_0_8px_var(--color-good)]' : 'bg-bad shadow-[0_0_8px_var(--color-bad)]'}`}></div>
                  <span className={`text-[10px] font-mono font-bold ${isTradingEnabled ? 'text-white' : 'text-bad'}`}>{isTradingEnabled ? 'OPEN' : 'CLOSED'}</span>
               </div>
            </div>
          </div>
          
          <div className="flex-1 py-6">
             <div className="px-8 text-[9px] font-black text-muted/40 uppercase tracking-[0.2em] mb-4">Core Terminal</div>
             <nav className="mb-8 px-2">
                <NavItem view="dashboard" label="Overview" icon="01" />
                <NavItem view="portfolio" label="My Assets" icon="02" hidden={isGuest} />
                <NavItem view="profile" label="Profile" icon="PR" hidden={isGuest} />
                <NavItem view="news" label="Global Intel" icon="03" />
                <NavItem view="trades" label="Live Ticker" icon="04" />
             </nav>

             <div className="px-8 text-[9px] font-black text-muted/40 uppercase tracking-[0.2em] mb-4">Market Index</div>
             <nav className="mb-8 px-2">
                <NavItem view="market" label="Main Exchange" icon="MK" />
                <NavItem view="waifu" label="Waifu Index" icon="WF" />
             </nav>

             <div className="px-8 text-[9px] font-black text-muted/40 uppercase tracking-[0.2em] mb-4">Global Data</div>
             <nav className="px-2">
                <NavItem view="popularity" label="Popularity" icon="PV" />
                <NavItem view="strongest" label="Power Rankings" icon="PR" />
                <NavItem view="leaderboard" label="Hall of Fame" icon="LB" />
             </nav>
          </div>

          <div className="p-0 border-t border-line bg-black/20 flex-shrink-0">
             {!isGuest && (
               <div className="grid grid-cols-1 divide-y divide-line">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Liquid Funds</span>
                      <span className="text-[9px] font-mono text-good">ACTIVE</span>
                    </div>
                    <div className="text-2xl font-mono font-black text-white">Φ {formatMoney(cash)}</div>
                  </div>
                  <div className="p-6 bg-white/[0.02]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Net Value</span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white/80">Φ {formatMoney(netWorth)}</div>
                  </div>
               </div>
             )}
             
             <div className="p-6 border-t border-line">
                {isGuest ? (
                  <Button onClick={onLoginRequest} className="w-full shadow-lg">SYSTEM ACCESS</Button>
                ) : (
                  <div className="flex flex-col gap-4">
                    {isAdmin && (
                       <Button variant="danger" onClick={() => setView('admin')} className="w-full text-xs !py-2 shadow-[0_0_15px_rgba(225,29,72,0.2)]">ADMIN CONSOLE</Button>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Agent ID</span>
                        <span className="text-[11px] font-mono font-bold text-white uppercase truncate max-w-[120px]">{userEmail?.split('@')[0]}</span>
                      </div>
                      <button onClick={onLogout} className="text-[10px] font-black text-bad hover:text-white transition-colors uppercase tracking-widest">Sign Out</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 min-w-0 relative flex flex-col h-screen overflow-hidden z-10 transition-colors duration-500">
        {/* Visual Noise/Grid - Decorative only */}
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:40px_40px] opacity-20 pointer-events-none" />

        <header className="hidden lg:flex h-16 border-b border-line bg-bg1/80 backdrop-blur-md items-center justify-between px-10 z-20">
             <div className="flex items-center gap-10">
                 <div className="flex flex-col">
                     <span className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-60">Session Host</span>
                     <span className="text-[10px] font-mono font-bold text-white uppercase">Terminal-01</span>
                 </div>
                 <div className="flex flex-col">
                     <span className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-60">Sync Status</span>
                     <span className="text-[10px] font-mono font-bold text-good">SYNC: [ON]</span>
                 </div>
             </div>
             <div className="text-xl font-heading text-white italic opacity-10 uppercase tracking-[0.5em] select-none pointer-events-none">
                 {activeView}
             </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 relative custom-scrollbar z-10">
          <div className="max-w-7xl mx-auto space-y-10 pb-32">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Menu Backdrop */}
      {isMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[95] bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Container */}
      <div 
        className={`fixed inset-0 z-[100] bg-bg1/95 backdrop-blur-xl flex flex-col p-8 pt-24 transition-all duration-300 transform lg:hidden ${
          isMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
         <div className="flex-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            <NavItem view="dashboard" label="Overview" icon="01" />
            <NavItem view="market" label="Exchange" icon="02" />
            <NavItem view="waifu" label="Waifu Index" icon="WF" />
            <NavItem view="popularity" label="Popularity" icon="PV" />
            <NavItem view="strongest" label="Power Rankings" icon="PR" />
            <NavItem view="portfolio" label="My Assets" icon="PF" hidden={isGuest} />
            <NavItem view="profile" label="Profile" icon="ID" hidden={isGuest} />
            <NavItem view="leaderboard" label="Hall of Fame" icon="LB" />
            <NavItem view="news" label="Global News" icon="NW" />
            {isAdmin && <NavItem view="admin" label="ADMIN_CMD" icon="SU" />}
         </div>
         <div className="mt-8 border-t border-line pt-8">
            {isGuest ? (
              <Button onClick={() => { setIsMenuOpen(false); onLoginRequest?.(); }} className="w-full">AUTHENTICATE</Button>
            ) : (
              <Button variant="danger" onClick={() => { setIsMenuOpen(false); onLogout(); }} className="w-full">TERMINATE SESSION</Button>
            )}
         </div>
      </div>
    </div>
  );
};
