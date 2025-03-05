// DOM Elements
const welcomeScreen = document.querySelector(".welcome-screen");
const meetingRoom = document.querySelector(".meeting-room");
const chatPanel = document.querySelector(".chat-panel");
const newMeetingBtn = document.querySelector(".new-meeting-btn");
const joinMeetingBtn = document.querySelector(".join-meeting-btn");
const meetingCodeInput = document.querySelector(".meeting-code-input");
const localVideo = document.getElementById("localVideo");
const muteAudioBtn = document.getElementById("muteAudio");
const stopVideoBtn = document.getElementById("stopVideo");
const shareScreenBtn = document.getElementById("shareScreen");
const chatBtn = document.getElementById("chat");
const leaveMeetingBtn = document.getElementById("leaveMeeting");
const chatInput = document.getElementById("chatInput");
const sendMessageBtn = document.getElementById("sendMessage");
const closeChatBtn = document.querySelector(".close-chat");
const chatMessages = document.querySelector(".chat-messages");

// Additional DOM Elements
const copyMeetingIdBtn = document.createElement("button");
copyMeetingIdBtn.className = "copy-meeting-id";
copyMeetingIdBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Meeting ID';

// Add new DOM Elements
const lockMeetingBtn = document.getElementById("lockMeeting");
const participantsBtn = document.getElementById("participants");
const recordMeetingBtn = document.getElementById("recordMeeting");
const reactionsBtn = document.getElementById("reactions");
const reactionsMenu = document.querySelector(".reactions-menu");
const raiseHandBtn = document.getElementById("raiseHand");
const meetingInfoBtn = document.getElementById("meetingInfo");

// State variables
let localStream = null;
let isAudioMuted = false;
let isVideoStopped = false;
let isScreenSharing = false;
let meetingId = null;
let participants = new Map();

// Additional state
let isLocked = false;
let isRecording = false;
let mediaRecorder = null;
let recordedChunks = [];
let isHandRaised = false;

// Add to the top of file after existing state variables
let currentUser = {
  name: "Doodle User",
  picture: "assets/default-avatar.png",
};

// Generate Meeting ID
function generateMeetingId() {
  return Math.random().toString(36).substring(2, 12);
}

// Check authentication
function checkAuth() {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );
  if (!user) {
    // Redirect to login if not authenticated
    window.location.href = "login.html";
    return null;
  }
  return user;
}

// Update UI with user info
function updateUserInterface() {
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user")
  );

  if (user) {
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");

    userAvatar.src = user.picture || "assets/default-avatar.png";
    userName.textContent = user.name;
  }
}

// Initialize when document loads
document.addEventListener("DOMContentLoaded", () => {
  // Load saved language
  const currentLang = localStorage.getItem("language") || "en";
  updatePageLanguage();

  // Check authentication
  const user = checkAuth();
  if (!user) return;

  // Update UI
  updateUserInterface();

  // Initialize welcome screen buttons
  initializeWelcomeScreen();

  // Initialize header buttons
  initializeHeaderButtons();

  // Initialize meeting controls
  initializeMeetingControls();
});

function initializeWelcomeScreen() {
  const newMeetingBtn = document.querySelector(".new-meeting-btn");
  const joinMeetingBtn = document.querySelector(".join-meeting-btn");
  const meetingCodeInput = document.querySelector(".meeting-code-input");

  if (newMeetingBtn) {
    newMeetingBtn.addEventListener("click", async () => {
      try {
        // Show loading state
        newMeetingBtn.classList.add("btn-loading");

        // Request camera and microphone permissions
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Generate meeting ID
        meetingId = generateMeetingId();

        // Show meeting room and hide welcome screen
        const welcomeScreen = document.querySelector(".welcome-screen");
        const meetingRoom = document.querySelector(".meeting-room");

        if (welcomeScreen && meetingRoom) {
          welcomeScreen.classList.add("hidden");
          meetingRoom.classList.remove("hidden");

          // Initialize video
          const localVideo = document.getElementById("localVideo");
          if (localVideo) {
            localVideo.srcObject = localStream;
            await localVideo.play();
          }

          showNotification("Meeting created successfully!", "success");

          // Copy meeting ID to clipboard
          navigator.clipboard.writeText(meetingId).then(() => {
            showNotification("Meeting ID copied to clipboard!", "info");
          });
        }
      } catch (error) {
        console.error("Error creating meeting:", error);
        showNotification(
          "Failed to create meeting. Please check your permissions.",
          "error"
        );
      } finally {
        // Remove loading state
        newMeetingBtn.classList.remove("btn-loading");
      }
    });
  }

  if (joinMeetingBtn && meetingCodeInput) {
    joinMeetingBtn.addEventListener("click", () => {
      const code = meetingCodeInput.value.trim();
      if (code) {
        joinMeeting(code);
      } else {
        showNotification("Please enter a meeting code", "error");
      }
    });
  }
}

