// DOM Elements
const profileForm = document.getElementById("profileForm");
const profileAvatar = document.getElementById("profileAvatar");
const avatarInput = document.getElementById("avatarInput");
const changeAvatarBtn = document.querySelector(".change-avatar-btn");
const timezoneSelect = document.getElementById("timezone");

// Initialize profile page
function initializeProfile() {
  const user = checkAuth();
  if (!user) return;

  // Update header user info
  updateUserInterface();

  // Load user data into form
  document.getElementById("fullName").value = user.name || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  profileAvatar.src = user.picture || "assets/default-avatar.png";

  // Load saved settings
  const settings = JSON.parse(localStorage.getItem("userSettings") || "{}");
  document.getElementById("muteMic").checked = settings.muteMic || false;
  document.getElementById("turnOffCamera").checked =
    settings.turnOffCamera || false;
  document.getElementById("highQuality").checked =
    settings.highQuality || false;
  document.getElementById("language").value = settings.language || "en";

  // Populate timezone options
  populateTimezones();
  timezoneSelect.value =
    settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Populate timezone select with options
function populateTimezones() {
  const timeZones = moment.tz.names();
  timeZones.forEach((zone) => {
    const option = document.createElement("option");
    option.value = zone;
    option.textContent = zone.replace(/_/g, " ");
    timezoneSelect.appendChild(option);
  });
}

// Handle avatar change
changeAvatarBtn.addEventListener("click", () => {
  avatarInput.click();
});

avatarInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      changeAvatarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found");

      // Resize image
      const resizedImage = await resizeImage(file);

      // Upload to Firebase Storage
      const storageRef = storage.ref();
      const avatarRef = storageRef.child(`avatars/${user.uid}`);

      // Convert base64 to blob
      const response = await fetch(resizedImage);
      const blob = await response.blob();

      // Upload file
      const snapshot = await avatarRef.put(blob);
      const downloadURL = await snapshot.ref.getDownloadURL();

      // Update profile picture URL in Firestore
      await db.collection("users").doc(user.uid).update({
        picture: downloadURL,
      });

      // Update preview
      profileAvatar.src = downloadURL;

      // Update local storage
      const storage = localStorage.getItem("user")
        ? localStorage
        : sessionStorage;
      const userData = JSON.parse(storage.getItem("user"));
      userData.picture = downloadURL;
      storage.setItem("user", JSON.stringify(userData));

      changeAvatarBtn.innerHTML = '<i class="fas fa-camera"></i>';
      showNotification("Profile picture updated successfully!");
    } catch (error) {
      console.error("Avatar update error:", error);
      showNotification(error.message, "error");
      changeAvatarBtn.innerHTML = '<i class="fas fa-camera"></i>';
    }
  }
});

// Update form submission
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Show loading state
    const saveBtn = document.querySelector(".save-btn");
    const originalText = saveBtn.textContent;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    // Get selected language
    const newLang = document.getElementById("language").value;
    const currentLang = localStorage.getItem("language") || "en";
    const isLanguageChanged = newLang !== currentLang;

    // Get form data
    const formData = {
      name: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      picture: profileAvatar.src,
      settings: {
        muteMic: document.getElementById("muteMic").checked,
        turnOffCamera: document.getElementById("turnOffCamera").checked,
        highQuality: document.getElementById("highQuality").checked,
        language: newLang,
      },
    };

    // Save to Firebase/localStorage
    const user = auth.currentUser;
    if (user) {
      await db
        .collection("users")
        .doc(user.uid)
        .update({
          ...formData,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        });
    }

    // Update local storage
    const storage = localStorage.getItem("user")
      ? localStorage
      : sessionStorage;
    const userData = JSON.parse(storage.getItem("user"));
    const updatedUser = {
      ...userData,
      ...formData,
      lastUpdated: new Date().toISOString(),
    };
    storage.setItem("user", JSON.stringify(updatedUser));

    // Update language if changed
    if (isLanguageChanged) {
      // Update language in localStorage
      localStorage.setItem("language", newLang);

      // Update all translatable elements
      document.querySelectorAll("[data-translate]").forEach((element) => {
        const key = element.getAttribute("data-translate");
        if (translations[newLang] && translations[newLang][key]) {
          if (
            element.tagName === "INPUT" &&
            element.getAttribute("placeholder")
          ) {
            element.placeholder = translations[newLang][key];
          } else {
            element.textContent = translations[newLang][key];
          }
        }
      });

      // Update document direction and language
      document.dir = newLang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = newLang;

      // Show success message in appropriate language
      showNotification(
        newLang === "ar"
          ? "تم تحديث الملف الشخصي بنجاح!"
          : "Profile updated successfully!",
        "success"
      );

      // Redirect to home page after short delay
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } else {
      // Show regular success message
      showNotification("Profile updated successfully!", "success");
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    showNotification("Error updating profile", "error");
    saveBtn.innerHTML = originalText;
    saveBtn.disabled = false;
  }
});

