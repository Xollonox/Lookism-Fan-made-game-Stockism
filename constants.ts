
export const ADMIN_EMAIL = "xolonox333@gmail.com";
export const STARTING_CASH = 0;

export const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // --- HELPER FUNCTIONS ---
    
    function isSignedIn() { 
      return request.auth != null; 
    }
    
    function isAdmin() { 
      return isSignedIn() && 
             request.auth.token.email.lower() == "${ADMIN_EMAIL}".lower(); 
    }

    function isWorker() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "worker";
    }
    
    function isOwner(userId) { 
      return isSignedIn() && request.auth.uid == userId; 
    }
    
    // --- COLLECTION RULES ---

    // 1. Game Settings - Public Read, Admin Write
    match /game/{docId} { 
      allow read: if true; 
      allow write: if isAdmin(); 
    }
    
    // 2. News / Announcements - Public Read, Admin/Worker Write
    match /news/{docId} {
      allow read: if true;
      allow create, update: if isAdmin() || isWorker();
      allow delete: if isAdmin();
    }
    
    // 3. Characters (Market) - Public Read, Admin Write
    match /characters/{charId} { 
      allow read: if true; 
      allow write: if isAdmin(); 
    }
    
    // 4. Private User Data (Sensitive) - Owner/Admin Read, Owner/Admin Write
    match /users/{userId} { 
      allow read, write: if isAdmin() || isOwner(userId); 
      // Allow admin to list users
      allow list: if isAdmin();
    }
    
    // 5. Public User Profiles - Public Read, Owner/Admin Write
    match /users_public/{userId} { 
      allow read: if true; 
      allow write: if isAdmin() || isOwner(userId); 
    }
    
    // 6. Holdings (Portfolio) - Owner/Admin Read/Write
    match /holdings/{userId} { 
      allow read, write: if isAdmin() || isOwner(userId);
      match /items/{itemId} { 
        allow read, write: if isAdmin() || isOwner(userId); 
      } 
    }
    
    // 7. Trades (History) - Public Read, Signed-In Create, Admin Write
    match /trades/{tradeId} { 
      allow read: if true; 
      allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid; 
      allow write: if isAdmin();
    }
    
    // 8. Daily Votes - Public Read, Signed-In Write
    match /daily_votes/{voteId} {
      allow read: if true;
      allow write: if isSignedIn() && request.resource.data.uid == request.auth.uid;
    }
  }
}`;

export const DEFAULT_AVATAR = (initial: string) => `
  <svg viewBox="0 0 100 100" class="w-full h-full text-white/50 fill-current">
    <rect width="100" height="100" fill="currentColor" />
    <text x="50" y="50" dy=".1em" font-size="50" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">${initial}</text>
  </svg>
`;

export const CREWS = [
  "Allied", "Big Deal", "Workers", "Hostel", "God Dog", "Burn Knuckles", "Gen 0", "Gen 1"
];

export const RARITIES = [
  "Common", "Rare", "Epic", "Legendary", "Mythic"
];
