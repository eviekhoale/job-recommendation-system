const requiredProfileColumns = [
  "profile_id",
  "course_id",
  "course_name",
  "kkt_type",
  "canonical_name",
  "has_term",
  "source_origin"
];

const TYPE_LABELS = {
  K: "Kiến thức",
  S: "Kỹ năng",
  T: "Công cụ"
};

const matchLayout = document.getElementById("matchLayout");

const jobTitleEl = document.getElementById("jobTitle");
const jobFieldEl = document.getElementById("jobField");
const jobCompanyEl = document.getElementById("jobCompany");
const jobDescriptionListEl = document.getElementById("jobDescriptionList");
const jobRequirementListEl = document.getElementById("jobRequirementList");

const toggleMatchBtn = document.getElementById("toggleMatchBtn");
const uploadSection = document.getElementById("uploadSection");
const profileFileInput = document.getElementById("profileFile");
const matchBtn = document.getElementById("matchBtn");
const fileStatus = document.getElementById("fileStatus");

const resultEmpty = document.getElementById("resultEmpty");
const resultContent = document.getElementById("resultContent");
const overallScore = document.getElementById("overallScore");
const scoreFormula = document.getElementById("scoreFormula");
const knowledgeStat = document.getElementById("knowledgeStat");
const skillStat = document.getElementById("skillStat");
const toolStat = document.getElementById("toolStat");
const matchedGroups = document.getElementById("matchedGroups");
const missingGroups = document.getElementById("missingGroups");

let selectedJob = null;
let selectedJobKKT = [];

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase();
}

function isTruthy(value) {
  const normalized = normalizeText(value);
  return ["true", "1", "yes", "y", "co", "có"].includes(normalized);
}

function toArrayBullets(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (!value) return [];

  return String(value)
    .split(/\n|•|;| - /g)
    .map(item => item.trim())
    .filter(Boolean);
}

