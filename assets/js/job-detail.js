const jobTitleEl = document.getElementById("jobTitle");
const jobFieldEl = document.getElementById("jobField");
const jobCompanyEl = document.getElementById("jobCompany");
const jobSourceEl = document.getElementById("jobSource");
const jobIdTextEl = document.getElementById("jobIdText");
const jobDescriptionEl = document.getElementById("jobDescription");
const jobRequirementEl = document.getElementById("jobRequirement");
const jobKstSummaryEl = document.getElementById("jobKstSummary");

const openMatchBtn = document.getElementById("openMatchBtn");
const profileUploadSection = document.getElementById("profileUploadSection");
const profileExcelInput = document.getElementById("profileExcelInput");
const runMatchBtn = document.getElementById("runMatchBtn");
const uploadStatusEl = document.getElementById("uploadStatus");

const jobDetailLayout = document.getElementById("jobDetailLayout");
const matchResultCard = document.getElementById("matchResultCard");
const emptyStateEl = document.getElementById("jobDetailEmptyState");

const matchPercentEl = document.getElementById("matchPercent");
const matchScoreLabelEl = document.getElementById("matchScoreLabel");
const matchScoreSubtextEl = document.getElementById("matchScoreSubtext");
const jobTermCountEl = document.getElementById("jobTermCount");
const matchedTermCountEl = document.getElementById("matchedTermCount");
const missingTermCountEl = document.getElementById("missingTermCount");
const matchedGroupWrapEl = document.getElementById("matchedGroupWrap");
const missingGroupWrapEl = document.getElementById("missingGroupWrap");

/*
  Trang job-detail đọc dữ liệu từ 4 JSON chính:
  - COURSE
  - JOB_POST
  - KKT_ENTITY
  - KKT_OCCURRENCE

  Có thêm các tên fallback để tránh lỗi nếu file trong repo đang dùng tên viết hoa/thường khác nhau.
*/
const DATA_SOURCES = {
  courses: [
    "../data/COURSE.json",
    "../data/course.json",
    "../data/Courses.json",
    "../data/courses.json"
  ],

  jobs: [
    "../data/JOB_POST.json",
    "../data/job_post.json",
    "../data/jobs.json"
  ],

  entities: [
    "../data/KKT_ENTITY.json",
    "../data/kkt_entity.json",
    "../data/kkt_entities.json"
  ],

  occurrences: [
    "../data/KKT_OCCURRENCE.json",
    "../data/kkt_occurrence.json",
    "../data/kkt_occurrences.json",

    /*
      Fallback cho trường hợp repo vẫn còn file cũ sau khi enrich.
      Nếu không có file này cũng không sao.
    */
    "../data/job_kkt.json"
  ]
};

/*
  Cấu trúc file hồ sơ cá nhân upload lên.
  Đây là cấu trúc theo file mẫu bạn cung cấp, nhưng code KHÔNG đọc riêng file đó.
  Người dùng có thể upload bất kỳ file Excel nào miễn có đủ các cột dưới đây.
*/
const REQUIRED_PROFILE_COLUMNS = [
  "profile_id",
  "course_id",
  "course_name",
  "kkt_type",
  "canonical_name",
  "source_origin"
];

let allCourses = [];
let allJobs = [];
let allEntities = [];
let allOccurrences = [];

let entityMapById = new Map();

let selectedJob = null;
let selectedJobTerms = [];

