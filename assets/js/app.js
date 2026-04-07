const searchInput = document.getElementById("searchInput");
const suggestionBox = document.getElementById("searchSuggestions");
const searchBtn = document.getElementById("searchBtn");

const fieldTags = document.querySelectorAll(".field-tag");
const fieldPreview = document.getElementById("fieldPreview");
const fieldPreviewTitle = document.getElementById("fieldPreviewTitle");
const fieldPreviewList = document.getElementById("fieldPreviewList");
const closeFieldPreview = document.getElementById("closeFieldPreview");

const positionCatalog = [
  {
    title: "Chuyên viên Quản lý thông tin",
    field: "Khoa học thông tin",
    description: "Quản lý, tổ chức và khai thác nguồn tin phục vụ hoạt động học tập và công việc."
  },
  {
    title: "Nhân viên lưu trữ",
    field: "Khoa học thông tin",
    description: "Thực hiện sắp xếp, bảo quản và khai thác hồ sơ, tài liệu lưu trữ."
  },
  {
    title: "Nhân viên văn thư lưu trữ",
    field: "Khoa học thông tin",
    description: "Phụ trách văn bản, hồ sơ và quy trình lưu trữ trong cơ quan, tổ chức."
  },
  {
    title: "Nhân viên thông tin",
    field: "Khoa học thông tin",
    description: "Hỗ trợ xử lý, cung cấp và quản trị thông tin trong môi trường làm việc."
  },
  {
    title: "Chuyên viên dữ liệu",
    field: "Công nghệ thông tin - truyền thông",
    description: "Thu thập, xử lý và quản lý dữ liệu phục vụ phân tích và ra quyết định."
  },
  {
    title: "Phân tích dữ liệu",
    field: "Công nghệ thông tin - truyền thông",
    description: "Phân tích dữ liệu nhằm rút ra insight và hỗ trợ giải quyết bài toán thực tiễn."
  },
  {
    title: "Quản trị cơ sở dữ liệu",
    field: "Công nghệ thông tin - truyền thông",
    description: "Thiết kế, vận hành và duy trì hệ thống cơ sở dữ liệu trong tổ chức."
  },
  {
    title: "Quản lý hồ sơ",
    field: "Quản lý",
    description: "Theo dõi, tổ chức và kiểm soát hồ sơ, tài liệu trong quy trình nghiệp vụ."
  },
  {
    title: "Chuyên viên hành chính",
    field: "Quản lý",
    description: "Hỗ trợ điều phối công việc hành chính, giấy tờ và quy trình nội bộ."
  },
  {
    title: "Nhân viên hành chính văn phòng",
    field: "Quản lý",
    description: "Thực hiện các công việc văn phòng, tổng hợp hồ sơ và hỗ trợ vận hành."
  }
];

const fieldDescriptions = {
  "Khoa học thông tin":
    "Các vị trí thiên về tổ chức, lưu trữ, quản lý và cung cấp thông tin.",
  "Công nghệ thông tin - truyền thông":
    "Các vị trí liên quan đến dữ liệu, hệ thống thông tin và công nghệ xử lý thông tin.",
  "Quản lý":
    "Các vị trí thiên về điều phối, quản trị hồ sơ, hành chính và vận hành công việc."
};

function normalizeKeyword(value) {
  return value.trim().toLowerCase();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function goToJobsPage({ keyword = "", field = "" } = {}) {
  const url = new URL("pages/jobs.html", window.location.href);

  if (keyword.trim()) {
    url.searchParams.set("keyword", keyword.trim());
  }

  if (field.trim()) {
    url.searchParams.set("field", field.trim());
  }

  window.location.href = url.toString();
}

function getSuggestions(keyword = "") {
  const normalized = normalizeKeyword(keyword);

  if (!normalized) {
    return positionCatalog.slice(0, 6);
  }

  return positionCatalog
    .filter(item => {
      return (
        normalizeKeyword(item.title).includes(normalized) ||
        normalizeKeyword(item.field).includes(normalized)
      );
    })
    .slice(0, 6);
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
        <button type="button" class="suggestion-item" data-keyword="${escapeHtml(item.title)}">
          <span class="suggestion-title">${escapeHtml(item.title)}</span>
          <span class="suggestion-subtitle">${escapeHtml(item.field)}</span>
        </button>
      `
    )
    .join("");

  suggestionBox.classList.remove("d-none");
}

function setActiveField(fieldName = "") {
  fieldTags.forEach(tag => {
    const matched = tag.getAttribute("data-field") === fieldName;
    tag.classList.toggle("is-active", matched);
  });
}

function showFieldPreview(fieldName) {
  if (!fieldPreview || !fieldPreviewTitle || !fieldPreviewList) return;

  const positions = positionCatalog.filter(item => item.field === fieldName);

  fieldPreviewTitle.textContent = fieldName;
  setActiveField(fieldName);

  if (!positions.length) {
    fieldPreviewList.innerHTML = `
      <article class="preview-position-card">
        <div>
          <h6>Không có dữ liệu</h6>
          <p>Hiện chưa có vị trí việc làm nào được gán cho lĩnh vực này.</p>
        </div>
      </article>
    `;
  } else {
    fieldPreviewList.innerHTML = positions
      .map(
        item => `
          <article class="preview-position-card">
            <div>
              <h6>${escapeHtml(item.title)}</h6>
              <p>${escapeHtml(item.description)}</p>
            </div>

            <div class="preview-position-footer">
              <span class="preview-position-badge">${escapeHtml(fieldName)}</span>
              <button
                type="button"
                class="btn-preview-link"
                data-keyword="${escapeHtml(item.title)}"
                data-field="${escapeHtml(fieldName)}"
              >
                Xem việc làm
              </button>
            </div>
          </article>
        `
      )
      .join("");
  }

  fieldPreview.classList.remove("d-none");
  fieldPreview.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderSuggestions(getSuggestions(searchInput.value));
  });

  searchInput.addEventListener("focus", () => {
    renderSuggestions(getSuggestions(searchInput.value));
  });

  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToJobsPage({ keyword: searchInput.value });
    }
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    goToJobsPage({ keyword: searchInput ? searchInput.value : "" });
  });
}

if (suggestionBox) {
  suggestionBox.addEventListener("click", e => {
    const item = e.target.closest(".suggestion-item");
    if (!item || !searchInput) return;

    const keyword = item.getAttribute("data-keyword") || "";
    searchInput.value = keyword;
    suggestionBox.classList.add("d-none");
    goToJobsPage({ keyword });
  });
}

fieldTags.forEach(tag => {
  tag.addEventListener("click", () => {
    const fieldName = tag.getAttribute("data-field") || "";
    showFieldPreview(fieldName);
  });
});

if (fieldPreviewList) {
  fieldPreviewList.addEventListener("click", e => {
    const button = e.target.closest(".btn-preview-link");
    if (!button) return;

    const keyword = button.getAttribute("data-keyword") || "";
    const field = button.getAttribute("data-field") || "";
    goToJobsPage({ keyword, field });
  });
}

if (closeFieldPreview) {
  closeFieldPreview.addEventListener("click", () => {
    fieldPreview.classList.add("d-none");
    setActiveField("");
  });
}

document.addEventListener("click", e => {
  if (searchPanelClickedOutside(e)) {
    suggestionBox?.classList.add("d-none");
  }
});

function searchPanelClickedOutside(event) {
  return !event.target.closest(".search-panel");
}
