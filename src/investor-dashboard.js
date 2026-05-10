import { logout, auth } from "./auth.js";
import { 
  uploadTransactionScreenshot,
  createInvestment, 
  getUserInvestments, 
  getUserProfits, 
  createWithdrawal,
  createReinvestment,
  createCancellationRequest,
  getUserDashboardStats
} from "./utils.js";

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
  
  if (!userId || userRole !== "investor") {
    console.warn("Investor auth check failed - clearing cache and redirecting to login");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
  }
  return userId;
};

// LOAD INVESTOR DATA
const loadInvestorData = async (userId) => {
  try {
    // Get dashboard stats
    const stats = await getUserDashboardStats(userId);
    
    // Update summary cards
    document.getElementById("totalInvested").textContent = `PKR ${stats.totalInvested.toLocaleString()}`;
    document.getElementById("totalProfit").textContent = `PKR ${stats.totalProfit.toLocaleString()}`;
    document.getElementById("pendingCount").textContent = stats.pendingApprovals;
    document.getElementById("withdrawBalance").textContent = `PKR ${stats.totalProfit.toLocaleString()}`;
    document.getElementById("totalTransactions").textContent = stats.totalTransactions;
    document.getElementById("activePlans").textContent = stats.activePlans;

    // Update reinvestment amounts
    document.getElementById("completeReinvestAmount").textContent = `PKR ${stats.totalProfit.toLocaleString()}`;
    document.getElementById("partialReinvestAmount").max = stats.totalProfit;
    
    // Enable/disable reinvestment buttons based on available profit
    const completeBtn = document.getElementById("completeReinvestBtn");
    const partialInput = document.getElementById("partialReinvestAmount");
    
    if (stats.totalProfit > 0) {
      completeBtn.disabled = false;
      completeBtn.textContent = "Complete Reinvest";
      partialInput.max = stats.totalProfit;
    } else {
      completeBtn.disabled = true;
      completeBtn.textContent = "No Profit Available";
      partialInput.max = 0;
    }

    // Get detailed data for tables
    const investments = await getUserInvestments(userId);
    const profits = await getUserProfits(userId);

    // Display investments table
    if (investments.length === 0) {
      document.getElementById("investmentsContainer").innerHTML = '<div class="empty-state">No investments yet</div>';
    } else {
      let html = '<table><thead><tr><th>Amount</th><th>Status</th><th>Created</th><th>Approved</th></tr></thead><tbody>';
      investments.forEach(inv => {
        const createdDate = inv.createdAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        const approvedDate = inv.approvedAt?.toDate?.().toLocaleDateString?.() || 'Pending';
        html += `<tr>
          <td>PKR ${inv.amount.toLocaleString()}</td>
          <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
          <td>${createdDate}</td>
          <td>${approvedDate}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById("investmentsContainer").innerHTML = html;
    }

    // Display profits table
    if (profits.length === 0) {
      document.getElementById("profitsContainer").innerHTML = '<div class="empty-state">No profits recorded yet</div>';
    } else {
      let html = '<table><thead><tr><th>Investment</th><th>Your Share (30%)</th><th>Farm Cost (30%)</th><th>Admin Profit (40%)</th><th>Date</th></tr></thead><tbody>';
      profits.forEach(profit => {
        const date = profit.distributedAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        html += `<tr>
          <td>PKR ${profit.totalProfit.toLocaleString()}</td>
          <td>PKR ${profit.investorShare.toLocaleString()}</td>
          <td>PKR ${profit.farmCost.toLocaleString()}</td>
          <td>PKR ${profit.adminProfit.toLocaleString()}</td>
          <td>${date}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById("profitsContainer").innerHTML = html;
    }
  } catch (error) {
    console.error("Error loading investor data:", error);
  }
};

// CREATE INVESTMENT
const handleInvestmentSubmit = async (e) => {
  e.preventDefault();
  
  const userId = localStorage.getItem("currentUserId");
  const amount = parseInt(document.getElementById("investmentAmount").value);
  const screenshotInput = document.getElementById("transactionScreenshot");
  const screenshotError = document.getElementById("investmentError");

  if (amount < 1000) {
    screenshotError.style.display = "block";
    screenshotError.textContent = "Minimum investment is PKR 1000.";
    return;
  }

  if (!screenshotInput.files || screenshotInput.files.length === 0) {
    screenshotError.style.display = "block";
    screenshotError.textContent = "Please upload a transaction screenshot before submitting.";
    return;
  }

  screenshotError.style.display = "none";
  const file = screenshotInput.files[0];
  const uploadResult = await uploadTransactionScreenshot(userId, file);

  if (!uploadResult.success) {
    alert("Error uploading screenshot: " + uploadResult.error);
    return;
  }

  const result = await createInvestment(userId, amount, uploadResult.url);
  if (result.success) {
    alert("Investment submitted successfully! Awaiting admin approval.");
    document.getElementById("investmentForm").reset();
    document.getElementById("screenshotPreview").innerHTML = "";
    loadInvestorData(userId);
  } else {
    alert("Error creating investment: " + result.error);
  }
};

// REQUEST WITHDRAWAL
const handleWithdrawalSubmit = async (e) => {
  e.preventDefault();
  
  const userId = localStorage.getItem("currentUserId");
  const amount = parseInt(document.getElementById("withdrawalAmount").value);
  const accountNumber = document.getElementById("accountNumber").value.trim();
  const accountHolderName = document.getElementById("accountHolderName").value.trim();
  const withdrawalError = document.getElementById("withdrawalError");

  if (!amount || amount < 100 || !accountNumber || !accountHolderName) {
    withdrawalError.style.display = "block";
    withdrawalError.textContent = "All withdrawal fields are required and amount must be at least PKR 100.";
    return;
  }

  withdrawalError.style.display = "none";
  const result = await createWithdrawal(userId, amount, accountNumber, accountHolderName);
  if (result.success) {
    alert("Withdrawal request submitted! Admin will review and process it.");
    document.getElementById("withdrawalForm").reset();
  } else {
    alert("Error creating withdrawal: " + result.error);
  }
};

// COMPLETE REINVESTMENT
const handleCompleteReinvest = async () => {
  const userId = localStorage.getItem("currentUserId");
  const profitAmount = parseInt(document.getElementById("completeReinvestAmount").textContent.replace(/[^0-9]/g, ''));

  if (profitAmount <= 0) {
    alert("No profit available for reinvestment.");
    return;
  }

  if (confirm(`Are you sure you want to reinvest your entire profit balance of PKR ${profitAmount.toLocaleString()}?`)) {
    const result = await createReinvestment(userId, profitAmount, "complete");
    if (result.success) {
      alert("Complete reinvestment request submitted! Your profit will be reinvested into the farm.");
      loadInvestorData(userId);
    } else {
      alert("Error creating reinvestment: " + result.error);
    }
  }
};

// PARTIAL REINVESTMENT
const handlePartialReinvest = async (e) => {
  e.preventDefault();
  
  const userId = localStorage.getItem("currentUserId");
  const amount = parseInt(document.getElementById("partialReinvestAmount").value);
  const maxAmount = parseInt(document.getElementById("partialReinvestAmount").max);

  if (!amount || amount < 100) {
    alert("Minimum reinvestment amount is PKR 100.");
    return;
  }

  if (amount > maxAmount) {
    alert("Reinvestment amount cannot exceed your available profit.");
    return;
  }

  if (confirm(`Are you sure you want to reinvest PKR ${amount.toLocaleString()}?`)) {
    const result = await createReinvestment(userId, amount, "partial");
    if (result.success) {
      alert("Partial reinvestment request submitted! The specified amount will be reinvested into the farm.");
      document.getElementById("partialReinvestForm").reset();
      loadInvestorData(userId);
    } else {
      alert("Error creating reinvestment: " + result.error);
    }
  }
};

// PLAN CANCELLATION REQUEST
const handleCancellationSubmit = async (e) => {
  e.preventDefault();
  
  const userId = localStorage.getItem("currentUserId");
  const reason = document.getElementById("cancellationReason").value;
  const details = document.getElementById("cancellationDetails").value.trim();
  const agreement = document.getElementById("cancellationAgreement").checked;
  const cancellationError = document.getElementById("cancellationError");

  if (!reason || !agreement) {
    cancellationError.style.display = "block";
    cancellationError.textContent = "Please select a reason and agree to the terms.";
    return;
  }

  cancellationError.style.display = "none";

  if (confirm("Are you sure you want to cancel your investment plan? This action cannot be undone and will take 5 business days to process.")) {
    const result = await createCancellationRequest(userId, reason, details);
    if (result.success) {
      alert("Cancellation request submitted! Your request will be processed within 5 business days.");
      document.getElementById("cancellationForm").reset();
    } else {
      alert("Error creating cancellation request: " + result.error);
    }
  }
};

// INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
  const userId = checkAuth();
  loadInvestorData(userId);

  const investmentForm = document.getElementById("investmentForm");
  const withdrawalForm = document.getElementById("withdrawalForm");
  const partialReinvestForm = document.getElementById("partialReinvestForm");
  const cancellationForm = document.getElementById("cancellationForm");
  const completeReinvestBtn = document.getElementById("completeReinvestBtn");
  const screenshotInput = document.getElementById("transactionScreenshot");
  const previewContainer = document.getElementById("screenshotPreview");

  if (investmentForm) {
    investmentForm.addEventListener("submit", handleInvestmentSubmit);
  }

  if (withdrawalForm) {
    withdrawalForm.addEventListener("submit", handleWithdrawalSubmit);
  }

  if (partialReinvestForm) {
    partialReinvestForm.addEventListener("submit", handlePartialReinvest);
  }

  if (cancellationForm) {
    cancellationForm.addEventListener("submit", handleCancellationSubmit);
  }

  if (completeReinvestBtn) {
    completeReinvestBtn.addEventListener("click", handleCompleteReinvest);
  }

  if (screenshotInput && previewContainer) {
    screenshotInput.addEventListener("change", () => {
      const file = screenshotInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          previewContainer.innerHTML = `<img src="${reader.result}" alt="Screenshot preview" style="max-width:100%; max-height:220px; border-radius:10px; border:1px solid #ddd;" />`;
        };
        reader.readAsDataURL(file);
      } else {
        previewContainer.innerHTML = "";
      }
    });
  }
});