/* =========================
   Helper chung
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
    .replace(/đ/g, "d")
    .trim();
}

function normalizeSpaces(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTermName(value) {
  return normalizeText(value)
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForSearch(value) {
  return normalizeText(value)
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9+#./-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text || "");
  return div.innerHTML;
}

function formatMultilineText(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function getFirstValue(obj, keys, fallback = "") {
  if (!obj) return fallback;

  for (const key of keys) {
    const value = obj[key];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  const normalizedKeyMap = new Map(
    Object.keys(obj).map((key) => [normalizeText(key), key])
  );

  for (const key of keys) {
    const actualKey = normalizedKeyMap.get(normalizeText(key));
    if (!actualKey) continue;

    const value = obj[actualKey];

    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return fallback;
}

function unwrapArray(data, possibleKeys = []) {
  if (Array.isArray(data)) return data;

  for (const key of possibleKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

async function fetchJsonFromCandidates(urls, options = {}) {
  const { required = true, label = "dữ liệu" } = options;
  const errors = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        errors.push(`${url}: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      return { url, data };
    } catch (error) {
      errors.push(`${url}: ${error.message}`);
    }
  }

  if (required) {
    throw new Error(`Không thể tải ${label}. Đã thử: ${urls.join(" | ")}`);
  }

  console.warn(`Không tải được ${label}.`, errors);
  return { url: "", data: [] };
}

/* =========================
   Lấy thông tin job
========================= */

function getJobId(job) {
  return String(
    getFirstValue(job, [
      "job_id",
      "JOB_ID",
      "id",
      "ID",
      "job_code",
      "ma_tin"
    ], "")
  ).trim();
}

function getJobTitle(job) {
  return normalizeSpaces(
    getFirstValue(job, [
      "job_title",
      "JOB_TITLE",
      "title",
      "position_title",
      "job_name",
      "ten_vi_tri"
    ], "Chưa có tên vị trí")
  );
}

function getJobField(job) {
  return normalizeSpaces(
    getFirstValue(job, [
      "industry",
      "INDUSTRY",
      "field",
      "job_field",
      "linh_vuc",
      "sector"
    ], "Chưa có lĩnh vực")
  );
}

function getJobCompany(job) {
  return normalizeSpaces(
    getFirstValue(job, [
      "company_name",
      "COMPANY_NAME",
      "company",
      "employer",
      "company_code",
      "ma_cong_ty"
    ], "Chưa có thông tin công ty")
  );
}

function getJobSource(job) {
  return normalizeSpaces(
    getFirstValue(job, [
      "source",
      "SOURCE",
      "source_name",
      "job_source",
      "nguon_tin"
    ], "Chưa có nguồn")
  );
}

function getJobDescription(job) {
  return getFirstValue(job, [
    "job_description",
    "JOB_DESCRIPTION",
    "description",
    "job_desc",
    "mo_ta_cong_viec"
  ], "Chưa có mô tả công việc.");
}

function getJobRequirement(job) {
  return getFirstValue(job, [
    "job_requirement",
    "JOB_REQUIREMENT",
    "job_requirements",
    "requirements",
    "yeu_cau_cong_viec"
  ], "Chưa có yêu cầu công việc.");
}

function getJobTextForExtraction(job) {
  return [
    getJobTitle(job),
    getJobDescription(job),
    getJobRequirement(job),
    getFirstValue(job, ["benefits", "job_benefits", "phuc_loi"], "")
  ].join("\n");
}

/* =========================
   Lấy thông tin K–S–T
========================= */

function getEntityId(row) {
  return String(
    getFirstValue(row, ["entity_id", "ENTITY_ID"], "")
  ).trim();
}

function getKktType(row) {
  return String(
    getFirstValue(row, ["kkt_type", "KKT_TYPE", "type", "TYPE"], "")
  )
    .toUpperCase()
    .trim();
}

function getCanonicalName(row) {
  return normalizeSpaces(
    getFirstValue(row, [
      "canonical_name",
      "CANONICAL_NAME",
      "name",
      "NAME"
    ], "")
  );
}

function isValidKktType(type) {
  return ["K", "S", "T"].includes(String(type || "").toUpperCase());
}

function buildNameKey(term) {
  return [
    String(term.kkt_type || "").toUpperCase().trim(),
    normalizeTermName(term.canonical_name)
  ].join("|");
}

function buildEntityKey(term) {
  const entityId = String(term.entity_id || "").trim();
  return entityId ? `ENTITY|${normalizeText(entityId)}` : "";
}

