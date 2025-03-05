// Check authentication state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      // Get user data from Firestore
      const doc = await db.collection("users").doc(user.uid).get();
      if (doc.exists) {
        const userData = {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified,
          ...doc.data(),
        };

        // Update local storage
        const storage = localStorage.getItem("user")
          ? localStorage
          : sessionStorage;
        storage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  } else {
    // No user is signed in, redirect to login
    if (!window.location.pathname.includes("login.html")) {
      window.location.href = "login.html";
    }
  }
});
