import React, { useState, useEffect } from 'react';
import { db, slugify, formatMoney } from '../services/firebase';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, where, limit, serverTimestamp, addDoc, orderBy, writeBatch } from 'firebase/firestore';
import { Button } from './ui/Button';
import { Input, Select } from './ui/Input';
import { GameSettings, Character } from '../types';
import { CREWS, RARITIES, ADMIN_EMAIL } from '../constants';
// Import GoogleGenAI and Type for structured AI-assisted news generation
import { GoogleGenAI, Type } from "@google/genai";

interface AdminPanelProps {
  settings: GameSettings;
  market: Character[];
  isMainAdmin: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ settings, market, isMainAdmin }) => {
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'MARKET' | 'USERS' | 'NEWS' | 'EVENTS'>('GENERAL');
  
  const placeholder = "/assets/placeholder-character.png";

  // Market State
  const [newCharName, setNewCharName] = useState('');
  const [newCharPrice, setNewCharPrice] = useState('100');
  const [newCharCrew, setNewCharCrew] = useState(CREWS[0]);
  const [newCharRarity, setNewCharRarity] = useState(RARITIES[0]);
  const [newCharGender, setNewCharGender] = useState<'Male'|'Female'>('Male');
  const [newCharImageUrl, setNewCharImageUrl] = useState('');
  const [newCharIsWaifu, setNewCharIsWaifu] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [priceAdjustment, setPriceAdjustment] = useState('');
  const [editName, setEditName] = useState('');
  const [editCrew, setEditCrew] = useState('');
  const [editRarity, setEditRarity] = useState('');
  const [editGender, setEditGender] = useState<'Male'|'Female'>('Male');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsWaifu, setEditIsWaifu] = useState(false);
  
  // User State
  const [userSearch, setUserSearch] = useState('');
  const [userList, setUserList] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [cashAmount, setCashAmount] = useState('');

  // News State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsBody, setNewsBody] = useState('');
  const [newsType, setNewsType] = useState<'market' | 'character' | 'event' | 'system'>('system');
  const [newsCharId, setNewsCharId] = useState('');
  const [newsPriceChange, setNewsPriceChange] = useState('');

  // Event State
  const [eventName, setEventName] = useState(settings.event?.name || '');
  const [eventMult, setEventMult] = useState(settings.event?.priceMultiplier?.toString() || '1.0');

  // Initial Data Load for Users
  useEffect(() => {
    if (activeTab === 'USERS') {
      fetchRecentUsers();
    }
  }, [activeTab]);

  // --- ACTIONS ---

  // Generate AI-assisted news content using Gemini with structured output
  const handleGenerateAINews = async () => {
    if (!newsCharId) {
      alert("Please select a character first to contextually generate news.");
      return;
    }
    const char = market.find(c => c.id === newsCharId);
    if (!char) return;

    setIsSaving(true);
    try {
      // Initialize Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as a senior fintech analyst for Stockism, an elite trading terminal. 
      Generate a professional, serious market update for the following character:
      Name: ${char.name}
      Crew: ${char.crew}
      Current Valuation: Φ ${char.price}
      
      Tone: Professional, fintech, serious.
      Include relevant emojis.
      Provide a short title and one concise body paragraph. Content should cover market volatility, valuation shifts, or trading activity.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "A catchy, serious news headline" },
              body: { type: Type.STRING, description: "A concise professional market analysis paragraph" }
            },
            required: ["headline", "body"]
          }
        }
      });

      // Directly parse the structured response
      const data = JSON.parse(response.text);
      setNewsTitle(data.headline || "");
      setNewsBody(data.body || "");
      
    } catch (e: any) {
      console.error("AI Generation Error:", e);
      alert("AI Generation failed. Ensure an asset is selected and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await setDoc(doc(db, 'game', 'settings'), { [key]: value }, { merge: true });
    } catch (e: any) {
      alert("Error updating settings: " + e.message);
    }
  };

  const handleAddCharacter = async () => {
    if (!newCharName || !newCharPrice) {
        alert("Name and Price required");
        return;
    }
    
    setIsSaving(true);
    try {
        const id = slugify(newCharName);
        
        await setDoc(doc(db, 'characters', id), {
          name: newCharName,
          price: parseInt(newCharPrice),
          crew: newCharCrew,
          rarity: newCharRarity,
          tier: 1,
          gender: newCharIsWaifu ? 'Female' : newCharGender,
          imageUrl: newCharImageUrl.trim(),
          isWaifu: newCharIsWaifu,
          popularityVotes: 0,
          strengthVotes: 0, 
          updatedAt: serverTimestamp()
        });
        
        setNewCharName('');
        setNewCharPrice('100');
        setNewCharImageUrl('');
        setNewCharIsWaifu(false);
        setNewCharGender('Male');
        alert("Character Added Successfully");
    } catch(e: any) {
        console.error(e);
        alert("Error adding character: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleUpdateDetails = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    if (!selectedChar) {
        console.error("Error: No character selected");
        return;
    }
    
    if (!editName.trim()) {
        alert("Character name cannot be empty");
        return;
    }

    setIsSaving(true);
    
    try {
        const updateData: any = {
            name: editName.trim(),
            crew: editCrew || CREWS[0],
            rarity: editRarity || RARITIES[0],
            isWaifu: editIsWaifu,
            gender: editIsWaifu ? 'Female' : editGender,
            updatedAt: serverTimestamp()
        };

        if (editImageUrl && editImageUrl.trim() !== "") {
            updateData.imageUrl = editImageUrl.trim();
        }

        await updateDoc(doc(db, 'characters', selectedChar.id), updateData);
        
        alert("Character Saved Successfully!");
        setSelectedChar(null);
        setEditImageUrl('');

    } catch (err: any) {
        console.error("Update Process Failed:", err);
        alert("Save Failed: " + (err.message || "Unknown Error"));
    } finally {
        setIsSaving(false);
    }
  };

  const handlePriceUpdate = async (mode: 'SET' | 'DELTA') => {
    if (!selectedChar) return;
    const val = parseInt(priceAdjustment);
    if (isNaN(val)) {
        alert("Please enter a valid number");
        return;
    }

    const current = Number(selectedChar.price) || 0;
    let final = 0;

    if (mode === 'SET') final = val;
    if (mode === 'DELTA') final = current + val;

    if (final < 1) {
        alert("Price must be at least 1");
        return;
    }

    try {
        await updateDoc(doc(db, 'characters', selectedChar.id), {
            price: final,
            updatedAt: serverTimestamp()
        });
        
        alert(`Price updated to Φ ${final}`);
        setPriceAdjustment('');
    } catch (e: any) {
        console.error(e);
        alert("Failed to update price: " + e.message);
    }
  };

  const handleToggleFreeze = async (id: string) => {
    const current = settings.frozenCharacters || [];
    const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    updateSetting('frozenCharacters', updated);
  };

  const handleDeleteChar = async (id: string) => {
    if(confirm(`Delete character ${id}?`)) await deleteDoc(doc(db, 'characters', id));
  };

  const performBatchUpdates = async (docs: any[], getData: (doc: any) => any) => {
    let batch = writeBatch(db);
    let count = 0;
    let totalUpdated = 0;

    for (const d of docs) {
        const updates = getData(d);
        if (updates) {
            batch.update(d.ref, updates);
            count++;
            totalUpdated++;
        }

        if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) await batch.commit();
    return totalUpdated;
  };

  const handleResetPopularity = async (genderToReset: 'Male' | 'Female') => {
    if (!confirm(`Are you sure you want to RESET all ${genderToReset.toUpperCase()} popularity votes to 0? This cannot be undone.`)) return;
    
    setIsSaving(true);
    try {
        const snap = await getDocs(collection(db, 'characters'));
        const targets = snap.docs.filter(d => {
            const data = d.data();
            const effGender = data.isWaifu ? 'Female' : (data.gender || 'Male');
            return effGender === genderToReset;
        });

        if (targets.length === 0) {
            alert(`No ${genderToReset} characters found.`);
            return;
        }

        const updatedCount = await performBatchUpdates(targets, () => ({
            popularityVotes: 0,
            prevPopularityRank: 0,
            updatedAt: serverTimestamp()
        }));
        
        alert(`Success: Reset votes for ${updatedCount} characters.`);
    } catch (e: any) {
        console.error(e);
        alert("Reset failed: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleResetStrongest = async () => {
    if (!confirm("Are you sure you want to RESET ALL Strongest Votes? This is destructive.")) return;
    setIsSaving(true);
    try {
        const snap = await getDocs(collection(db, 'characters'));
        await performBatchUpdates(snap.docs, () => ({
            strengthVotes: 0,
            prevStrengthRank: 0,
            updatedAt: serverTimestamp()
        }));
        alert("Strongest Rank Reset Successfully!");
    } catch(e: any) {
        console.error(e);
        alert("Error: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSnapshotStrongest = async () => {
     if(!confirm("Capture current rankings? This will update the 'Previous Rank' for movement indicators.")) return;
     setIsSaving(true);
     try {
         const snap = await getDocs(collection(db, 'characters'));
         const chars = snap.docs.map(d => ({ id: d.id, ref: d.ref, ...d.data() } as any));
         chars.sort((a, b) => (b.strengthVotes || 0) - (a.strengthVotes || 0));
         
         let batch = writeBatch(db);
         let count = 0;
         
         for (let i = 0; i < chars.length; i++) {
             const char = chars[i];
             batch.update(char.ref, { prevStrengthRank: i + 1 });
             count++;
             if (count >= 400) {
                 await batch.commit();
                 batch = writeBatch(db);
                 count = 0;
             }
         }
         if (count > 0) await batch.commit();
         alert("Rank Snapshot Captured!");
     } catch(e:any) {
         console.error(e);
         alert("Error: " + e.message);
     } finally {
         setIsSaving(false);
     }
  };

  const fetchRecentUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      const users: any[] = [];
      
      for (const d of snap.docs) {
         const privateData = d.data();
         const publicSnap = await getDoc(doc(db, 'users_public', d.id));
         const publicData = publicSnap.exists() ? publicSnap.data() : {};
         
         users.push({
            id: d.id,
            ...privateData,
            ...publicData
         });
      }
      setUserList(users);
    } catch (e: any) {
      console.error("Fetch Users Error:", e);
    }
  };

  const handleSearchUsers = async () => {
    if (!userSearch) {
        fetchRecentUsers();
        return;
    }

    try {
        let users: any[] = [];
        
        const uidDoc = await getDoc(doc(db, 'users', userSearch));
        if (uidDoc.exists()) {
            const pubDoc = await getDoc(doc(db, 'users_public', userSearch));
            users.push({ id: userSearch, ...uidDoc.data(), ...(pubDoc.exists() ? pubDoc.data() : {}) });
        } else {
             const emailQ = query(collection(db, 'users'), where('email', '>=', userSearch), where('email', '<=', userSearch + '\uf8ff'), limit(5));
             const emailSnap = await getDocs(emailQ);
             for (const d of emailSnap.docs) {
                const pubDoc = await getDoc(doc(db, 'users_public', d.id));
                users.push({ id: d.id, ...d.data(), ...(pubDoc.exists() ? pubDoc.data() : {}) });
             }
        }
        
        setUserList(users);
        if (users.length === 0) alert("No users found by Email or UID.");

    } catch (e: any) {
        console.error(e);
        alert("Search failed. Try exact Email or UID.");
    }
  };

  const handlePostNews = async () => {
    if (!newsTitle || !newsBody) {
        alert("Title and Body required");
        return;
    }

    let charName = "";
    if (newsCharId) {
        const c = market.find(x => x.id === newsCharId);
        if(c) charName = c.name;
    }

    try {
        await addDoc(collection(db, 'news'), {
            title: newsTitle,
            body: newsBody,
            type: newsType,
            relatedCharacterId: newsCharId || null,
            characterName: charName || null,
            priceChange: newsPriceChange ? parseInt(newsPriceChange) : 0,
            createdAt: serverTimestamp(),
            createdBy: isMainAdmin ? "Main Admin" : "Worker"
        });
        alert("News Posted!");
        setNewsTitle('');
        setNewsBody('');
        setNewsPriceChange('');
    } catch(e: any) {
        console.error(e);
        alert("Failed to post news: " + e.message);
    }
  };

  const handleSaveEvent = async () => {
    updateSetting('event', {
      active: true,
      name: eventName,
      description: "Admin Event",
      priceMultiplier: parseFloat(eventMult)
    });
    alert("Event Live!");
  };

  const stopEvent = async () => {
    updateSetting('event', { active: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 glass-panel rounded-2xl overflow-x-auto">
        {['GENERAL', 'MARKET', 'USERS', 'NEWS', 'EVENTS'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all ${
              activeTab === tab ? 'bg-brand text-white shadow-lg' : 'text-muted hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'GENERAL' && (
        <div className="glass-panel p-6 rounded-[24px] space-y-4">
          <h3 className="text-lg font-black text-white">Global Control</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button 
               variant={settings.tradingEnabled ? 'success' : 'danger'}
               onClick={() => updateSetting('tradingEnabled', !settings.tradingEnabled)}
            >
               Trading: {settings.tradingEnabled ? 'ACTIVE' : 'PAUSED'}
            </Button>
            <Button 
               variant={settings.popularityVotingEnabled ? 'success' : 'secondary'}
               onClick={() => updateSetting('popularityVotingEnabled', !settings.popularityVotingEnabled)}
            >
               Pop. Vote: {settings.popularityVotingEnabled ? 'ON' : 'OFF'}
            </Button>
            <Button 
               variant={settings.strongestVotingEnabled ? 'success' : 'secondary'}
               onClick={() => updateSetting('strongestVotingEnabled', !settings.strongestVotingEnabled)}
            >
               Str. Vote: {settings.strongestVotingEnabled ? 'ON' : 'OFF'}
            </Button>
            <Input 
               label="Market Ticker"
               defaultValue={settings.marketMessage}
               onBlur={(e) => updateSetting('marketMessage', e.target.value)}
            />
            <Input 
               label="Banner Image URL"
               defaultValue={settings.bannerImageUrl}
               onBlur={(e) => updateSetting('bannerImageUrl', e.target.value)}
               placeholder="https://..."
            />
            <Input 
               label="Cooldown (s)"
               type="number"
               defaultValue={settings.cooldownSeconds}
               onBlur={(e) => updateSetting('cooldownSeconds', parseInt(e.target.value))}
            />
          </div>

          <div className="mt-4 p-4 bg-white/5 border border-line rounded-xl space-y-4">
             <div>
                <h4 className="text-xs font-heading text-muted mb-3">POPULARITY VOTE RESET (DANGER ZONE)</h4>
                <div className="flex gap-2">
                    <Button onClick={() => handleResetPopularity('Male')} variant="danger" disabled={isSaving}>RESET MALE</Button>
                    <Button onClick={() => handleResetPopularity('Female')} variant="danger" disabled={isSaving}>RESET FEMALE</Button>
                </div>
                <div className="text-[10px] text-muted mt-2">
                  * Resets votes for respective gender (including Waifus as Female).
                </div>
             </div>
             <div>
                <h4 className="text-xs font-heading text-muted mb-3">STRONGEST RANK CONTROLS</h4>
                <div className="flex gap-2">
                    <Button onClick={handleSnapshotStrongest} variant="secondary" disabled={isSaving}>CAPTURE RANK SNAPSHOT</Button>
                    <Button onClick={handleResetStrongest} variant="danger" disabled={isSaving}>RESET VOTES</Button>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'MARKET' && (
        <div className="space-y-6">
          {selectedChar ? (
            <div className="glass-panel p-6 rounded-[24px] border-brand/50 shadow-[0_0_30px_rgba(91,99,255,0.1)] animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white">Editing: {selectedChar.name}</h3>
                        <div className="text-xs text-muted">ID: <span className="font-mono">{selectedChar.id}</span></div>
                    </div>
                    <Button variant="ghost" onClick={() => { setSelectedChar(null); setEditImageUrl(''); setPriceAdjustment(''); }} className="!p-1 h-8 w-8">✕</Button>
                </div>
                
                <div className="space-y-6">
                    <div className="p-4 bg-white/5 rounded-xl border border-line space-y-4">
                        <h4 className="font-heading text-sm text-brand tracking-widest">METADATA & VISUALS</h4>
                        <Input 
                            label="Character Name" 
                            value={editName} 
                            onChange={e => setEditName(e.target.value)} 
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Crew" value={editCrew} onChange={e => setEditCrew(e.target.value)}>
                                {CREWS.map(c => <option key={c} value={c}>{c}</option>)}
                            </Select>
                            <Select label="Rarity" value={editRarity} onChange={e => setEditRarity(e.target.value)}>
                                {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                            </Select>
                            <Select 
                                label="Gender" 
                                value={editIsWaifu ? 'Female' : editGender} 
                                onChange={e => setEditGender(e.target.value as any)}
                                disabled={editIsWaifu}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </Select>
                        </div>
                        
                        <div>
                            <Input 
                                label="Update Image URL" 
                                value={editImageUrl} 
                                onChange={e => setEditImageUrl(e.target.value)} 
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-black/20 border border-line rounded">
                            <input 
                                type="checkbox" 
                                id="editWaifu"
                                checked={editIsWaifu} 
                                onChange={e => {
                                    const isChecked = e.target.checked;
                                    setEditIsWaifu(isChecked);
                                    if(isChecked) setEditGender('Female');
                                }}
                                className="w-5 h-5 accent-brand cursor-pointer"
                            />
                            <label htmlFor="editWaifu" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer select-none">
                                Is Waifu Character?
                            </label>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-black border border-line rounded-lg overflow-hidden shrink-0 relative">
                                <img 
                                    src={editImageUrl || selectedChar.imageUrl || placeholder} 
                                    className="relative z-10 w-full h-full object-cover" 
                                    alt="Preview"
                                    onError={(e) => { e.currentTarget.src = placeholder; }}
                                />
                            </div>
                            <div className="text-xs text-muted">PREVIEW</div>
                        </div>

                        <Button onClick={handleUpdateDetails} disabled={isSaving} className="w-full">
                            {isSaving ? "SAVING..." : "SAVE DETAILS"}
                        </Button>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-line space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-heading text-sm text-brand tracking-widest">VALUATION</h4>
                            <span className="text-white font-mono text-base font-bold">Current: Φ {formatMoney(selectedChar.price || 0)}</span>
                        </div>
                        <Input 
                            label="Value Input" 
                            type="number" 
                            value={priceAdjustment} 
                            onChange={e => setPriceAdjustment(e.target.value)} 
                            placeholder="e.g. 250"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <Button onClick={() => handlePriceUpdate('SET')} className="w-full">
                               Set Exact
                            </Button>
                            <Button onClick={() => handlePriceUpdate('DELTA')} variant="secondary" className="w-full">
                               Adjust (+/-)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-[24px]">
                <h3 className="text-lg font-black mb-4">Add Character</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Name" value={newCharName} onChange={e => setNewCharName(e.target.value)} />
                    <Input label="Price" type="number" value={newCharPrice} onChange={e => setNewCharPrice(e.target.value)} />
                    <Select label="Crew" value={newCharCrew} onChange={e => setNewCharCrew(e.target.value)}>
                        {CREWS.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Select label="Rarity" value={newCharRarity} onChange={e => setNewCharRarity(e.target.value)}>
                        {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                    </Select>
                    
                    <div className="col-span-2">
                        <Select 
                            label="Gender" 
                            value={newCharIsWaifu ? 'Female' : newCharGender} 
                            onChange={e => setNewCharGender(e.target.value as any)}
                            disabled={newCharIsWaifu}
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </Select>
                    </div>

                    <div className="col-span-2">
                        <Input 
                            label="Image URL" 
                            value={newCharImageUrl} 
                            onChange={e => setNewCharImageUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-3 p-3 bg-black/20 border border-line rounded">
                        <input 
                            type="checkbox" 
                            id="newWaifu"
                            checked={newCharIsWaifu} 
                            onChange={e => {
                                const isChecked = e.target.checked;
                                setNewCharIsWaifu(isChecked);
                                if (isChecked) setNewCharGender('Female');
                            }}
                            className="w-5 h-5 accent-brand cursor-pointer"
                        />
                        <label htmlFor="newWaifu" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer select-none">
                            Is Waifu Character?
                        </label>
                    </div>
                    
                    <div className="col-span-2 flex justify-center py-2">
                        <div className="w-20 h-20 bg-black border border-line rounded-lg overflow-hidden relative">
                            <img 
                                src={newCharImageUrl || placeholder} 
                                className="relative z-10 w-full h-full object-cover" 
                                alt="Preview" 
                                onError={(e) => { e.currentTarget.src = placeholder; }}
                            />
                        </div>
                    </div>

                    <Button onClick={handleAddCharacter} className="col-span-2 mt-2" disabled={isSaving}>
                        {isSaving ? "PROCESSING..." : "CREATE CHARACTER"}
                    </Button>
                </div>
            </div>
          )}

          <div className="glass-panel p-6 rounded-[24px]">
            <h3 className="text-lg font-black mb-4">Roster ({market.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {market.map(c => {
                return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-xs border border-white/5 hover:border-line transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white/10 overflow-hidden shrink-0">
                      <img 
                        src={c.imageUrl || placeholder} 
                        className="w-full h-full object-cover" 
                        alt={c.name} 
                        onError={(e) => { e.currentTarget.src = placeholder; }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-[10px] text-muted">{c.crew} • {c.gender || 'Male'} • Φ {c.price || 0} {c.isWaifu && <span className="text-brand ml-1">♥</span>}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => { 
                            setSelectedChar(c); 
                            setEditName(c.name);
                            setEditCrew(c.crew || CREWS[0]);
                            setEditRarity(c.rarity || RARITIES[0]);
                            setEditImageUrl(''); 
                            setEditIsWaifu(!!c.isWaifu);
                            setEditGender(c.gender || 'Male');
                            setPriceAdjustment(''); 
                        }} 
                        className="px-3 py-1 rounded bg-brand/20 text-brand font-black hover:bg-brand hover:text-white transition-colors"
                    >
                       Edit
                    </button>
                    <button onClick={() => handleToggleFreeze(c.id)} className={`px-2 py-1 rounded ${settings.frozenCharacters.includes(c.id) ? 'bg-warn text-black' : 'bg-white/10 text-muted'} font-bold`}>
                       {settings.frozenCharacters.includes(c.id) ? 'Frozen' : 'Freeze'}
                    </button>
                    <button onClick={() => handleDeleteChar(c.id)} className="text-bad font-bold px-2">X</button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="glass-panel p-6 rounded-[24px] space-y-4">
           <h3 className="text-lg font-black">User Management</h3>
           <div className="flex gap-2">
             <Input placeholder="Search Email or UID..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
             <Button onClick={handleSearchUsers} variant="secondary">Search</Button>
           </div>
           
           {!selectedUser && (
             <div className="space-y-2 mt-2 max-h-[500px] overflow-y-auto custom-scrollbar">
               <h4 className="text-xs font-heading text-muted tracking-widest mb-2">RECENT USERS</h4>
               {userList.map(u => (
                 <div key={u.id} onClick={() => selectUser(u)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer flex justify-between items-center group transition-colors">
                    <div>
                        <div className="font-bold text-white group-hover:text-brand transition-colors">{u.email || "No Email"}</div>
                        <div className="text-[10px] text-muted font-mono">{u.username || "No Username"} • ID: {u.id.substring(0,8)}...</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono">Φ {formatMoney(u.cash)}</div>
                        <div className={`text-[10px] font-black uppercase ${u.isBanned ? 'text-bad' : 'text-good'}`}>
                             {u.isBanned ? 'BANNED' : 'ACTIVE'}
                        </div>
                    </div>
                 </div>
               ))}
               {userList.length === 0 && <div className="text-center text-muted text-xs py-4">No users found.</div>}
             </div>
           )}

           {selectedUser && (
             <div className="mt-4 p-4 bg-black/20 rounded-2xl border border-line animate-in fade-in">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-black">{selectedUser.username || "Unknown Agent"}</h4>
                    <div className="text-xs text-muted font-mono">{selectedUser.id}</div>
                    <div className="text-xs text-brand font-mono mt-1">{selectedUser.email}</div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedUser(null)} className="!p-1 h-6 w-6">✕</Button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex gap-2 items-end p-3 bg-white/5 rounded-xl border border-line">
                      <Input label="Modify Phi Balance" type="number" value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="+Amount or -Amount" />
                      <Button onClick={() => handleUpdateCash(parseInt(cashAmount))} className="mb-[2px]">EXECUTE</Button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                       <Button onClick={handleBanToggle} variant={selectedUser.isBanned ? 'success' : 'danger'}>
                          {selectedUser.isBanned ? 'UNBAN ACCOUNT' : 'BAN ACCOUNT'}
                       </Button>
                       {isMainAdmin && (
                         <div className="flex gap-1">
                             <Button onClick={() => handleSetRole('worker')} variant="secondary" className="flex-1 text-[10px] !px-2">MAKE ADMIN</Button>
                             <Button onClick={() => handleSetRole(null)} variant="secondary" className="flex-1 text-[10px] !px-2">REVOKE ADMIN</Button>
                         </div>
                       )}
                   </div>
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'NEWS' && (
        <div className="glass-panel p-6 rounded-[24px] space-y-4">
           <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-black">Post Announcement</h3>
              <Button 
                onClick={handleGenerateAINews} 
                variant="secondary" 
                className="text-[10px] !py-1.5"
                disabled={isSaving || !newsCharId}
              >
                {isSaving ? "GENERATING..." : "GENERATE WITH AI"}
              </Button>
           </div>
           <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                    <Input label="Title" value={newsTitle} onChange={e => setNewsTitle(e.target.value)} placeholder="e.g. Market Volatility Warning" />
               </div>
               <div className="col-span-2">
                    <label className="block text-xs font-black text-muted mb-1.5 uppercase tracking-wide">Body</label>
                    <textarea 
                        className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-line text-white placeholder-white/20 focus:outline-none focus:border-brand/50 focus:bg-brand/5 transition-all min-h-[100px]"
                        value={newsBody}
                        onChange={e => setNewsBody(e.target.value)}
                        placeholder="Concise market update..."
                    />
               </div>
               <Select label="Type" value={newsType} onChange={e => setNewsType(e.target.value as any)}>
                    <option value="system">System News</option>
                    <option value="market">Market Update</option>
                    <option value="character">Character Update</option>
                    <option value="event">Event News</option>
               </Select>
               <Select label="Related Character (Optional)" value={newsCharId} onChange={e => setNewsCharId(e.target.value)}>
                    <option value="">None</option>
                    {market.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </Select>
               <Button onClick={handlePostNews} className="col-span-2">Publish News</Button>
           </div>
        </div>
      )}

      {activeTab === 'EVENTS' && (
        <div className="glass-panel p-6 rounded-[24px] space-y-4">
           <h3 className="text-lg font-black">Live Events</h3>
           <div className="bg-brand/10 border border-brand/20 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-brand">Current Status</span>
                {settings.event?.active ? (
                  <span className="bg-good text-black text-[10px] font-black px-2 py-1 rounded">ACTIVE: {settings.event.name}</span>
                ) : (
                  <span className="bg-white/10 text-muted text-[10px] font-black px-2 py-1 rounded">NO EVENT</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Event Name" value={eventName} onChange={e => setEventName(e.target.value)} />
                <Input label="Multiplier" type="number" step="0.1" value={eventMult} onChange={e => setEventMult(e.target.value)} />
              </div>
              <div className="flex gap-2 mt-4">
                 <Button onClick={handleSaveEvent} className="flex-1">Start Event</Button>
                 <Button onClick={stopEvent} variant="secondary" className="flex-1">End Event</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );

  function selectUser(u: any) { setSelectedUser(u); }
  
  async function handleUpdateCash(amount: number) {
    if (!selectedUser) return;
    const newCash = (selectedUser.cash || 0) + amount;
    const newNetWorth = (selectedUser.netWorth || 0) + amount;
    
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', selectedUser.id), { cash: newCash }),
        updateDoc(doc(db, 'users_public', selectedUser.id), { 
          netWorth: newNetWorth, 
          liquidPhi: newCash,
          updatedAt: serverTimestamp() 
        })
      ]);
      
      alert(`Balance Adjusted. User Net Worth updated in Hall of Fame.`);
      setSelectedUser({ ...selectedUser, cash: newCash, netWorth: newNetWorth, liquidPhi: newCash });
      fetchRecentUsers();
    } catch (e: any) {
      alert("Update failed: " + e.message);
    }
  }

  async function handleBanToggle() {
    if (!selectedUser) return;
    if (selectedUser.email === ADMIN_EMAIL) return alert("Cannot ban Main Admin.");
    const newVal = !selectedUser.isBanned;
    try {
      await Promise.all([
        updateDoc(doc(db, 'users', selectedUser.id), { isBanned: newVal }),
        updateDoc(doc(db, 'users_public', selectedUser.id), { isBanned: newVal, updatedAt: serverTimestamp() })
      ]);
      alert(`User ${newVal ? 'BANNED' : 'RESTORED'}`);
      setSelectedUser({ ...selectedUser, isBanned: newVal });
      fetchRecentUsers();
    } catch (e: any) { alert("Action failed."); }
  }

  async function handleSetRole(role: any) {
    if (!isMainAdmin || !selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), { role });
      alert("Role updated.");
      setSelectedUser({ ...selectedUser, role });
      fetchRecentUsers();
    } catch (e: any) { alert("Action failed."); }
  }
};