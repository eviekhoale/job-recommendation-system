const profileSearchInput = document.getElementById("profileSearchInput");
const profileSearchBtn = document.getElementById("profileSearchBtn");
const profileSelect = document.getElementById("profileSelect");

const profileEmptyState = document.getElementById("profileEmptyState");
const positionProfileLayout = document.getElementById("positionProfileLayout");

const profileNameEl = document.getElementById("profileName");
const profileFieldEl = document.getElementById("profileField");
const profileJobCountEl = document.getElementById("profileJobCount");

const profileKnowledgeWrap = document.getElementById("profileKnowledgeWrap");
const profileSkillWrap = document.getElementById("profileSkillWrap");
const profileToolWrap = document.getElementById("profileToolWrap");

const openProfileMatchBtn = document.getElementById("openProfileMatchBtn");
const profileUploadSection = document.getElementById("profileUploadSection");
const profileExcelInput = document.getElementById("profileExcelInput");
const runProfileMatchBtn = document.getElementById("runProfileMatchBtn");
const uploadStatusEl = document.getElementById("uploadStatus");

const profileMatchResultCard = document.getElementById("profileMatchResultCard");
const matchPercentEl = document.getElementById("matchPercent");
const matchScoreLabelEl = document.getElementById("matchScoreLabel");
const matchScoreSubtextEl = document.getElementById("matchScoreSubtext");
const positionTermCountEl = document.getElementById("positionTermCount");
const matchedTermCountEl = document.getElementById("matchedTermCount");
const missingTermCountEl = document.getElementById("missingTermCount");
const matchedGroupWrapEl = document.getElementById("matchedGroupWrap");
const missingGroupWrapEl = document.getElementById("missingGroupWrap");

let allProfiles = [];
let selectedProfile = null;
let selectedProfileTerms = [];

const EXPECTED_PROFILE_COLUMNS = [
  "profile_id",
  "course_id",
  "course_name",
  "kkt_type",
  "canonical_name",
  "has_term",
  "source_origin"
];

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
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
  div.textContent = String(text || "");
  return div.innerHTML;
}

function buildTermKey(term) {
  return `${normalizeText(term.kkt_type)}|${normalizeText(term.canonical_name)}`;
}

function mapFieldName(positionName) {
  const value = normalizeText(positionName);

  if (value.includes("khoa hoc thong tin")) return "Khoa học thông tin";
  if (value.includes("cong nghe thong tin") || value.includes("ict") || value.includes("truyen thong")) {
    return "Công nghệ thông tin - truyền thông";
  }
  if (value.includes("quan ly")) return "Quản lý";

  return positionName || "Chưa xác định";
}

function groupTermsByType(terms) {
  const grouped = { K: [], S: [], T: [] };

  terms.forEach((term) => {
    const type = String(term.kkt_type || "").toUpperCase();
    if (grouped[type]) grouped[type].push(term);
  });

  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) =>
      String(a.canonical_name).localeCompare(String(b.canonical_name), "vi")
    );
  });

  return grouped;
}

function renderSimpleList(container, items) {
  if (!items.length) {
    container.innerHTML = `<p class="profile-list-empty">Không có dữ liệu.</p>`;
    return;
  }

  container.innerHTML = `
    <ul>
      ${items.map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`).join("")}
    </ul>
  `;
}

function renderMatchGroupBoxes(container, groupedTerms, emptyText) {
  const typeLabels = {
    K: "Kiến thức",
    S: "Kỹ năng",
    T: "Công cụ"
  };

  const hasAny = groupedTerms.K.length || groupedTerms.S.length || groupedTerms.T.length;

  if (!hasAny) {
    container.innerHTML = `<p class="profile-match-empty">${escapeHtml(emptyText)}</p>`;
    return;
  }

  container.innerHTML = ["K", "S", "T"]
    .map((type) => {
      const items = groupedTerms[type];

      return `
        <div class="profile-match-group-box">
          <h4>${typeLabels[type]} (${items.length})</h4>
          ${
            items.length
              ? `<ul>${items.map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`).join("")}</ul>`
              : `<p class="profile-match-empty">Không có mục nào.</p>`
          }
        </div>
      `;
    })
    .join("");
}

function populateProfileSelect(profiles) {
  profileSelect.innerHTML = `
    <option value="">-- Chọn hồ sơ vị trí --</option>
    ${profiles
      .map(
        (profile) =>
          `<option value="${escapeHtml(profile.position_name)}">${escapeHtml(profile.position_name)}</option>`
      )
      .join("")}
  `;
}

