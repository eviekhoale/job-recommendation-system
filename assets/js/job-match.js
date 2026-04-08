const JOBS = [
  {
    id: "job001",
    title: "Quản trị cơ sở dữ liệu",
    field: "Công nghệ thông tin - truyền thông",
    company: "Công ty Dữ liệu Minh An",
    descriptionBullets: [
      "Tham gia quản trị, duy trì và tối ưu cơ sở dữ liệu phục vụ hoạt động vận hành của tổ chức.",
      "Hỗ trợ kiểm tra tính nhất quán dữ liệu, đảm bảo dữ liệu được lưu trữ và khai thác hiệu quả.",
      "Phối hợp với các bộ phận liên quan để thực hiện truy vấn, cập nhật và quản lý dữ liệu."
    ],
    requirementBullets: [
      "Có kiến thức nền tảng về cơ sở dữ liệu và mô hình dữ liệu.",
      "Biết sử dụng SQL để truy vấn và thao tác dữ liệu.",
      "Có khả năng thiết kế, thao tác cơ sở dữ liệu cơ bản.",
      "Biết sử dụng công cụ hỗ trợ quản trị cơ sở dữ liệu."
    ]
  },
  {
    id: "job002",
    title: "Phân tích dữ liệu",
    field: "Công nghệ thông tin - truyền thông",
    company: "Công ty Phân tích Tri Thức",
    descriptionBullets: [
      "Thu thập, xử lý và phân tích dữ liệu phục vụ báo cáo và ra quyết định.",
      "Phối hợp xây dựng bộ chỉ số và trực quan hóa dữ liệu cho các đơn vị chuyên môn.",
      "Hỗ trợ chuẩn hóa dữ liệu trước khi đưa vào khai thác."
    ],
    requirementBullets: [
      "Có kiến thức về dữ liệu và quy trình phân tích dữ liệu.",
      "Có kỹ năng xử lý dữ liệu và sử dụng SQL cơ bản.",
      "Biết sử dụng công cụ hỗ trợ quản lý và khai thác dữ liệu."
    ]
  },
  {
    id: "job003",
    title: "Quản lý hồ sơ",
    field: "Quản lý",
    company: "Trung tâm Hành chính Nam Việt",
    descriptionBullets: [
      "Tổ chức, sắp xếp và quản lý hồ sơ tài liệu trong đơn vị.",
      "Phối hợp kiểm tra, cập nhật và theo dõi tình trạng hồ sơ.",
      "Hỗ trợ vận hành các quy trình liên quan đến hồ sơ và văn bản."
    ],
    requirementBullets: [
      "Có kiến thức cơ bản về hồ sơ và tài liệu.",
      "Có kỹ năng quản lý, phân loại và sắp xếp hồ sơ.",
      "Biết sử dụng công cụ hỗ trợ lưu trữ và xử lý hồ sơ."
    ]
  }
];

/*
  Bộ từ khóa nhận diện K-S-T từ nội dung tin tuyển dụng.
  Đây không phải dữ liệu hồ sơ học phần.
  Nó chỉ là từ điển nhận diện đơn giản để demo hệ thống.
*/
const JOB_TERM_LEXICON = {
  K: [
    { canonical: "Cơ sở dữ liệu", aliases: ["cơ sở dữ liệu", "database"] },
    { canonical: "Kiến trúc và mô hình dữ liệu", aliases: ["mô hình dữ liệu", "kiến trúc dữ liệu", "data model"] },
    { canonical: "SQL", aliases: ["sql"] },
    { canonical: "Dữ liệu", aliases: ["dữ liệu", "data"] },
    { canonical: "Hồ sơ", aliases: ["hồ sơ"] },
    { canonical: "Tài liệu", aliases: ["tài liệu", "văn bản"] },
    { canonical: "Lưu trữ", aliases: ["lưu trữ", "lưu giữ"] }
  ],
  S: [
    { canonical: "Thiết kế và thao tác cơ sở dữ liệu cơ bản", aliases: ["thiết kế cơ sở dữ liệu", "thao tác cơ sở dữ liệu"] },
    { canonical: "Sử dụng SQL cơ bản", aliases: ["sử dụng sql", "truy vấn sql", "viết sql"] },
    { canonical: "Phân tích dữ liệu", aliases: ["phân tích dữ liệu"] },
    { canonical: "Xử lý dữ liệu", aliases: ["xử lý dữ liệu", "chuẩn hóa dữ liệu"] },
    { canonical: "Quản lý hồ sơ", aliases: ["quản lý hồ sơ", "theo dõi hồ sơ"] },
    { canonical: "Phân loại tài liệu", aliases: ["phân loại tài liệu"] },
    { canonical: "Sắp xếp hồ sơ", aliases: ["sắp xếp hồ sơ"] }
  ],
  T: [
    { canonical: "Microsoft SQL Server Management Studio", aliases: ["sql server management studio", "ssms"] },
    { canonical: "Microsoft Excel", aliases: ["excel", "microsoft excel"] },
    { canonical: "Power BI", aliases: ["power bi"] }
  ]
};

