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

/**
 * File hồ sơ cá nhân/CTĐT dạng Excel cần tối thiểu:
 * - kkt_type
 * - canonical_name
 *
 * Cột has_term không bắt buộc.
 * Nếu có has_term: chỉ lấy dòng có has_term = 1/true/yes/có/x...
 * Nếu không có has_term: mặc định toàn bộ dòng hợp lệ là K–S–T đã có.
 */
const REQUIRED_PROFILE_COLUMNS = ["kkt_type", "canonical_name"];

const HAS_TERM_COLUMN_NAMES = [
  "has_term",
  "HAS_TERM",
  "has term",
  "Có trong hồ sơ",
  "co_trong_ho_so",
  "cờ xác định thực thể",
  "co xac dinh thuc the"
];

/* =========================
   BASIC HELPERS
========================= */

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
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

function buildTermKey(term) {
  return `${normalizeText(term.kkt_type)}|${normalizeText(term.canonical_name)}`;
}

/* =========================
   PROFILE DATA HELPERS
========================= */

function getProfileName(profile) {
  return String(
    getFirstValue(
      profile,
      [
        "position_name",
        "position_title",
        "profile_name",
        "profile_title",
        "job_title",
        "title",
        "name"
      ],
      "Chưa có tên hồ sơ"
    )
  ).trim();
}

function getProfileField(profile) {
  return String(
    getFirstValue(
      profile,
      ["field", "job_group", "industry", "job_field", "linh_vuc"],
      "Chưa xác định"
    )
  ).trim();
}

function getProfileJobCount(profile) {
  const value = getFirstValue(
    profile,
    ["job_count", "count", "total_jobs", "representative_job_count"],
    0
  );

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getProfileSelectKey(profile) {
  return String(profile.__profile_key || "").trim();
}

function createProfileSelectKey(profile, index) {
  const rawId = getFirstValue(
    profile,
    ["profile_id", "position_id", "id", "code"],
    ""
  );

  if (String(rawId).trim()) {
    return `id:${String(rawId).trim()}`;
  }

  return `idx:${index}:${normalizeText(getProfileName(profile))}`;
}

function getProfileAliases(profile) {
  const aliases =
    profile?.aliases ||
    profile?.alias_list ||
    profile?.equivalent_titles ||
    profile?.related_titles ||
    [];

  if (Array.isArray(aliases)) {
    return aliases
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(aliases || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getProfileTerms(profile) {
  const rawTerms =
    profile?.kkt_list ||
    profile?.kst_list ||
    profile?.terms ||
    profile?.items ||
    [];

  if (!Array.isArray(rawTerms)) return [];

  const map = new Map();

  rawTerms.forEach((item) => {
    const kktType = String(
      getFirstValue(item, ["kkt_type", "type", "loai", "Loại"], "")
    )
      .toUpperCase()
      .trim();

    const canonicalName = String(
      getFirstValue(
        item,
        [
          "canonical_name",
          "canonical",
          "name",
          "term",
          "Tên chuẩn (Canonical)",
          "Tên chuẩn"
        ],
        ""
      )
    ).trim();

    if (!["K", "S", "T"].includes(kktType)) return;
    if (!canonicalName) return;

    const term = {
      entity_id: String(item.entity_id || "").trim(),
      kkt_type: kktType,
      canonical_name: canonicalName,
      job_count: Number(item.job_count || item.count || 0) || 0
    };

    const key = buildTermKey(term);

    if (!map.has(key)) {
      map.set(key, term);
      return;
    }

    const saved = map.get(key);
    saved.job_count = Math.max(saved.job_count || 0, term.job_count || 0);
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.kkt_type !== b.kkt_type) {
      return a.kkt_type.localeCompare(b.kkt_type);
    }

    if ((b.job_count || 0) !== (a.job_count || 0)) {
      return (b.job_count || 0) - (a.job_count || 0);
    }

    return String(a.canonical_name).localeCompare(
      String(b.canonical_name),
      "vi"
    );
  });
}

function getProfileTermCount(profile) {
  return getProfileTerms(profile).length;
}

function groupTermsByType(terms) {
  const grouped = {
    K: [],
    S: [],
    T: []
  };

  terms.forEach((term) => {
    const type = String(term.kkt_type || "").toUpperCase();

    if (grouped[type]) {
      grouped[type].push(term);
    }
  });

  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) => {
      if ((b.job_count || 0) !== (a.job_count || 0)) {
        return (b.job_count || 0) - (a.job_count || 0);
      }

      return String(a.canonical_name).localeCompare(
        String(b.canonical_name),
        "vi"
      );
    });
  });

  return grouped;
}

