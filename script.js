// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const userProfile = document.getElementById("userProfile");
const copyLink = document.getElementById("copyLink");
const toast = document.getElementById("toast");
const tips = document.querySelectorAll(".tip");

// GitHub API URL
const GITHUB_API_URL = "https://api.github.com/users/";

// Special themes for specific users
const specialThemes = {
  ganeshdojo: {
    name: "Cyberpunk",
    colors: {
      "--primary-color": "#8b5cf6",
      "--primary-hover": "#7c3aed",
      "--text-color": "#ffffff",
      "--text-light": "#60a5fa",
      "--bg-color": "#0a0a0f",
      "--card-bg": "rgba(139, 92, 246, 0.15)",
      "--glass-bg": "rgba(96, 165, 250, 0.08)",
      "--glass-border": "rgba(139, 92, 246, 0.25)",
      "--error-color": "#ef4444",
      "--success-color": "#8b5cf6",
      "--link-color": "#60a5fa",
      "--gradient-1": "linear-gradient(45deg, #8b5cf6, #60a5fa, #3b82f6)",
      "--gradient-2": "linear-gradient(45deg, #60a5fa, #8b5cf6, #7c3aed)",
    },
    message: "🤖 Cyberpunk theme activated! Welcome to the digital future!",
  },
  fahimaanjum6: {
    name: "Sunshine",
    colors: {
      "--primary-color": "#FFC107",
      "--primary-hover": "#FFA000",
      "--text-color": "#ffffff",
      "--text-light": "#FFE082",
      "--bg-color": "#0a0a0f",
      "--card-bg": "rgba(255, 193, 7, 0.1)",
      "--glass-bg": "rgba(255, 224, 130, 0.05)",
      "--glass-border": "rgba(255, 193, 7, 0.2)",
      "--error-color": "#f44336",
      "--success-color": "#FFD54F",
      "--link-color": "#FFE082",
      "--gradient-1": "linear-gradient(45deg, #FFC107, #FFD54F)",
      "--gradient-2": "linear-gradient(45deg, #FFD54F, #FFC107)",
    },
    message: "☀️ Sunshine theme activated! Welcome to the golden hour!",
  },
};

// --- Search Suggestions ---
const suggestionsContainer = document.createElement("div");
suggestionsContainer.className = "search-suggestions glass hidden";
searchInput.parentElement.appendChild(suggestionsContainer);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const handleSearchSuggestions = debounce(async (query) => {
  if (query.length < 2) {
    suggestionsContainer.classList.add("hidden");
    return;
  }
  try {
    const response = await fetch(
      `https://api.github.com/search/users?q=${query}&per_page=5`
    );
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      suggestionsContainer.innerHTML = data.items
        .map(
          (user) => `
          <div class="suggestion-item" data-username="${user.login}">
            <img src="${user.avatar_url}" alt="${user.login}" class="suggestion-avatar">
            <span>${user.login}</span>
          </div>
        `
        )
        .join("");
      suggestionsContainer.classList.remove("hidden");
    } else {
      suggestionsContainer.classList.add("hidden");
    }
  } catch (error) {
    suggestionsContainer.classList.add("hidden");
  }
}, 300);

searchInput.addEventListener("input", (e) => {
  handleSearchSuggestions(e.target.value);
});

suggestionsContainer.addEventListener("click", (e) => {
  const suggestionItem = e.target.closest(".suggestion-item");
  if (suggestionItem) {
    const username = suggestionItem.dataset.username;
    searchInput.value = username;
    suggestionsContainer.classList.add("hidden");
    handleSearch();
  }
});
document.addEventListener("click", (e) => {
  if (
    !searchInput.contains(e.target) &&
    !suggestionsContainer.contains(e.target)
  ) {
    suggestionsContainer.classList.add("hidden");
  }
});

// --- Repository Pagination & Top Languages ---
let currentPage = 1;
const reposPerPage = 6;
let allRepos = [];
let totalPages = 1;

// Event Listeners
searchBtn.addEventListener("click", handleSearch);
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    handleSearch();
  }
});
searchInput.addEventListener("input", () => {
  clearBtn.classList.toggle("hidden", !searchInput.value);
});
clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearBtn.classList.add("hidden");
  searchInput.focus();
});
copyLink.addEventListener("click", copyProfileUrl);
tips.forEach((tip) => {
  tip.addEventListener("click", () => {
    searchInput.value = tip.textContent;
    clearBtn.classList.remove("hidden");
    handleSearch();
  });
});