function initializeHeaderButtons() {
  // Header join/host buttons
  const headerJoinBtn = document.querySelector("nav .join-meeting");
  const headerHostBtn = document.querySelector("nav .host-meeting");
  const logoutBtn = document.querySelector(".logout-btn");

  if (headerJoinBtn) {
    headerJoinBtn.addEventListener("click", showJoinMeetingDialog);
  }

  if (headerHostBtn) {
    headerHostBtn.addEventListener("click", createNewMeeting);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}

function initializeMeetingControls() {
  const controls = {
    muteAudio: document.getElementById("muteAudio"),
    stopVideo: document.getElementById("stopVideo"),
    shareScreen: document.getElementById("shareScreen"),
    chat: document.getElementById("chat"),
    participants: document.getElementById("participants"),
    lockMeeting: document.getElementById("lockMeeting"),
    recordMeeting: document.getElementById("recordMeeting"),
    reactions: document.getElementById("reactions"),
    raiseHand: document.getElementById("raiseHand"),
    leaveMeeting: document.getElementById("leaveMeeting"),
  };

  // Add event listeners if elements exist
  if (controls.muteAudio)
    controls.muteAudio.addEventListener("click", toggleAudio);
  if (controls.stopVideo)
    controls.stopVideo.addEventListener("click", toggleVideo);
  if (controls.shareScreen)
    controls.shareScreen.addEventListener("click", toggleScreenShare);
  if (controls.chat) controls.chat.addEventListener("click", toggleChat);
  if (controls.participants)
    controls.participants.addEventListener("click", toggleParticipants);
  if (controls.lockMeeting)
    controls.lockMeeting.addEventListener("click", toggleLockMeeting);
  if (controls.recordMeeting)
    controls.recordMeeting.addEventListener("click", toggleRecording);
  if (controls.reactions)
    controls.reactions.addEventListener("click", toggleReactions);
  if (controls.raiseHand)
    controls.raiseHand.addEventListener("click", toggleRaiseHand);
  if (controls.leaveMeeting)
    controls.leaveMeeting.addEventListener("click", leaveMeeting);

  // Chat close button
  const closeChatBtn = document.querySelector(".close-chat");
  if (closeChatBtn) {
    closeChatBtn.addEventListener("click", toggleChat);
  }

  if (meetingInfoBtn) {
    meetingInfoBtn.addEventListener("click", showMeetingInfo);
  }
}

// Meeting functions
async function createNewMeeting() {
  try {
    // Show loading state
    const newMeetingBtn = document.querySelector(".new-meeting-btn");
    if (newMeetingBtn) {
      newMeetingBtn.classList.add("btn-loading");
    }

    // Request camera and microphone permissions
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Generate meeting ID
    meetingId = generateMeetingId();

    // Show meeting room and hide welcome screen
    const welcomeScreen = document.querySelector(".welcome-screen");
    const meetingRoom = document.querySelector(".meeting-room");

    if (welcomeScreen && meetingRoom) {
      welcomeScreen.classList.add("hidden");
      meetingRoom.classList.remove("hidden");

      // Initialize video
      const localVideo = document.getElementById("localVideo");
      if (localVideo) {
        localVideo.srcObject = localStream;
        await localVideo.play();
      }

      showNotification("Meeting created successfully!", "success");

      // Show meeting info dialog
      showMeetingInfo();
    }
  } catch (error) {
    console.error("Error creating meeting:", error);
    showNotification(
      "Failed to create meeting. Please check your permissions.",
      "error"
    );
  } finally {
    const newMeetingBtn = document.querySelector(".new-meeting-btn");
    if (newMeetingBtn) {
      newMeetingBtn.classList.remove("btn-loading");
    }
  }
}

function showMeetingInfo() {
  const dialog = document.createElement("div");
  dialog.className = "dialog-overlay";

  const meetingLink = `${window.location.origin}/join.html?id=${meetingId}`;

  dialog.innerHTML = `
    <div class="meeting-info-dialog">
      <h2>Meeting Information</h2>
      
      <div class="meeting-info-section">
        <h3>Meeting ID</h3>
        <div class="info-box">
          <input type="text" value="${meetingId}" readonly />
          <button class="copy-btn" onclick="copyToClipboard('${meetingId}', this)">
            <i class="fas fa-copy"></i>
            Copy
          </button>
        </div>
      </div>

      <div class="meeting-info-section">
        <h3>Invitation Link</h3>
        <div class="info-box">
          <input type="text" value="${meetingLink}" readonly />
          <button class="copy-btn" onclick="copyToClipboard('${meetingLink}', this)">
            <i class="fas fa-copy"></i>
            Copy
          </button>
        </div>
      </div>

      <div class="dialog-buttons">
        <button class="dialog-confirm" onclick="this.closest('.dialog-overlay').remove()">
          Done
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
}

async function copyToClipboard(text, button) {
  try {
    await navigator.clipboard.writeText(text);

    // Show success state
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
    button.classList.add("copied");

    // Reset button after 2 seconds
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove("copied");
    }, 2000);

    showNotification("Copied to clipboard!", "success");
  } catch (err) {
    console.error("Failed to copy:", err);
    showNotification("Failed to copy to clipboard", "error");
  }
}

async function joinMeeting(code) {
  try {
    // Request permissions
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    meetingId = code;

    // Show meeting room
    document.querySelector(".welcome-screen").classList.add("hidden");
    document.querySelector(".meeting-room").classList.remove("hidden");

    // Initialize video
    const localVideo = document.getElementById("localVideo");
    if (localVideo) {
      localVideo.srcObject = localStream;
      await localVideo.play();
    }

    showNotification("Joined meeting successfully!", "success");
  } catch (error) {
    console.error("Error joining meeting:", error);
    showNotification(
      "Failed to join meeting. Please check your permissions.",
      "error"
    );
  }
}

// Check for meeting ID in URL when page loads
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get("id");

  if (meetingId) {
    joinMeeting(meetingId);
  }
});

// Helper functions
function showJoinMeetingDialog() {
  const dialog = document.createElement("div");
  dialog.className = "dialog-overlay";
  dialog.innerHTML = `
    <div class="dialog">
      <h2>Join Meeting</h2>
      <input type="text" placeholder="Enter meeting code" id="dialogMeetingCode">
      <div class="dialog-buttons">
        <button class="dialog-cancel" onclick="this.closest('.dialog-overlay').remove()">Cancel</button>
        <button class="dialog-confirm" onclick="handleDialogJoin(this)">Join</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
}

function handleDialogJoin(button) {
  const dialog = button.closest(".dialog-overlay");
  const code = dialog.querySelector("#dialogMeetingCode").value.trim();

  if (code) {
    dialog.remove();
    joinMeeting(code);
  } else {
    showNotification("Please enter a meeting code", "error");
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

// Logout function
function logout() {
  localStorage.removeItem("user");
  sessionStorage.removeItem("user");
  // Redirect to login page
  window.location.href = "login.html";
}

// Add guest badge styles
const guestStyles = `
.guest-badge {
  background-color: #e2e8f0;
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 1rem;
  margin-left: 0.5rem;
  font-weight: normal;
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = guestStyles;
document.head.appendChild(styleSheet);

// Initialize with enhanced features
async function initialize() {
  try {
    const user = checkAuth();
    if (!user) return;

    // Request permissions for media devices
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: "user",
      },
    });

    localVideo.srcObject = localStream;

    // Generate meeting ID for new meetings
    meetingId = generateMeetingId();

    // Add meeting ID display
    const meetingInfo = document.createElement("div");
    meetingInfo.className = "meeting-info";
    meetingInfo.innerHTML = `
      <span>Meeting ID: ${meetingId}</span>
      ${copyMeetingIdBtn.outerHTML}
    `;
    meetingRoom.insertBefore(meetingInfo, meetingRoom.firstChild);

    // Initialize copy button functionality
    document.querySelector(".copy-meeting-id").addEventListener("click", () => {
      navigator.clipboard.writeText(meetingId).then(() => {
        showNotification("Meeting ID copied to clipboard!");
      });
    });

    // Initialize reactions menu position
    const controlsRect = document
      .querySelector(".meeting-controls")
      .getBoundingClientRect();
    reactionsMenu.style.bottom = `${
      window.innerHeight - controlsRect.top + 20
    }px`;

    // Add user interface update
    updateUserInterface();
  } catch (error) {
    console.error("Error initializing:", error);
    showNotification("Error initializing application", "error");
  }
}

// Event Listeners
newMeetingBtn.addEventListener("click", () => {
  welcomeScreen.classList.add("hidden");
  meetingRoom.classList.remove("hidden");
  initialize();
});

joinMeetingBtn.addEventListener("click", () => {
  const meetingCode = meetingCodeInput.value.trim();
  if (meetingCode) {
    meetingId = meetingCode;
    welcomeScreen.classList.add("hidden");
    meetingRoom.classList.remove("hidden");
    initialize();
  } else {
    showNotification("Please enter a meeting code", "error");
  }
});

muteAudioBtn.addEventListener("click", () => {
  if (localStream) {
    isAudioMuted = !isAudioMuted;
    localStream.getAudioTracks()[0].enabled = !isAudioMuted;
    muteAudioBtn.querySelector("i").className = isAudioMuted
      ? "fas fa-microphone-slash"
      : "fas fa-microphone";
    muteAudioBtn.classList.toggle("active", isAudioMuted);

    showNotification(
      isAudioMuted ? "Microphone muted" : "Microphone unmuted",
      "success"
    );
  }
});

stopVideoBtn.addEventListener("click", () => {
  if (localStream) {
    isVideoStopped = !isVideoStopped;
    localStream.getVideoTracks()[0].enabled = !isVideoStopped;
    stopVideoBtn.querySelector("i").className = isVideoStopped
      ? "fas fa-video-slash"
      : "fas fa-video";
    stopVideoBtn.classList.toggle("active", isVideoStopped);

    showNotification(
      isVideoStopped ? "Camera turned off" : "Camera turned on",
      "success"
    );
  }
});

shareScreenBtn.addEventListener("click", async () => {
  try {
    if (!isScreenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      videoTrack.onended = () => {
        stopScreenSharing();
      };

      localVideo.srcObject = screenStream;
      isScreenSharing = true;
      shareScreenBtn.querySelector("i").className = "fas fa-times";
      shareScreenBtn.classList.add("active");
      showNotification("Screen sharing started", "success");
    } else {
      stopScreenSharing();
    }
  } catch (error) {
    console.error("Error sharing screen:", error);
    showNotification("Failed to share screen", "error");
  }
});

function stopScreenSharing() {
  localVideo.srcObject = localStream;
  isScreenSharing = false;
  shareScreenBtn.querySelector("i").className = "fas fa-desktop";
  shareScreenBtn.classList.remove("active");
  showNotification("Screen sharing stopped", "success");
}

chatBtn.addEventListener("click", () => {
  chatPanel.classList.toggle("hidden");
});

closeChatBtn.addEventListener("click", () => {
  chatPanel.classList.add("hidden");
});

leaveMeetingBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to leave the meeting?")) {
    if (isRecording) {
      mediaRecorder.stop();
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    meetingRoom.classList.add("hidden");
    welcomeScreen.classList.remove("hidden");
    showNotification("You have left the meeting", "success");
  }
});

// Chat functionality
function addMessage(message, isLocal = true) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${isLocal ? "local" : "remote"}`;

  // Add timestamp
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <div class="message-content">${message}</div>
    <div class="message-time">${timestamp}</div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendMessageBtn.addEventListener("click", () => {
  const message = chatInput.value.trim();
  if (message) {
    addMessage(message);
    chatInput.value = "";
  }
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const message = chatInput.value.trim();
    if (message) {
      addMessage(message);
      chatInput.value = "";
    }
  }
});

// Handle window beforeunload
window.addEventListener("beforeunload", (e) => {
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
});

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.altKey) {
    switch (e.key) {
      case "m":
        muteAudioBtn.click();
        break;
      case "v":
        stopVideoBtn.click();
        break;
      case "c":
        chatBtn.click();
        break;
      case "l":
        leaveMeetingBtn.click();
        break;
    }
  }
});

