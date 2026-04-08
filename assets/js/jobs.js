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
    emptyStateEl.innerHTML = `<p>Không thể đọc dữ liệu từ jobs.json.</p>`;
  }
}

function filterJobs() {
  const keyword = normalizeText(currentKeyword);

  // Nếu vào từ menu "Việc làm" mà không có từ khóa -> hiện toàn bộ danh sách
  if (!keyword) return allJobs;

  // Chỉ tìm theo tên vị trí tuyển dụng
  return allJobs.filter((job) => {
    const title = normalizeText(
      getFirstValue(job, ["job_title", "title", "position_title", "job_name"])
    );
    return title.includes(keyword);
  });
}

function renderJobs() {
  const filteredJobs = filterJobs();
  jobListEl.innerHTML = "";

  if (filteredJobs.length === 0) {
    resultCountEl.textContent = "Không tìm thấy dữ liệu tương ứng.";
    emptyStateEl.style.display = "block";
    return;
  }

  emptyStateEl.style.display = "none";
  resultCountEl.textContent = `Có ${filteredJobs.length} kết quả phù hợp.`;

  filteredJobs.forEach((job) => {
    const jobId = getFirstValue(job, ["job_id", "id", "job_code"], "");
    const title = getFirstValue(
      job,
      ["job_title", "title", "position_title", "job_name"],
      "Chưa có tên vị trí"
    );
    const field = getFirstValue(
      job,
      ["industry", "field", "job_field", "linh_vuc"],
      "Chưa có lĩnh vực"
    );
    const source = getFirstValue(
      job,
      ["source", "source_name"],
      "Chưa có nguồn"
    );

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

function handleSearch() {
  currentKeyword = searchInputEl.value.trim();

  const newUrl = currentKeyword
    ? `jobs.html?q=${encodeURIComponent(currentKeyword)}`
    : `jobs.html`;

  window.history.replaceState({}, "", newUrl);
  renderJobs();
}

searchBtnEl.addEventListener("click", handleSearch);

searchInputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

loadJobs();