// Handle search
async function handleSearch() {
  const username = searchInput.value.trim();
  if (!username) {
    showError("Please enter a username");
    return;
  }
  try {
    showLoading();
    const userData = await fetchUserData(username);
    await fetchAndDisplayReposAndLanguages(username, userData);
  } catch (err) {
    showError("User not found");
  } finally {
    hideLoading();
  }
}
window.handleSearch = handleSearch;

// Fetch user data from GitHub API
async function fetchUserData(username) {
  const response = await fetch(`${GITHUB_API_URL}${username}`);
  if (!response.ok) throw new Error("User not found");
  return await response.json();
}

// Fetch repos and languages, then update UI
async function fetchAndDisplayReposAndLanguages(username, userData) {
  // Fetch all repos
  const reposResponse = await fetch(
    `${GITHUB_API_URL}${username}/repos?sort=updated&per_page=100`
  );
  allRepos = await reposResponse.json();
  totalPages = Math.ceil(allRepos.length / reposPerPage);
  currentPage = 1;
  // Fetch languages for first page
  const initialRepos = allRepos.slice(0, reposPerPage);
  const languagesPromises = initialRepos.map((repo) =>
    fetch(
      `https://api.github.com/repos/${username}/${repo.name}/languages`
    ).then((res) => res.json())
  );
  const languagesData = await Promise.all(languagesPromises);
  const languageStats = calculateLanguageStats(languagesData);
  displayUserData(userData, initialRepos, languageStats);
  updatePagination();
}