/* =========================
   RENDER HELPERS
========================= */

function renderSimpleList(container, items) {
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<p class="profile-list-empty">Không có dữ liệu.</p>`;
    return;
  }

  container.innerHTML = `
    <ul>
      ${items
        .map((item) => {
          const countText = item.job_count
            ? ` <span class="profile-term-count">(${item.job_count} job)</span>`
            : "";

          return `
            <li>
              ${escapeHtml(item.canonical_name)}${countText}
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function renderMatchGroupBoxes(container, groupedTerms, emptyText) {
  if (!container) return;

  const typeLabels = {
    K: "Kiến thức",
    S: "Kỹ năng",
    T: "Công cụ"
  };

  const hasAny =
    groupedTerms.K.length ||
    groupedTerms.S.length ||
    groupedTerms.T.length;

  if (!hasAny) {
    container.innerHTML = `<p class="match-empty">${escapeHtml(emptyText)}</p>`;
    return;
  }

  container.innerHTML = ["K", "S", "T"]
    .map((type) => {
      const items = groupedTerms[type];

      return `
        <div class="match-group-box">
          <h4>${typeLabels[type]} (${items.length})</h4>
          ${
            items.length
              ? `
                <ul>
                  ${items
                    .map((item) => {
                      const countText = item.job_count
                        ? ` <span class="profile-term-count">(${item.job_count} job)</span>`
                        : "";

                      return `
                        <li>${escapeHtml(item.canonical_name)}${countText}</li>
                      `;
                    })
                    .join("")}
                </ul>
              `
              : `<p class="match-empty">Không có mục nào.</p>`
          }
        </div>
      `;
    })
    .join("");
}

/**
 * Dropdown chỉ hiển thị tên hồ sơ vị trí / job title.
 * Không hiển thị field, số job, số K–S–T để dropdown gọn trong màn hình.
 */
function populateProfileSelect(profiles) {
  if (!profileSelect) return;

  profileSelect.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Chọn hồ sơ vị trí --";
  profileSelect.appendChild(defaultOption);

  profiles.forEach((profile) => {
    const name = getProfileName(profile);
    if (!name) return;

    const option = document.createElement("option");
    option.value = getProfileSelectKey(profile);
    option.textContent = name;

    profileSelect.appendChild(option);
  });
}

/* =========================
   SEARCH / FIND PROFILE
========================= */

function findProfileBySelectKey(selectKey) {
  const normalized = String(selectKey || "").trim();

  if (!normalized) return null;

  return allProfiles.find((profile) => {
    return getProfileSelectKey(profile) === normalized;
  }) || null;
}

function findProfileByName(name) {
  const normalized = normalizeText(name);

  if (!normalized) return null;

  return allProfiles.find((profile) => {
    return normalizeText(getProfileName(profile)) === normalized;
  }) || null;
}

function searchProfileByKeyword(keyword) {
  const normalized = normalizeText(keyword);

  if (!normalized) return null;

  const exactByPositionName = allProfiles.find((profile) => {
    return normalizeText(getProfileName(profile)) === normalized;
  });

  if (exactByPositionName) return exactByPositionName;

  const exactByAlias = allProfiles.find((profile) => {
    const aliases = getProfileAliases(profile);

    return aliases.some((alias) => normalizeText(alias) === normalized);
  });

  if (exactByAlias) return exactByAlias;

  const fuzzyByPositionName = allProfiles.find((profile) => {
    const profileName = normalizeText(getProfileName(profile));

    return (
      profileName.includes(normalized) ||
      normalized.includes(profileName)
    );
  });

  if (fuzzyByPositionName) return fuzzyByPositionName;

  const fuzzyByAlias = allProfiles.find((profile) => {
    const aliases = getProfileAliases(profile);

    return aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias);

      return (
        normalizedAlias.includes(normalized) ||
        normalized.includes(normalizedAlias)
      );
    });
  });

  return fuzzyByAlias || null;
}

/* =========================
   PAGE STATE
========================= */

function hideInitialMessage() {
  if (!profileEmptyState) return;

  profileEmptyState.textContent = "";
  profileEmptyState.classList.add("is-hidden");
  profileEmptyState.setAttribute("hidden", "hidden");
}

function showMessage(message) {
  if (!profileEmptyState) {
    alert(message);
    return;
  }

  profileEmptyState.textContent = message;
  profileEmptyState.classList.remove("is-hidden");
  profileEmptyState.removeAttribute("hidden");
}

function resetMatchState() {
  if (profileUploadSection) {
    profileUploadSection.classList.add("is-hidden");
  }

  if (profileMatchResultCard) {
    profileMatchResultCard.classList.add("is-hidden");
  }

  if (positionProfileLayout) {
    positionProfileLayout.classList.remove("is-match-mode");
  }

  if (profileExcelInput) {
    profileExcelInput.value = "";
  }

  if (uploadStatusEl) {
    uploadStatusEl.textContent = "Chưa có file nào được chọn.";
  }

  if (matchPercentEl) matchPercentEl.textContent = "0%";
  if (matchScoreLabelEl) {
    matchScoreLabelEl.textContent = "Chưa thực hiện đối sánh";
  }

  if (matchScoreSubtextEl) {
    matchScoreSubtextEl.textContent =
      "Tải hồ sơ cá nhân để xem mức độ bao phủ K–S–T của hồ sơ vị trí.";
  }

  if (positionTermCountEl) positionTermCountEl.textContent = "0";
  if (matchedTermCountEl) matchedTermCountEl.textContent = "0";
  if (missingTermCountEl) missingTermCountEl.textContent = "0";

  if (matchedGroupWrapEl) matchedGroupWrapEl.innerHTML = "";
  if (missingGroupWrapEl) missingGroupWrapEl.innerHTML = "";
}

function showInitialState(message = "") {
  selectedProfile = null;
  selectedProfileTerms = [];

  if (positionProfileLayout) {
    positionProfileLayout.classList.add("is-hidden");
    positionProfileLayout.classList.remove("is-match-mode");
  }

  resetMatchState();

  if (profileSelect) {
    profileSelect.value = "";
  }

  if (message) {
    showMessage(message);
  } else {
    hideInitialMessage();
  }
}

function renderProfile(profile) {
  selectedProfile = profile;
  selectedProfileTerms = getProfileTerms(profile);

  const profileName = getProfileName(profile);
  const profileField = getProfileField(profile);
  const jobCount = getProfileJobCount(profile);

  if (profileNameEl) profileNameEl.textContent = profileName;
  if (profileFieldEl) profileFieldEl.textContent = profileField;
  if (profileJobCountEl) profileJobCountEl.textContent = String(jobCount);

  const grouped = groupTermsByType(selectedProfileTerms);

  renderSimpleList(profileKnowledgeWrap, grouped.K);
  renderSimpleList(profileSkillWrap, grouped.S);
  renderSimpleList(profileToolWrap, grouped.T);

  hideInitialMessage();

  if (positionProfileLayout) {
    positionProfileLayout.classList.remove("is-hidden");
  }

  if (profileSelect) {
    profileSelect.value = getProfileSelectKey(profile);
  }

  if (profileSearchInput) {
    profileSearchInput.value = profileName;
  }

  resetMatchState();
}

function openMatchMode() {
  if (!selectedProfile) {
    showMessage("Vui lòng chọn một hồ sơ vị trí trước khi đối sánh.");
    return;
  }

  hideInitialMessage();

  if (profileUploadSection) {
    profileUploadSection.classList.remove("is-hidden");
  }

  if (profileMatchResultCard) {
    profileMatchResultCard.classList.remove("is-hidden");
  }

  if (positionProfileLayout) {
    positionProfileLayout.classList.add("is-match-mode");
  }
}

/* =========================
   EXCEL HELPERS
========================= */

function getRowKeysLowerMap(row) {
  const map = new Map();

  Object.keys(row || {}).forEach((key) => {
    map.set(normalizeText(key), key);
  });

  return map;
}

function hasColumn(row, columnName) {
  const keyMap = getRowKeysLowerMap(row);
  return keyMap.has(normalizeText(columnName));
}

function getColumnValue(row, possibleNames, fallback = "") {
  const keyMap = getRowKeysLowerMap(row);

  for (const name of possibleNames) {
    const realKey = keyMap.get(normalizeText(name));

    if (realKey !== undefined) {
      return row[realKey];
    }
  }

  return fallback;
}

function hasAnyHasTermColumn(rows) {
  if (!rows.length) return false;

  return HAS_TERM_COLUMN_NAMES.some((columnName) => {
    return hasColumn(rows[0], columnName);
  });
}

function validateProfileColumns(rows) {
  if (!rows.length) {
    return {
      ok: false,
      missing: REQUIRED_PROFILE_COLUMNS
    };
  }

  const firstRow = rows[0];

  const missing = REQUIRED_PROFILE_COLUMNS.filter((column) => {
    return !hasColumn(firstRow, column);
  });

  return {
    ok: missing.length === 0,
    missing
  };
}

function isTruthyHasTerm(value) {
  const normalized = normalizeText(value);

  return [
    "1",
    "true",
    "yes",
    "y",
    "co",
    "có",
    "x",
    "da hoc",
    "đã học",
    "hoc",
    "học",
    "checked",
    "available",
    "present"
  ].includes(normalized);
}

function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, {
          type: "array"
        });

        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          resolve([]);
          return;
        }

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

    reader.onerror = () => {
      reject(new Error("Không thể đọc file Excel."));
    };

    reader.readAsArrayBuffer(file);
  });
}

function collectUserTerms(rows) {
  const map = new Map();
  const shouldCheckHasTerm = hasAnyHasTermColumn(rows);

  rows.forEach((row) => {
    const kktType = String(
      getColumnValue(row, ["kkt_type", "KKT_TYPE", "Loại"], "")
    )
      .toUpperCase()
      .trim();

    const canonicalName = String(
      getColumnValue(
        row,
        [
          "canonical_name",
          "CANONICAL_NAME",
          "Tên chuẩn (Canonical)",
          "Tên chuẩn"
        ],
        ""
      )
    ).trim();

    if (!["K", "S", "T"].includes(kktType)) return;
    if (!canonicalName) return;

    if (shouldCheckHasTerm) {
      const hasTerm = getColumnValue(row, HAS_TERM_COLUMN_NAMES, "");

      if (!isTruthyHasTerm(hasTerm)) return;
    }

    const term = {
      kkt_type: kktType,
      canonical_name: canonicalName
    };

    const key = buildTermKey(term);

    if (!map.has(key)) {
      map.set(key, term);
    }
  });

  return Array.from(map.values());
}

/* =========================
   MATCHING
========================= */

function renderMatchResult(positionTerms, matchedTerms, missingTerms) {
  const denominator = positionTerms.length;
  const numerator = matchedTerms.length;

  const percent = denominator
    ? Math.round((numerator / denominator) * 100)
    : 0;

  if (matchPercentEl) {
    matchPercentEl.textContent = `${percent}%`;
  }

  if (matchScoreLabelEl) {
    if (percent >= 70) {
      matchScoreLabelEl.textContent = "Mức độ bao phủ K–S–T cao";
    } else if (percent >= 40) {
      matchScoreLabelEl.textContent = "Mức độ bao phủ K–S–T trung bình";
    } else {
      matchScoreLabelEl.textContent = "Mức độ bao phủ K–S–T còn thấp";
    }
  }

  if (matchScoreSubtextEl) {
    matchScoreSubtextEl.textContent =
      "Kết quả phản ánh mức độ trùng khớp giữa K–S–T trong hồ sơ cá nhân/CTĐT và K–S–T đã trích xuất từ hồ sơ vị trí. Kết quả chưa bao gồm kinh nghiệm làm việc, mức độ thành thạo, chứng chỉ, ngoại ngữ hoặc tiêu chí tuyển dụng khác.";
  }

  if (positionTermCountEl) {
    positionTermCountEl.textContent = String(denominator);
  }

  if (matchedTermCountEl) {
    matchedTermCountEl.textContent = String(numerator);
  }

  if (missingTermCountEl) {
    missingTermCountEl.textContent = String(missingTerms.length);
  }

  renderMatchGroupBoxes(
    matchedGroupWrapEl,
    groupTermsByType(matchedTerms),
    "Chưa có K–S–T nào trùng khớp theo dữ liệu đã trích xuất."
  );

  renderMatchGroupBoxes(
    missingGroupWrapEl,
    groupTermsByType(missingTerms),
    "Không có K–S–T còn thiếu theo dữ liệu đã trích xuất."
  );
}

function runMatching(userTerms) {
  const userTermKeys = new Set(userTerms.map(buildTermKey));

  const matchedTerms = selectedProfileTerms.filter((term) => {
    return userTermKeys.has(buildTermKey(term));
  });

  const missingTerms = selectedProfileTerms.filter((term) => {
    return !userTermKeys.has(buildTermKey(term));
  });

  renderMatchResult(selectedProfileTerms, matchedTerms, missingTerms);
}

/* =========================
   LOAD DATA
========================= */

async function loadPageData() {
  try {
    const response = await fetch("../data/position_profiles.json");

    if (!response.ok) {
      throw new Error("Không thể tải position_profiles.json");
    }

    const data = await response.json();

    const rawProfiles = Array.isArray(data)
      ? data
      : data.position_profiles || data.profiles || [];

    allProfiles = rawProfiles
  .filter((profile) => getProfileName(profile))
  .sort((a, b) => {
    const kstCompare = getProfileTermCount(b) - getProfileTermCount(a);

    if (kstCompare !== 0) {
      return kstCompare;
    }

    const jobCompare = getProfileJobCount(b) - getProfileJobCount(a);

    if (jobCompare !== 0) {
      return jobCompare;
    }

    return getProfileName(a).localeCompare(getProfileName(b), "vi");
  });

    allProfiles.forEach((profile, index) => {
      profile.__profile_key = createProfileSelectKey(profile, index);
    });

    populateProfileSelect(allProfiles);

    if (!allProfiles.length) {
      showInitialState("Chưa có dữ liệu hồ sơ vị trí trong position_profiles.json.");
      return;
    }

    const queryPosition = getQueryParam("position").trim();
    const queryProfile = getQueryParam("profile").trim();
    const queryName = queryPosition || queryProfile;

    if (queryName) {
      const found = searchProfileByKeyword(queryName);

      if (found) {
        renderProfile(found);
        return;
      }

      showInitialState("Không tìm thấy hồ sơ vị trí tương ứng với tham số trên URL.");
      return;
    }

    showInitialState();
  } catch (error) {
    console.error(error);
    showInitialState("Không thể đọc dữ liệu hồ sơ vị trí.");
  }
}

/* =========================
   EVENTS
========================= */

profileSearchBtn?.addEventListener("click", () => {
  const keyword = profileSearchInput?.value.trim() || "";

  if (!keyword) {
    showInitialState("Vui lòng nhập tên hồ sơ vị trí cần tra cứu.");
    return;
  }

  const found = searchProfileByKeyword(keyword);

  if (!found) {
    showInitialState("Không tìm thấy hồ sơ vị trí tương ứng.");
    return;
  }

  renderProfile(found);
});

profileSearchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    profileSearchBtn?.click();
  }
});

profileSelect?.addEventListener("change", () => {
  const value = profileSelect.value.trim();

  if (!value) {
    showInitialState();
    return;
  }

  const found = findProfileBySelectKey(value);

  if (!found) {
    showInitialState("Không tìm thấy hồ sơ vị trí tương ứng.");
    return;
  }

  renderProfile(found);
});

openProfileMatchBtn?.addEventListener("click", () => {
  openMatchMode();
});

profileExcelInput?.addEventListener("change", () => {
  const file = profileExcelInput.files?.[0];

  if (uploadStatusEl) {
    uploadStatusEl.textContent = file
      ? `Đã chọn file: ${file.name}`
      : "Chưa có file nào được chọn.";
  }
});

runProfileMatchBtn?.addEventListener("click", async () => {
  const file = profileExcelInput?.files?.[0];

  if (!selectedProfile) {
    if (uploadStatusEl) {
      uploadStatusEl.textContent = "Vui lòng chọn hồ sơ vị trí trước khi đối sánh.";
    }
    return;
  }

  if (!selectedProfileTerms.length) {
    if (uploadStatusEl) {
      uploadStatusEl.textContent =
        "Hồ sơ vị trí hiện chưa có dữ liệu K–S–T để đối sánh.";
    }
    return;
  }

  if (!file) {
    if (uploadStatusEl) {
      uploadStatusEl.textContent = "Vui lòng chọn file Excel hồ sơ cá nhân/CTĐT trước.";
    }
    return;
  }

  if (typeof XLSX === "undefined") {
    if (uploadStatusEl) {
      uploadStatusEl.textContent =
        "Không tìm thấy thư viện đọc Excel. Hãy kiểm tra link SheetJS trong HTML.";
    }
    return;
  }

  try {
    if (uploadStatusEl) {
      uploadStatusEl.textContent = "Đang đọc file Excel...";
    }

    const rows = await readExcelFile(file);

    if (!rows.length) {
      if (uploadStatusEl) {
        uploadStatusEl.textContent = "File Excel không có dữ liệu.";
      }
      return;
    }

    const validation = validateProfileColumns(rows);

    if (!validation.ok) {
      if (uploadStatusEl) {
        uploadStatusEl.textContent =
          `File chưa đúng cấu trúc. Thiếu cột: ${validation.missing.join(", ")}`;
      }
      return;
    }

    const userTerms = collectUserTerms(rows);

    if (!userTerms.length) {
      if (uploadStatusEl) {
        uploadStatusEl.textContent =
          "Không tìm thấy thực thể K–S–T hợp lệ trong file Excel.";
      }
      return;
    }

    runMatching(userTerms);

    if (uploadStatusEl) {
      const hasTermMode = hasAnyHasTermColumn(rows)
        ? "có xét cột has_term"
        : "không có cột has_term, mặc định toàn bộ dòng hợp lệ là K–S–T đã có";

      uploadStatusEl.textContent =
        `Đối sánh hoàn tất với ${userTerms.length} thực thể K–S–T từ file Excel (${hasTermMode}).`;
    }
  } catch (error) {
    console.error(error);

    if (uploadStatusEl) {
      uploadStatusEl.textContent =
        "Không thể xử lý file Excel. Vui lòng kiểm tra lại cấu trúc file.";
    }
  }
});

loadPageData();
