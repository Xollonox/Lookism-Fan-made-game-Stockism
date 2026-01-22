export const ADMIN_EMAIL = "xolonox333@gmail.com";
export const STARTING_CASH = 5000;

export const FIRESTORE_RULES_TEXT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.email == "${ADMIN_EMAIL}"; }
    
    match /game/{docId} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /characters/{charId} { allow read: if isSignedIn(); allow write: if isAdmin(); }
    match /users/{userId} { allow read, write: if isSignedIn() && request.auth.uid == userId; }
    match /users_public/{userId} { allow read: if isSignedIn(); allow write: if isSignedIn() && request.auth.uid == userId; }
    match /holdings/{userId} { allow read, write: if isSignedIn() && request.auth.uid == userId; match /items/{itemId} { allow read, write: if isSignedIn() && request.auth.uid == userId; } }
    match /trades/{tradeId} { allow read: if isSignedIn(); allow create: if isSignedIn() && request.resource.data.uid == request.auth.uid; }
    match /admin_actions/{actionId} { allow read, write: if isAdmin(); }
  }
}`;

export const DEFAULT_AVATAR = (initial: string) => `
  <svg viewBox="0 0 100 100" class="w-full h-full text-white/50 fill-current">
    <rect width="100" height="100" fill="currentColor" />
    <text x="50" y="50" dy=".1em" font-size="50" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">${initial}</text>
  </svg>
`;