// Calculate top languages
function calculateLanguageStats(languagesData) {
  const totalBytes = {};
  let grandTotal = 0;
  languagesData.forEach((repoLangs) => {
    Object.entries(repoLangs).forEach(([lang, bytes]) => {
      totalBytes[lang] = (totalBytes[lang] || 0) + bytes;
      grandTotal += bytes;
    });
  });
  return Object.entries(totalBytes)
    .map(([lang, bytes]) => ({
      language: lang,
      bytes,
      percentage: (bytes / grandTotal) * 100,
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 5);
}

// Pagination controls
function updatePagination() {
  let paginationContainer = document.querySelector(".pagination-container");
  if (!paginationContainer) {
    paginationContainer = document.createElement("div");
    paginationContainer.className = "pagination-container";
    userProfile.appendChild(paginationContainer);
  }
  paginationContainer.innerHTML = `
    <div class="pagination">
      <button class="pagination-btn" ${
        currentPage === 1 ? "disabled" : ""
      } onclick="changePage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="page-info">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-btn" ${
        currentPage === totalPages ? "disabled" : ""
      } onclick="changePage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
  `;
}
window.changePage = function (page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  const startIndex = (page - 1) * reposPerPage;
  const endIndex = startIndex + reposPerPage;
  const pageRepos = allRepos.slice(startIndex, endIndex);
  // Animate out
  const repoGrid = document.querySelector(".repos-grid");
  repoGrid.style.opacity = "0.5";
  setTimeout(async () => {
    // Fetch languages for this page
    const username = document
      .getElementById("username")
      .textContent.replace(/^@/, "");
    const languagesPromises = pageRepos.map((repo) =>
      fetch(
        `https://api.github.com/repos/${username}/${repo.name}/languages`
      ).then((res) => res.json())
    );
    const languagesData = await Promise.all(languagesPromises);
    const languageStats = calculateLanguageStats(languagesData);
    displayUserData(null, pageRepos, languageStats);
    updatePagination();
    repoGrid.style.opacity = "1";
  }, 200);
};

// Display user data in the UI (with repos and languages)
function displayUserData(user, repos, languageStats) {
  if (user) {
    // Hide error if visible
    error.classList.add("hidden");
    // Check for special theme
    const specialTheme = specialThemes[user.login.toLowerCase()];
    if (specialTheme) {
      applyTheme(specialTheme);
      showToast(specialTheme.message);
    } else {
      // Reset to default theme
      const root = document.documentElement;
      Object.keys(specialThemes["ganeshdojo"].colors).forEach((property) => {
        root.style.removeProperty(property);
      });
    }
    // Update profile image
    document.getElementById("avatar").src = user.avatar_url;
    // Update user info
    document.getElementById("name").textContent = user.name || user.login;
    document.getElementById("username").textContent = `@${user.login}`;
    document.getElementById("bio").textContent = user.bio || "No bio available";
    // Update stats
    document.getElementById("followers").textContent = formatNumber(
      user.followers
    );
    document.getElementById("following").textContent = formatNumber(
      user.following
    );
    document.getElementById("repos").textContent = formatNumber(
      user.public_repos
    );
    // Update details
    updateDetail("location", user.location);
    updateDetail("website", user.blog, true);
    updateDetail(
      "twitter",
      user.twitter_username,
      true,
      "https://twitter.com/"
    );
    // Update GitHub link
    const githubLink = document.getElementById("githubLink");
    githubLink.href = user.html_url;
    // Show profile
    userProfile.classList.remove("hidden");
    // Scroll to profile
    userProfile.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Add/Update repo grid
  let repoGrid = document.querySelector(".repos-grid");
  if (repoGrid && repos) {
    repoGrid.innerHTML = repos
      .map(
        (repo, index) => `
          <div class="repo-card" style="animation-delay: ${index * 100}ms">
            <div class="repo-header">
              <a href="${repo.html_url}" target="_blank" class="repo-name">${
          repo.name
        }</a>
              <div class="repo-stats">
                <span class="repo-stat"><i class="fas fa-star"></i> ${
                  repo.stargazers_count
                }</span>
                <span class="repo-stat"><i class="fas fa-code-branch"></i> ${
                  repo.forks_count
                }</span>
              </div>
            </div>
            <p class="repo-description">${
              repo.description || "No description available"
            }</p>
            ${
              repo.language
                ? `<div class="repo-language"><span class="language-dot"></span>${repo.language}</div>`
                : ""
            }
          </div>
        `
      )
      .join("");
  }
  // Top languages
  let langContainer = document.querySelector(".languages-container");
  if (langContainer && languageStats) {
    langContainer.innerHTML = languageStats
      .map(
        (lang) => `
          <div class="language-bar">
            <span class="language-name">${lang.language}</span>
            <div class="language-bar-container">
              <div class="language-bar-fill" style="width: ${
                lang.percentage
              }%;"></div>
            </div>
            <span class="language-percentage">${lang.percentage.toFixed(
              1
            )}%</span>
          </div>
        `
      )
      .join("");
  }
}

// Apply theme to the document
function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.colors).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}

// Update detail element
function updateDetail(id, value, isLink = false, prefix = "") {
  const element = document.getElementById(id);
  const span = element.querySelector(isLink ? "a" : "span");
  if (value) {
    if (isLink) {
      span.href = prefix + value;
      span.textContent = value;
    } else {
      span.textContent = value;
    }
    element.classList.remove("hidden");
  } else {
    element.classList.add("hidden");
  }
}

// Show loading spinner
function showLoading() {
  loading.classList.remove("hidden");
  userProfile.classList.add("hidden");
  error.classList.add("hidden");
}

// Hide loading spinner
function hideLoading() {
  loading.classList.add("hidden");
}

// Show error message
function showError(message) {
  error.querySelector("p").textContent = message;
  error.classList.remove("hidden");
  userProfile.classList.add("hidden");
}

// Copy profile URL to clipboard
async function copyProfileUrl() {
  const url = document.getElementById("githubLink").href;
  try {
    await navigator.clipboard.writeText(url);
    showToast("Profile URL copied to clipboard!");
  } catch (err) {
    showToast("Failed to copy URL", true);
  }
}

// Show toast notification
function showToast(message, isError = false) {
  toast.innerHTML = `
    <i class="fas fa-${isError ? "exclamation-circle" : "check-circle"}"></i>
    <span>${message}</span>
  `;
  toast.style.background = isError
    ? "var(--error-color)"
    : "var(--success-color)";
  toast.classList.remove("hidden");
  // Reset animation
  toast.style.animation = "none";
  toast.offsetHeight; // Trigger reflow
  toast.style.animation = "slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards";
  // Hide toast after animation
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// Format numbers (e.g., 1000 -> 1k)
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "k";
  }
  return num.toString();
}