// Lock Meeting functionality
lockMeetingBtn.addEventListener("click", () => {
  isLocked = !isLocked;
  lockMeetingBtn.querySelector("i").className = isLocked
    ? "fas fa-lock"
    : "fas fa-lock-open";
  lockMeetingBtn.classList.toggle("locked");

  showNotification(
    isLocked ? "Meeting is now locked" : "Meeting is now unlocked",
    "warning"
  );
});

// Recording functionality
recordMeetingBtn.addEventListener("click", async () => {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = "meeting-recording.webm";
        a.click();
        window.URL.revokeObjectURL(url);
        recordedChunks = [];
      };

      mediaRecorder.start();
      isRecording = true;
      recordMeetingBtn.classList.add("active");
      showNotification("Recording started", "success");
    } catch (error) {
      console.error("Error starting recording:", error);
      showNotification("Failed to start recording", "error");
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recordMeetingBtn.classList.remove("active");
    showNotification("Recording saved", "success");
  }
});

// Participants button
participantsBtn.addEventListener("click", () => {
  // Here you would typically show a participants list panel
  showNotification("Participants feature coming soon", "warning");
});

// Reactions functionality
reactionsBtn.addEventListener("click", () => {
  reactionsMenu.classList.toggle("hidden");
});

// Close reactions menu when clicking outside
document.addEventListener("click", (e) => {
  if (!reactionsMenu.contains(e.target) && !reactionsBtn.contains(e.target)) {
    reactionsMenu.classList.add("hidden");
  }
});

