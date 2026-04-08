const jobListEl = document.getElementById("jobList");
const resultCountEl = document.getElementById("resultCount");
const emptyStateEl = document.getElementById("emptyState");
const searchInputEl = document.getElementById("jobSearchInput");
const searchBtnEl = document.getElementById("jobSearchBtn");
const suggestionBoxEl = document.getElementById("searchSuggestions");

let allJobs = [];
let currentKeyword = "";

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getFirstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return obj[key];
    }
  }
  return fallback;
}

function getJobTitle(job) {
  return getFirstValue(job, ["job_title", "title", "position_title", "job_name"], "Chưa có tên vị trí");
}

function getJobField(job) {
  return getFirstValue(job, ["industry", "field", "job_field", "linh_vuc"], "Chưa có lĩnh vực");
}

function getJobSource(job) {
  return getFirstValue(job, ["source", "source_name"], "Chưa có nguồn");
}

function getJobId(job) {
  return getFirstValue(job, ["job_id", "id", "job_code"], "");
}

async function loadJobs() {
  try {
    const response = await fetch("../data/jobs.json");
    if (!response.ok) throw new Error("Không thể tải jobs.json");

    const data = await response.json();
    allJobs = Array.isArray(data) ? data : (data.jobs || []);

    currentKeyword = getQueryParam("q").trim();
    searchInputEl.value = currentKeyword;

    renderJobs();
  } catch (error) {
    console.error(error);
    resultCountEl.textContent = "Không thể tải dữ liệu việc làm.";
    emptyStateEl.style.display = "block";
    emptyStateEl.innerHTML = `<p>Không thể đọc dữ liệu từ jobs.json.</p>`;
  }
}

function filterJobsByKeyword(keyword) {
  const normalizedKeyword = normalizeText(keyword);

  if (!normalizedKeyword) return allJobs;

  return allJobs.filter((job) => {
    const title = normalizeText(getJobTitle(job));
    return title.includes(normalizedKeyword);
  });
}

function renderJobs() {
  const filteredJobs = filterJobsByKeyword(currentKeyword);
  jobListEl.innerHTML = "";

  if (filteredJobs.length === 0) {
    resultCountEl.textContent = "Không tìm thấy dữ liệu tương ứng.";
    emptyStateEl.style.display = "block";
    return;
  }

  emptyStateEl.style.display = "none";

  if (!currentKeyword) {
    resultCountEl.textContent = `Hiển thị toàn bộ ${filteredJobs.length} tin tuyển dụng.`;
  } else {
    resultCountEl.textContent = `Có ${filteredJobs.length} kết quả phù hợp với từ khóa "${currentKeyword}".`;
  }

  filteredJobs.forEach((job) => {
    const jobId = getJobId(job);
    const title = getJobTitle(job);
    const field = getJobField(job);
    const source = getJobSource(job);

    const item = document.createElement("article");
    item.className = "jobs-result-item";

    item.innerHTML = `
      <div class="jobs-result-info">
        <h3 class="jobs-item-title">${title}</h3>
        <p class="jobs-item-meta"><strong>Lĩnh vực:</strong> ${field}</p>
        <p class="jobs-item-meta"><strong>Nguồn tin:</strong> ${source}</p>
      </div>

      <div class="jobs-result-action">
        <a class="jobs-detail-btn" href="job-detail.html?type=job&id=${encodeURIComponent(jobId)}">
          Chi tiết
        </a>
      </div>
    `;

    jobListEl.appendChild(item);
  });
}

function updateUrlAndRender() {
  currentKeyword = searchInputEl.value.trim();

  const newUrl = currentKeyword
    ? `jobs.html?q=${encodeURIComponent(currentKeyword)}`
    : `jobs.html`;

  window.history.replaceState({}, "", newUrl);
  hideSuggestions();
  renderJobs();
}

function getSuggestions(keyword) {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return [];

  const seen = new Set();

  return allJobs
    .filter((job) => {
      const title = normalizeText(getJobTitle(job));
      return title.includes(normalizedKeyword);
    })
    .filter((job) => {
      const title = getJobTitle(job);
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    })
    .slice(0, 6);
}

function renderSuggestions() {
  const keyword = searchInputEl.value.trim();
  const suggestions = getSuggestions(keyword);

  if (!keyword || suggestions.length === 0) {
    hideSuggestions();
    return;
  }

  suggestionBoxEl.innerHTML = "";

  suggestions.forEach((job) => {
    const title = getJobTitle(job);
    const field = getJobField(job);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.innerHTML = `
      <div style="font-weight:700; color:#20324f;">${title}</div>
      <div style="font-size:0.88rem; color:#6a7fa5; margin-top:4px;">${field}</div>
    `;

    button.addEventListener("click", () => {
      searchInputEl.value = title;
      updateUrlAndRender();
    });

    suggestionBoxEl.appendChild(button);
  });

  suggestionBoxEl.style.display = "block";
}

function hideSuggestions() {
  suggestionBoxEl.style.display = "none";
  suggestionBoxEl.innerHTML = "";
}

searchBtnEl.addEventListener("click", () => {
  updateUrlAndRender();
});

searchInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    updateUrlAndRender();
  }
});

searchInputEl.addEventListener("input", () => {
  renderSuggestions();
});

searchInputEl.addEventListener("focus", () => {
  renderSuggestions();
});

document.addEventListener("click", (event) => {
  const searchPanel = document.querySelector(".jobs-search-panel");
  if (!searchPanel.contains(event.target)) {
    hideSuggestions();
  }
});

loadJobs();