const TYPE_LABELS = {
  K: "Kiến thức",
  S: "Kỹ năng",
  T: "Công cụ"
};

const requiredProfileColumns = [
  "profile_id",
  "course_id",
  "course_name",
  "kkt_type",
  "canonical_name",
  "has_term",
  "source_origin"
];

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

function renderBulletList(targetEl, items) {
  targetEl.innerHTML = items.map(item => `<li>${item}</li>`).join("");
}

function getSelectedJob() {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("id") || "job001";
  return JOBS.find(job => job.id === jobId) || JOBS[0];
}

const selectedJob = getSelectedJob();

function renderJobDetail(job) {
  jobTitleEl.textContent = job.title;
  jobFieldEl.textContent = job.field;
  jobCompanyEl.textContent = job.company;
  renderBulletList(jobDescriptionListEl, job.descriptionBullets);
  renderBulletList(jobRequirementListEl, job.requirementBullets);
}

function extractJobKSTFromText(job) {
  const fullText = normalizeText(
    [...job.descriptionBullets, ...job.requirementBullets].join(" ")
  );

  const extracted = [];

  Object.entries(JOB_TERM_LEXICON).forEach(([type, terms]) => {
    terms.forEach(term => {
      const matched = term.aliases.some(alias =>
        fullText.includes(normalizeText(alias))
      );

      if (matched) {
        extracted.push({
          type,
          name: term.canonical
        });
      }
    });
  });

  return uniqueByKey(extracted, item => `${item.type}|||${normalizeText(item.name)}`);
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

function calculateMatch(profileItems, jobTerms) {
  const profileSet = new Set(
    profileItems.map(item => `${item.kkt_type}|||${normalizeText(item.canonical_name)}`)
  );

  const groupedMatched = { K: [], S: [], T: [] };
  const groupedMissing = { K: [], S: [], T: [] };

  let matchedCount = 0;

  jobTerms.forEach(term => {
    const key = `${term.type}|||${normalizeText(term.name)}`;
    if (profileSet.has(key)) {
      groupedMatched[term.type].push(term);
      matchedCount += 1;
    } else {
      groupedMissing[term.type].push(term);
    }
  });

  const totalRequirements = jobTerms.length;
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
                  ${items
                    .map(item => `<span class="result-tag ${className}">${item.name}</span>`)
                    .join("")}
                </div>`
              : `<div class="empty-tag">Không có mục nào.</div>`
          }
        </div>
      `;
    })
    .join("");
}

function renderMatchResult(result) {
  resultEmpty.classList.add("hidden");
  resultContent.classList.remove("hidden");

  overallScore.textContent = `${result.percentage.toFixed(1)}%`;
  scoreFormula.textContent =
    `${result.matchedCount} / ${result.totalRequirements} thực thể K-S-T trùng khớp`;

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

  fileStatus.textContent = "Đang đọc file và thực hiện đối sánh...";

  try {
    const profileItems = await parseProfileExcel(file);
    const extractedJobTerms = extractJobKSTFromText(selectedJob);

    if (!extractedJobTerms.length) {
      throw new Error(
        "Hệ thống chưa nhận diện được thực thể K-S-T nào từ nội dung tin tuyển dụng này."
      );
    }

    const result = calculateMatch(profileItems, extractedJobTerms);

    fileStatus.textContent =
      `Đã đọc ${profileItems.length} thực thể K-S-T hợp lệ từ hồ sơ cá nhân và nhận diện ${extractedJobTerms.length} thực thể từ tin tuyển dụng.`;

    renderMatchResult(result);
  } catch (error) {
    fileStatus.textContent = error.message || "Có lỗi khi xử lý file hồ sơ.";
  }
});

renderJobDetail(selectedJob);