// Initialize when document loads
document.addEventListener("DOMContentLoaded", () => {
  // Set initial language
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  if (user?.settings?.language) {
    const currentLang = user.settings.language;
    document.documentElement.lang = currentLang;
    document.dir = currentLang === "ar" ? "rtl" : "ltr";
  }

  initializeProfile();
  loadDraft();

  // Load saved language
  const currentLang = localStorage.getItem("language") || "en";
  const languageSelect = document.getElementById("language");
  if (languageSelect) {
    languageSelect.value = currentLang;
  }
});

// Enhanced notification system
function showNotification(message, type = "success") {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Add icon based on type
  const icon = type === "success" ? "check-circle" : "exclamation-circle";
  notification.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(notification);

  // Add show animation
  setTimeout(() => notification.classList.add("show"), 100);

  // Remove after delay
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add auto-save functionality
let autoSaveTimeout;
const formInputs = profileForm.querySelectorAll("input, select");

formInputs.forEach((input) => {
  input.addEventListener("change", () => {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      // Save to temporary storage
      const tempData = {
        formData: {
          name: document.getElementById("fullName").value,
          email: document.getElementById("email").value,
          phone: document.getElementById("phone").value,
        },
        settings: {
          muteMic: document.getElementById("muteMic").checked,
          turnOffCamera: document.getElementById("turnOffCamera").checked,
          highQuality: document.getElementById("highQuality").checked,
          language: document.getElementById("language").value,
        },
      };
      localStorage.setItem("profileDraft", JSON.stringify(tempData));
      showNotification("Draft saved automatically", "info");
    }, 1000);
  });
});

// Load draft on page load if exists
function loadDraft() {
  const draft = JSON.parse(localStorage.getItem("profileDraft"));
  if (draft) {
    const loadDraftBtn = document.createElement("button");
    loadDraftBtn.className = "load-draft-btn";
    loadDraftBtn.innerHTML =
      '<i class="fas fa-history"></i> Load unsaved changes';

    loadDraftBtn.addEventListener("click", () => {
      // Restore draft data
      Object.entries(draft.formData).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) input.value = value;
      });

      Object.entries(draft.settings).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) {
          if (input.type === "checkbox") {
            input.checked = value;
          } else {
            input.value = value;
          }
        }
      });

      loadDraftBtn.remove();
      localStorage.removeItem("profileDraft");
      showNotification("Draft restored", "success");
    });

    profileForm.insertBefore(loadDraftBtn, profileForm.firstChild);
  }
}

// Helper function to resize image
async function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Load translations on page load
function updatePageLanguage() {
  const currentLang = localStorage.getItem("language") || "en";
  document.querySelectorAll("[data-translate]").forEach((element) => {
    const key = element.getAttribute("data-translate");
    if (translations[currentLang] && translations[currentLang][key]) {
      if (element.tagName === "INPUT" && element.getAttribute("placeholder")) {
        element.placeholder = translations[currentLang][key];
      } else {
        element.textContent = translations[currentLang][key];
      }
    }
  });

  // Update document direction for RTL languages
  document.dir = currentLang === "ar" ? "rtl" : "ltr";
}
