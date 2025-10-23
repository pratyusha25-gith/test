async function loadActivities() {
  try {
    const response = await fetch("/activities");
    const activities = await response.json();
    const activitiesList = document.getElementById("activities-list");
    const activitySelect = document.getElementById("activity");

    // Clear loading message and activity options
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    Object.entries(activities).forEach(([name, details]) => {
      // Create activity card
      const card = document.createElement("div");
      card.className = "activity-card";
      card.innerHTML = `
        <h4>${name}</h4>
        <p><strong>Description:</strong> ${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Available Spots:</strong> ${details.max_participants - details.participants.length} / ${details.max_participants}</p>
        <p><strong>Current Participants:</strong></p>
        <ul class="participants-list">
          ${details.participants.map(email => `<li>${email}</li>`).join('')}
        </ul>
      `;
      activitiesList.appendChild(card);

      // Add to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading activities:", error);
  }
}

async function handleSignup(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const activity = document.getElementById("activity").value;
  const messageDiv = document.getElementById("message");

  try {
    const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `email=${encodeURIComponent(email)}`,
    });

    const result = await response.json();

    if (response.ok) {
      messageDiv.className = "message success";
      messageDiv.textContent = result.message;
      // Reload activities to show updated participants
      loadActivities();
    } else {
      messageDiv.className = "message error";
      messageDiv.textContent = result.detail;
    }
  } catch (error) {
    messageDiv.className = "message error";
    messageDiv.textContent = "An error occurred while signing up.";
  }
  messageDiv.classList.remove("hidden");
}

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadActivities();
  document.getElementById("signup-form").addEventListener("submit", handleSignup);
});
