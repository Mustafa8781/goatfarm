import { db, storage, collection, setDoc, doc, serverTimestamp } from "./firestore-config.js";
import { addDoc, updateDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// PROFIT DISTRIBUTION RULES
const PROFIT_DISTRIBUTION = {
  investor: 0.30,    // 30%
  farmCost: 0.30,    // 30%
  adminProfit: 0.40  // 40%
};

// UPLOAD TRANSACTION SCREENSHOT
export const uploadTransactionScreenshot = async (userId, file) => {
  try {
    const storageRef = ref(storage, `transaction_screenshots/${userId}/${Date.now()}_${file.name}`);
    const uploadTask = await uploadBytesResumable(storageRef, file);
    const url = await getDownloadURL(uploadTask.ref);
    console.log("Screenshot uploaded:", url);
    return { success: true, url };
  } catch (error) {
    console.error("Error uploading screenshot:", error);
    return { success: false, error: error.message };
  }
};

// CREATE NEW INVESTMENT
export const createInvestment = async (userId, amount, screenshotURL) => {
  try {
    const investment = {
      userId: userId,
      amount: amount,
      transactionScreenshotURL: screenshotURL,
      status: "pending", // pending, approved, active
      createdAt: serverTimestamp(),
      approvedBy: null,
      approvedAt: null
    };

    const docRef = await addDoc(collection(db, "investments"), investment);
    console.log("Investment created:", docRef.id);
    return { success: true, investmentId: docRef.id };
  } catch (error) {
    console.error("Error creating investment:", error);
    return { success: false, error: error.message };
  }
};

// UPDATE INVESTMENT STATUS (Admin only)
export const updateInvestmentStatus = async (investmentId, adminId, approved = true) => {
  try {
    await updateDoc(doc(db, "investments", investmentId), {
      status: approved ? "approved" : "rejected",
      approvedBy: adminId,
      approvedAt: serverTimestamp()
    });
    console.log("Investment status updated:", approved ? "approved" : "rejected");
    return { success: true };
  } catch (error) {
    console.error("Error updating investment status:", error);
    return { success: false, error: error.message };
  }
};

// ADD GOAT
export const addGoat = async (breed, age, price, healthStatus) => {
  try {
    const goat = {
      breed: breed,
      age: age,
      price: price,
      healthStatus: healthStatus, // healthy, sick, recovering
      linkedInvestors: [],
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "goats"), goat);
    console.log("Goat added:", docRef.id);
    return { success: true, goatId: docRef.id };
  } catch (error) {
    console.error("Error adding goat:", error);
    return { success: false, error: error.message };
  }
};

// CALCULATE PROFIT DISTRIBUTION
export const calculateProfitDistribution = (totalProfit) => {
  return {
    investorShare: totalProfit * PROFIT_DISTRIBUTION.investor,
    farmCost: totalProfit * PROFIT_DISTRIBUTION.farmCost,
    adminProfit: totalProfit * PROFIT_DISTRIBUTION.adminProfit
  };
};

// RECORD PROFIT
export const recordProfit = async (investmentId, userId, totalProfit) => {
  try {
    const distribution = calculateProfitDistribution(totalProfit);
    
    const profit = {
      investmentId: investmentId,
      userId: userId,
      totalProfit: totalProfit,
      investorShare: distribution.investorShare,
      farmCost: distribution.farmCost,
      adminProfit: distribution.adminProfit,
      distributedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "profits"), profit);
    console.log("Profit recorded:", docRef.id);
    return { success: true, profitId: docRef.id, distribution };
  } catch (error) {
    console.error("Error recording profit:", error);
    return { success: false, error: error.message };
  }
};

// GET USER INVESTMENTS
export const getUserInvestments = async (userId) => {
  try {
    const q = query(collection(db, "investments"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const investments = [];
    querySnapshot.forEach((doc) => {
      investments.push({ id: doc.id, ...doc.data() });
    });
    return investments;
  } catch (error) {
    console.error("Error fetching investments:", error);
    return [];
  }
};

// GET ALL PENDING INVESTMENTS (For Admin)
export const getPendingInvestments = async () => {
  try {
    const q = query(collection(db, "investments"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const investments = [];
    querySnapshot.forEach((doc) => {
      investments.push({ id: doc.id, ...doc.data() });
    });
    return investments;
  } catch (error) {
    console.error("Error fetching pending investments:", error);
    return [];
  }
};

// GET ALL GOATS
export const getAllGoats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "goats"));
    const goats = [];
    querySnapshot.forEach((doc) => {
      goats.push({ id: doc.id, ...doc.data() });
    });
    return goats;
  } catch (error) {
    console.error("Error fetching goats:", error);
    return [];
  }
};

