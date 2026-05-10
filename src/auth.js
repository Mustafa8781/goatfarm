import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { app, db, collection, setDoc, doc, serverTimestamp, checkNetworkConnectivity } from "./firestore-config.js";
import { getDoc } from "firebase/firestore";

const auth = getAuth(app);

// SIGNUP WITH ROLE
export const signup = async (email, password, name, role = "investor") => {
  try {
    // Quick network check before attempting auth
    console.log("Checking network connectivity...");
    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      console.warn("Network is offline - cannot create account");
      return { 
        success: false, 
        error: "Network error: Cannot reach Firebase services. Please check your internet connection.",
        offline: true 
      };
    }

    // Add timeout to Firebase Auth call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase Auth timeout - network unreachable")), 8000)
    );

    const userCredential = await Promise.race([
      createUserWithEmailAndPassword(auth, email, password),
      timeoutPromise
    ]);
    const user = userCredential.user;

    // Save user data to Firestore with role
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      name: name,
      role: role, // "admin", "investor", or "manager"
      status: "active",
      createdAt: serverTimestamp(),
      investmentTotal: 0,
      profitTotal: 0
    });

    console.log("User created successfully with role:", role);
    return { success: true, user: user, role: role };
  } catch (error) {
    console.error("Signup error:", error);
    const msg = error.message || error.code || "";
    
    // Check if error is network-related
    if (msg.includes("ERR_NAME_NOT_RESOLVED") || msg.includes("unavailable") || msg.includes("network") || msg.includes("timeout")) {
      return { 
        success: false, 
        error: "Network error: Cannot reach Firebase services. Please check your internet connection.",
        offline: true 
      };
    }
    
    return { success: false, error: error.message };
  }
};

// LOGIN
export const login = async (email, password) => {
  try {
    // Quick network check before attempting auth
    console.log("Checking network connectivity...");
    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      console.warn("Network is offline - cannot authenticate");
      return { 
        success: false, 
        error: "Network error: Cannot reach Firebase services. Please check your internet connection.",
        offline: true 
      };
    }

    // Add timeout to Firebase Auth call
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Firebase Auth timeout - network unreachable")), 8000)
    );

    const userCredential = await Promise.race([
      signInWithEmailAndPassword(auth, email, password),
      timeoutPromise
    ]);
    const user = userCredential.user;

    // Get user role from Firestore, with cache fallback
    const userDoc = await getUserDocFromFirestore(user.uid);
    const role = userDoc?.data()?.role || localStorage.getItem("userRole") || "investor";

    console.log("Login successful, role:", role);
    return { success: true, user: user, role: role };
  } catch (error) {
    console.error("Login error:", error);
    const msg = error.message || error.code || "";
    
    // Check if error is network-related
    if (msg.includes("ERR_NAME_NOT_RESOLVED") || msg.includes("unavailable") || msg.includes("network") || msg.includes("timeout")) {
      return { 
        success: false, 
        error: "Network error: Cannot reach Firebase services. Please check your internet connection.",
        offline: true 
      };
    }
    
    return { success: false, error: error.message };
  }
};

const getUserDocFromFirestore = async (uid) => {
  const userRef = doc(db, "users", uid);
  try {
    // Set a timeout for network requests
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Firestore read timeout")), 5000)
    );
    return await Promise.race([getDoc(userRef), timeoutPromise]);
  } catch (error) {
    console.warn("Firestore read failed, attempting cache fallback:", error.message);
    try {
      const cachedDoc = await getDoc(userRef, { source: "cache" });
      return cachedDoc.exists() ? cachedDoc : null;
    } catch (cacheError) {
      console.warn("Cache read also failed:", cacheError.message);
      return null;
    }
  }
};

// LOGOUT
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("Logout successful");
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
};

// GET USER ROLE
export const getUserRole = async (uid) => {
  try {
    const userDoc = await getUserDocFromFirestore(uid);
    return userDoc?.data()?.role || localStorage.getItem("userRole") || "investor";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return localStorage.getItem("userRole") || "investor";
  }
};

// GET CURRENT USER
export const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      unsubscribe();
      if (user) {
        const role = await getUserRole(user.uid);
        resolve({ user, role });
      } else {
        resolve({ user: null, role: null });
      }
    });
  });
};

export { auth };
