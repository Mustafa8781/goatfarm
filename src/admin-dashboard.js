import { logout } from "./auth.js";
import { 
  addGoat, 
  getAllGoats, 
  getPendingInvestments, 
  updateInvestmentStatus,
  getPendingWithdrawals,
  approveWithdrawal,
  recordProfit,
  calculateProfitDistribution
} from "./utils.js";
import { db, collection, getDocs } from "./firestore-config.js";

// LOGOUT
window.logoutUser = async () => {
  const result = await logout();
  if (result.success) {
    alert("Logged out successfully");
    window.location.href = "index.html";
  }
};

// CHECK AUTH
const checkAuth = () => {
  const userId = localStorage.getItem("currentUserId");
  const userRole = localStorage.getItem("userRole");
  
  if (!userId || userRole !== "admin") {
    console.warn("Admin auth check failed - clearing cache and redirecting to login");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
  }
  return userId;
};

// LOAD ADMIN DATA
const loadAdminData = async () => {
  try {
    // Get total users
    const usersSnapshot = await getDocs(collection(db, "users"));
    document.getElementById("totalUsers").textContent = usersSnapshot.size;

    // Get total investments
    const investmentsSnapshot = await getDocs(collection(db, "investments"));
    let totalInvested = 0;
    investmentsSnapshot.forEach(doc => {
      totalInvested += doc.data().amount || 0;
    });
    document.getElementById("totalInvestments").textContent = `PKR ${totalInvested.toLocaleString()}`;

    // Get pending approvals
    const pendingInvestments = await getPendingInvestments();
    document.getElementById("pendingApprovals").textContent = pendingInvestments.length;

    // Load pending investments table
    if (pendingInvestments.length === 0) {
      document.getElementById("pendingInvestmentsContainer").innerHTML = '<div class="empty-state">No pending approvals</div>';
    } else {
      let html = '<table><thead><tr><th>Investor Email</th><th>Amount</th><th>Screenshot</th><th>Date</th><th>Action</th></tr></thead><tbody>';
      for (const inv of pendingInvestments) {
        const userDoc = await getUserById(inv.userId);
        const email = userDoc?.email || 'Unknown';
        const date = inv.createdAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        const screenshotHtml = inv.screenshotUrl ? `<a href="${inv.screenshotUrl}" target="_blank">View</a>` : 'None';
        html += `<tr>
          <td>${email}</td>
          <td>PKR ${inv.amount.toLocaleString()}</td>
          <td>${screenshotHtml}</td>
          <td>${date}</td>
          <td>
            <button class="btn btn-success btn-small" onclick="approveInvestmentAction('${inv.id}')">Approve</button>
            <button class="btn btn-danger btn-small" onclick="rejectInvestmentAction('${inv.id}')">Reject</button>
          </td>
        </tr>`;
      }
      html += '</tbody></table>';
      document.getElementById("pendingInvestmentsContainer").innerHTML = html;
    }

    // Load pending withdrawal requests
    const pendingWithdrawals = await getPendingWithdrawals();
    if (pendingWithdrawals.length === 0) {
      document.getElementById("pendingWithdrawalsContainer").innerHTML = '<div class="empty-state">No pending withdrawal requests</div>';
    } else {
      let html = '<table><thead><tr><th>Investor Email</th><th>Amount</th><th>Account</th><th>Name</th><th>Requested</th><th>Action</th></tr></thead><tbody>';
      for (const wd of pendingWithdrawals) {
        const userDoc = await getUserById(wd.userId);
        const email = userDoc?.email || 'Unknown';
        const date = wd.requestedAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        html += `<tr>
          <td>${email}</td>
          <td>PKR ${wd.amount.toLocaleString()}</td>
          <td>${wd.accountNumber}</td>
          <td>${wd.accountHolderName}</td>
          <td>${date}</td>
          <td>
            <button class="btn btn-success btn-small" onclick="approveWithdrawalAction('${wd.id}')">Approve</button>
            <button class="btn btn-danger btn-small" onclick="rejectWithdrawalAction('${wd.id}')">Reject</button>
          </td>
        </tr>`;
      }
      html += '</tbody></table>';
      document.getElementById("pendingWithdrawalsContainer").innerHTML = html;
    }

    // Get all goats
    const goats = await getAllGoats();
    document.getElementById("totalGoats").textContent = goats.length;

    // Load goats table
    if (goats.length === 0) {
      document.getElementById("goatsContainer").innerHTML = '<div class="empty-state">No goats in inventory</div>';
    } else {
      let html = '<table><thead><tr><th>Breed</th><th>Age (months)</th><th>Price</th><th>Health</th><th>Date Added</th></tr></thead><tbody>';
      goats.forEach(goat => {
        const date = goat.createdAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        html += `<tr>
          <td>${goat.breed}</td>
          <td>${goat.age}</td>
          <td>PKR ${goat.price.toLocaleString()}</td>
          <td><span class="status-badge status-${goat.healthStatus}">${goat.healthStatus}</span></td>
          <td>${date}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById("goatsContainer").innerHTML = html;
    }

    // Load investments for profit recording
    const allInvestments = await getDocs(collection(db, "investments"));
    let investmentOptions = '<option value="">Select Investment</option>';
    allInvestments.forEach(doc => {
      const data = doc.data();
      if (data.status === 'approved') {
        investmentOptions += `<option value="${doc.id}">INV-${doc.id.slice(0, 6)} - ${data.amount} PKR</option>`;
      }
    });
    document.getElementById("profitInvestmentId").innerHTML = investmentOptions;
  } catch (error) {
    console.error("Error loading admin data:", error);
  }
};

// GET USER BY ID
const getUserById = async (userId) => {
  try {
    const { getDoc, doc } = await import('firebase/firestore');
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.data();
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
};

// APPROVE INVESTMENT
window.approveInvestmentAction = async (investmentId) => {
  const adminId = localStorage.getItem("currentUserId");
  const result = await updateInvestmentStatus(investmentId, adminId, true);
  if (result.success) {
    alert("Investment approved successfully!");
    loadAdminData();
  } else {
    alert("Error approving investment: " + result.error);
  }
};

// REJECT INVESTMENT
window.rejectInvestmentAction = async (investmentId) => {
  const adminId = localStorage.getItem("currentUserId");
  const result = await updateInvestmentStatus(investmentId, adminId, false);
  if (result.success) {
    alert("Investment rejected successfully.");
    loadAdminData();
  } else {
    alert("Error rejecting investment: " + result.error);
  }
};

// APPROVE WITHDRAWAL
window.approveWithdrawalAction = async (withdrawalId) => {
  const adminId = localStorage.getItem("currentUserId");
  const result = await approveWithdrawal(withdrawalId, adminId, true);
  if (result.success) {
    alert("Withdrawal approved successfully!");
    loadAdminData();
  } else {
    alert("Error approving withdrawal: " + result.error);
  }
};

// REJECT WITHDRAWAL
window.rejectWithdrawalAction = async (withdrawalId) => {
  const adminId = localStorage.getItem("currentUserId");
  const result = await approveWithdrawal(withdrawalId, adminId, false);
  if (result.success) {
    alert("Withdrawal rejected successfully.");
    loadAdminData();
  } else {
    alert("Error rejecting withdrawal: " + result.error);
  }
};

// ADD GOAT
const handleGoatSubmit = async (e) => {
  e.preventDefault();
  
  const breed = document.getElementById("breed").value;
  const age = parseInt(document.getElementById("age").value);
  const price = parseInt(document.getElementById("price").value);
  const health = document.getElementById("health").value;

  const result = await addGoat(breed, age, price, health);
  if (result.success) {
    alert("Goat added successfully!");
    document.getElementById("goatForm").reset();
    loadAdminData();
  } else {
    alert("Error adding goat: " + result.error);
  }
};

// PROFIT CALCULATION
const handleProfitCalculation = (e) => {
  const totalProfitInput = document.getElementById("totalProfit");
  const total = parseInt(totalProfitInput.value) || 0;
  
  if (total > 0) {
    const distribution = calculateProfitDistribution(total);
    document.getElementById("investorShare").value = `PKR ${distribution.investorShare.toLocaleString()}`;
    document.getElementById("farmCostShare").value = `PKR ${distribution.farmCost.toLocaleString()}`;
    document.getElementById("adminProfitShare").value = `PKR ${distribution.adminProfit.toLocaleString()}`;
  }
};

// RECORD PROFIT
const handleProfitSubmit = async (e) => {
  e.preventDefault();
  
  const investmentId = document.getElementById("profitInvestmentId").value;
  const totalProfit = parseInt(document.getElementById("totalProfit").value);
  const adminId = localStorage.getItem("currentUserId");

  if (!investmentId || totalProfit < 1000) {
    alert("Please fill all fields correctly");
    return;
  }

  // Get investment to find user
  const { getDoc, doc } = await import('firebase/firestore');
  const invDoc = await getDoc(doc(db, "investments", investmentId));
  const userId = invDoc.data().userId;

  const result = await recordProfit(investmentId, userId, totalProfit);
  if (result.success) {
    alert(`Profit recorded! Distribution:\nInvestor: PKR ${result.distribution.investorShare.toLocaleString()}\nFarm Cost: PKR ${result.distribution.farmCost.toLocaleString()}\nAdmin: PKR ${result.distribution.adminProfit.toLocaleString()}`);
    document.getElementById("profitForm").reset();
  } else {
    alert("Error recording profit: " + result.error);
  }
};

// INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadAdminData();

  const goatForm = document.getElementById("goatForm");
  const profitForm = document.getElementById("profitForm");
  const totalProfitInput = document.getElementById("totalProfit");

  if (goatForm) {
    goatForm.addEventListener("submit", handleGoatSubmit);
  }

  if (profitForm) {
    profitForm.addEventListener("submit", handleProfitSubmit);
  }

  if (totalProfitInput) {
    totalProfitInput.addEventListener("input", handleProfitCalculation);
  }
});