// CREATE WITHDRAWAL REQUEST
export const createWithdrawal = async (userId, amount, accountNumber, accountHolderName) => {
  try {
    const withdrawal = {
      userId: userId,
      amount: amount,
      accountNumber: accountNumber,
      accountHolderName: accountHolderName,
      status: "pending",
      requestedAt: serverTimestamp(),
      approvedAt: null
    };

    const docRef = await addDoc(collection(db, "withdrawals"), withdrawal);
    console.log("Withdrawal request created:", docRef.id);
    return { success: true, withdrawalId: docRef.id };
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return { success: false, error: error.message };
  }
};

export const getPendingWithdrawals = async () => {
  try {
    const q = query(collection(db, "withdrawals"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    const withdrawals = [];
    querySnapshot.forEach((doc) => {
      withdrawals.push({ id: doc.id, ...doc.data() });
    });
    return withdrawals;
  } catch (error) {
    console.error("Error fetching pending withdrawals:", error);
    return [];
  }
};

export const approveWithdrawal = async (withdrawalId, adminId, approved = true) => {
  try {
    await updateDoc(doc(db, "withdrawals", withdrawalId), {
      status: approved ? "approved" : "rejected",
      approvedBy: adminId,
      approvedAt: serverTimestamp()
    });
    console.log("Withdrawal updated:", withdrawalId, approved ? "approved" : "rejected");
    return { success: true };
  } catch (error) {
    console.error("Error updating withdrawal:", error);
    return { success: false, error: error.message };
  }
};

// GET USER PROFITS
export const getUserProfits = async (userId) => {
  try {
    const q = query(collection(db, "profits"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const profits = [];
    querySnapshot.forEach((doc) => {
      profits.push({ id: doc.id, ...doc.data() });
    });
    return profits;
  } catch (error) {
    console.error("Error fetching profits:", error);
    return [];
  }
};

// CREATE REINVESTMENT REQUEST
export const createReinvestment = async (userId, amount, type = "partial") => {
  try {
    const reinvestment = {
      userId: userId,
      amount: amount,
      type: type, // "complete" or "partial"
      status: "pending",
      requestedAt: serverTimestamp(),
      processedAt: null
    };

    const docRef = await addDoc(collection(db, "reinvestments"), reinvestment);
    console.log("Reinvestment created:", docRef.id);
    return { success: true, reinvestmentId: docRef.id };
  } catch (error) {
    console.error("Error creating reinvestment:", error);
    return { success: false, error: error.message };
  }
};

// GET USER REINVESTMENTS
export const getUserReinvestments = async (userId) => {
  try {
    const q = query(collection(db, "reinvestments"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const reinvestments = [];
    querySnapshot.forEach((doc) => {
      reinvestments.push({ id: doc.id, ...doc.data() });
    });
    return reinvestments;
  } catch (error) {
    console.error("Error fetching reinvestments:", error);
    return [];
  }
};

// CREATE PLAN CANCELLATION REQUEST
export const createCancellationRequest = async (userId, reason, details = "") => {
  try {
    const cancellation = {
      userId: userId,
      reason: reason,
      details: details,
      status: "pending",
      requestedAt: serverTimestamp(),
      processedAt: null,
      refundAmount: 0 // Will be calculated by admin
    };

    const docRef = await addDoc(collection(db, "cancellationRequests"), cancellation);
    console.log("Cancellation request created:", docRef.id);
    return { success: true, cancellationId: docRef.id };
  } catch (error) {
    console.error("Error creating cancellation request:", error);
    return { success: false, error: error.message };
  }
};

// GET USER CANCELLATION REQUESTS
export const getUserCancellationRequests = async (userId) => {
  try {
    const q = query(collection(db, "cancellationRequests"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    return requests;
  } catch (error) {
    console.error("Error fetching cancellation requests:", error);
    return [];
  }
};

// GET DASHBOARD STATS FOR USER
export const getUserDashboardStats = async (userId) => {
  try {
    const [investments, profits, withdrawals, reinvestments] = await Promise.all([
      getUserInvestments(userId),
      getUserProfits(userId),
      getUserWithdrawals(userId),
      getUserReinvestments(userId)
    ]);

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalProfit = profits.reduce((sum, p) => sum + p.investorShare, 0);
    const totalTransactions = investments.length + withdrawals.length + reinvestments.length;
    const activePlans = investments.filter(inv => inv.status === 'approved').length;
    const pendingApprovals = investments.filter(inv => inv.status === 'pending').length;

    return {
      totalInvested,
      totalProfit,
      totalTransactions,
      activePlans,
      pendingApprovals
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalInvested: 0,
      totalProfit: 0,
      totalTransactions: 0,
      activePlans: 0,
      pendingApprovals: 0
    };
  }
};

// GET USER WITHDRAWALS
export const getUserWithdrawals = async (userId) => {
  try {
    const q = query(collection(db, "withdrawals"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const withdrawals = [];
    querySnapshot.forEach((doc) => {
      withdrawals.push({ id: doc.id, ...doc.data() });
    });
    return withdrawals;
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return [];
  }
};
