import { signup as authSignup, login as authLogin, getCurrentUser } from "./auth.js";

console.log("MAIN JS WORKING - Goat Farm System");

// SIGNUP
const signup = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const name = document.getElementById("name")?.value || email.split("@")[0];

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  const result = await authSignup(email, password, name, "investor");
  console.log("Signup result:", result);
  if (result.success) {
    localStorage.setItem("currentUserId", result.user.uid);
    localStorage.setItem("userRole", result.role);
    alert("Signup Success! Redirecting...");
    redirectToRole(result.role, result.user.uid);
  } else {
    let message = result.error;
    if (result.offline) {
      message = "⚠️ Network Error: " + result.error + "\n\nTroubleshooting:\n- Check your internet connection\n- Check if you're behind a firewall/proxy\n- Try again in a moment";
    } else if (result.error.includes("email-already-in-use")) {
      message = "Email already exists. Please login instead.";
    }
    alert(message);
  }
};

// LOGIN
const login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  const result = await authLogin(email, password);
  console.log("Login result:", result);
  if (result.success) {
    localStorage.setItem("currentUserId", result.user.uid);
    localStorage.setItem("userRole", result.role);
    alert("Login Success! Redirecting...");
    redirectToRole(result.role, result.user.uid);
  } else {
    let message = result.error;
    if (result.offline) {
      message = "⚠️ Network Error: " + result.error + "\n\nTroubleshooting:\n- Check your internet connection\n- Check if you're behind a firewall/proxy\n- Try again in a moment";
    } else if (result.error.includes("invalid-credential")) {
      message = "Login failed: Email or password is incorrect.";
    }
    alert(message);
  }
};

// REDIRECT BASED ON ROLE
const redirectToRole = (role, userId) => {
  localStorage.setItem("currentUserId", userId);
  localStorage.setItem("userRole", role);

  switch (role) {
    case "admin":
      window.location.href = "admin.html";
      break;
    case "manager":
      window.location.href = "manager.html";
      break;
    case "investor":
    default:
      window.location.href = "investor.html";
      break;
  }
};

// CHECK IF USER ALREADY LOGGED IN
const checkAuth = async () => {
  // Only attempt to check auth if we have a genuine Firebase connection
  // Don't use cached redirect on initial page load
  const cachedUserId = localStorage.getItem("currentUserId");
  const cachedRole = localStorage.getItem("userRole");
  
  if (!cachedUserId || !cachedRole) {
    console.log("No cached auth; staying on login page");
    return;
  }

  // Verify auth with Firebase (with timeout)
  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ user: null, role: null }), 3000));
  const { user, role } = await Promise.race([getCurrentUser(), timeoutPromise]);

  if (user && role) {
    console.log("Firebase verified auth; redirecting to role page");
    redirectToRole(role, user.uid);
  } else {
    console.log("Firebase auth verification failed; clearing stale cache");
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("userRole");
  }
};

// Attach event listeners when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  
  const signupBtn = document.querySelector(".signup");
  const loginBtn = document.querySelector(".login");
  
  if (signupBtn) signupBtn.addEventListener("click", signup);
  if (loginBtn) loginBtn.addEventListener("click", login);
});