import React, { useState, useEffect, useRef } from 'react';
import { auth, db, slugify, formatMoney, formatTime } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  User 
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
  writeBatch,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { Layout } from './components/Layout';
import { Button } from './components/ui/Button';
import { Input, Select } from './components/ui/Input';
import { MarketCard } from './components/MarketCard';
import { TradeModal } from './components/TradeModal';
import { Character, GameSettings, UserProfile, Holding, Trade } from './types';
import { ADMIN_EMAIL, STARTING_CASH } from './constants';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  
  // Data State
  const [cash, setCash] = useState(0);
  const [netWorth, setNetWorth] = useState(0);
  const [username, setUsername] = useState('');
  const [market, setMarket] = useState<Character[]>([]);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [trades, setTrades] = useState<Trade[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  
  // UI State
  const [tradeChar, setTradeChar] = useState<Character | null>(null);
  const [lastTradeAt, setLastTradeAt] = useState(0);
  
  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    tradingEnabled: true,
    marketMessage: "",
    season: 1,
    cashCap: 0,
    cooldownSeconds: 0,
    maxSharesPerUser: 0,
    frozenCharacters: []
  });

  // Login Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Admin Inputs
  const [newCharName, setNewCharName] = useState('');
  const [newCharPrice, setNewCharPrice] = useState('100');
  const [newCharCrew, setNewCharCrew] = useState('');
  const [newCharRarity, setNewCharRarity] = useState('Common');
  const [newCharImg, setNewCharImg] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Initialize User Docs
        const userRef = doc(db, 'users', u.uid);
        const pubRef = doc(db, 'users_public', u.uid);
        
        const [privSnap, pubSnap] = await Promise.all([getDoc(userRef), getDoc(pubRef)]);
        
        if (!privSnap.exists()) {
          await setDoc(userRef, { cash: STARTING_CASH, createdAt: serverTimestamp() });
        }
        if (!pubSnap.exists()) {
          const defaultName = (u.email || "user").split("@")[0].slice(0, 12);
          await setDoc(pubRef, { username: defaultName, netWorth: STARTING_CASH, updatedAt: serverTimestamp() });
        }
      }
    });
    return () => unsub();
  }, []);

  // Listeners
  useEffect(() => {
    if (!user) return;

    // Game Settings
    const unsubGame = onSnapshot(doc(db, 'game', 'settings'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as GameSettings);
    });

    // Market
    const unsubMarket = onSnapshot(query(collection(db, 'characters'), orderBy('name')), (snap) => {
      const chars: Character[] = [];
      snap.forEach(d => chars.push({ id: d.id, ...d.data() } as Character));
      setMarket(chars);
    });

    // Wallet
    const unsubWallet = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) setCash(snap.data().cash || 0);
    });

    // Holdings
    const unsubHoldings = onSnapshot(collection(db, 'holdings', user.uid, 'items'), (snap) => {
      const h: Record<string, number> = {};
      snap.forEach(d => {
        const val = d.data().shares;
        if (val > 0) h[d.id] = val;
      });
      setHoldings(h);
    });

    // Trades
    const unsubTrades = onSnapshot(query(collection(db, 'trades'), orderBy('createdAt', 'desc'), limit(20)), (snap) => {
      const t: Trade[] = [];
      snap.forEach(d => t.push(d.data() as Trade));
      setTrades(t);
    });

    // Leaderboard
    const unsubLb = onSnapshot(query(collection(db, 'users_public'), orderBy('netWorth', 'desc'), limit(25)), (snap) => {
      const l: UserProfile[] = [];
      snap.forEach(d => l.push(d.data() as UserProfile));
      setLeaderboard(l);
    });
    
    // Own Public Profile
    const unsubProfile = onSnapshot(doc(db, 'users_public', user.uid), (snap) => {
       if(snap.exists()) setUsername(snap.data().username || "");
    });

    return () => {
      unsubGame(); unsubMarket(); unsubWallet(); unsubHoldings(); unsubTrades(); unsubLb(); unsubProfile();
    };
  }, [user]);

  // Calculate Net Worth Effect
  useEffect(() => {
    if (!user) return;
    let portfolioValue = 0;
    Object.entries(holdings).forEach(([id, shares]) => {
      const char = market.find(c => c.id === id);
      if (char) portfolioValue += char.price * Number(shares);
    });
    const total = cash + portfolioValue;
    setNetWorth(total);
    
    // Throttle updating public net worth
    const timeout = setTimeout(() => {
      updateDoc(doc(db, 'users_public', user.uid), { netWorth: total, updatedAt: serverTimestamp() }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timeout);
  }, [cash, holdings, market, user]);

  const handleLogin = async (isSignup: boolean) => {
    try {
      setAuthError('');
      if (isSignup) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      setAuthError(e.message);
    }
  };

  const handleTrade = async (charId: string, side: 'BUY' | 'SELL', qty: number) => {
    if (!user) return;
    
    await runTransaction(db, async (tx) => {
      const userRef = doc(db, 'users', user.uid);
      const itemRef = doc(db, 'holdings', user.uid, 'items', charId);
      const charRef = doc(db, 'characters', charId);

      const [userSnap, itemSnap, charSnap] = await Promise.all([
        tx.get(userRef), tx.get(itemRef), tx.get(charRef)
      ]);

      if (!charSnap.exists()) throw new Error("Character not found");
      
      const charData = charSnap.data() as Character;
      const currentCash = userSnap.data()?.cash || 0;
      const currentShares = itemSnap.exists() ? itemSnap.data().shares : 0;
      const total = charData.price * qty;

      if (side === 'BUY') {
        if (currentCash < total) throw new Error("Insufficient funds");
        tx.update(userRef, { cash: currentCash - total });
        tx.set(itemRef, { shares: currentShares + qty }, { merge: true });
      } else {
        if (currentShares < qty) throw new Error("Insufficient shares");
        tx.update(userRef, { cash: currentCash + total });
        tx.set(itemRef, { shares: currentShares - qty }, { merge: true });
      }

      // Record Trade
      const tradeRef = doc(collection(db, 'trades'));
      tx.set(tradeRef, {
        uid: user.uid,
        username: username || "User",
        charId,
        character: charData.name,
        crew: charData.crew,
        side,
        qty,
        price: charData.price,
        total,
        season: settings.season,
        createdAt: serverTimestamp()
      });
    });
    setLastTradeAt(Date.now());
  };

  const handleUpdateUsername = async () => {
     if(!user || !username.trim()) return;
     await updateDoc(doc(db, 'users_public', user.uid), { username: username.trim() });
  };

  // Admin Actions
  const handleAddCharacter = async () => {
    if (!newCharName || !newCharPrice) return;
    const id = slugify(newCharName);
    await setDoc(doc(db, 'characters', id), {
      name: newCharName,
      price: parseInt(newCharPrice),
      crew: newCharCrew,
      rarity: newCharRarity,
      tier: 1,
      imageUrl: newCharImg,
      updatedAt: serverTimestamp()
    });
    setNewCharName('');
  };
  
  const handleToggleFreeze = async (id: string) => {
      const current = settings.frozenCharacters || [];
      const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      await setDoc(doc(db, 'game', 'settings'), { frozenCharacters: updated }, { merge: true });
  };

  const handleDeleteChar = async (id: string) => {
      if(confirm('Delete character?')) await deleteDoc(doc(db, 'characters', id));
  }

  // View Components
  const Dashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {settings.marketMessage && (
        <div className="bg-gradient-to-r from-brand/20 to-brand2/20 border border-brand/50 p-4 rounded-2xl flex items-center gap-4">
           <span className="bg-brand text-white text-[10px] font-black px-2 py-1 rounded-lg">NEWS</span>
           <span className="text-sm font-bold text-white">{settings.marketMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-6 rounded-[24px] border border-line">
           <h3 className="text-lg font-black mb-4">Market Pulse</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-muted font-bold uppercase">Characters</div>
                 <div className="text-2xl font-black">{market.length}</div>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl">
                 <div className="text-xs text-muted font-bold uppercase">Frozen</div>
                 <div className="text-2xl font-black">{settings.frozenCharacters.length}</div>
              </div>
           </div>
        </div>
        
        <div className="bg-card p-6 rounded-[24px] border border-line">
           <h3 className="text-lg font-black mb-4">Quick Profile</h3>
           <div className="flex gap-2 mb-4">
             <Input 
               value={username} 
               onChange={e => setUsername(e.target.value)} 
               placeholder="Set Username" 
               className="!py-2"
             />
             <Button onClick={handleUpdateUsername}>Save</Button>
           </div>
           <p className="text-xs text-muted">Trading Cooldown: {settings.cooldownSeconds}s</p>
        </div>
      </div>
    </div>
  );

  const Market = () => {
    const [search, setSearch] = useState('');
    const filtered = market.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Input 
          placeholder="Search characters..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="shadow-lg"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(char => (
            <MarketCard 
              key={char.id} 
              char={char} 
              onTrade={() => setTradeChar(char)}
              isFrozen={settings.frozenCharacters.includes(char.id)}
              tradingEnabled={settings.tradingEnabled}
            />
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center text-muted font-bold py-10">No characters found</div>}
        </div>
      </div>
    );
  };

  const Portfolio = () => {
    const myHoldings = market.filter(c => (holdings[c.id] || 0) > 0);
    
    return (
      <div className="bg-card border border-line rounded-[24px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="p-6 border-b border-line">
           <h2 className="text-xl font-black">Your Portfolio</h2>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm">
             <thead className="bg-white/5 text-muted uppercase text-[10px] font-black">
               <tr>
                 <th className="p-4">Character</th>
                 <th className="p-4">Shares</th>
                 <th className="p-4">Value</th>
                 <th className="p-4 text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-line">
               {myHoldings.map(char => (
                 <tr key={char.id} className="hover:bg-white/5">
                   <td className="p-4 font-bold">{char.name}</td>
                   <td className="p-4 font-mono">{holdings[char.id]}</td>
                   <td className="p-4 font-mono">₹{formatMoney(char.price * holdings[char.id])}</td>
                   <td className="p-4 text-right">
                      <Button variant="secondary" className="!py-1 !px-3 text-xs" onClick={() => setTradeChar(char)}>Trade</Button>
                   </td>
                 </tr>
               ))}
               {myHoldings.length === 0 && (
                 <tr><td colSpan={4} className="p-8 text-center text-muted">You don't own any stocks yet.</td></tr>
               )}
             </tbody>
           </table>
         </div>
      </div>
    );
  };
  
  const Leaderboard = () => (
    <div className="bg-card border border-line rounded-[24px] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border-b border-line flex justify-between items-center">
           <h2 className="text-xl font-black">Top Players</h2>
           <span className="text-xs text-muted font-bold">BY NET WORTH</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
             <thead className="bg-white/5 text-muted uppercase text-[10px] font-black">
               <tr>
                 <th className="p-4">#</th>
                 <th className="p-4">Player</th>
                 <th className="p-4 text-right">Net Worth</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-line">
                {leaderboard.map((p, i) => (
                  <tr key={i} className={`hover:bg-white/5 ${p.username === username ? 'bg-brand/10' : ''}`}>
                    <td className="p-4 font-black text-muted">{i + 1}</td>
                    <td className="p-4 font-bold">{p.username || "Anonymous"}</td>
                    <td className="p-4 text-right font-mono font-bold text-good">₹{formatMoney(p.netWorth)}</td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
    </div>
  );

  const AdminPanel = () => {
    if (user?.email !== ADMIN_EMAIL) return <div className="p-10 text-center text-bad font-black">ACCESS DENIED</div>;

    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="bg-card p-6 rounded-[24px] border border-line">
          <h3 className="text-lg font-black mb-4">Global Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
               variant={settings.tradingEnabled ? 'success' : 'danger'}
               onClick={() => setDoc(doc(db, 'game', 'settings'), { tradingEnabled: !settings.tradingEnabled }, { merge: true })}
            >
               Trading: {settings.tradingEnabled ? 'ON' : 'OFF'}
            </Button>
            <Input 
               label="Market Message"
               defaultValue={settings.marketMessage}
               onBlur={(e) => setDoc(doc(db, 'game', 'settings'), { marketMessage: e.target.value }, { merge: true })}
            />
          </div>
        </div>

        <div className="bg-card p-6 rounded-[24px] border border-line">
           <h3 className="text-lg font-black mb-4">Add Character</h3>
           <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={newCharName} onChange={e => setNewCharName(e.target.value)} />
              <Input label="Price" type="number" value={newCharPrice} onChange={e => setNewCharPrice(e.target.value)} />
              <Input label="Crew" value={newCharCrew} onChange={e => setNewCharCrew(e.target.value)} />
              <Select label="Rarity" value={newCharRarity} onChange={e => setNewCharRarity(e.target.value)}>
                <option value="Common">Common</option>
                <option value="Rare">Rare</option>
                <option value="Epic">Epic</option>
                <option value="Legendary">Legendary</option>
              </Select>
              <div className="col-span-2">
                 <Input label="Image URL" value={newCharImg} onChange={e => setNewCharImg(e.target.value)} placeholder="https://..." />
              </div>
              <Button onClick={handleAddCharacter} className="col-span-2 mt-2">Create Character</Button>
           </div>
        </div>
        
        <div className="bg-card p-6 rounded-[24px] border border-line">
           <h3 className="text-lg font-black mb-4">Manage List</h3>
           <div className="space-y-2 max-h-60 overflow-y-auto">
             {market.map(c => (
               <div key={c.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl text-xs">
                 <span className="font-bold">{c.name}</span>
                 <div className="flex gap-2">
                   <button onClick={() => handleToggleFreeze(c.id)} className="text-warn hover:underline">
                      {settings.frozenCharacters.includes(c.id) ? 'Unfreeze' : 'Freeze'}
                   </button>
                   <button onClick={() => handleDeleteChar(c.id)} className="text-bad hover:underline">Delete</button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    );
  };

  // Login Screen
  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-[#070A14] text-brand">
       <div className="animate-spin text-4xl">❋</div>
     </div>
  );
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-line p-8 rounded-[32px] shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
             <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand to-brand2 rounded-2xl mb-4 shadow-lg animate-pulse" />
             <h1 className="text-3xl font-black tracking-tight mb-2">Stockism</h1>
             <p className="text-muted text-sm font-bold">Lookism Fan Market</p>
          </div>
          
          <div className="space-y-4">
             <Input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
             <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
             
             {authError && <div className="text-bad text-xs font-bold text-center bg-bad/10 p-2 rounded-lg">{authError}</div>}
             
             <div className="grid grid-cols-2 gap-4 pt-2">
                <Button onClick={() => handleLogin(false)}>Login</Button>
                <Button variant="secondary" onClick={() => handleLogin(true)}>Signup</Button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeView={view} 
      setView={setView} 
      userEmail={user.email} 
      isAdmin={user.email === ADMIN_EMAIL} 
      onLogout={() => signOut(auth)}
      cash={cash}
      netWorth={netWorth}
      status={settings.tradingEnabled ? 'Online' : 'Paused'}
    >
      {view === 'dashboard' && <Dashboard />}
      {view === 'market' && <Market />}
      {view === 'portfolio' && <Portfolio />}
      {view === 'leaderboard' && <Leaderboard />}
      {view === 'trades' && (
        <div className="bg-card border border-line rounded-[24px] overflow-hidden">
          <div className="p-6 border-b border-line"><h2 className="text-xl font-black">Recent Trades</h2></div>
          <table className="w-full text-left text-sm">
             <thead className="bg-white/5 text-muted uppercase text-[10px] font-black">
               <tr><th>Time</th><th>User</th><th>Action</th><th>Total</th></tr>
             </thead>
             <tbody className="divide-y divide-line">
                {trades.map((t, i) => (
                   <tr key={i} className="hover:bg-white/5">
                      <td className="p-3 text-muted text-xs">{formatTime(t.createdAt)}</td>
                      <td className="p-3 font-bold">{t.username}</td>
                      <td className="p-3">
                         <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${t.side === 'BUY' ? 'bg-good text-black' : 'bg-bad text-white'}`}>
                            {t.side}
                         </span> 
                         <span className="ml-2 font-bold text-xs">{t.character}</span>
                      </td>
                      <td className="p-3 font-mono">₹{formatMoney(t.total)}</td>
                   </tr>
                ))}
             </tbody>
          </table>
        </div>
      )}
      {view === 'admin' && <AdminPanel />}

      {tradeChar && (
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