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
  return value.trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getJobTitle(job) {
  return String(
    job.job_title ||
    job.title ||
    job.position_title ||
    job.job_name ||
    ""
  ).trim();
}

function mapFieldName(rawIndustry) {
  const value = normalizeText(rawIndustry);

  if (value.includes("khoa hoc thong tin")) return "Khoa học thông tin";

  if (
    value.includes("cong nghe thong tin") ||
    value.includes("truyen thong") ||
    value.includes("ict")
  ) {
    return "Công nghệ thông tin - truyền thông";
  }

  if (value.includes("quan ly")) return "Quản lý";

  return "";
}

async function loadFieldDataFromJobs() {
  try {
    const response = await fetch("data/jobs.json");
    if (!response.ok) throw new Error("Không thể tải data/jobs.json");

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
      const fieldName = mapFieldName(
        job.industry || job.field || job.job_field || job.linh_vuc || ""
      );

      const title = getJobTitle(job);

      if (!fieldName || !title) return;
      if (seenByField[fieldName].has(title)) return;

      seenByField[fieldName].add(title);
      fieldData[fieldName].push(title);
    });

    Object.keys(fieldData).forEach((field) => {
      fieldData[field].sort((a, b) => a.localeCompare(b, "vi"));
    });

    positionKeywords = Object.values(fieldData).flat();
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
      item => `
        <button type="button" class="suggestion-item">${escapeHtml(item)}</button>
      `
    )
    .join("");

  suggestionBox.classList.remove("d-none");
}

function goToJobsPage(keyword = "") {
  const normalized = keyword.trim();

  if (normalized) {
    window.location.href = `pages/jobs.html?q=${encodeURIComponent(normalized)}`;
  } else {
    window.location.href = "pages/jobs.html";
  }
}

function goToPositionProfilePage(position = "", field = "") {
  const params = new URLSearchParams();

  if (position.trim()) params.set("position", position.trim());
  if (field.trim()) params.set("field", field.trim());

  const query = params.toString();

  window.location.href = query
    ? `pages/position-profile.html?${query}`
    : `pages/position-profile.html`;
}

function setActiveField(fieldName = "") {
  fieldTags.forEach(tag => {
    const isMatched = tag.getAttribute("data-field") === fieldName;
    tag.classList.toggle("is-active", isMatched);
  });
}

function showFieldPreview(fieldName) {
  if (!fieldPreview || !fieldPreviewTitle || !fieldPreviewList) return;

  const positions = fieldData[fieldName] || [];
  fieldPreviewTitle.textContent =
    `Danh sách vị trí việc làm thuộc lĩnh vực: ${fieldName} (${positions.length})`;

  if (!positions.length) {
    fieldPreviewList.innerHTML = `
      <div class="preview-list-item">
        <div class="preview-item-main">
          <i class="bi bi-folder2-open"></i>
          <span>Hiện chưa có dữ liệu vị trí việc làm.</span>
        </div>
      </div>
    `;
  } else {
    fieldPreviewList.innerHTML = positions
      .map(
        (position) => `
          <div class="preview-list-item">
            <div class="preview-item-main">
              <i class="bi bi-file-earmark-text"></i>
              <span class="preview-item-text">${escapeHtml(position)}</span>
            </div>

            <div class="preview-item-actions">
              <button
                type="button"
                class="preview-item-btn preview-open-jobs"
                data-position="${escapeHtml(position)}">
                Xem việc làm
              </button>

              <button
                type="button"
                class="preview-item-btn preview-open-profile"
                data-position="${escapeHtml(position)}"
                data-field="${escapeHtml(fieldName)}">
                Hồ sơ vị trí
              </button>
            </div>
          </div>
        `
      )
      .join("");
  }

  setActiveField(fieldName);
  fieldPreview.classList.remove("d-none");
}

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const value = normalizeKeyword(this.value);

    if (!value) {
      if (suggestionBox) {
        suggestionBox.classList.add("d-none");
        suggestionBox.innerHTML = "";
      }
      return;
    }

    const matched = positionKeywords.filter(item =>
      item.toLowerCase().includes(value)
    );

    renderSuggestions(matched.slice(0, 6));
  });

  searchInput.addEventListener("focus", function () {
    const value = normalizeKeyword(this.value);

    if (!positionKeywords.length) return;

    if (!value) {
      renderSuggestions(positionKeywords.slice(0, 6));
      return;
    }

    const matched = positionKeywords.filter(item =>
      item.toLowerCase().includes(value)
    );

    renderSuggestions(matched.slice(0, 6));
  });

  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      goToJobsPage(searchInput.value);
    }
  });
}

if (suggestionBox) {
  suggestionBox.addEventListener("click", function (e) {
    const item = e.target.closest(".suggestion-item");
    if (!item || !searchInput) return;

    searchInput.value = item.textContent.trim();
    suggestionBox.classList.add("d-none");
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    goToJobsPage(searchInput ? searchInput.value : "");
  });
}

fieldTags.forEach(tag => {
  tag.addEventListener("click", () => {
    const fieldName = tag.getAttribute("data-field") || "";
    showFieldPreview(fieldName);
  });
});

if (fieldPreviewList) {
  fieldPreviewList.addEventListener("click", (e) => {
    const openJobsBtn = e.target.closest(".preview-open-jobs");
    const openProfileBtn = e.target.closest(".preview-open-profile");

    if (openJobsBtn) {
      const position = openJobsBtn.getAttribute("data-position") || "";
      goToJobsPage(position);
      return;
    }

    if (openProfileBtn) {
      const position = openProfileBtn.getAttribute("data-position") || "";
      const field = openProfileBtn.getAttribute("data-field") || "";
      goToPositionProfilePage(position, field);
    }
  });
}

if (closeFieldPreview) {
  closeFieldPreview.addEventListener("click", () => {
    fieldPreview.classList.add("d-none");
    setActiveField("");
  });
}

document.addEventListener("click", function (e) {
  if (!suggestionBox) return;

  if (!e.target.closest(".search-panel")) {
    suggestionBox.classList.add("d-none");
  }
});

loadFieldDataFromJobs();
