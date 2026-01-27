import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  username: string;
  netWorth: number;
  liquidPhi?: number;
  updatedAt: Timestamp;
  isBanned?: boolean; 
}

export interface UserPrivateData {
  cash: number;
  createdAt: Timestamp;
  email?: string;
  isBanned?: boolean;
  role?: 'admin' | 'worker';
  bonusClaimed?: boolean;
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
  isWaifu?: boolean;
  // Popularity System
  gender?: 'Male' | 'Female';
  popularityVotes?: number;
  prevPopularityRank?: number;
  // Strongest System
  strengthVotes?: number;
  prevStrengthRank?: number;
}

export interface GameSettings {
  tradingEnabled: boolean;
  marketMessage: string;
  season: number;
  cashCap: number;
  cooldownSeconds: number;
  maxSharesPerUser: number;
  frozenCharacters: string[];
  popularityVotingEnabled?: boolean;
  strongestVotingEnabled?: boolean;
  bannerImageUrl?: string;
  event?: {
    active: boolean;
    name: string;
    description: string;
    priceMultiplier: number;
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

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: 'market' | 'character' | 'event' | 'system';
  relatedCharacterId?: string;
  characterName?: string;
  priceChange?: number;
  createdAt: Timestamp;
  createdBy: string;
}