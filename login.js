document.addEventListener("DOMContentLoaded", () => {
  // Check if user is already logged in
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "index.html";
    }
  });

  // Handle login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Initialize social login buttons
  initializeSocialLogin();
});

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginBtn = document.querySelector(".login-btn");

  try {
    // Show loading state
    loginBtn.classList.add("btn-loading");

    // Sign in with Firebase
    const userCredential = await auth.signInWithEmailAndPassword(
      email,
      password
    );
    const user = userCredential.user;

    // Get additional user data from Firestore
    const userData = await db.collection("users").doc(user.uid).get();

    // Store user data
    const userInfo = {
      id: user.uid,
      name: userData.data()?.name || user.displayName || "User",
      email: user.email,
      picture:
        userData.data()?.picture ||
        user.photoURL ||
        "assets/default-avatar.png",
    };

    localStorage.setItem("user", JSON.stringify(userInfo));

    // Show success message
    showNotification("Login successful!", "success");

    // Redirect to home page
    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  } catch (error) {
    console.error("Login error:", error);
    showNotification(getErrorMessage(error.code), "error");
  } finally {
    loginBtn.classList.remove("btn-loading");
  }
}

async function loginAsGuest() {
  try {
    // Sign in anonymously with Firebase
    const userCredential = await auth.signInAnonymously();
    const user = userCredential.user;

    const guestUser = {
      id: user.uid,
      name: "Guest User",
      email: "guest@example.com",
      picture: "assets/default-avatar.png",
      isGuest: true,
    };

    // Store in session storage (temporary)
    sessionStorage.setItem("user", JSON.stringify(guestUser));

    // Redirect to home page
    window.location.href = "index.html";
  } catch (error) {
    console.error("Guest login error:", error);
    showNotification("Failed to continue as guest", "error");
  }
}

function initializeSocialLogin() {
  // Google Sign In
  const googleBtn = document.querySelector(".google-login");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;

        // Store user info
        const userInfo = {
          id: user.uid,
          name: user.displayName,
          email: user.email,
          picture: user.photoURL,
        };

        localStorage.setItem("user", JSON.stringify(userInfo));
        window.location.href = "index.html";
      } catch (error) {
        console.error("Google login error:", error);
        showNotification("Failed to login with Google", "error");
      }
    });
  }
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/wrong-password":
      return "Invalid password. Please try again.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Login failed. Please try again.";
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