// Handle reactions
document.querySelectorAll(".reaction-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const emoji = button.dataset.emoji;
    showReaction(emoji);
    // Here you would typically broadcast this reaction to other participants
  });
});

function showReaction(emoji) {
  const reaction = document.createElement("div");
  reaction.className = "reaction-animation";
  reaction.textContent = emoji;

  // Random position at the bottom of the screen
  const randomX = Math.random() * (window.innerWidth - 50);
  reaction.style.left = `${randomX}px`;
  reaction.style.bottom = "100px";

  document.body.appendChild(reaction);

  // Remove the element after animation
  reaction.addEventListener("animationend", () => {
    reaction.remove();
  });
}

// Raise hand functionality
raiseHandBtn.addEventListener("click", () => {
  isHandRaised = !isHandRaised;
  raiseHandBtn.classList.toggle("active", isHandRaised);

  // Update hand raised indicator
  const videoContainer = document.querySelector(".video-container");
  if (isHandRaised) {
    const indicator = document.createElement("div");
    indicator.className = "hand-raised-indicator";
    indicator.innerHTML = `<i class="fas fa-hand"></i> Hand Raised`;
    videoContainer.appendChild(indicator);
    videoContainer.classList.add("hand-raised");
  } else {
    const indicator = videoContainer.querySelector(".hand-raised-indicator");
    if (indicator) {
      indicator.remove();
    }
    videoContainer.classList.remove("hand-raised");
  }

  showNotification(isHandRaised ? "Hand raised" : "Hand lowered", "success");

  // Here you would typically broadcast the hand raised status to other participants
});

