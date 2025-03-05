document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const meetingId = urlParams.get("id");

  if (!meetingId) {
    window.location.href = "index.html";
    return;
  }

  const joinWithVideo = document.getElementById("joinWithVideo");
  const joinWithoutVideo = document.getElementById("joinWithoutVideo");
  const muteAudioSetting = document.getElementById("muteAudioSetting");
  const turnOffVideoSetting = document.getElementById("turnOffVideoSetting");

  joinWithVideo.addEventListener("click", () => {
    joinMeeting(true);
  });

  joinWithoutVideo.addEventListener("click", () => {
    turnOffVideoSetting.checked = true;
    joinMeeting(false);
  });

  async function joinMeeting(withVideo) {
    try {
      const constraints = {
        audio: true,
        video: withVideo,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (muteAudioSetting.checked) {
        stream.getAudioTracks()[0].enabled = false;
      }

      if (turnOffVideoSetting.checked) {
        stream.getVideoTracks().forEach((track) => (track.enabled = false));
      }

      // Store settings in session storage
      sessionStorage.setItem(
        "meetingSettings",
        JSON.stringify({
          audioMuted: muteAudioSetting.checked,
          videoOff: turnOffVideoSetting.checked,
        })
      );

      // Redirect to meeting room
      window.location.href = `index.html?id=${meetingId}`;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      showNotification("Failed to access camera/microphone", "error");
    }
  }
});
