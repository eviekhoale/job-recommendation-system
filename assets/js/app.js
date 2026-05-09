const searchInput = document.getElementById("searchInput");
const suggestionBox = document.getElementById("searchSuggestions");
const searchBtn =
  document.getElementById("searchBtn") || document.querySelector(".search-btn");

const fieldTags = document.querySelectorAll(".field-tag");
const fieldPreview = document.getElementById("fieldPreview");
const fieldPreviewTitle = document.getElementById("fieldPreviewTitle");
const fieldPreviewList = document.getElementById("fieldPreviewList");
const closeFieldPreview = document.getElementById("closeFieldPreview");

let positionKeywords = [];

const fieldData = {
  "Khoa học thông tin": [],
  "Công nghệ thông tin - truyền thông": [],
  "Quản lý": []
};

function normalizeKeyword(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text || "");
  return div.innerHTML;
}

function getFirstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
}

function getJobId(job) {
  return String(
    getFirstValue(job, ["job_id", "id", "job_code", "Mã tin"], "")
  ).trim();
}

function getJobTitle(job) {
  return String(
    getFirstValue(
      job,
      ["job_title", "title", "position_title", "job_name", "Tiêu đề việc làm"],
      ""
    )
  ).trim();
}

function getJobRawField(job) {
  return String(
    getFirstValue(
      job,
      ["industry", "field", "job_field", "linh_vuc", "Lĩnh vực (theo khoa)"],
      ""
    )
  ).trim();
}

function mapFieldName(rawIndustry) {
  const value = normalizeText(rawIndustry);

  if (
    value.includes("khoa hoc thong tin") ||
    value.includes("information science")
  ) {
    return "Khoa học thông tin";
  }

  if (
    value.includes("cong nghe thong tin") ||
    value.includes("truyen thong") ||
    value.includes("ict") ||
    value.includes("information technology") ||
    value.includes("communication technology")
  ) {
    return "Công nghệ thông tin - truyền thông";
  }

  if (
    value.includes("quan ly") ||
    value.includes("management")
  ) {
    return "Quản lý";
  }

  return "";
}

function getUniqueTitlesFromJobs(jobs) {
  const seen = new Set();
  const titles = [];

  jobs.forEach((job) => {
    const title = String(job.title || "").trim();
    if (!title) return;

    const key = normalizeText(title);
    if (seen.has(key)) return;

    seen.add(key);
    titles.push(title);
  });

  return titles.sort((a, b) => a.localeCompare(b, "vi"));
}

async function loadFieldDataFromJobs() {
  try {
    const response = await fetch("data/jobs.json");

    if (!response.ok) {
      throw new Error("Không thể tải data/jobs.json");
    }

    const data = await response.json();
    const jobs = Array.isArray(data) ? data : (data.jobs || []);

    fieldData["Khoa học thông tin"] = [];
    fieldData["Công nghệ thông tin - truyền thông"] = [];
    fieldData["Quản lý"] = [];
    positionKeywords = [];

    const seenByField = {
      "Khoa học thông tin": new Set(),
      "Công nghệ thông tin - truyền thông": new Set(),
      "Quản lý": new Set()
    };

    jobs.forEach((job) => {
      const fieldName = mapFieldName(getJobRawField(job));
      const jobId = getJobId(job);
      const title = getJobTitle(job);

      if (!fieldName || !jobId || !title) return;

      const uniqueKey = `${jobId}|${normalizeText(title)}`;

      if (seenByField[fieldName].has(uniqueKey)) return;

      seenByField[fieldName].add(uniqueKey);

      fieldData[fieldName].push({
        job_id: jobId,
        title
      });
    });

    Object.keys(fieldData).forEach((field) => {
      fieldData[field].sort((a, b) =>
        a.title.localeCompare(b.title, "vi")
      );
    });

    positionKeywords = getUniqueTitlesFromJobs(
      Object.values(fieldData).flat()
    );
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu vị trí theo lĩnh vực:", error);
  }
}

function renderSuggestions(items) {
  if (!suggestionBox) return;

  if (!items.length) {
    suggestionBox.classList.add("d-none");
    suggestionBox.innerHTML = "";
    return;
  }

  suggestionBox.innerHTML = items
    .map(
      (item) => `
        <button type="button" class="suggestion-item">
          ${escapeHtml(item)}
        </button>
      `
    )
    .join("");

  suggestionBox.classList.remove("d-none");
}

function hideSuggestions() {
  if (!suggestionBox) return;

  suggestionBox.classList.add("d-none");
  suggestionBox.innerHTML = "";
}

