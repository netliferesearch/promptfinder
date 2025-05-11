// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const promptsListSection = document.getElementById("prompts-list-section");
  let allPrompts = [];
  const promptDetailSection = document.getElementById("prompt-details-section");
  const addPromptButton = document.getElementById("add-prompt-button");
  const addPromptSection = document.getElementById("add-prompt-section");
  const addPromptForm = document.getElementById("add-prompt-form");
  const promptsList = document.getElementById("prompts-list");
  const confirmationMessage = document.getElementById("confirmation-message");
  const searchInput = document.getElementById("search-input");
  const errorMessage = document.getElementById("error-message");

  // --- Section Visibility Management ---

  const showPromptList = () => {
    if (promptsListSection) promptsListSection.style.display = "block";
    if (promptDetailSection) promptDetailSection.style.display = "none";
    if (addPromptSection) addPromptSection.style.display = "none";
  };

  const showPromptDetails = () => {
    if (promptsListSection) promptsListSection.style.display = "none";
    if (promptDetailSection) promptDetailSection.style.display = "block";
    if (addPromptSection) addPromptSection.style.display = "none";
  };

  // --- Data Storage Functions ---

  const handleError = (message) => {
    console.error(message);
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = "block";
      setTimeout(() => {
        errorMessage.style.display = "none";
      }, 5000);
    }
  };

  const updatePromptInStorage = (promptId, updates) => {
    console.log(
      "updatePromptInStorage called - promptId:",
      promptId,
      "updates:",
      updates
    ); // Added logging
    const promptIndex = allPrompts.findIndex((p) => p.id === promptId);
    if (promptIndex !== -1) {
      // compute new sum, count and average
      const old = allPrompts[promptIndex];
      const newCount = (old.ratingCount || 0) + 1;
      const newSum = (old.ratingSum || 0) + (updates.rating || 0);
      const newAvg = newSum / newCount;

      // write back average, sum & count
      allPrompts[promptIndex] = {
        ...old,
        ratingSum: newSum,
        ratingCount: newCount,
        rating: newAvg,
      };

      chrome.storage.local.set({ prompts: allPrompts }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error setting prompts in storage:",
            chrome.runtime.lastError
          );
          handleError(`Error saving rating: ${chrome.runtime.lastError}`);
        } else {
          console.log("Prompts successfully saved to storage.");
        }
      });
    }
  };

  const findPromptById = (promptId) => {
    return allPrompts.find((prompt) => prompt.id === promptId);
  };

  // --- Display Functions ---

  const displayPrompts = (prompts) => {
    promptsList.innerHTML = "";
    if (prompts) {
      prompts.forEach((prompt) => {
        const promptElement = document.createElement("div");
        promptElement.classList.add("prompt-item");
        promptElement.innerHTML = `
          <h3>${prompt.title}</h3>
          <button class="view-details" data-id="${prompt.id}">View Details</button>
          <button class="copy-prompt" data-id="${prompt.id}">Copy</button>
        `;
        promptsList.appendChild(promptElement);
      });
    }
  };

  const displayPromptDetails = (prompt) => {
    showPromptDetails();

    const titleEl = promptDetailSection.querySelector("#prompt-detail-title");
    if (titleEl) titleEl.textContent = prompt.title;
    const textEl = promptDetailSection.querySelector("#prompt-detail-text");
    if (textEl) textEl.textContent = prompt.text;
    const categoryEl = promptDetailSection.querySelector(
      "#prompt-detail-category"
    );
    if (categoryEl) categoryEl.textContent = prompt.category;
    const tagsEl = promptDetailSection.querySelector("#prompt-detail-tags");
    if (tagsEl) tagsEl.textContent = prompt.tags.join(", ");
    const favoritesEl = promptDetailSection.querySelector(
      "#prompt-detail-favorites"
    );
    if (favoritesEl) favoritesEl.textContent = prompt.favorites;

    // Rebuild the star container and attach per-star click handlers
    const starRatingContainer =
      promptDetailSection.querySelector("#star-rating");
    if (starRatingContainer) {
      starRatingContainer.dataset.id = prompt.id;
      starRatingContainer.innerHTML = "";
      const currentRating = Math.round(prompt.rating || 0);
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.classList.add("star");
        star.dataset.value = i;
        star.innerHTML =
          i <= currentRating
            ? '<i class="fas fa-star"></i>'
            : '<i class="far fa-star"></i>';
        if (i <= currentRating) star.classList.add("filled");
        star.addEventListener("click", (e) => {
          e.stopPropagation();
          const rating = i;
          console.log(`Star clicked: ${rating} for prompt ${prompt.id}`);
          // Immediate UI update
          highlightStars(rating, starRatingContainer);
          // Persist the rating
          updatePromptInStorage(prompt.id, { rating });
          // Show confirmation
          showConfirmationMessage(`Rated ${rating} stars!`);
        });
        starRatingContainer.appendChild(star);
      }
    }
    // Update the “(count)” display
    const countEl = promptDetailSection.querySelector("#rating-count");
    if (countEl) {
      countEl.textContent = `(${prompt.ratingCount || 0})`;
    }

    // Now wire up the back & copy buttons directly
    const backBtn = promptDetailSection.querySelector("#back-to-list-button");
    if (backBtn) backBtn.addEventListener("click", showPromptList);

    const copyBtn = promptDetailSection.querySelector("#copy-prompt-button");
    if (copyBtn)
      copyBtn.addEventListener("click", () => {
        copyPrompt(prompt.id);
      });
  };
  // --- Event Handling ---

  // Event listener for the "Add New Prompt" button
  if (addPromptButton) {
    addPromptButton.addEventListener("click", () => {
      // Hide other sections
      if (promptsListSection) promptsListSection.style.display = "none";
      if (promptDetailSection) promptDetailSection.style.display = "none";
      // Show the add prompt section
      if (addPromptSection) addPromptSection.style.display = "block";
    });
  }

  // Event listener for adding a new prompt
  if (addPromptForm) {
    addPromptForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const title = document.getElementById("prompt-title").value;
      const text = document.getElementById("prompt-text").value;

      if (!title || !text) {
        handleError("Please enter both a title and prompt text.");
        return;
      }

      //   const category = document.getElementById("prompt-category").value;
      //    const tags = document
      //  .getElementById("prompt-tags")
      //    .value.split(",")
      //      .map((tag) => tag.trim())
      //        .filter((tag) => tag !== ""); // Filter out empty tags
      // Safely grab category & tags only if those inputs exist
      const categoryInput = document.getElementById("prompt-category");
      const tagsInput = document.getElementById("prompt-tags");
      const category = categoryInput ? categoryInput.value : "";
      const tags = tagsInput
        ? tagsInput.value
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag !== "")
        : [];
      const isPublic = document.getElementById("prompt-public").checked;

      const newPrompt = {
        id: Date.now().toString(),
        title: title,
        text: text,
        category: category,
        tags: tags,
        isPublic: isPublic,
        rating: 0, // current average / last‐click value
        ratingCount: 0, // number of times rated
        ratingSum: 0, // total of all individual ratings
        favorites: 0,
        dateAdded: new Date().toISOString(),
      };

      allPrompts.push(newPrompt);
      chrome.storage.local.set({ prompts: allPrompts }, () => {
        if (chrome.runtime.lastError) {
          handleError(
            `Error setting prompts after adding new: ${chrome.runtime.lastError}`
          );
        }
        showConfirmationMessage("Prompt added successfully!"); // Provide confirmation
        loadAndDisplayPrompts();
        if (addPromptSection) addPromptSection.style.display = "none";
        if (promptsListSection) promptsListSection.style.display = "block";
        if (addPromptForm) addPromptForm.reset();
      });
    });
  }

  // Add event listener for search input - Uses local allPrompts
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const filtered = filterPrompts(event.target.value, allPrompts);
      displayPrompts(filtered);
    });
  }

  // Event delegation for the prompts list section
  if (promptsList) {
    promptsList.addEventListener("click", (event) => {
      const target = event.target;
      const promptId = target.dataset.id;

      if (target.classList.contains("copy-prompt")) {
        copyPrompt(promptId);
      } else if (target.classList.contains("view-details")) {
        viewPromptDetails(promptId);
      }
    });
  }

  // --- Star Rating Event Handling (Mouseover/Mouseout) ---
  // Using event delegation on the promptDetailSection

  if (promptDetailSection) {
    promptDetailSection.addEventListener("mouseover", (event) => {
      const targetStar = event.target.closest(".star"); // Use closest to handle clicks on the i tag inside span
      if (targetStar) {
        const starRatingContainer = targetStar.closest("#star-rating");
        if (starRatingContainer) {
          const value = parseInt(targetStar.dataset.value);
          highlightStars(value, starRatingContainer);
        }
      }
    });

    promptDetailSection.addEventListener("mouseout", (event) => {
      const relatedTarget = event.relatedTarget;
      const starRatingContainer =
        promptDetailSection.querySelector("#star-rating");
      // Check if the mouse is moving out of the star rating container completely
      if (
        starRatingContainer &&
        (!relatedTarget || !starRatingContainer.contains(relatedTarget))
      ) {
        // Reset stars to the current saved rating when mouse leaves the container
        const promptId = starRatingContainer.dataset.id;
        const prompt = findPromptById(promptId);
        if (prompt && prompt.rating) {
          highlightStars(prompt.rating, starRatingContainer);
        } else {
          highlightStars(0, starRatingContainer); // Or clear all if no rating
        }
      }
    });
  }

  // Helper function to highlight stars up to a given value within a specific container
  const highlightStars = (value, container) => {
    const stars = container.querySelectorAll(".star");
    stars.forEach((star) => {
      const starValue = parseInt(star.dataset.value);
      if (starValue <= value) {
        // Use Font Awesome filled star
        star.innerHTML = '<i class="fas fa-star"></i>';
        star.classList.add("filled");
      } else {
        // Use Font Awesome empty star
        star.innerHTML = '<i class="far fa-star"></i>';
        star.classList.remove("filled");
      }
    });
  };
  // --- End Star Rating Event Handling ---

  // Function to copy prompt text
  const copyPrompt = (promptId) => {
    chrome.storage.local.get("prompts", (data) => {
      if (chrome.runtime.lastError) {
        handleError(
          `Error getting prompt for copy: ${chrome.runtime.lastError}`
        );
        return;
      }
      const prompts = data.prompts || [];
      const prompt = prompts.find((p) => p.id === promptId);
      if (prompt && navigator.clipboard) {
        navigator.clipboard
          .writeText(prompt.text)
          .then(() => {
            showConfirmationMessage("Prompt copied!");
          })
          .catch((err) => {
            console.error("Failed to copy prompt: ", err);
          });
      }
    });
  };

  // Function to filter prompts
  const filterPrompts = (searchTerm, prompts) => {
    if (!searchTerm) {
      return prompts;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return prompts.filter(
      (prompt) =>
        prompt.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        prompt.text.toLowerCase().includes(lowerCaseSearchTerm) ||
        prompt.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        prompt.tags.some((tag) =>
          tag.toLowerCase().includes(lowerCaseSearchTerm)
        )
    );
  };

  const viewPromptDetails = (promptId) => {
    const prompt = findPromptById(promptId);
    if (prompt) {
      displayPromptDetails(prompt);
    } else {
      handleError(`Prompt with ID ${promptId} not found.`);
    }
  };

  const showConfirmationMessage = (message) => {
    if (confirmationMessage) {
      confirmationMessage.textContent = message;
      confirmationMessage.style.display = "block";
      setTimeout(() => {
        confirmationMessage.style.display = "none";
      }, 2000);
    }
  };

  // Load prompts when the popup is opened
  const loadAndDisplayPrompts = () => {
    chrome.storage.local.get("prompts", (data) => {
      if (chrome.runtime.lastError) {
        handleError(`Error loading prompts: ${chrome.runtime.lastError}`);
        return;
      }
      allPrompts = data.prompts || [];
      displayPrompts(allPrompts);
    });
  };

  loadAndDisplayPrompts(); // Initial load when popup opens
}); // End of DOMContentLoaded listener

// Temporary test listener outside DOMContentLoaded
document.body.addEventListener("click", function (event) {
  if (event.target.tagName === "I" && event.target.classList.contains("fa")) {
    console.log("Direct click on FA i tag detected!", event.target);
  }
});
