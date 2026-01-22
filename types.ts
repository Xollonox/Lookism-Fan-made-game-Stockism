import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  username: string;
  netWorth: number;
  updatedAt: Timestamp;
}

export interface Character {
  id: string;
  name: string;
  price: number;
  crew: string;
  rarity: string;
  tier: number;
  imageUrl?: string;
  updatedAt?: Timestamp;
}

export interface GameSettings {
  tradingEnabled: boolean;
  marketMessage: string;
  season: number;
  cashCap: number;
  cooldownSeconds: number;
  maxSharesPerUser: number;
  frozenCharacters: string[];
  event?: {
    name: string;
    active: boolean;
    crewMultipliers: Record<string, number>;
  };
}

export interface Trade {
  uid: string;
  username: string;
  charId: string;
  character: string;
  crew: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  total: number;
  season: number;
  createdAt: Timestamp;
}

export interface Holding {
  shares: number;
}