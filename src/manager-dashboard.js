import { logout } from "./auth.js";
import { getAllGoats } from "./utils.js";
import { db, collection, getDocs, updateDoc, doc } from "./firestore-config.js";

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
  
  if (!userId || userRole !== "manager") {
    console.warn("Manager auth check failed - clearing cache and redirecting to login");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userRole");
    window.location.href = "index.html";
  }
  return userId;
};

// LOAD MANAGER DATA
const loadManagerData = async () => {
  try {
    // Get all goats
    const goats = await getAllGoats();
    document.getElementById("activeGoats").textContent = goats.length;

    const healthyCount = goats.filter(g => g.healthStatus === 'healthy').length;
    const sickCount = goats.filter(g => g.healthStatus === 'sick' || g.healthStatus === 'recovering').length;

    document.getElementById("healthyGoats").textContent = healthyCount;
    document.getElementById("sickGoats").textContent = sickCount;

    // Load goat select dropdown
    let goatOptions = '<option value="">Select Goat</option>';
    goats.forEach((goat, index) => {
      goatOptions += `<option value="${goat.id}">${goat.breed} (${goat.age} months) - ${goat.healthStatus}</option>`;
    });
    document.getElementById("goatId").innerHTML = goatOptions;

    // Display goats table
    if (goats.length === 0) {
      document.getElementById("goatsStatusContainer").innerHTML = '<div class="empty-state">No goats in inventory</div>';
    } else {
      let html = '<table><thead><tr><th>Breed</th><th>Age</th><th>Price</th><th>Health Status</th><th>Date Added</th></tr></thead><tbody>';
      goats.forEach(goat => {
        const date = goat.createdAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        html += `<tr>
          <td>${goat.breed}</td>
          <td>${goat.age} months</td>
          <td>PKR ${goat.price.toLocaleString()}</td>
          <td><span class="status-badge status-${goat.healthStatus}">${goat.healthStatus}</span></td>
          <td>${date}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById("goatsStatusContainer").innerHTML = html;
    }

    // Get active investments
    const investmentsSnapshot = await getDocs(collection(db, "investments"));
    const activeInvestments = [];
    investmentsSnapshot.forEach(doc => {
      if (doc.data().status === 'approved' || doc.data().status === 'active') {
        activeInvestments.push({ id: doc.id, ...doc.data() });
      }
    });

    document.getElementById("activeInvestors").textContent = new Set(activeInvestments.map(i => i.userId)).size;

    // Display active investments
    if (activeInvestments.length === 0) {
      document.getElementById("activeInvestmentsContainer").innerHTML = '<div class="empty-state">No active investments</div>';
    } else {
      let html = '<table><thead><tr><th>Investor</th><th>Amount</th><th>Status</th><th>Investment Date</th></tr></thead><tbody>';
      activeInvestments.forEach(async (inv) => {
        const userDoc = await getUserById(inv.userId);
        const email = userDoc?.email || 'Unknown';
        const date = inv.createdAt?.toDate?.().toLocaleDateString?.() || 'N/A';
        html += `<tr>
          <td>${email}</td>
          <td>PKR ${inv.amount.toLocaleString()}</td>
          <td><span class="status-badge status-${inv.status}">${inv.status}</span></td>
          <td>${date}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      document.getElementById("activeInvestmentsContainer").innerHTML = html;
    }
  } catch (error) {
    console.error("Error loading manager data:", error);
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

// UPDATE GOAT HEALTH
const handleHealthUpdate = async (e) => {
  e.preventDefault();
  
  const goatId = document.getElementById("goatId").value;
  const healthStatus = document.getElementById("healthStatus").value;
  const notes = document.getElementById("notes").value;

  if (!goatId || !healthStatus) {
    alert("Please fill all required fields");
    return;
  }

  try {
    await updateDoc(doc(db, "goats", goatId), {
      healthStatus: healthStatus,
      lastUpdated: new Date(),
      notes: notes
    });

    alert("Goat health status updated successfully!");
    document.getElementById("healthUpdateForm").reset();
    loadManagerData();
  } catch (error) {
    console.error("Error updating goat:", error);
    alert("Error updating health status: " + error.message);
  }
};

// INITIALIZE
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadManagerData();

  const healthForm = document.getElementById("healthUpdateForm");
  if (healthForm) {
    healthForm.addEventListener("submit", handleHealthUpdate);
  }
});
