document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants markup
        let participantsMarkup = "";
        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const items = details.participants
            .map((p) => {
              // create initials for badge from email/name string
              const initials = (p || "")
                .split(/[\s@._-]+/)
                .filter(Boolean)
                .slice(0,2)
                .map(s => s[0]?.toUpperCase() || "")
                .join("")
                .slice(0,2);

              return `
                <li class="participant-item">
                  <span class="participant-badge">${initials}</span>
                  <span class="participant-name">${p}</span>
                  <button class="delete-participant" title="Remove participant" data-activity="${name}" data-email="${p}">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 6L14 14M6 14L14 6" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  </button>
                </li>
              `;
            })
            .join("");

          participantsMarkup = `
            <div class="participants">
              <h5>Participants</h5>
              <ul class="participant-list">
                ${items}
              </ul>
            </div>
          `;
        } else {
          participantsMarkup = `
            <div class="participants">
              <h5>Participants</h5>
              <div class="participant-empty">No participants yet — be the first to sign up!</div>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        // Add event listeners for delete buttons after rendering
        activityCard.querySelectorAll('.delete-participant').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const activityName = btn.getAttribute('data-activity');
            const email = btn.getAttribute('data-email');
            if (!activityName || !email) return;
            btn.disabled = true;
            btn.innerHTML = '<span style="color:#c62828;font-size:12px;">Removing...</span>';
            try {
              const response = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
              });
              const result = await response.json();
              if (response.ok) {
                fetchActivities();
                showMessage(result.message, 'success');
              } else {
                showMessage(result.detail || 'Failed to remove participant.', 'error');
              }
            } catch (err) {
              showMessage('Error removing participant.', 'error');
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
