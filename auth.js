// DOM Elements
const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const togglePasswordButtons = document.querySelectorAll(".toggle-password");

// Tab Switching
authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const targetForm = tab.dataset.tab;

    // Update active tab
    authTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // Show/hide forms
    authForms.forEach((form) => {
      form.classList.add("hidden");
      if (form.id === `${targetForm}Form`) {
        form.classList.remove("hidden");
      }
    });
  });
});

// Toggle Password Visibility
togglePasswordButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const input = button.parentElement.querySelector("input");
    const icon = button.querySelector("i");

    if (input.type === "password") {
      input.type = "text";
      icon.className = "fas fa-eye-slash";
    } else {
      input.type = "password";
      icon.className = "fas fa-eye";
    }
  });
});

// Social Login Configuration
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"; // Replace with your Google Client ID
const FB_APP_ID = "YOUR_FACEBOOK_APP_ID"; // Replace with your Facebook App ID

// Initialize Facebook SDK
window.fbAsyncInit = function () {
  FB.init({
    appId: FB_APP_ID,
    cookie: true,
    xfbml: true,
    version: "v18.0",
  });
};

// Initialize Google Sign-In
function initializeGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleSignIn,
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

// Handle regular login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear any existing guest session
  sessionStorage.removeItem("user");

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const rememberMe = document.getElementById("rememberMe").checked;

  try {
    // Show loading state
    const submitBtn = document.querySelector(".auth-button");
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    submitBtn.disabled = true;

    // Sign in with Firebase
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Get user data from Firestore
    const userData = await db.collection("users").doc(user.uid).get();

    // Combine auth and profile data
    const userProfile = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      ...userData.data(),
    };

    // Store in localStorage/sessionStorage
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(userProfile));

    showNotification("Login successful!", "success");
    setTimeout(() => (window.location.href = "index.html"), 1500);
  } catch (error) {
    console.error("Login error:", error);
    showNotification(error.message, "error");
  }
});

// Handle registration
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear any existing guest session
  sessionStorage.removeItem("user");

  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  try {
    if (password !== confirmPassword) {
      throw new Error("Passwords do not match");
    }

    // Show loading state
    const submitBtn = registerForm.querySelector(".auth-button");
    submitBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    // Create user in Firebase Auth
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Create user profile in Firestore
    await db
      .collection("users")
      .doc(user.uid)
      .set({
        name,
        email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        settings: {
          muteMic: false,
          turnOffCamera: false,
          highQuality: true,
          language: "en",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });

    // Send email verification
    await user.sendEmailVerification();

    showNotification(
      "Account created successfully! Please verify your email.",
      "success"
    );

    // Switch to login tab
    document.querySelector('[data-tab="login"]').click();
  } catch (error) {
    console.error("Registration error:", error);
    showNotification(error.message, "error");
  }
});

// Handle Google Sign-In
async function handleGoogleSignIn(response) {
  try {
    const decoded = jwt_decode(response.credential);
    const userData = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
      provider: "google",
      token: response.credential,
    };

    handleSuccessfulLogin(userData, true);
  } catch (error) {
    console.error("Google Sign-In error:", error);
    showNotification("Failed to sign in with Google", "error");
  }
}

// Handle Facebook Sign-In
function handleFacebookSignIn() {
  FB.login(
    function (response) {
      if (response.authResponse) {
        FB.api("/me", { fields: "name,email,picture" }, function (userData) {
          const user = {
            name: userData.name,
            email: userData.email,
            picture: userData.picture?.data?.url,
            provider: "facebook",
            accessToken: response.authResponse.accessToken,
          };

          handleSuccessfulLogin(user, true);
        });
      } else {
        showNotification("Failed to sign in with Facebook", "error");
      }
    },
    { scope: "public_profile,email" }
  );
}

// Common function to handle successful login
function handleSuccessfulLogin(userData, rememberMe) {
  // Store user data
  if (rememberMe) {
    localStorage.setItem("user", JSON.stringify(userData));
  } else {
    sessionStorage.setItem("user", JSON.stringify(userData));
  }

  // Show success notification
  showNotification(`Welcome back, ${userData.name}!`, "success");

  // Redirect to main app after short delay
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Check auth status on page load
function checkAuthStatus() {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  if (user && !user.isGuest) {
    // Redirect logged-in users to main app
    window.location.href = "index.html";
  }
}

// Initialize everything when the page loads
document.addEventListener("DOMContentLoaded", () => {
  initializeGoogleSignIn();
  checkAuthStatus();
});

// Add logout functionality (add this to main.js)
function logout() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.provider === "facebook") {
    FB.logout();
  }

  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Notification System
function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add guest login functionality
function loginAsGuest() {
  try {
    // Generate random guest ID
    const guestId = "guest_" + Math.random().toString(36).substr(2, 9);

    // Create guest user data
    const guestData = {
      uid: guestId,
      name: "Doodle User",
      picture: "assets/default-avatar.png",
      isGuest: true,
      lastLogin: new Date().toISOString(),
    };

    // Store in sessionStorage (not localStorage since it's a temporary guest)
    sessionStorage.setItem("user", JSON.stringify(guestData));

    // Show success message
    showNotification("Welcome, Guest User!", "success");

    // Redirect to main app
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  } catch (error) {
    console.error("Guest login error:", error);
    showNotification("Failed to continue as guest", "error");
  }
}
