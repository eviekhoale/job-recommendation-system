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

let allJobs = [];
let allJobKkt = [];
let selectedJob = null;
let selectedJobTerms = [];

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

function getFirstValue(obj, keys, fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
}

function getJobId(job) {
  return String(getFirstValue(job, ["job_id", "id", "job_code"], "")).trim();
}

function getJobTitle(job) {
  return getFirstValue(job, ["job_title", "title", "position_title", "job_name"], "Chưa có tên vị trí");
}

function getJobField(job) {
  return getFirstValue(job, ["industry", "field", "job_field", "linh_vuc"], "Chưa có lĩnh vực");
}

function getJobCompany(job) {
  return getFirstValue(job, ["company_name", "company", "employer", "company_code"], "Chưa có thông tin công ty");
}

function getJobSource(job) {
  return getFirstValue(job, ["source", "source_name"], "Chưa có nguồn");
}

function getJobDescription(job) {
  return getFirstValue(
    job,
    ["job_description", "description", "job_desc"],
    "Chưa có mô tả công việc."
  );
}

function getJobRequirement(job) {
  return getFirstValue(
    job,
    ["job_requirement", "job_requirements", "requirements"],
    "Chưa có yêu cầu công việc."
  );
}

function buildTermKey(term) {
  return `${normalizeText(term.kkt_type)}|${normalizeText(term.canonical_name)}`;
}

function formatBulletText(text) {
  return String(text || "").replace(/\n/g, "<br>");
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

function getUniqueJobTerms(jobId) {
  const map = new Map();

  allJobKkt
    .filter((item) => String(item.job_id).trim() === String(jobId).trim())
    .forEach((item) => {
      const term = {
        job_id: item.job_id,
        entity_id: item.entity_id,
        kkt_type: String(item.kkt_type || "").toUpperCase(),
        canonical_name: String(item.canonical_name || "").trim(),
        field: item.field || "",
        matched_term: item.matched_term || "",
        method: item.method || "",
        evidence_snippet: item.evidence_snippet || ""
      };

      if (!term.kkt_type || !term.canonical_name) return;

      const key = buildTermKey(term);
      if (!map.has(key)) map.set(key, term);
    });

  return Array.from(map.values()).sort((a, b) => {
    if (a.kkt_type !== b.kkt_type) return a.kkt_type.localeCompare(b.kkt_type);
    return a.canonical_name.localeCompare(b.canonical_name, "vi");
  });
}

function renderJobKstSummary(jobTerms) {
  const grouped = groupTermsByType(jobTerms);

  jobKstSummaryEl.innerHTML = `
    <div class="job-kst-box">
      <h4>Kiến thức (${grouped.K.length})</h4>
      ${
        grouped.K.length
          ? `<ul>${grouped.K.map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`).join("")}</ul>`
          : "<p>Không có dữ liệu.</p>"
      }
    </div>

    <div class="job-kst-box">
      <h4>Kỹ năng (${grouped.S.length})</h4>
      ${
        grouped.S.length
          ? `<ul>${grouped.S.map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`).join("")}</ul>`
          : "<p>Không có dữ liệu.</p>"
      }
    </div>

    <div class="job-kst-box">
      <h4>Công cụ (${grouped.T.length})</h4>
      ${
        grouped.T.length
          ? `<ul>${grouped.T.map((item) => `<li>${escapeHtml(item.canonical_name)}</li>`).join("")}</ul>`
          : "<p>Không có dữ liệu.</p>"
      }
    </div>
  `;
}

function renderJobDetail(job) {
  jobTitleEl.textContent = getJobTitle(job);
  jobFieldEl.textContent = getJobField(job);
  jobCompanyEl.textContent = getJobCompany(job);
  jobSourceEl.textContent = getJobSource(job);
  jobIdTextEl.textContent = getJobId(job);

  jobDescriptionEl.innerHTML = formatBulletText(getJobDescription(job));
  jobRequirementEl.innerHTML = formatBulletText(getJobRequirement(job));

  selectedJobTerms = getUniqueJobTerms(getJobId(job));
  renderJobKstSummary(selectedJobTerms);
}