function findProfileByName(name) {
  const normalized = normalizeText(name);

  return allProfiles.find(
    (profile) => normalizeText(profile.position_name) === normalized
  );
}

function searchProfileByKeyword(keyword) {
  const normalized = normalizeText(keyword);
  if (!normalized) return null;

  return (
    allProfiles.find((profile) =>
      normalizeText(profile.position_name).includes(normalized)
    ) || null
  );
}

function renderProfile(profile) {
  selectedProfile = profile;

  const terms = Array.isArray(profile.kkt_list) ? profile.kkt_list : [];
  selectedProfileTerms = terms
    .map((item) => ({
      kkt_type: String(item.kkt_type || "").toUpperCase(),
      canonical_name: String(item.canonical_name || "").trim()
    }))
    .filter((item) => item.kkt_type && item.canonical_name);

  profileNameEl.textContent = profile.position_name || "Chưa có tên hồ sơ";
  profileFieldEl.textContent = mapFieldName(profile.position_name || "");
  profileJobCountEl.textContent = String(profile.job_count || 0);

  const grouped = groupTermsByType(selectedProfileTerms);
  renderSimpleList(profileKnowledgeWrap, grouped.K);
  renderSimpleList(profileSkillWrap, grouped.S);
  renderSimpleList(profileToolWrap, grouped.T);

  profileEmptyState.classList.add("is-hidden");
  positionProfileLayout.classList.remove("is-hidden");

  profileSelect.value = profile.position_name || "";
  profileSearchInput.value = profile.position_name || "";
}

function openMatchMode() {
  positionProfileLayout.classList.add("is-match-mode");
  profileUploadSection.classList.remove("is-hidden");
  profileMatchResultCard.classList.remove("is-hidden");
}

function isTruthyHasTerm(value) {
  const normalized = normalizeText(value);
  if (!normalized) return true;
  return ["1", "true", "yes", "y", "x", "co", "có"].includes(normalized);
}

function validateProfileColumns(rows) {
  if (!rows.length) return { ok: false, missing: EXPECTED_PROFILE_COLUMNS };

  const firstRowKeys = Object.keys(rows[0]).map((key) => normalizeText(key));
  const missing = EXPECTED_PROFILE_COLUMNS.filter(
    (col) => !firstRowKeys.includes(normalizeText(col))
  );

  return {
    ok: missing.length === 0,
    missing
  };
}

function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false
        });

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Không thể đọc file Excel."));
    reader.readAsArrayBuffer(file);
  });
}

function getFirstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

function collectUserTerms(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const kktType = String(
      getFirstValue(row, ["kkt_type", "KKT_TYPE"], "")
    ).toUpperCase().trim();

    const canonicalName = String(
      getFirstValue(row, ["canonical_name", "CANONICAL_NAME"], "")
    ).trim();

    const hasTerm = getFirstValue(row, ["has_term", "HAS_TERM"], "");

    if (!kktType || !canonicalName) return;
    if (!["K", "S", "T"].includes(kktType)) return;
    if (!isTruthyHasTerm(hasTerm)) return;

    const term = {
      kkt_type: kktType,
      canonical_name: canonicalName
    };

    const key = buildTermKey(term);
    if (!map.has(key)) map.set(key, term);
  });

  return Array.from(map.values());
}

function renderMatchResult(targetTerms, matchedTerms, missingTerms) {
  const denominator = targetTerms.length;
  const numerator = matchedTerms.length;
  const percent = denominator ? Math.round((numerator / denominator) * 100) : 0;

  matchPercentEl.textContent = `${percent}%`;
  matchScoreLabelEl.textContent =
    percent >= 70
      ? "Mức độ phù hợp tương đối cao"
      : percent >= 40
        ? "Mức độ phù hợp tương đối trung bình"
        : "Mức độ phù hợp còn thấp";

  matchScoreSubtextEl.textContent =
    "Kết quả chỉ phản ánh mức độ trùng khớp dữ liệu K–S–T giữa hồ sơ cá nhân và hồ sơ vị trí.";

  positionTermCountEl.textContent = String(denominator);
  matchedTermCountEl.textContent = String(numerator);
  missingTermCountEl.textContent = String(missingTerms.length);

  renderMatchGroupBoxes(
    matchedGroupWrapEl,
    groupTermsByType(matchedTerms),
    "Chưa có mục nào trùng khớp."
  );

  renderMatchGroupBoxes(
    missingGroupWrapEl,
    groupTermsByType(missingTerms),
    "Không có mục còn thiếu."
  );
}

