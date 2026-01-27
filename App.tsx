import React, { useState, useEffect, useMemo } from 'react';
import { auth, db, formatMoney, formatTime } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  type User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  serverTimestamp, 
  runTransaction,
  limit
} from 'firebase/firestore';
import { Layout } from './components/Layout';
import { Button } from './components/ui/Button';
import { Input, Select } from './components/ui/Input';
import { MarketCard } from './components/MarketCard';
import { TradeModal } from './components/TradeModal';
import { AdminPanel } from './components/AdminPanel';
import { NewsCard } from './components/NewsCard';
import { Character, GameSettings, UserProfile, Trade, UserPrivateData, Announcement } from './types';
import { ADMIN_EMAIL } from './constants';
import { Market } from './components/Market';
import { WaifuPanel } from './components/WaifuPanel';
import { StrongestRank } from './components/StrongestRank';
import { GooAI } from './components/GooAI';
import { GoogleGenAI } from "@google/genai";

const SkeletonLoader = () => (
  <div className="min-h-screen bg-bg0 p-8 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
          <div className="text-4xl font-heading text-white animate-pulse">SYSTEM_BOOT</div>
          <div className="w-64 h-2 bg-line rounded overflow-hidden">
              <div className="h-full bg-brand animate-[scanline_2s_linear_infinite] w-full origin-left"></div>
          </div>
          <div className="font-mono text-xs text-muted uppercase">Establishing Secure Uplink</div>
      </div>
  </div>
);

const AuthModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm glass-panel shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative p-8 clip-corner">
          <Button variant="ghost" onClick={onClose} className="absolute top-2 right-2 !p-2 h-8 w-8 rounded-full z-10">✕</Button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading italic tracking-tighter text-white mb-2">STOCK<span className="text-brand">ISM</span></h1>
            <p className="text-xs text-brand font-mono tracking-[0.2em] uppercase">{isSignup ? "New Agent Registration" : "Agent Authentication"}</p>
            {isSignup && (
              <div className="mt-4 p-2 bg-brand/5 border border-brand/20 rounded flex items-center justify-between">
                <span className="text-[10px] text-muted font-mono uppercase">Initial Grant</span>
                <span className="text-xs text-brand font-black">Φ 5,000</span>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <Input placeholder="AGENT ID" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/30" />
            <Input type="password" placeholder="ACCESS CODE" value={password} onChange={e => setPassword(e.target.value)} className="bg-black/30" />
            {error && <div className="text-bad text-xs font-mono border border-bad/50 p-2 text-center uppercase">{error}</div>}
            
            <div className="pt-2 space-y-3">
              <Button onClick={handleAuth} disabled={loading} className="w-full shadow-lg">
                {loading ? 'PROCESSING' : (isSignup ? 'REGISTER' : 'LOGIN')}
              </Button>
              <div className="text-center">
                 <button 
                   onClick={() => setIsSignup(!isSignup)} 
                   className="text-xs text-muted hover:text-white underline font-mono uppercase tracking-widest"
                 >
                   {isSignup ? "Return to Login" : "Request Access"}
                 </button>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const GuestBanner = ({ onLogin }: { onLogin: () => void }) => (
  <div className="fixed bottom-0 left-0 right-0 z-[100] bg-brand text-white p-3 shadow-[0_-5px_20px_rgba(225,29,72,0.3)] animate-in slide-in-from-bottom-full duration-500">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4">
      <div className="flex items-center gap-3">
        <div className="bg-white text-brand font-black px-2 py-1 text-xs rounded uppercase">Phi Grant Active</div>
        <p className="font-heading text-sm sm:text-base tracking-wide uppercase">Initialize session to secure Phi 5,000 bonus credits.</p>
      </div>
      <Button onClick={onLogin} variant="secondary" className="bg-black text-white border-none hover:bg-white hover:text-brand !py-2 text-xs w-full sm:w-auto">
        INITIALIZE SESSION
      </Button>
    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loadingError, setLoadingError] = useState(false);
  const [view, setView] = useState('dashboard');
  const [isBanned, setIsBanned] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [cash, setCash] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [username, setUsername] = useState('');
  const [market, setMarket] = useState<Character[]>([]);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [news, setNews] = useState<Announcement[]>([]);
  
  const [tradeChar, setTradeChar] = useState<Character | null>(null);
  const [lastTradeAt, setLastTradeAt] = useState(0);
  const [search, setSearch] = useState("");
  
  const [editUsername, setEditUsername] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  
  const [popTab, setPopTab] = useState<'Male'|'Female'>('Male');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [settings, setSettings] = useState<GameSettings>({
    tradingEnabled: true,
    marketMessage: "",
    season: 1,
    cashCap: 0,
    cooldownSeconds: 0,
    maxSharesPerUser: 0,
    frozenCharacters: [],
    popularityVotingEnabled: false,
    strongestVotingEnabled: false,
    bannerImageUrl: ""
  });

  const placeholder = "/assets/placeholder-character.png";

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setLoadingError(true);
    }, 8000); 
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        setShowAuthModal(false); 
        const userRef = doc(db, 'users', u.uid);
        const pubRef = doc(db, 'users_public', u.uid);
        try {
          const privSnap = await getDoc(userRef);
          if (!privSnap.exists()) {
             await setDoc(userRef, { 
               cash: 5000, 
               createdAt: serverTimestamp(), 
               email: u.email,
               bonusClaimed: true 
             }, { merge: true });
             setShowWelcome(true);
          } else {
            const pData = privSnap.data() as UserPrivateData;
            if (pData.isBanned) setIsBanned(true);
            setUserRole(pData.role || null);
          }
          const pubSnap = await getDoc(pubRef);
          if (!pubSnap.exists()) {
            const defaultName = (u.email || "user").split("@")[0].slice(0, 12);
            await setDoc(pubRef, { 
              username: defaultName, 
              netWorth: 5000, 
              liquidPhi: 5000,
              updatedAt: serverTimestamp() 
            }, { merge: true });
          }
        } catch (e) {
          console.warn("User sync error", e);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubGame = onSnapshot(doc(db, 'game', 'settings'), (snap) => { 
        if (snap.exists()) {
          const s = snap.data();
          setSettings({
            tradingEnabled: s.tradingEnabled ?? true,
            marketMessage: s.marketMessage || "",
            season: s.season || 1,
            cashCap: s.cashCap || 0,
            cooldownSeconds: s.cooldownSeconds || 0,
            maxSharesPerUser: s.maxSharesPerUser || 0,
            frozenCharacters: Array.isArray(s.frozenCharacters) ? s.frozenCharacters : [],
            event: s.event || undefined,
            popularityVotingEnabled: s.popularityVotingEnabled ?? false,
            strongestVotingEnabled: s.strongestVotingEnabled ?? false,
            bannerImageUrl: s.bannerImageUrl || ""
          });
        }
    });

    const unsubMarket = onSnapshot(query(collection(db, 'characters'), orderBy('name')), (snap) => {
        const chars: Character[] = [];
        snap.forEach(d => {
           const data = d.data();
           chars.push({ id: d.id, ...data } as Character);
        });
        setMarket(chars);
    });

    const unsubTrades = onSnapshot(query(collection(db, 'trades'), orderBy('createdAt', 'desc'), limit(20)), (snap) => {
        const t: Trade[] = [];
        snap.forEach(d => t.push(d.data() as Trade));
        setTrades(t);
    });

    const unsubLb = onSnapshot(query(collection(db, 'users_public'), orderBy('netWorth', 'desc'), limit(25)), (snap) => {
        const l: UserProfile[] = [];
        snap.forEach(d => l.push(d.data() as UserProfile));
        setLeaderboard(l);
    });

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
        const n: Announcement[] = [];
        snap.forEach(d => n.push({ id: d.id, ...d.data() } as Announcement));
        setNews(n);
    });

    return () => {
      unsubGame(); unsubMarket(); unsubTrades(); unsubLb(); unsubNews();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubWallet = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCash(Number(data.cash) || 0);
        setIsBanned(!!data.isBanned);
        setUserRole(data.role || null);
      }
    });
    const unsubHoldings = onSnapshot(collection(db, 'holdings', user.uid, 'items'), (snap) => {
      const h: Record<string, number> = {};
      snap.forEach(d => {
        const val = Number(d.data().shares);
        if (val > 0) h[d.id] = val;
      });
      setHoldings(h);
    });
    const unsubProfile = onSnapshot(doc(db, 'users_public', user.uid), (snap) => { 
      if(snap.exists()) {
        const name = snap.data().username || "";
        setUsername(name);
        setEditUsername(name);
      }
    });
    return () => { unsubWallet(); unsubHoldings(); unsubProfile(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let portfolioValue = 0;
    const multiplier = (settings.event?.active && settings.event.priceMultiplier) ? Number(settings.event.priceMultiplier) : 1;
    Object.entries(holdings).forEach(([id, shares]) => {
      const char = market.find(c => c.id === id);
      if (char) portfolioValue += (Number(char.price) * multiplier) * (Number(shares) || 0);
    });
    const total = (Number(cash) || 0) + portfolioValue;
    setNetWorth(total);
    const timeout = setTimeout(() => {
      if (total > 0 || cash > 0) {
        updateDoc(doc(db, 'users_public', user.uid), { 
          netWorth: total, 
          liquidPhi: Number(cash) || 0,
          updatedAt: serverTimestamp() 
        }).catch(() => {});
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [cash, holdings, market, user, settings.event]);

  const generateMarketInsight = async () => {
    if (!market.length) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyze market: ${market.slice(0, 10).map(c => c.name).join(', ')}. Status: ${settings.tradingEnabled ? "OPEN" : "CLOSED"}. Provide strategic outlook.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || "Market stable.");
    } catch (e) {
      setAiInsight("Terminal connection unstable.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setView('dashboard');
  };

  const handleUpdateUsername = async () => {
    if (!user) return;
    if (editUsername.trim().length < 3) {
      setProfileMessage({ text: "Callsign too short", type: "error" });
      return;
    }
    setIsUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'users_public', user.uid), {
        username: editUsername.trim(),
        updatedAt: serverTimestamp()
      });
      setProfileMessage({ text: "Credentials updated", type: "success" });
    } catch (e: any) {
      setProfileMessage({ text: "Update failed", type: "error" });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleTrade = async (charId: string, side: 'BUY' | 'SELL', qty: number) => {
    if (!user || !username) return;
    const now = Date.now();
    if (now - lastTradeAt < (settings.cooldownSeconds * 1000)) throw new Error("Order cooldown");
    await runTransaction(db, async (txn) => {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await txn.get(userRef);
      const charRef = doc(db, 'characters', charId);
      const charDoc = await txn.get(charRef);
      const holdingRef = doc(db, 'holdings', user.uid, 'items', charId);
      const holdingDoc = await txn.get(holdingRef);
      if (!charDoc.exists()) throw new Error("Asset missing");
      const charData = charDoc.data() as Character;
      const multiplier = (settings.event?.active && settings.event.priceMultiplier) ? settings.event.priceMultiplier : 1;
      const finalPrice = Math.floor((charData.price || 0) * multiplier);
      const totalCost = finalPrice * qty;
      const currentCash = userDoc.data()?.cash || 0;
      const currentShares = holdingDoc.exists() ? holdingDoc.data().shares : 0;
      if (side === 'BUY') {
        if (currentCash < totalCost) throw new Error("Liquidity failure");
        txn.update(userRef, { cash: currentCash - totalCost });
        txn.set(holdingRef, { shares: currentShares + qty }, { merge: true });
      } else {
        if (currentShares < qty) throw new Error("Asset deficiency");
        txn.update(userRef, { cash: currentCash + totalCost });
        txn.set(holdingRef, { shares: currentShares - qty }, { merge: true });
      }
      const tradeRef = doc(collection(db, 'trades'));
      txn.set(tradeRef, {
        uid: user.uid,
        username,
        charId,
        character: charData.name,
        side,
        qty,
        price: finalPrice,
        total: totalCost,
        createdAt: serverTimestamp()
      });
    });
    setLastTradeAt(Date.now());
  };

  const handleVote = async (charId: string, charGender: 'Male'|'Female') => {
    if (!user || !settings.popularityVotingEnabled) return;
    const today = new Date().toISOString().split('T')[0]; 
    const voteId = `v_${today}_${user.uid}_${charGender}`;
    const voteRef = doc(db, 'daily_votes', voteId);
    const charRef = doc(db, 'characters', charId);
    try {
        await runTransaction(db, async (txn) => {
            const voteDoc = await txn.get(voteRef);
            if (voteDoc.exists()) throw new Error("Daily quota reached");
            const cDoc = await txn.get(charRef);
            txn.update(charRef, { popularityVotes: (cDoc.data()?.popularityVotes || 0) + 1 });
            txn.set(voteRef, { uid: user.uid, charId, timestamp: serverTimestamp() });
        });
        alert("Vote registered");
    } catch (e: any) { alert(e.message); }
  };

  if (loadingError) return (
    <div className="min-h-screen bg-bg0 flex items-center justify-center p-4">
      <div className="glass-panel p-8 text-center max-w-sm w-full">
        <h2 className="text-xl font-heading mb-2 text-bad uppercase tracking-widest">Connection Error</h2>
        <Button onClick={() => window.location.reload()} className="w-full">RETRY</Button>
      </div>
    </div>
  );

  if (loading) return <SkeletonLoader />;

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || userRole === 'worker';

  return (
    <Layout 
      activeView={view} 
      setView={setView} 
      userEmail={user?.email || null} 
      isAdmin={isAdmin}
      onLogout={handleLogout}
      onLoginRequest={() => setShowAuthModal(true)}
      cash={cash}
      netWorth={netWorth}
      isTradingEnabled={settings.tradingEnabled}
      bannerImageUrl={settings.bannerImageUrl}
    >
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={() => setShowAuthModal(false)} />}
      {!user && <GuestBanner onLogin={() => setShowAuthModal(true)} />}

      {view === 'dashboard' && (
        <div className="space-y-6">
          {!user && (
            <div className="glass-panel p-12 text-center animate-fade-in-up">
                <h1 className="text-6xl font-heading text-white mb-4 italic tracking-tighter">
                    STOCK<span className="text-brand">ISM</span>
                </h1>
                <p className="text-muted font-mono max-w-2xl mx-auto mb-8 uppercase tracking-widest">
                    Secure elite assets. Dominate the exchange. Establish supremacy.
                </p>
            </div>
          )}

          <div className="glass-panel p-6 animate-fade-in-up anim-delay-1">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-brand uppercase tracking-widest">Market Analysis</h3>
                <Button onClick={generateMarketInsight} variant="ghost" className="text-[10px]" disabled={isAnalyzing}>
                    {isAnalyzing ? "SCANNING" : "REFRESH"}
                </Button>
             </div>
             <p className="text-sm font-mono text-white/90 italic border-l-2 border-brand pl-4 min-h-[40px]">
                {aiInsight || "Initiate terminal scan for market intelligence."}
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up anim-delay-2">
             <div className="glass-panel h-[400px] flex flex-col">
                <div className="p-3 border-b border-line bg-white/5 uppercase font-mono text-[10px]">Log Terminal</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-[11px] custom-scrollbar">
                   {trades.map((t, i) => (
                      <div key={i} className="flex gap-2 text-muted">
                         <span className="text-white/30">[{formatTime(t.createdAt)}]</span>
                         <span className="text-brand uppercase">{t.username}</span>
                         <span className={t.side === 'BUY' ? 'text-good' : 'text-bad'}>{t.side}</span>
                         <span className="text-white uppercase">{t.character}</span>
                      </div>
                   ))}
                </div>
             </div>
             <div className="glass-panel p-8 flex flex-col justify-center">
                <h3 className="text-muted font-mono text-[10px] uppercase tracking-widest mb-2">Net Portfolio Value</h3>
                <div className="text-5xl font-mono text-white font-bold tracking-tighter">
                    Φ {formatMoney(netWorth)}
                </div>
             </div>
          </div>
        </div>
      )}

      {view === 'market' && <Market market={market} search={search} setSearch={setSearch} onTrade={user ? setTradeChar : () => setShowAuthModal(true)} settings={settings} frozenIds={settings.frozenCharacters} />}
      {view === 'waifu' && <WaifuPanel market={market} search={search} setSearch={setSearch} onTrade={user ? setTradeChar : () => setShowAuthModal(true)} settings={settings} frozenIds={settings.frozenCharacters} />}
      {view === 'news' && <div className="max-w-3xl mx-auto space-y-4">{news.map(n => <NewsCard key={n.id} item={n} onJumpToMarket={c => { setSearch(c); setView('market'); }} />)}</div>}
      {view === 'leaderboard' && (
        <div className="glass-panel overflow-hidden animate-fade-in-up">
           <table className="w-full text-left font-mono text-xs">
              <thead className="bg-black/40 text-brand uppercase tracking-widest">
                 <tr><th className="p-4">Rank</th><th className="p-4">Agent</th><th className="p-4 text-right">Net Worth</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                 {leaderboard.map((u, i) => (
                    <tr key={i} className={u.username === username ? 'bg-white/5' : ''}>
                       <td className="p-4 font-bold text-white">{i+1}</td>
                       <td className="p-4 text-muted">{u.username}</td>
                       <td className="p-4 text-right text-white">Φ {formatMoney(u.netWorth)}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
      {view === 'profile' && user && (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
           <div className="glass-panel p-8">
              <h2 className="text-2xl font-heading mb-6 italic">Agent Profile</h2>
              <div className="space-y-4">
                 <Input label="Callsign" value={editUsername} onChange={e => setEditUsername(e.target.value)} />
                 {profileMessage.text && <p className="text-[10px] uppercase font-mono text-good">{profileMessage.text}</p>}
                 <Button onClick={handleUpdateUsername} disabled={isUpdatingProfile} className="w-full">UPDATE_CREDENTIALS</Button>
              </div>
           </div>
        </div>
      )}
      {view === 'goo' && <GooAI />}
      {view === 'admin' && isAdmin && <AdminPanel settings={settings} market={market} isMainAdmin={user?.email === ADMIN_EMAIL} />}

      {tradeChar && user && (
        <TradeModal 
          char={tradeChar} 
          onClose={() => setTradeChar(null)} 
          onExecute={handleTrade}
          holdings={holdings[tradeChar.id] || 0}
          cash={cash}
          settings={settings}
          lastTradeAt={lastTradeAt}
        />
      )}
    </Layout>
  );
}