// Add keyboard shortcut for raising hand
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "h") {
    raiseHandBtn.click();
  }
});

// Function to handle incoming reactions from other participants
function handleIncomingReaction(emoji, participantId) {
  showReaction(emoji);
  // You might want to show who sent the reaction
  showNotification(`${participantId} reacted with ${emoji}`, "info");
}

// Function to handle incoming hand raise status from other participants
function handleHandRaiseStatus(participantId, isRaised) {
  // Update UI to show which participant has their hand raised
  const participantVideo = document.querySelector(
    `[data-participant-id="${participantId}"]`
  );
  if (participantVideo) {
    if (isRaised) {
      const indicator = document.createElement("div");
      indicator.className = "hand-raised-indicator";
      indicator.innerHTML = `<i class="fas fa-hand"></i> Hand Raised`;
      participantVideo.appendChild(indicator);
      participantVideo.classList.add("hand-raised");
    } else {
      const indicator = participantVideo.querySelector(
        ".hand-raised-indicator"
      );
      if (indicator) {
        indicator.remove();
      }
      participantVideo.classList.remove("hand-raised");
    }
  }
}

// Add notification styles
const notificationStyles = `
.notification.info {
  background-color: #eff6ff;
  border-left: 4px solid var(--primary-color);
  color: var(--primary-color);
}
`;