function goToJobsPage(keyword = "") {
  const normalized = String(keyword || "").trim();

  if (normalized) {
    window.location.href = `pages/jobs.html?q=${encodeURIComponent(normalized)}`;
  } else {
    window.location.href = "pages/jobs.html";
  }
}

function goToJobDetailPage(jobId = "") {
  const normalizedJobId = String(jobId || "").trim();

  if (!normalizedJobId) return;

  window.location.href =
    `pages/job-detail.html?type=job&id=${encodeURIComponent(normalizedJobId)}`;
}

function setActiveField(fieldName = "") {
  fieldTags.forEach((tag) => {
    const isMatched = tag.getAttribute("data-field") === fieldName;
    tag.classList.toggle("is-active", isMatched);
  });
}

function closeFieldModal() {
  if (!fieldPreview) return;

  fieldPreview.classList.add("d-none");
  document.body.classList.remove("field-modal-open");
  setActiveField("");
}

function showFieldPreview(fieldName) {
  if (!fieldPreview || !fieldPreviewTitle || !fieldPreviewList) return;

  const jobs = fieldData[fieldName] || [];

  fieldPreviewTitle.textContent =
    `Việc làm thuộc lĩnh vực: ${fieldName} (${jobs.length})`;

  if (!jobs.length) {
    fieldPreviewList.innerHTML = `
      <div class="preview-list-item">
        <div class="preview-item-main">
          <i class="bi bi-folder2-open"></i>
          <span class="preview-item-text">Hiện chưa có dữ liệu vị trí việc làm.</span>
        </div>
      </div>
    `;
  } else {
    fieldPreviewList.innerHTML = jobs
      .map(
        (job) => `
          <div class="preview-list-item">
            <div class="preview-item-main">
              <i class="bi bi-file-earmark-text"></i>
              <span class="preview-item-text" title="${escapeHtml(job.title)}">
                ${escapeHtml(job.title)}
              </span>
            </div>

            <div class="preview-item-actions">
              <button
                type="button"
                class="preview-item-btn preview-open-detail"
                data-job-id="${escapeHtml(job.job_id)}">
                Xem chi tiết
              </button>
            </div>
          </div>
        `
      )
      .join("");
  }

  setActiveField(fieldName);
  document.body.classList.add("field-modal-open");
  fieldPreview.classList.remove("d-none");
}

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const value = normalizeKeyword(this.value);

    if (!value) {
      hideSuggestions();
      return;
    }

    const normalizedValue = normalizeText(value);

    const matched = positionKeywords.filter((item) =>
      normalizeText(item).includes(normalizedValue)
    );

    renderSuggestions(matched.slice(0, 8));
  });

  searchInput.addEventListener("focus", function () {
    const value = normalizeKeyword(this.value);

    if (!positionKeywords.length) return;

    if (!value) {
      renderSuggestions(positionKeywords.slice(0, 8));
      return;
    }

    const normalizedValue = normalizeText(value);

    const matched = positionKeywords.filter((item) =>
      normalizeText(item).includes(normalizedValue)
    );

    renderSuggestions(matched.slice(0, 8));
  });

  searchInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      goToJobsPage(searchInput.value);
    }
  });
}

if (suggestionBox) {
  suggestionBox.addEventListener("click", function (event) {
    const item = event.target.closest(".suggestion-item");

    if (!item || !searchInput) return;

    searchInput.value = item.textContent.trim();
    hideSuggestions();
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    goToJobsPage(searchInput ? searchInput.value : "");
  });
}

fieldTags.forEach((tag) => {
  tag.addEventListener("click", () => {
    const fieldName = tag.getAttribute("data-field") || "";
    showFieldPreview(fieldName);
  });
});

if (fieldPreviewList) {
  fieldPreviewList.addEventListener("click", (event) => {
    const detailBtn = event.target.closest(".preview-open-detail");

    if (!detailBtn) return;

    const jobId = detailBtn.getAttribute("data-job-id") || "";
    goToJobDetailPage(jobId);
  });
}

if (closeFieldPreview) {
  closeFieldPreview.addEventListener("click", closeFieldModal);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFieldModal();
    hideSuggestions();
  }
});

document.addEventListener("click", function (event) {
  if (
    suggestionBox &&
    !event.target.closest(".search-panel")
  ) {
    hideSuggestions();
  }

  if (
    document.body.classList.contains("field-modal-open") &&
    fieldPreview &&
    !event.target.closest("#fieldPreview") &&
    !event.target.closest(".field-tag")
  ) {
    closeFieldModal();
  }
});

loadFieldDataFromJobs();
