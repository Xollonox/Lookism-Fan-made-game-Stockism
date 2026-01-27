
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCAxUFLCVqRSmxG1x4_b7cRz1VkLfbmTSY",
  authDomain: "stockismweb.firebaseapp.com",
  projectId: "stockismweb",
  storageBucket: "stockismweb.firebasestorage.app",
  messagingSenderId: "474278686865",
  appId: "1:474278686865:web:8444cb369971f34bebcf30",
  measurementId: "G-L8KZ6QSNC0"
};

// Initialize via named export (standard modular SDK pattern)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const slugify = (name: string) => {
  return String(name || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
};

export const formatMoney = (n: number) => Math.round(Number(n || 0)).toLocaleString("en-IN");

export const formatTime = (ts: any) => {
  try {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
    return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch { return "—"; }
};
