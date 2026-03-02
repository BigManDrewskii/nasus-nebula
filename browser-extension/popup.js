// Update tab count on load
chrome.storage.session.get("attachedTabs", ({ attachedTabs = [] }) => {
  document.getElementById("tabCount").textContent = attachedTabs.length;
});

// Listen for storage changes to update tab count in real-time
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.attachedTabs) {
    document.getElementById("tabCount").textContent = changes.attachedTabs.newValue?.length || 0;
  }
});

// Test connection to the app
document.getElementById("testBtn").addEventListener("click", async () => {
  const btn = document.getElementById("testBtn");
  const originalText = btn.textContent;
  btn.textContent = "Testing...";
  btn.disabled = true;

  // Try to send a ping to known origins
  const origins = ["http://localhost:5173", "http://localhost:3000", "https://nasus.app"];
  let connected = false;

  for (const origin of origins) {
    try {
      const response = await fetch(origin + "/", { method: "HEAD", mode: "no-cors" });
      // no-cors means we can't check response status, but no exception means the server is reachable
      connected = true;
      break;
    } catch {}
  }

  if (connected) {
    btn.textContent = "✓ App Detected";
    btn.classList.add("connected");
  } else {
    btn.textContent = "✗ App Not Detected";
    btn.classList.add("error");
  }

  // Reset after 3 seconds
  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("connected", "error");
    btn.disabled = false;
  }, 3000);
});
