const jobListEl = document.getElementById("jobList");
const resultCountEl = document.getElementById("resultCount");
const emptyStateEl = document.getElementById("emptyState");
const searchInputEl = document.getElementById("jobSearchInput");
const searchBtnEl = document.getElementById("jobSearchBtn");

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
    emptyStateEl.innerHTML = `
      <h3>Lỗi tải dữ liệu</h3>
      <p>Không thể đọc dữ liệu từ jobs.json.</p>
    `;
  }
}

function filterJobs() {
  const keyword = normalizeText(currentKeyword);

  return allJobs.filter((job) => {
    const title = normalizeText(getFirstValue(job, ["job_title", "title", "position_title", "job_name"]));
    const field = normalizeText(getFirstValue(job, ["industry", "field", "job_field", "linh_vuc"]));
    const company = normalizeText(getFirstValue(job, ["company_name", "company", "employer_name"]));
    const source = normalizeText(getFirstValue(job, ["source", "source_name"]));

    return (
      !keyword ||
      title.includes(keyword) ||
      field.includes(keyword) ||
      company.includes(keyword) ||
      source.includes(keyword)
    );
  });
}

function renderJobs() {
  const filteredJobs = filterJobs();
  jobListEl.innerHTML = "";

  if (filteredJobs.length === 0) {
    resultCountEl.textContent = "Có 0 kết quả phù hợp.";
    emptyStateEl.style.display = "block";
    return;
  }

  emptyStateEl.style.display = "none";
  resultCountEl.textContent = `Có ${filteredJobs.length} kết quả phù hợp.`;

  filteredJobs.forEach((job) => {
    const jobId = getFirstValue(job, ["job_id", "id", "job_code"], "");
    const title = getFirstValue(job, ["job_title", "title", "position_title", "job_name"], "Chưa có tên vị trí");
    const field = getFirstValue(job, ["industry", "field", "job_field", "linh_vuc"], "Chưa có lĩnh vực");
    const company = getFirstValue(job, ["company_name", "company", "employer_name"], "Chưa có công ty");
    const source = getFirstValue(job, ["source", "source_name"], "Chưa có nguồn");

    const card = document.createElement("article");
    card.className = "job-card";

    card.innerHTML = `
      <div class="job-card-top">
        <span class="job-chip">${field}</span>
        <span class="job-chip soft">${source}</span>
      </div>

      <h3 class="job-card-title">${title}</h3>
      <p class="job-card-company"><strong>Công ty:</strong> ${company}</p>

      <div class="job-card-actions">
        <a class="job-detail-btn" href="detail.html?type=job&id=${encodeURIComponent(jobId)}">
          Xem chi tiết
        </a>
      </div>
    `;

    jobListEl.appendChild(card);
  });
}

function handleSearch() {
  currentKeyword = searchInputEl.value.trim();
  renderJobs();
}

searchBtnEl.addEventListener("click", handleSearch);

searchInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

loadJobs();
