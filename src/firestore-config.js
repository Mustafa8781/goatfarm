import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Check network connectivity before initializing Firebase
const checkNetworkConnectivity = async () => {
  try {
    const response = await Promise.race([
      fetch("https://www.google.com", { method: "HEAD", mode: "no-cors" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000))
    ]);
    return true;
  } catch (error) {
    console.warn("Network connectivity check failed:", error.message);
    return false;
  }
};

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC0zc2hjSLMKP484SI4WMGgHKEcuHd7VhA",
  authDomain: "goatfarm-d1342.firebaseapp.com",
  projectId: "goatfarm-d1342",
  storageBucket: "goatfarm-d1342.firebasestorage.app",
  messagingSenderId: "505548052997",
  appId: "1:505548052997:web:dc1ab86cb74403b0bc5a6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true
});
const storage = getStorage(app);

export { app, db, storage, collection, setDoc, doc, serverTimestamp, checkNetworkConnectivity };

// Initialize Firestore Collections Structure
export const initializeCollections = async () => {
  try {
    // Create users collection reference (will be created when first document is added)
    // Users structure: { uid, email, name, role, createdAt, status }
    
    // Create investments collection reference
    // Investments: { id, userId, amount, status, date, approvedBy }
    
    // Create goats collection reference
    // Goats: { id, breed, age, price, health, linkedInvestors[], createdDate }
    
    // Create profits collection reference
    // Profits: { id, investmentId, userId, profitAmount, distributionDate }
    
    // Create withdrawals collection reference
    // Withdrawals: { id, userId, amount, status, requestDate, approvedDate }
    
    console.log("Firestore collections ready");
  } catch (error) {
    console.error("Error initializing collections:", error);
  }
};