// Update existing styles
const styleSheet = document.createElement("style");
styleSheet.textContent = guestStyles + notificationStyles;
document.head.appendChild(styleSheet);

// Add these event listeners
document.addEventListener("DOMContentLoaded", () => {
  updateUserInterface();
  initializeEventListeners();
});

// Update the addParticipant function
function addParticipant(userId, stream) {
  const videoContainer = document.createElement("div");
  videoContainer.className = "video-container";

  const video = document.createElement("video");
  video.autoplay = true;
  video.playsInline = true;
  video.srcObject = stream;

  const participantName = document.createElement("div");
  participantName.className = "participant-name";

  // Get participant info
  const participant = participants.get(userId) || {
    name: "Doodle User",
    picture: "assets/default-avatar.png",
    isGuest: true,
  };

  participantName.textContent = participant.name;

  // Add avatar for participants without video
  const avatarContainer = document.createElement("div");
  avatarContainer.className = "avatar-container hidden";
  const avatar = document.createElement("img");
  avatar.src = participant.picture;
  avatar.alt = participant.name;
  avatarContainer.appendChild(avatar);

  videoContainer.appendChild(video);
  videoContainer.appendChild(avatarContainer);
  videoContainer.appendChild(participantName);

  // Show avatar when video is turned off
  video.addEventListener("loadedmetadata", () => {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      avatarContainer.classList.remove("hidden");
    }
  });

  document.querySelector(".video-grid").appendChild(videoContainer);
  return videoContainer;
}

// Add styles for avatar
const styles = `
.avatar-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-container.hidden {
  display: none;
}

.participant-name {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  background: rgba(0, 0, 0, 0.5);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Add new functions for meeting functionality
function showJoinMeetingDialog() {
  const dialog = document.createElement("div");
  dialog.className = "dialog-overlay";
  dialog.innerHTML = `
    <div class="dialog">
      <h2>Join Meeting</h2>
      <input type="text" placeholder="Enter meeting code" id="dialogMeetingCode">
      <div class="dialog-buttons">
        <button class="dialog-cancel" onclick="this.closest('.dialog-overlay').remove()">Cancel</button>
        <button class="dialog-confirm" onclick="handleDialogJoin(this)">Join</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);
}

function joinMeetingWithCode() {
  const code = document.getElementById("meetingCodeInput").value.trim();
  if (!code) {
    showNotification("Please enter a meeting code", "error");
    return;
  }

  document.querySelector(".dialog-overlay").remove();
  joinMeeting(code);
}

function createNewMeeting() {
  const meetingId = generateMeetingId();
  showNotification("Creating new meeting...", "info");

  // Copy meeting ID to clipboard
  navigator.clipboard.writeText(meetingId).then(() => {
    showNotification("Meeting ID copied to clipboard!", "success");
  });

  // Start the meeting
  joinMeeting(meetingId);
}

// Add meeting control functions
function toggleAudio() {
  const muteBtn = document.getElementById("muteAudio");
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    audioTrack.enabled = !audioTrack.enabled;
    muteBtn.innerHTML = audioTrack.enabled
      ? '<i class="fas fa-microphone"></i>'
      : '<i class="fas fa-microphone-slash"></i>';

    showNotification(
      audioTrack.enabled ? "Microphone unmuted" : "Microphone muted",
      "info"
    );
  }
}

function toggleVideo() {
  const videoBtn = document.getElementById("stopVideo");
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    videoTrack.enabled = !videoTrack.enabled;
    videoBtn.innerHTML = videoTrack.enabled
      ? '<i class="fas fa-video"></i>'
      : '<i class="fas fa-video-slash"></i>';

    // Show/hide avatar when video is toggled
    const localVideo = document.getElementById("localVideo");
    const avatarContainer =
      localVideo.parentElement.querySelector(".avatar-container");
    if (avatarContainer) {
      avatarContainer.classList.toggle("hidden", videoTrack.enabled);
    }

    showNotification(
      videoTrack.enabled ? "Camera turned on" : "Camera turned off",
      "info"
    );
  }
}