function uniqueByKey(items, keyFn) {
  const map = new Map();

  items.forEach(item => {
    const key = keyFn(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

function normalizeJob(rawJob, index) {
  return {
    id:
      rawJob.job_id ||
      rawJob.id ||
      rawJob.ma_tin ||
      `job${String(index + 1).padStart(3, "0")}`,

    title:
      rawJob.job_title ||
      rawJob.title ||
      rawJob.ten_vi_tri ||
      rawJob.position ||
      "Chưa có tiêu đề",

    field:
      rawJob.field ||
      rawJob.industry ||
      rawJob.linh_vuc ||
      rawJob.job_field ||
      "Chưa phân lĩnh vực",

    company:
      rawJob.company ||
      rawJob.company_name ||
      rawJob.ten_cong_ty ||
      "Chưa có tên công ty",

    descriptionBullets: toArrayBullets(
      rawJob.descriptionBullets ||
      rawJob.description ||
      rawJob.job_description ||
      rawJob.mo_ta
    ),

    requirementBullets: toArrayBullets(
      rawJob.requirementBullets ||
      rawJob.requirements ||
      rawJob.job_requirements ||
      rawJob.yeu_cau
    )
  };
}

function normalizeJobKKT(rawItem) {
  return {
    job_id: rawItem.job_id || rawItem.id || rawItem.ma_tin || "",
    kkt_type: String(rawItem.kkt_type || rawItem.type || "").trim().toUpperCase(),
    canonical_name: String(rawItem.canonical_name || rawItem.name || rawItem.term || "").trim(),
    has_term: typeof rawItem.has_term === "undefined" ? true : rawItem.has_term
  };
}

function renderBulletList(targetEl, items) {
  targetEl.innerHTML = items.map(item => `<li>${item}</li>`).join("");
}

function buildTagGroupsHTML(groupedData, className) {
  return ["K", "S", "T"]
    .map(type => {
      const items = groupedData[type] || [];
      return `
        <div class="group-section">
          <div class="group-title">${TYPE_LABELS[type]}</div>
          ${
            items.length
              ? `<div class="tag-list">
                  ${items.map(item => `<span class="result-tag ${className}">${item.canonical_name}</span>`).join("")}
                </div>`
              : `<div class="empty-tag">Không có mục nào.</div>`
          }
        </div>
      `;
    })
    .join("");
}

function renderJobDetail(job) {
  jobTitleEl.textContent = job.title;
  jobFieldEl.textContent = job.field;
  jobCompanyEl.textContent = job.company;
  renderBulletList(jobDescriptionListEl, job.descriptionBullets);
  renderBulletList(jobRequirementListEl, job.requirementBullets);
}

async function loadSelectedJob() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id");

  if (!jobId) {
    throw new Error("Thiếu mã tin tuyển dụng trên URL.");
  }

  const [jobsResponse, jobKktResponse] = await Promise.all([
    fetch("../data/jobs.json"),
    fetch("../data/job_kkt.json")
  ]);

  if (!jobsResponse.ok) {
    throw new Error("Không đọc được file jobs.json");
  }

  if (!jobKktResponse.ok) {
    throw new Error("Không đọc được file job_kkt.json");
  }

  const rawJobs = await jobsResponse.json();
  const rawJobKkt = await jobKktResponse.json();

  const jobs = Array.isArray(rawJobs) ? rawJobs.map(normalizeJob) : [];
  const allJobKKT = Array.isArray(rawJobKkt) ? rawJobKkt.map(normalizeJobKKT) : [];

  selectedJob = jobs.find(job => String(job.id) === String(jobId));

  if (!selectedJob) {
    throw new Error("Không tìm thấy tin tuyển dụng tương ứng.");
  }

  selectedJobKKT = allJobKKT.filter(item => {
    return (
      String(item.job_id) === String(jobId) &&
      ["K", "S", "T"].includes(item.kkt_type) &&
      item.canonical_name &&
      isTruthy(item.has_term)
    );
  });

  selectedJobKKT = uniqueByKey(
    selectedJobKKT,
    item => `${item.kkt_type}|||${normalizeText(item.canonical_name)}`
  );

  renderJobDetail(selectedJob);
}

async function parseProfileExcel(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  const normalizedRows = rawRows.map(row => {
    const normalizedRow = {};
    Object.keys(row).forEach(key => {
      normalizedRow[normalizeHeader(key)] = row[key];
    });
    return normalizedRow;
  });

  const firstRow = normalizedRows[0] || {};
  const missingColumns = requiredProfileColumns.filter(col => !(col in firstRow));

  if (missingColumns.length) {
    throw new Error(`File thiếu các cột bắt buộc: ${missingColumns.join(", ")}`);
  }

  const validRows = normalizedRows
    .map(row => ({
      profile_id: row.profile_id,
      course_id: row.course_id,
      course_name: row.course_name,
      kkt_type: String(row.kkt_type || "").trim().toUpperCase(),
      canonical_name: String(row.canonical_name || "").trim(),
      has_term: row.has_term,
      source_origin: row.source_origin
    }))
    .filter(row => {
      return (
        row.canonical_name &&
        ["K", "S", "T"].includes(row.kkt_type) &&
        isTruthy(row.has_term)
      );
    });

  return uniqueByKey(
    validRows,
    row => `${row.kkt_type}|||${normalizeText(row.canonical_name)}`
  );
}

function calculateMatch(profileItems, jobItems) {
  const profileSet = new Set(
    profileItems.map(item => `${item.kkt_type}|||${normalizeText(item.canonical_name)}`)
  );

  const groupedMatched = { K: [], S: [], T: [] };
  const groupedMissing = { K: [], S: [], T: [] };

  let matchedCount = 0;

  jobItems.forEach(item => {
    const key = `${item.kkt_type}|||${normalizeText(item.canonical_name)}`;

    if (profileSet.has(key)) {
      groupedMatched[item.kkt_type].push(item);
      matchedCount += 1;
    } else {
      groupedMissing[item.kkt_type].push(item);
    }
  });

  const totalRequirements = jobItems.length;
  const percentage = totalRequirements === 0
    ? 0
    : (matchedCount / totalRequirements) * 100;

  return {
    matchedCount,
    totalRequirements,
    percentage,
    groupedMatched,
    groupedMissing,
    statByType: {
      K: {
        matched: groupedMatched.K.length,
        total: groupedMatched.K.length + groupedMissing.K.length
      },
      S: {
        matched: groupedMatched.S.length,
        total: groupedMatched.S.length + groupedMissing.S.length
      },
      T: {
        matched: groupedMatched.T.length,
        total: groupedMatched.T.length + groupedMissing.T.length
      }
    }
  };
}

function renderMatchResult(result) {
  resultEmpty.classList.add("hidden");
  resultContent.classList.remove("hidden");

  overallScore.textContent = `${result.percentage.toFixed(1)}%`;
  scoreFormula.textContent = `${result.matchedCount} / ${result.totalRequirements} thực thể K-S-T trùng khớp`;

  knowledgeStat.textContent = `${result.statByType.K.matched} / ${result.statByType.K.total}`;
  skillStat.textContent = `${result.statByType.S.matched} / ${result.statByType.S.total}`;
  toolStat.textContent = `${result.statByType.T.matched} / ${result.statByType.T.total}`;

  matchedGroups.innerHTML = buildTagGroupsHTML(result.groupedMatched, "success");
  missingGroups.innerHTML = buildTagGroupsHTML(result.groupedMissing, "missing");
}

toggleMatchBtn.addEventListener("click", () => {
  const isCompareMode = matchLayout.classList.contains("is-compare-mode");

  if (isCompareMode) {
    matchLayout.classList.remove("is-compare-mode");
    uploadSection.classList.add("hidden");
    toggleMatchBtn.textContent = "Đối sánh với hồ sơ của tôi";
  } else {
    matchLayout.classList.add("is-compare-mode");
    uploadSection.classList.remove("hidden");
    toggleMatchBtn.textContent = "Ẩn đối sánh";
  }
});

matchBtn.addEventListener("click", async () => {
  const file = profileFileInput.files[0];

  if (!file) {
    fileStatus.textContent = "Vui lòng chọn file Excel hồ sơ cá nhân trước khi đối sánh.";
    return;
  }

  if (!selectedJobKKT.length) {
    fileStatus.textContent = "Tin tuyển dụng này chưa có dữ liệu K-S-T trong file job_kkt.json.";
    return;
  }

  fileStatus.textContent = "Đang đọc file và thực hiện đối sánh...";

  try {
    const profileItems = await parseProfileExcel(file);
    const result = calculateMatch(profileItems, selectedJobKKT);

    fileStatus.textContent = `Đã đọc ${profileItems.length} thực thể K-S-T hợp lệ từ hồ sơ cá nhân.`;
    renderMatchResult(result);
  } catch (error) {
    console.error(error);
    fileStatus.textContent = error.message || "Có lỗi khi xử lý file hồ sơ.";
  }
});

loadSelectedJob().catch(error => {
  console.error(error);
  jobTitleEl.textContent = "Không thể tải chi tiết tin tuyển dụng";
  jobFieldEl.textContent = "-";
  jobCompanyEl.textContent = "-";
  jobDescriptionListEl.innerHTML = `<li>${error.message}</li>`;
  jobRequirementListEl.innerHTML = `<li>Vui lòng kiểm tra lại jobs.json, job_kkt.json và tham số id trên URL.</li>`;
});
