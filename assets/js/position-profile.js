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

const REQUIRED_PROFILE_COLUMNS = [
  "kkt_type",
  "canonical_name",
  "has_term"
];

const OPTIONAL_PROFILE_COLUMNS = [
  "profile_id",
  "course_id",
  "course_name",
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

function getProfileName(profile) {
  return String(
    getFirstValue(
      profile,
      ["position_name", "profile_name", "name", "title"],
      "Chưa có tên hồ sơ"
    )
  ).trim();
}

function getProfileField(profile) {
  return String(
    getFirstValue(
      profile,
      ["field", "industry", "job_field", "linh_vuc"],
      "Chưa xác định"
    )
  ).trim();
}

function getProfileJobCount(profile) {
  const value = getFirstValue(profile, ["job_count", "count", "total_jobs"], 0);
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getProfileAliases(profile) {
  const aliases = profile?.aliases || profile?.alias_list || profile?.equivalent_titles || [];

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
    profile?.terms ||
    profile?.kst_list ||
    profile?.items ||
    [];

  if (!Array.isArray(rawTerms)) return [];

  const map = new Map();

  rawTerms.forEach((item) => {
    const kktType = String(
      getFirstValue(item, ["kkt_type", "type", "Loại"], "")
    )
      .toUpperCase()
      .trim();

    const canonicalName = String(
      getFirstValue(
        item,
        ["canonical_name", "canonical", "name", "Tên chuẩn (Canonical)"],
        ""
      )
    ).trim();

    if (!["K", "S", "T"].includes(kktType)) return;
    if (!canonicalName) return;

    const term = {
      kkt_type: kktType,
      canonical_name: canonicalName,
      job_count: Number(item.job_count || item.count || 0)
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

    return a.canonical_name.localeCompare(b.canonical_name, "vi");
  });
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

function populateProfileSelect(profiles) {
  if (!profileSelect) return;

  profileSelect.innerHTML = `
    <option value="">-- Chọn hồ sơ vị trí --</option>
    ${profiles
      .map((profile) => {
        const name = getProfileName(profile);
        const field = getProfileField(profile);
        const jobCount = getProfileJobCount(profile);

        return `
          <option value="${escapeHtml(name)}">
            ${escapeHtml(name)} - ${escapeHtml(field)} (${jobCount} job)
          </option>
        `;
      })
      .join("")}
  `;
}

function findProfileByName(name) {
  const normalized = normalizeText(name);

  return allProfiles.find((profile) => {
    return normalizeText(getProfileName(profile)) === normalized;
  });
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

function renderProfile(profile) {
  selectedProfile = profile;
  selectedProfileTerms = getProfileTerms(profile);

  const profileName = getProfileName(profile);
  const profileField = getProfileField(profile);
  const jobCount = getProfileJobCount(profile);

  profileNameEl.textContent = profileName;
  profileFieldEl.textContent = profileField;
  profileJobCountEl.textContent = String(jobCount);

  const grouped = groupTermsByType(selectedProfileTerms);

  renderSimpleList(profileKnowledgeWrap, grouped.K);
  renderSimpleList(profileSkillWrap, grouped.S);
  renderSimpleList(profileToolWrap, grouped.T);

  profileEmptyState.classList.add("is-hidden");
  positionProfileLayout.classList.remove("is-hidden");

  if (profileSelect) {
    profileSelect.value = profileName;
  }

  if (profileSearchInput) {
    profileSearchInput.value = profileName;
  }

  resetMatchState();
}

function resetMatchState() {
  profileUploadSection.classList.add("is-hidden");
  profileMatchResultCard.classList.add("is-hidden");
  positionProfileLayout.classList.remove("is-match-mode");

  if (profileExcelInput) {
    profileExcelInput.value = "";
  }

  uploadStatusEl.textContent = "Chưa có file nào được chọn.";

  matchPercentEl.textContent = "0%";
  matchScoreLabelEl.textContent = "Chưa thực hiện đối sánh";
  matchScoreSubtextEl.textContent =
    "Tải hồ sơ cá nhân để xem mức độ phù hợp với hồ sơ vị trí.";

  positionTermCountEl.textContent = "0";
  matchedTermCountEl.textContent = "0";
  missingTermCountEl.textContent = "0";

  matchedGroupWrapEl.innerHTML = "";
  missingGroupWrapEl.innerHTML = "";
}

function openMatchMode() {
  if (!selectedProfile) {
    profileEmptyState.textContent = "Vui lòng chọn một hồ sơ vị trí trước khi đối sánh.";
    profileEmptyState.classList.remove("is-hidden");
    return;
  }

  profileUploadSection.classList.remove("is-hidden");
  profileMatchResultCard.classList.remove("is-hidden");
  positionProfileLayout.classList.add("is-match-mode");
}

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
    "học"
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

  rows.forEach((row) => {
    const kktType = String(
      getColumnValue(row, ["kkt_type", "KKT_TYPE", "Loại"], "")
    )
      .toUpperCase()
      .trim();

    const canonicalName = String(
      getColumnValue(
        row,
        ["canonical_name", "CANONICAL_NAME", "Tên chuẩn (Canonical)", "Tên chuẩn"],
        ""
      )
    ).trim();

    const hasTerm = getColumnValue(row, ["has_term", "HAS_TERM"], "");

    if (!["K", "S", "T"].includes(kktType)) return;
    if (!canonicalName) return;
    if (!isTruthyHasTerm(hasTerm)) return;

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

function renderMatchResult(positionTerms, matchedTerms, missingTerms) {
  const denominator = positionTerms.length;
  const numerator = matchedTerms.length;
  const percent = denominator
    ? Math.round((numerator / denominator) * 100)
    : 0;

  matchPercentEl.textContent = `${percent}%`;

  if (percent >= 70) {
    matchScoreLabelEl.textContent = "Mức độ phù hợp tương đối cao";
  } else if (percent >= 40) {
    matchScoreLabelEl.textContent = "Mức độ phù hợp tương đối trung bình";
  } else {
    matchScoreLabelEl.textContent = "Mức độ phù hợp còn thấp";
  }

  matchScoreSubtextEl.textContent =
    "Kết quả chỉ phản ánh mức độ trùng khớp dữ liệu K–S–T giữa hồ sơ cá nhân và hồ sơ vị trí, không thay thế đánh giá toàn diện về năng lực, kinh nghiệm hoặc mức độ phù hợp thực tế.";

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

  const matchedTerms = selectedProfileTerms.filter((term) => {
    return userTermKeys.has(buildTermKey(term));
  });

  const missingTerms = selectedProfileTerms.filter((term) => {
    return !userTermKeys.has(buildTermKey(term));
  });

  renderMatchResult(selectedProfileTerms, matchedTerms, missingTerms);
}

function showInitialState(message = "Chọn hoặc tra cứu một hồ sơ vị trí để xem nội dung tổng hợp.") {
  profileEmptyState.textContent = message;
  profileEmptyState.classList.remove("is-hidden");
  positionProfileLayout.classList.add("is-hidden");

  selectedProfile = null;
  selectedProfileTerms = [];
}

async function loadPageData() {
  try {
    const response = await fetch("../data/position_profiles.json");

    if (!response.ok) {
      throw new Error("Không thể tải position_profiles.json");
    }

    const data = await response.json();

    allProfiles = Array.isArray(data)
      ? data
      : data.position_profiles || data.profiles || [];

    allProfiles = allProfiles
      .filter((profile) => getProfileName(profile))
      .sort((a, b) => {
        const fieldCompare = getProfileField(a).localeCompare(getProfileField(b), "vi");

        if (fieldCompare !== 0) {
          return fieldCompare;
        }

        return getProfileName(a).localeCompare(getProfileName(b), "vi");
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

profileSearchBtn?.addEventListener("click", () => {
  const keyword = profileSearchInput.value.trim();

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
    profileSearchBtn.click();
  }
});

profileSelect?.addEventListener("change", () => {
  const value = profileSelect.value.trim();

  if (!value) {
    showInitialState();
    return;
  }

  const found = findProfileByName(value);

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

  uploadStatusEl.textContent = file
    ? `Đã chọn file: ${file.name}`
    : "Chưa có file nào được chọn.";
});

runProfileMatchBtn?.addEventListener("click", async () => {
  const file = profileExcelInput.files?.[0];

  if (!selectedProfile) {
    uploadStatusEl.textContent = "Vui lòng chọn hồ sơ vị trí trước khi đối sánh.";
    return;
  }

  if (!selectedProfileTerms.length) {
    uploadStatusEl.textContent =
      "Hồ sơ vị trí hiện chưa có dữ liệu K–S–T để đối sánh.";
    return;
  }

  if (!file) {
    uploadStatusEl.textContent = "Vui lòng chọn file Excel hồ sơ cá nhân trước.";
    return;
  }

  if (typeof XLSX === "undefined") {
    uploadStatusEl.textContent =
      "Không tìm thấy thư viện đọc Excel. Hãy kiểm tra link SheetJS trong HTML.";
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
      "Không thể xử lý file Excel. Vui lòng kiểm tra lại cấu trúc file.";
  }
});

loadPageData();