async function toggleScreenShare() {
  const shareBtn = document.getElementById("shareScreen");
  try {
    if (!isScreenSharing) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Replace video track
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection
        .getSenders()
        .find((s) => s.track.kind === "video");
      await sender.replaceTrack(videoTrack);

      // Update UI
      shareBtn.innerHTML = '<i class="fas fa-desktop"></i> Stop Sharing';
      isScreenSharing = true;

      // Handle when user stops sharing
      videoTrack.onended = () => {
        stopScreenShare();
      };

      showNotification("Screen sharing started", "success");
    } else {
      await stopScreenShare();
    }
  } catch (error) {
    console.error("Error sharing screen:", error);
    showNotification("Failed to share screen", "error");
  }
}

async function stopScreenShare() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection
      .getSenders()
      .find((s) => s.track.kind === "video");
    await sender.replaceTrack(videoTrack);

    document.getElementById("shareScreen").innerHTML =
      '<i class="fas fa-desktop"></i>';
    isScreenSharing = false;
    showNotification("Screen sharing stopped", "info");
  }
}

function toggleChat() {
  const chatPanel = document.querySelector(".chat-panel");
  const chatBtn = document.getElementById("chat");

  chatPanel.classList.toggle("hidden");
  chatBtn.classList.toggle("active");

  if (!chatPanel.classList.contains("hidden")) {
    document.getElementById("chatInput").focus();
  }
}

function toggleParticipants() {
  const participantsBtn = document.getElementById("participants");
  participantsBtn.classList.toggle("active");
  // TODO: Show participants list
  showNotification("Participants panel coming soon", "info");
}

function toggleLockMeeting() {
  const lockBtn = document.getElementById("lockMeeting");
  isLocked = !isLocked;

  lockBtn.innerHTML = isLocked
    ? '<i class="fas fa-lock"></i>'
    : '<i class="fas fa-lock-open"></i>';

  showNotification(
    isLocked ? "Meeting is now locked" : "Meeting is now unlocked",
    "info"
  );
}

function toggleRecording() {
  const recordBtn = document.getElementById("recordMeeting");

  if (!isRecording) {
    startRecording();
    recordBtn.classList.add("active");
    showNotification("Recording started", "info");
  } else {
    stopRecording();
    recordBtn.classList.remove("active");
    showNotification("Recording stopped", "info");
  }
}

function toggleReactions() {
  const reactionsMenu = document.querySelector(".reactions-menu");
  reactionsMenu.classList.toggle("hidden");
}

function toggleRaiseHand() {
  const raiseHandBtn = document.getElementById("raiseHand");
  isHandRaised = !isHandRaised;

  raiseHandBtn.classList.toggle("active", isHandRaised);
  showNotification(isHandRaised ? "Hand raised" : "Hand lowered", "info");

  // TODO: Broadcast hand raise status to other participants
}

function leaveMeeting() {
  if (confirm("Are you sure you want to leave the meeting?")) {
    // Clean up streams
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Reset UI
    document.querySelector(".meeting-room").classList.add("hidden");
    document.querySelector(".welcome-screen").classList.remove("hidden");

    showNotification("You have left the meeting", "info");

    // Redirect to home after short delay
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  }
}

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Meeting controls
  document.getElementById("muteAudio").addEventListener("click", toggleAudio);
  document.getElementById("stopVideo").addEventListener("click", toggleVideo);
  document
    .getElementById("shareScreen")
    .addEventListener("click", toggleScreenShare);
  document.getElementById("chat").addEventListener("click", toggleChat);
  document
    .getElementById("participants")
    .addEventListener("click", toggleParticipants);
  document
    .getElementById("lockMeeting")
    .addEventListener("click", toggleLockMeeting);
  document
    .getElementById("recordMeeting")
    .addEventListener("click", toggleRecording);
  document
    .getElementById("reactions")
    .addEventListener("click", toggleReactions);
  document
    .getElementById("raiseHand")
    .addEventListener("click", toggleRaiseHand);
  document
    .getElementById("leaveMeeting")
    .addEventListener("click", leaveMeeting);

  // Chat functionality
  document.querySelector(".close-chat").addEventListener("click", toggleChat);

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.altKey) {
      switch (e.key.toLowerCase()) {
        case "m":
          toggleAudio();
          break;
        case "v":
          toggleVideo();
          break;
        case "c":
          toggleChat();
          break;
        case "h":
          toggleRaiseHand();
          break;
        case "l":
          leaveMeeting();
          break;
      }
    }
  });
});

// Add this function to update UI language
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
