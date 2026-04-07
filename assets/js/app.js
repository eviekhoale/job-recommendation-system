const searchInput = document.getElementById("searchInput");
const suggestionBox = document.getElementById("searchSuggestions");
const searchBtn = document.getElementById("searchBtn");

const fieldTags = document.querySelectorAll(".field-tag");
const fieldPreview = document.getElementById("fieldPreview");
const fieldPreviewTitle = document.getElementById("fieldPreviewTitle");
const fieldPreviewList = document.getElementById("fieldPreviewList");
const closeFieldPreview = document.getElementById("closeFieldPreview");

const positionKeywords = [
  "Chuyên viên Quản lý thông tin",
  "Nhân viên lưu trữ",
  "Nhân viên văn thư lưu trữ",
  "Chuyên viên dữ liệu",
  "Quản trị cơ sở dữ liệu",
  "Phân tích dữ liệu",
  "Nhân viên thông tin",
  "Quản lý hồ sơ"
];

const fieldData = {
  "Khoa học thông tin": [
    "Chuyên viên Quản lý thông tin",
    "Nhân viên lưu trữ",
    "Nhân viên văn thư lưu trữ",
    "Nhân viên thông tin"
  ],
  "Công nghệ thông tin - truyền thông": [
    "Chuyên viên dữ liệu",
    "Phân tích dữ liệu",
    "Quản trị cơ sở dữ liệu"
  ],
  "Quản lý": [
    "Quản lý hồ sơ",
    "Chuyên viên hành chính",
    "Nhân viên hành chính văn phòng"
  ]
};

function renderSuggestions(items) {
  if (!suggestionBox) return;

  if (!items.length) {
    suggestionBox.classList.add("d-none");
    suggestionBox.innerHTML = "";
    return;
  }

  suggestionBox.innerHTML = items
    .map(item => `<div class="suggestion-item">${item}</div>`)
    .join("");

  suggestionBox.classList.remove("d-none");

  document.querySelectorAll(".suggestion-item").forEach(el => {
    el.addEventListener("click", () => {
      searchInput.value = el.textContent.trim();
      suggestionBox.classList.add("d-none");
    });
  });
}

function normalizeKeyword(value) {
  return value.trim().toLowerCase();
}

function goToJobsPage(keyword = "") {
  const normalized = keyword.trim();
  if (normalized) {
    window.location.href = `pages/jobs.html?keyword=${encodeURIComponent(normalized)}`;
  } else {
    window.location.href = "pages/jobs.html";
  }
}

function showFieldPreview(fieldName) {
  if (!fieldPreview || !fieldPreviewTitle || !fieldPreviewList) return;

  const positions = fieldData[fieldName] || [];

  fieldPreviewTitle.textContent = `Danh sách vị trí việc làm thuộc lĩnh vực: ${fieldName}`;

  if (!positions.length) {
    fieldPreviewList.innerHTML = `
      <div class="field-preview-item">
        <strong>Không có dữ liệu</strong>
        <span>Hiện chưa có vị trí việc làm nào thuộc lĩnh vực này.</span>
      </div>
    `;
  } else {
    fieldPreviewList.innerHTML = positions
      .map(position => `
        <div class="field-preview-item">
          <strong>${position}</strong>
          <span>Lĩnh vực: ${fieldName}</span>
        </div>
      `)
      .join("");
  }

  fieldPreview.classList.remove("d-none");
}

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const value = normalizeKeyword(this.value);

    if (!value) {
      suggestionBox.classList.add("d-none");
      suggestionBox.innerHTML = "";
      return;
    }

    const matched = positionKeywords.filter(item =>
      item.toLowerCase().includes(value)
    );

    renderSuggestions(matched.slice(0, 6));
  });

  searchInput.addEventListener("focus", function () {
    const value = normalizeKeyword(this.value);

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

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-panel")) {
      suggestionBox.classList.add("d-none");
    }
  });
}

if (searchBtn) {
  searchBtn.addEventListener("click", () => {
    goToJobsPage(searchInput ? searchInput.value : "");
  });
}

fieldTags.forEach(tag => {
  tag.addEventListener("click", () => {
    const fieldName = tag.getAttribute("data-field");
    showFieldPreview(fieldName);
  });
});

if (closeFieldPreview) {
  closeFieldPreview.addEventListener("click", () => {
    fieldPreview.classList.add("d-none");
  });
}