function parseAliasList(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[;|,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildEntityLookup() {
  entityMapById = new Map();

  allEntities.forEach((entity) => {
    const entityId = getEntityId(entity);
    const kktType = getKktType(entity);
    const canonicalName = getCanonicalName(entity);

    if (!entityId || !isValidKktType(kktType) || !canonicalName) return;

    entityMapById.set(entityId, {
      entity_id: entityId,
      kkt_type: kktType,
      canonical_name: canonicalName,
      alias_list: getFirstValue(entity, ["alias_list", "aliases", "alias"], ""),
      canonical_norm: getFirstValue(entity, ["canonical_norm"], ""),
      canonical_ascii: getFirstValue(entity, ["canonical_ascii"], "")
    });
  });
}

function dedupeTerms(terms) {
  const map = new Map();

  terms.forEach((term) => {
    const kktType = String(term.kkt_type || "").toUpperCase().trim();
    const canonicalName = normalizeSpaces(term.canonical_name);
    const entityId = String(term.entity_id || "").trim();

    if (!isValidKktType(kktType) || !canonicalName) return;

    const normalizedTerm = {
      ...term,
      entity_id: entityId,
      kkt_type: kktType,
      canonical_name: canonicalName
    };

    const key = entityId
      ? buildEntityKey(normalizedTerm)
      : buildNameKey(normalizedTerm);

    if (!map.has(key)) {
      map.set(key, normalizedTerm);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.kkt_type !== b.kkt_type) {
      return a.kkt_type.localeCompare(b.kkt_type);
    }

    return String(a.canonical_name || "").localeCompare(
      String(b.canonical_name || ""),
      "vi"
    );
  });
}

function groupTermsByType(terms) {
  const grouped = { K: [], S: [], T: [] };

  terms.forEach((term) => {
    const type = String(term.kkt_type || "").toUpperCase();

    if (grouped[type]) {
      grouped[type].push(term);
    }
  });

  Object.keys(grouped).forEach((type) => {
    grouped[type].sort((a, b) =>
      String(a.canonical_name || "").localeCompare(
        String(b.canonical_name || ""),
        "vi"
      )
    );
  });

  return grouped;
}

/* =========================
   Lấy K–S–T của tin tuyển dụng
========================= */

function getOccurrenceJobId(occurrence) {
  const directJobId = String(
    getFirstValue(occurrence, [
      "job_id",
      "JOB_ID",
      "jd_id",
      "JD_ID"
    ], "")
  ).trim();

  if (directJobId) return directJobId;

  const sourceType = normalizeText(
    getFirstValue(occurrence, [
      "source_type",
      "SOURCE_TYPE",
      "source_table",
      "SOURCE_TABLE",
      "table_name",
      "TABLE_NAME"
    ], "")
  );

  const sourceId = String(
    getFirstValue(occurrence, [
      "source_id",
      "SOURCE_ID",
      "record_id",
      "RECORD_ID",
      "object_id",
      "OBJECT_ID",
      "ref_id",
      "REF_ID"
    ], "")
  ).trim();

  const isJobSource =
    sourceType.includes("job") ||
    sourceType.includes("jd") ||
    sourceType.includes("tuyen dung") ||
    sourceType.includes("tin tuyen dung");

  return isJobSource ? sourceId : "";
}

function getTermsFromOccurrences(jobId) {
  const targetJobId = String(jobId || "").trim();

  const terms = allOccurrences
    .filter((occurrence) => {
      const occurrenceJobId = getOccurrenceJobId(occurrence);
      return occurrenceJobId === targetJobId;
    })
    .map((occurrence) => {
      const entityId = getEntityId(occurrence);
      const entity = entityMapById.get(entityId) || {};

      const kktType = getKktType(occurrence) || entity.kkt_type || "";
      const canonicalName = getCanonicalName(occurrence) || entity.canonical_name || "";

      return {
        occ_id: getFirstValue(occurrence, ["occ_id", "OCC_ID"], ""),
        job_id: targetJobId,
        entity_id: entityId,
        kkt_type: kktType,
        canonical_name: canonicalName,
        field: getFirstValue(occurrence, ["field", "FIELD"], ""),
        matched_term: getFirstValue(occurrence, ["matched_term", "MATCHED_TERM"], ""),
        method: getFirstValue(occurrence, ["method", "METHOD"], ""),
        evidence_snippet: getFirstValue(
          occurrence,
          ["evidence_snippet", "EVIDENCE_SNIPPET"],
          ""
        )
      };
    });

  return dedupeTerms(terms);
}

/*
  Fallback:
  Nếu vì lý do nào đó KKT_OCCURRENCE chưa có dòng cho job hiện tại,
  hệ thống sẽ dò K–S–T từ KKT_ENTITY trong title + mô tả + yêu cầu công việc.

  Trường hợp bình thường sau khi enrich_job_kkt.py chạy đúng,
  hệ thống sẽ ưu tiên dùng KKT_OCCURRENCE.
*/
function extractTermsFromJobText(job) {
  const jobTextNorm = normalizeForSearch(getJobTextForExtraction(job));
  const jobId = getJobId(job);
  const terms = [];

  if (!jobTextNorm) return [];

  allEntities.forEach((entity) => {
    const entityId = getEntityId(entity);
    const kktType = getKktType(entity);
    const canonicalName = getCanonicalName(entity);

    if (!entityId || !isValidKktType(kktType) || !canonicalName) return;

    const candidates = [
      canonicalName,
      getFirstValue(entity, ["canonical_norm", "CANONICAL_NORM"], ""),
      getFirstValue(entity, ["canonical_ascii", "CANONICAL_ASCII"], ""),
      ...parseAliasList(
        getFirstValue(entity, ["alias_list", "aliases", "alias"], "")
      )
    ]
      .map((item) => String(item || "").trim())
      .filter(Boolean);

    const matchedTerm = candidates.find((candidate) => {
      const termNorm = normalizeForSearch(candidate);

      if (!termNorm || termNorm.length < 2) return false;

      return ` ${jobTextNorm} `.includes(` ${termNorm} `);
    });

    if (!matchedTerm) return;

    terms.push({
      job_id: jobId,
      entity_id: entityId,
      kkt_type: kktType,
      canonical_name: canonicalName,
      field: "auto_extract",
      matched_term: matchedTerm,
      method: "frontend_dictionary_match",
      evidence_snippet: ""
    });
  });

  return dedupeTerms(terms);
}

function getJobTerms(job) {
  const jobId = getJobId(job);

  const termsFromOccurrences = getTermsFromOccurrences(jobId);

  if (termsFromOccurrences.length) {
    return termsFromOccurrences;
  }

  return extractTermsFromJobText(job);
}

/* =========================
   Render giao diện
========================= */

function renderJobKstSummary(jobTerms) {
  const grouped = groupTermsByType(jobTerms);

  const typeMeta = {
    K: "Kiến thức",
    S: "Kỹ năng",
    T: "Công cụ"
  };

  jobKstSummaryEl.innerHTML = ["K", "S", "T"]
    .map((type) => {
      const items = grouped[type];

      return `
        <div class="job-kst-box">
          <h4>${typeMeta[type]} (${items.length})</h4>
          ${
            items.length
              ? `<ul>${items
                  .map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`)
                  .join("")}</ul>`
              : "<p>Không có dữ liệu.</p>"
          }
        </div>
      `;
    })
    .join("");
}

function renderTermGroupBoxes(container, groupedTerms, emptyText, isDark = false) {
  const typeLabels = {
    K: "Kiến thức",
    S: "Kỹ năng",
    T: "Công cụ"
  };

  const hasAny =
    groupedTerms.K.length || groupedTerms.S.length || groupedTerms.T.length;

  if (!hasAny) {
    container.innerHTML = `<p class="${isDark ? "match-empty" : ""}">${escapeHtml(emptyText)}</p>`;
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
              ? `<ul>${items
                  .map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`)
                  .join("")}</ul>`
              : `<p class="${isDark ? "match-empty" : ""}">Không có mục nào.</p>`
          }
        </div>
      `;
    })
    .join("");
}

function renderJobDetail(job) {
  jobTitleEl.textContent = getJobTitle(job);
  jobFieldEl.textContent = getJobField(job);
  jobCompanyEl.textContent = getJobCompany(job);
  jobSourceEl.textContent = getJobSource(job);
  jobIdTextEl.textContent = getJobId(job);

  jobDescriptionEl.innerHTML = formatMultilineText(getJobDescription(job));
  jobRequirementEl.innerHTML = formatMultilineText(getJobRequirement(job));

  selectedJobTerms = getJobTerms(job);
  renderJobKstSummary(selectedJobTerms);
}

function showEmptyState(message) {
  emptyStateEl.textContent = message || "Không tìm thấy tin tuyển dụng tương ứng.";
  emptyStateEl.classList.remove("is-hidden");
  jobDetailLayout?.classList.add("is-hidden");
}

function openUploadPanelOnly() {
  profileUploadSection.classList.remove("is-hidden");

  /*
    Yêu cầu của bạn:
    - Bấm "Đối sánh với hồ sơ của tôi" chỉ hiện khu upload file.
    - Chưa hiện khung "Kết quả đối sánh".
  */
  matchResultCard.classList.add("is-hidden");
  jobDetailLayout.classList.remove("is-match-mode");

  uploadStatusEl.textContent = profileExcelInput.files?.[0]
    ? `Đã chọn file: ${profileExcelInput.files[0].name}`
    : "Chưa có file nào được chọn.";

  profileUploadSection.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
}

function showMatchResultPanel() {
  /*
    Chỉ gọi hàm này sau khi bấm "Thực hiện đối sánh" và đối sánh thành công.
  */
  jobDetailLayout.classList.add("is-match-mode");
  matchResultCard.classList.remove("is-hidden");
}

/* =========================
   Đọc file hồ sơ cá nhân Excel
========================= */

function isTruthyHasTerm(value) {
  const normalized = normalizeText(value);

  if (!normalized) return true;

  return ["1", "true", "yes", "y", "x", "co", "có"].includes(normalized);
}

function validateProfileColumns(rows) {
  if (!rows.length) {
    return {
      ok: false,
      missing: REQUIRED_PROFILE_COLUMNS
    };
  }

  const firstRowKeys = Object.keys(rows[0]).map((key) => normalizeText(key));

  const missing = REQUIRED_PROFILE_COLUMNS.filter(
    (columnName) => !firstRowKeys.includes(normalizeText(columnName))
  );

  return {
    ok: missing.length === 0,
    missing
  };
}

function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === "undefined") {
      reject(
        new Error(
          "Thiếu thư viện XLSX. Kiểm tra lại script CDN trong job-detail.html."
        )
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        /*
          Đọc sheet đầu tiên có dữ liệu.
          Không phụ thuộc tên file, không phụ thuộc tên sheet.
        */
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];

          const rows = XLSX.utils.sheet_to_json(worksheet, {
            defval: "",
            raw: false
          });

          if (rows.length) {
            resolve({ sheetName, rows });
            return;
          }
        }

        resolve({ sheetName: "", rows: [] });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Không thể đọc file Excel."));
    reader.readAsArrayBuffer(file);
  });
}

function collectProfileTerms(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const entityId = String(
      getFirstValue(row, ["entity_id", "ENTITY_ID"], "")
    ).trim();

    const kktType = String(
      getFirstValue(row, ["kkt_type", "KKT_TYPE"], "")
    )
      .toUpperCase()
      .trim();

    const canonicalName = normalizeSpaces(
      getFirstValue(row, ["canonical_name", "CANONICAL_NAME"], "")
    );

    /*
      Cấu trúc file hồ sơ cá nhân hiện tại KHÔNG bắt buộc has_term.
      Nếu có cột has_term thì hệ thống dùng để lọc.
      Nếu không có cột has_term thì mặc định dòng đó là thực thể đã có trong hồ sơ.
    */
    const hasTermValue = getFirstValue(row, ["has_term", "HAS_TERM"], "");

    if (hasTermValue && !isTruthyHasTerm(hasTermValue)) return;
    if (!kktType || !canonicalName) return;
    if (!isValidKktType(kktType)) return;

    const term = {
      entity_id: entityId,
      kkt_type: kktType,
      canonical_name: canonicalName,
      profile_id: getFirstValue(row, ["profile_id", "PROFILE_ID"], ""),
      course_id: getFirstValue(row, ["course_id", "COURSE_ID"], ""),
      course_name: getFirstValue(row, ["course_name", "COURSE_NAME"], ""),
      source_origin: getFirstValue(row, ["source_origin", "SOURCE_ORIGIN"], "")
    };

    const key = entityId
      ? buildEntityKey(term)
      : buildNameKey(term);

    if (!map.has(key)) {
      map.set(key, term);
    }
  });

  return Array.from(map.values());
}

/* =========================
   Đối sánh
========================= */

function isMatchedByProfile(jobTerm, profileNameKeys, profileEntityKeys) {
  const entityKey = buildEntityKey(jobTerm);
  const nameKey = buildNameKey(jobTerm);

  if (entityKey && profileEntityKeys.has(entityKey)) {
    return true;
  }

  return profileNameKeys.has(nameKey);
}

function renderMatchResult(jobTerms, matchedTerms, missingTerms) {
  const denominator = jobTerms.length;
  const numerator = matchedTerms.length;
  const percent = denominator
    ? Math.round((numerator / denominator) * 100)
    : 0;

  matchPercentEl.textContent = `${percent}%`;

  matchScoreLabelEl.textContent =
    percent >= 70
      ? "Mức độ phù hợp tương đối cao"
      : percent >= 40
        ? "Mức độ phù hợp tương đối trung bình"
        : "Mức độ phù hợp còn thấp";

  matchScoreSubtextEl.textContent =
    "Kết quả chỉ phản ánh mức độ trùng khớp dữ liệu K–S–T giữa hồ sơ cá nhân và tin tuyển dụng, không thay thế đánh giá toàn diện năng lực.";

  jobTermCountEl.textContent = String(denominator);
  matchedTermCountEl.textContent = String(numerator);
  missingTermCountEl.textContent = String(missingTerms.length);

  renderTermGroupBoxes(
    matchedGroupWrapEl,
    groupTermsByType(matchedTerms),
    "Chưa có mục nào trùng khớp.",
    true
  );

  renderTermGroupBoxes(
    missingGroupWrapEl,
    groupTermsByType(missingTerms),
    "Không có mục còn thiếu.",
    true
  );
}

function runMatching(profileTerms) {
  const profileNameKeys = new Set(profileTerms.map(buildNameKey));

  const profileEntityKeys = new Set(
    profileTerms
      .map(buildEntityKey)
      .filter(Boolean)
  );

  const matchedTerms = selectedJobTerms.filter((term) =>
    isMatchedByProfile(term, profileNameKeys, profileEntityKeys)
  );

  const missingTerms = selectedJobTerms.filter((term) =>
    !isMatchedByProfile(term, profileNameKeys, profileEntityKeys)
  );

  renderMatchResult(selectedJobTerms, matchedTerms, missingTerms);

  /*
    Quan trọng:
    Chỉ sau khi đối sánh thành công mới hiện khung "Kết quả đối sánh".
  */
  showMatchResultPanel();
}

/* =========================
   Load dữ liệu trang
========================= */

async function loadPageData() {
  const jobId = getQueryParam("id").trim();

  if (!jobId) {
    showEmptyState("Không tìm thấy mã tin tuyển dụng trên đường dẫn.");
    return;
  }

  try {
    const [
      coursesResult,
      jobsResult,
      entitiesResult,
      occurrencesResult
    ] = await Promise.all([
      fetchJsonFromCandidates(DATA_SOURCES.courses, {
        required: false,
        label: "COURSE.json"
      }),

      fetchJsonFromCandidates(DATA_SOURCES.jobs, {
        required: true,
        label: "JOB_POST.json hoặc jobs.json"
      }),

      fetchJsonFromCandidates(DATA_SOURCES.entities, {
        required: true,
        label: "KKT_ENTITY.json"
      }),

      fetchJsonFromCandidates(DATA_SOURCES.occurrences, {
        required: false,
        label: "KKT_OCCURRENCE.json hoặc job_kkt.json"
      })
    ]);

    allCourses = unwrapArray(coursesResult.data, [
      "COURSE",
      "course",
      "courses"
    ]);

    allJobs = unwrapArray(jobsResult.data, [
      "JOB_POST",
      "job_post",
      "jobs"
    ]);

    allEntities = unwrapArray(entitiesResult.data, [
      "KKT_ENTITY",
      "kkt_entity",
      "kkt_entities",
      "entities"
    ]);

    allOccurrences = unwrapArray(occurrencesResult.data, [
      "KKT_OCCURRENCE",
      "kkt_occurrence",
      "kkt_occurrences",
      "occurrences",
      "job_kkt"
    ]);

    buildEntityLookup();

    selectedJob = allJobs.find((job) => getJobId(job) === jobId);

    if (!selectedJob) {
      showEmptyState("Không tìm thấy tin tuyển dụng tương ứng.");
      return;
    }

    renderJobDetail(selectedJob);

    console.info("Đã tải dữ liệu job-detail:", {
      courses: allCourses.length,
      jobs: allJobs.length,
      entities: allEntities.length,
      occurrences: allOccurrences.length,
      selectedJobId: getJobId(selectedJob),
      selectedJobTerms: selectedJobTerms.length
    });
  } catch (error) {
    console.error(error);
    showEmptyState("Không thể tải dữ liệu chi tiết tin tuyển dụng.");
  }
}

/* =========================
   Event listeners
========================= */

openMatchBtn?.addEventListener("click", () => {
  openUploadPanelOnly();
});

profileExcelInput?.addEventListener("change", () => {
  const file = profileExcelInput.files?.[0];

  uploadStatusEl.textContent = file
    ? `Đã chọn file: ${file.name}`
    : "Chưa có file nào được chọn.";

  /*
    Khi chọn file mới, ẩn kết quả cũ để tránh hiểu nhầm.
  */
  matchResultCard.classList.add("is-hidden");
  jobDetailLayout.classList.remove("is-match-mode");
});

runMatchBtn?.addEventListener("click", async () => {
  const file = profileExcelInput.files?.[0];

  if (!file) {
    uploadStatusEl.textContent = "Vui lòng chọn file Excel hồ sơ cá nhân trước.";
    return;
  }

  try {
    uploadStatusEl.textContent = "Đang đọc file hồ sơ cá nhân...";

    const { sheetName, rows } = await readExcelFile(file);

    if (!rows.length) {
      uploadStatusEl.textContent = "File Excel không có dữ liệu.";
      return;
    }

    const validation = validateProfileColumns(rows);

    if (!validation.ok) {
      uploadStatusEl.textContent =
        `File chưa đúng cấu trúc hồ sơ cá nhân. Thiếu cột: ${validation.missing.join(", ")}`;
      return;
    }

    const profileTerms = collectProfileTerms(rows);

    if (!profileTerms.length) {
      uploadStatusEl.textContent =
        "Không tìm thấy thực thể K–S–T hợp lệ trong hồ sơ cá nhân.";
      return;
    }

    if (!selectedJobTerms.length) {
      uploadStatusEl.textContent =
        "Tin tuyển dụng này hiện chưa có dữ liệu K–S–T để đối sánh.";
      return;
    }

    runMatching(profileTerms);

    uploadStatusEl.textContent =
      `Đối sánh hoàn tất với ${profileTerms.length} thực thể K–S–T từ file hồ sơ cá nhân${sheetName ? `, sheet "${sheetName}"` : ""}.`;
  } catch (error) {
    console.error(error);
    uploadStatusEl.textContent =
      "Không thể xử lý file Excel. Vui lòng kiểm tra lại file.";
  }
});

loadPageData();
