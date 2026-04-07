const searchInput = document.getElementById("searchInput");
const suggestionBox = document.getElementById("searchSuggestions");
const quickTags = document.querySelectorAll(".quick-tag");

const keywords = [
  "Chuyên viên Quản lý thông tin",
  "Quản trị dữ liệu",
  "Data Analyst",
  "Nhân viên lưu trữ",
  "Hành chính văn phòng",
  "Quản lý hồ sơ",
  "Thông tin thư viện",
  "Nhân viên văn thư lưu trữ",
  "Chuyên viên dữ liệu",
  "Quản trị cơ sở dữ liệu",
  "Phân tích dữ liệu",
  "Quản lý tài liệu",
  "Nhân viên thông tin"
];

function renderSuggestions(items) {
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

if (searchInput) {
  searchInput.addEventListener("input", function () {
    const value = this.value.trim().toLowerCase();

    if (!value) {
      suggestionBox.classList.add("d-none");
      suggestionBox.innerHTML = "";
      return;
    }

    const matched = keywords.filter(item =>
      item.toLowerCase().includes(value)
    );

    renderSuggestions(matched.slice(0, 6));
  });

  searchInput.addEventListener("focus", function () {
    const value = this.value.trim().toLowerCase();

    if (!value) {
      renderSuggestions(keywords.slice(0, 6));
      return;
    }

    const matched = keywords.filter(item =>
      item.toLowerCase().includes(value)
    );
    renderSuggestions(matched.slice(0, 6));
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-panel")) {
      suggestionBox.classList.add("d-none");
    }
  });
}

quickTags.forEach(tag => {
  tag.addEventListener("click", () => {
    const keyword = tag.getAttribute("data-keyword");
    if (searchInput) {
      searchInput.value = keyword;
      searchInput.focus();
      renderSuggestions(
        keywords.filter(item => item.toLowerCase().includes(keyword.toLowerCase())).slice(0, 6)
      );
    }
  });
});