function runMatching(userTerms) {
  const userTermKeys = new Set(userTerms.map(buildTermKey));

  const matchedTerms = selectedProfileTerms.filter((term) =>
    userTermKeys.has(buildTermKey(term))
  );

  const missingTerms = selectedProfileTerms.filter((term) =>
    !userTermKeys.has(buildTermKey(term))
  );

  renderMatchResult(selectedProfileTerms, matchedTerms, missingTerms);
}

async function loadProfiles() {
  try {
    const response = await fetch("../data/position_profiles.json");
    if (!response.ok) throw new Error("Không thể tải position_profiles.json");

    const data = await response.json();
    allProfiles = Array.isArray(data) ? data : (data.position_profiles || []);

    populateProfileSelect(allProfiles);

    const queryPosition = getQueryParam("position").trim();
    if (queryPosition) {
      const found = searchProfileByKeyword(queryPosition);
      if (found) renderProfile(found);
    }
  } catch (error) {
    console.error(error);
    profileEmptyState.textContent = "Không thể đọc dữ liệu hồ sơ vị trí.";
  }
}

profileSearchBtn?.addEventListener("click", () => {
  const keyword = profileSearchInput.value.trim();

  if (!keyword) {
    profileEmptyState.textContent = "Vui lòng nhập tên hồ sơ vị trí cần tra cứu.";
    profileEmptyState.classList.remove("is-hidden");
    positionProfileLayout.classList.add("is-hidden");
    return;
  }

  const found = searchProfileByKeyword(keyword);

  if (!found) {
    profileEmptyState.textContent = "Không tìm thấy hồ sơ vị trí tương ứng.";
    profileEmptyState.classList.remove("is-hidden");
    positionProfileLayout.classList.add("is-hidden");
    return;
  }

  renderProfile(found);
});

profileSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    profileSearchBtn.click();
  }
});

profileSelect?.addEventListener("change", () => {
  const value = profileSelect.value.trim();

  if (!value) {
    profileEmptyState.classList.remove("is-hidden");
    positionProfileLayout.classList.add("is-hidden");
    return;
  }

  const found = findProfileByName(value);
  if (found) renderProfile(found);
});

openProfileMatchBtn?.addEventListener("click", () => {
  if (!selectedProfile) return;
  openMatchMode();
});

profileExcelInput?.addEventListener("change", () => {
  const file = profileExcelInput.files?.[0];
  uploadStatusEl.textContent = file
    ? `Đã chọn file: ${file.name}`
    : "Chưa có file nào được chọn.";
});

runProfileMatchBtn?.addEventListener("click", async () => {
  const file = profileExcelInput.files?.[0];

  if (!file) {
    uploadStatusEl.textContent = "Vui lòng chọn file Excel hồ sơ cá nhân trước.";
    return;
  }

  if (!selectedProfileTerms.length) {
    uploadStatusEl.textContent = "Hồ sơ vị trí hiện chưa có dữ liệu K–S–T để đối sánh.";
    return;
  }

  try {
    uploadStatusEl.textContent = "Đang đọc file hồ sơ cá nhân...";

    const rows = await readExcelFile(file);

    if (!rows.length) {
      uploadStatusEl.textContent = "File Excel không có dữ liệu.";
      return;
    }

    const validation = validateProfileColumns(rows);
    if (!validation.ok) {
      uploadStatusEl.textContent =
        `File chưa đúng cấu trúc. Thiếu cột: ${validation.missing.join(", ")}`;
      return;
    }

    const userTerms = collectUserTerms(rows);

    if (!userTerms.length) {
      uploadStatusEl.textContent =
        "Không tìm thấy thực thể K–S–T hợp lệ trong hồ sơ cá nhân.";
      return;
    }

    runMatching(userTerms);
    uploadStatusEl.textContent =
      `Đối sánh hoàn tất với ${userTerms.length} thực thể K–S–T từ hồ sơ cá nhân.`;
  } catch (error) {
    console.error(error);
    uploadStatusEl.textContent =
      "Không thể xử lý file Excel. Vui lòng kiểm tra lại file.";
  }
});

loadProfiles();