function openMatchMode() {
  jobDetailLayout.classList.add("is-match-mode");
  profileUploadSection.classList.remove("is-hidden");
  matchResultCard.classList.remove("is-hidden");
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

function collectProfileTerms(rows) {
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

function renderMatchResult(jobTerms, matchedTerms, missingTerms) {
  const denominator = jobTerms.length;
  const numerator = matchedTerms.length;
  const percent = denominator ? Math.round((numerator / denominator) * 100) : 0;

  matchPercentEl.textContent = `${percent}%`;
  matchScoreLabelEl.textContent = percent >= 70
    ? "Mức độ phù hợp tương đối cao"
    : percent >= 40
      ? "Mức độ phù hợp tương đối trung bình"
      : "Mức độ phù hợp còn thấp";

  matchScoreSubtextEl.textContent =
    "Kết quả chỉ phản ánh mức độ trùng khớp dữ liệu K–S–T, không thay thế đánh giá toàn diện năng lực.";

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
  const profileTermKeys = new Set(profileTerms.map(buildTermKey));

  const matchedTerms = selectedJobTerms.filter((term) =>
    profileTermKeys.has(buildTermKey(term))
  );

  const missingTerms = selectedJobTerms.filter((term) =>
    !profileTermKeys.has(buildTermKey(term))
  );

  renderMatchResult(selectedJobTerms, matchedTerms, missingTerms);
}

async function loadPageData() {
  const jobId = getQueryParam("id").trim();

  if (!jobId) {
    emptyStateEl.classList.remove("is-hidden");
    document.querySelector(".job-detail-layout")?.classList.add("is-hidden");
    return;
  }

  try {
    const [jobsResponse, jobKktResponse] = await Promise.all([
      fetch("../data/jobs.json"),
      fetch("../data/job_kkt.json")
    ]);

    if (!jobsResponse.ok) throw new Error("Không thể tải jobs.json");
    if (!jobKktResponse.ok) throw new Error("Không thể tải job_kkt.json");

    const jobsData = await jobsResponse.json();
    const jobKktData = await jobKktResponse.json();

    allJobs = Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
    allJobKkt = Array.isArray(jobKktData) ? jobKktData : (jobKktData.job_kkt || []);

    selectedJob = allJobs.find((job) => getJobId(job) === jobId);

    if (!selectedJob) {
      emptyStateEl.classList.remove("is-hidden");
      document.querySelector(".job-detail-layout")?.classList.add("is-hidden");
      return;
    }

    renderJobDetail(selectedJob);
  } catch (error) {
    console.error(error);
    emptyStateEl.textContent = "Không thể tải dữ liệu chi tiết tin tuyển dụng.";
    emptyStateEl.classList.remove("is-hidden");
    document.querySelector(".job-detail-layout")?.classList.add("is-hidden");
  }
}

openMatchBtn?.addEventListener("click", () => {
  openMatchMode();
});

profileExcelInput?.addEventListener("change", () => {
  const file = profileExcelInput.files?.[0];
  uploadStatusEl.textContent = file
    ? `Đã chọn file: ${file.name}`
    : "Chưa có file nào được chọn.";
});

runMatchBtn?.addEventListener("click", async () => {
  const file = profileExcelInput.files?.[0];

  if (!file) {
    uploadStatusEl.textContent = "Vui lòng chọn file Excel hồ sơ cá nhân trước.";
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
    uploadStatusEl.textContent = `Đối sánh hoàn tất với ${profileTerms.length} thực thể K–S–T từ hồ sơ cá nhân.`;
  } catch (error) {
    console.error(error);
    uploadStatusEl.textContent = "Không thể xử lý file Excel. Vui lòng kiểm tra lại file.";
  }
});

loadPageData();
