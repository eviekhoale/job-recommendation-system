const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const REPORTS_DIR = path.join(__dirname, "..", "reports");

const JOBS_PATH = path.join(DATA_DIR, "jobs.json");
const JOB_KKT_PATH = path.join(DATA_DIR, "job_kkt.json");
const OUTPUT_PATH = path.join(DATA_DIR, "position_profiles.json");
const AUDIT_PATH = path.join(REPORTS_DIR, "position-profile-audit.json");

/**
 * Danh mục 44 hồ sơ vị trí đã được chuẩn hóa từ bảng thống kê sau xử lý.
 *
 * Lưu ý:
 * - Tool đọc data/jobs.json và data/job_kkt.json để tạo data/position_profiles.json.
 * - data/job_kkt.json nên là file đã được làm giàu nếu có bước scripts/enrich_job_kkt.py.
 * - Tool không tự tạo K–S–T mới; chỉ tổng hợp K–S–T đã có trong job_kkt.json.
 */
const POSITION_PROFILE_CATALOG = [
  {
    position_name: "Data Analyst / BI Analyst",
    job_group: "Phân tích dữ liệu & BI",
    job_ids: [
      "JD052", "JD053", "JD086", "JD087", "JD088", "JD125", "JD126",
      "JD128", "JD131", "JD137", "JD139", "JD144", "JD173", "JD174",
      "JD182", "JD183", "JD186", "JD189", "JD191", "JD192", "JD199",
      "JD201", "JD202", "JD203", "JD204", "JD207", "JD212", "JD223"
    ]
  },
  {
    position_name: "Project Management / Project Coordinator",
    job_group: "Quản lý dự án",
    job_ids: [
      "JD040", "JD067", "JD069", "JD071", "JD075", "JD102", "JD104",
      "JD117", "JD118", "JD119", "JD120", "JD136", "JD175", "JD179",
      "JD180", "JD184", "JD211", "JD229", "JD230", "JD231", "JD232",
      "JD233", "JD234", "JD235", "JD236", "JD237", "JD238", "JD239"
    ]
  },
  {
    position_name: "Business Analyst",
    job_group: "Phân tích nghiệp vụ",
    job_ids: [
      "JD015", "JD017", "JD048", "JD051", "JD090", "JD091", "JD092",
      "JD093", "JD112", "JD114", "JD124", "JD138", "JD140", "JD143",
      "JD164", "JD185", "JD205", "JD206", "JD215", "JD216", "JD217"
    ]
  },
  {
    position_name: "HR / Administrative HR",
    job_group: "Nhân sự - hành chính nhân sự",
    job_ids: [
      "JD035", "JD036", "JD039", "JD049", "JD050", "JD057", "JD063",
      "JD066", "JD073", "JD078", "JD081", "JD082", "JD121", "JD129",
      "JD142", "JD149", "JD151", "JD152", "JD178"
    ]
  },
  {
    position_name: "Market Research / Research Executive",
    job_group: "Nghiên cứu thị trường",
    job_ids: [
      "JD083", "JD084", "JD101", "JD106", "JD107", "JD141", "JD154",
      "JD155", "JD156", "JD167", "JD169", "JD190", "JD210", "JD218",
      "JD228"
    ]
  },
  {
    position_name: "Administrative Officer / Admin",
    job_group: "Hành chính văn phòng",
    job_ids: [
      "JD016", "JD028", "JD033", "JD041", "JD042", "JD044", "JD045",
      "JD056", "JD080", "JD134", "JD165"
    ]
  },
  {
    position_name: "Digital Marketing / Communications",
    job_group: "Marketing số & truyền thông",
    job_ids: [
      "JD058", "JD059", "JD076", "JD077", "JD079", "JD097", "JD098",
      "JD105", "JD132"
    ]
  },
  {
    position_name: "Product / Product Owner",
    job_group: "Quản lý sản phẩm",
    job_ids: [
      "JD113", "JD133", "JD145", "JD146", "JD147", "JD170", "JD171",
      "JD172", "JD240"
    ]
  },
  {
    position_name: "Customer Service Officer",
    job_group: "Dịch vụ khách hàng",
    job_ids: [
      "JD037", "JD061", "JD062", "JD064", "JD085", "JD115", "JD135",
      "JD163"
    ]
  },
  {
    position_name: "Data Scientist / AI Specialist",
    job_group: "Khoa học dữ liệu & AI",
    job_ids: [
      "JD029", "JD187", "JD188", "JD193", "JD197", "JD198", "JD200",
      "JD222"
    ]
  },
  {
    position_name: "Data Operations / Reporting Analyst",
    job_group: "Vận hành dữ liệu & báo cáo",
    job_ids: [
      "JD021", "JD095", "JD123", "JD181", "JD194", "JD208", "JD221"
    ]
  },
  {
    position_name: "Information Security / SOC / Risk",
    job_group: "An toàn thông tin & rủi ro",
    job_ids: [
      "JD072", "JD094", "JD127", "JD162", "JD213", "JD219", "JD220"
    ]
  },
  {
    position_name: "Sales / Business Development / Commercial",
    job_group: "Kinh doanh & phát triển thị trường",
    job_ids: [
      "JD055", "JD068", "JD122", "JD157", "JD158", "JD160", "JD195"
    ]
  },
  {
    position_name: "Business Operations / Digital Transformation",
    job_group: "Vận hành kinh doanh & chuyển đổi số",
    job_ids: [
      "JD060", "JD089", "JD103", "JD116", "JD161", "JD214"
    ]
  },
  {
    position_name: "Database / Master Data Administrator",
    job_group: "Cơ sở dữ liệu & master data",
    job_ids: [
      "JD031", "JD100", "JD150", "JD224", "JD226", "JD227"
    ]
  },
  {
    position_name: "Web / Software Developer",
    job_group: "Phát triển phần mềm / web",
    job_ids: [
      "JD023", "JD099", "JD153", "JD176", "JD177", "JD196"
    ]
  },
  {
    position_name: "IT Staff / General IT Support",
    job_group: "CNTT tổng quát",
    job_ids: [
      "JD020", "JD159", "JD166"
    ]
  },
  {
    position_name: "Project Development Specialist",
    job_group: "Phát triển dự án",
    job_ids: [
      "JD014", "JD074", "JD130"
    ]
  },
  {
    position_name: "UI/UX / Web Graphic Designer",
    job_group: "Thiết kế giao diện & đồ họa số",
    job_ids: [
      "JD026", "JD065", "JD168"
    ]
  },
  {
    position_name: "Business Analyst (Finance/Accounting domain)",
    job_group: "Phân tích nghiệp vụ",
    job_ids: [
      "JD005", "JD054"
    ]
  },
  {
    position_name: "Construction Supervisor",
    job_group: "Giám sát xây dựng",
    job_ids: [
      "JD004", "JD008"
    ]
  },
  {
    position_name: "Data Engineer",
    job_group: "Kỹ sư dữ liệu",
    job_ids: [
      "JD022", "JD225"
    ]
  },
  {
    position_name: "Financial Analyst / Strategy Analyst",
    job_group: "Phân tích tài chính & chiến lược",
    job_ids: [
      "JD070", "JD209"
    ]
  },
  {
    position_name: "IT Support",
    job_group: "Hỗ trợ CNTT",
    job_ids: [
      "JD002", "JD241"
    ]
  },
  {
    position_name: "Order Management / Merchandiser",
    job_group: "Quản lý đơn hàng / merchandising",
    job_ids: [
      "JD046", "JD047"
    ]
  },
  {
    position_name: "PLC / Embedded Engineer",
    job_group: "Kỹ sư hệ thống nhúng / PLC",
    job_ids: [
      "JD010", "JD110"
    ]
  },
  {
    position_name: "QA Staff",
    job_group: "Kiểm soát chất lượng / QA",
    job_ids: [
      "JD003", "JD007"
    ]
  },
  {
    position_name: "Software Implementation Specialist",
    job_group: "Triển khai phần mềm",
    job_ids: [
      "JD030", "JD108"
    ]
  },
  {
    position_name: "Technical Project Assistant",
    job_group: "Hỗ trợ kỹ thuật dự án",
    job_ids: [
      "JD011", "JD013"
    ]
  },
  {
    position_name: "Training Staff",
    job_group: "Đào tạo & phát triển",
    job_ids: [
      "JD038", "JD096"
    ]
  },
  {
    position_name: "Web Designer",
    job_group: "Thiết kế web",
    job_ids: [
      "JD025", "JD148"
    ]
  },
  {
    position_name: "AI Engineer",
    job_group: "AI / Machine Learning",
    job_ids: [
      "JD009"
    ]
  },
  {
    position_name: "Business Assistant",
    job_group: "Trợ lý kinh doanh",
    job_ids: [
      "JD043"
    ]
  },
  {
    position_name: "Executive Assistant / Management Support",
    job_group: "Trợ lý điều hành",
    job_ids: [
      "JD109"
    ]
  },
  {
    position_name: "Financial Data Governance Specialist",
    job_group: "Quản trị dữ liệu tài chính",
    job_ids: [
      "JD019"
    ]
  },
  {
    position_name: "IT Administrator",
    job_group: "Quản trị CNTT",
    job_ids: [
      "JD006"
    ]
  },
  {
    position_name: "Manual Tester",
    job_group: "Kiểm thử phần mềm",
    job_ids: [
      "JD032"
    ]
  },
  {
    position_name: "NodeJS Developer",
    job_group: "Phát triển phần mềm",
    job_ids: [
      "JD027"
    ]
  },
  {
    position_name: "PLM & MES Manager",
    job_group: "Quản lý hệ thống sản xuất",
    job_ids: [
      "JD012"
    ]
  },
  {
    position_name: "Payment Gateway Systems Operations Specialist",
    job_group: "Vận hành hệ thống",
    job_ids: [
      "JD018"
    ]
  },
  {
    position_name: "Project Secretary",
    job_group: "Thư ký dự án",
    job_ids: [
      "JD034"
    ]
  },
  {
    position_name: "Solar Performance Analysis & Monitoring",
    job_group: "Phân tích & giám sát vận hành",
    job_ids: [
      "JD001"
    ]
  },
  {
    position_name: "Systems Administrator",
    job_group: "Quản trị hệ thống",
    job_ids: [
      "JD024"
    ]
  },
  {
    position_name: "Web Administrator / Website Operations",
    job_group: "Quản trị website",
    job_ids: [
      "JD111"
    ]
  }
];

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Không tìm thấy file: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  if (Array.isArray(data)) return data;

  return (
    data.jobs ||
    data.job_kkt ||
    data.position_profiles ||
    data.profiles ||
    data.data ||
    []
  );
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s#+./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function getJobId(job) {
  return String(
    getFirstValue(job, ["job_id", "id", "job_code", "Mã tin"], "")
  ).trim();
}

function getJobTitle(job) {
  return String(
    getFirstValue(
      job,
      ["job_title", "title", "position_title", "job_name", "Tiêu đề việc làm"],
      ""
    )
  ).trim();
}

function getJobField(job) {
  return String(
    getFirstValue(
      job,
      ["industry", "field", "job_field", "linh_vuc", "Lĩnh vực (theo khoa)"],
      ""
    )
  ).trim();
}

function buildTermKey(term) {
  const entityId = normalizeText(term.entity_id || "");
  const type = normalizeText(term.kkt_type || "");
  const name = normalizeText(term.canonical_name || "");

  return entityId ? `${entityId}|${type}|${name}` : `${type}|${name}`;
}

function buildJobMap(jobs) {
  const map = new Map();

  jobs.forEach((job) => {
    const jobId = getJobId(job);
    if (!jobId) return;
    map.set(jobId, job);
  });

  return map;
}

function buildTermsByJob(jobKktRows) {
  const termsByJob = new Map();

  jobKktRows.forEach((row) => {
    const sourceType = String(row.source_type || "").toUpperCase().trim();

    // Nếu job_kkt.json còn source_type thì chỉ lấy JOB.
    // Nếu không có source_type, mặc định toàn bộ file đã là K–S–T của job.
    if (sourceType && sourceType !== "JOB") return;

    const jobId = String(
      getFirstValue(row, ["job_id", "Mã tin"], "")
    ).trim();

    const kktType = String(
      getFirstValue(row, ["kkt_type", "type", "Loại"], "")
    )
      .toUpperCase()
      .trim();

    const canonicalName = String(
      getFirstValue(
        row,
        ["canonical_name", "canonical", "name", "Tên chuẩn (Canonical)"],
        ""
      )
    ).trim();

    const entityId = String(
      getFirstValue(row, ["entity_id", "Mã thực thể"], "")
    ).trim();

    const field = String(
      getFirstValue(row, ["field"], "")
    ).trim();

    const matchedTerm = String(
      getFirstValue(row, ["matched_term"], "")
    ).trim();

    const method = String(
      getFirstValue(row, ["method"], "")
    ).trim();

    const evidenceSnippet = String(
      getFirstValue(row, ["evidence_snippet"], "")
    ).trim();

    const coverageStatus = String(
      getFirstValue(row, ["coverage_status"], "")
    ).trim();

    if (!jobId) return;
    if (!["K", "S", "T"].includes(kktType)) return;
    if (!canonicalName) return;

    if (!termsByJob.has(jobId)) {
      termsByJob.set(jobId, new Map());
    }

    const term = {
      entity_id: entityId,
      kkt_type: kktType,
      canonical_name: canonicalName,
      field,
      matched_term: matchedTerm,
      method,
      evidence_snippet: evidenceSnippet,
      coverage_status: coverageStatus
    };

    const termKey = buildTermKey(term);

    // Trong cùng một job, một K–S–T chỉ tính một lần.
    if (!termsByJob.get(jobId).has(termKey)) {
      termsByJob.get(jobId).set(termKey, term);
    }
  });

  return termsByJob;
}

function getDominantMajorField(jobIds, jobMap) {
  const countMap = new Map();

  jobIds.forEach((jobId) => {
    const job = jobMap.get(jobId);
    if (!job) return;

    const field = getJobField(job);
    if (!field) return;

    countMap.set(field, (countMap.get(field) || 0) + 1);
  });

  const entries = Array.from(countMap.entries());

  if (!entries.length) return "Chưa xác định";

  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "vi");
  });

  return entries[0][0];
}

function buildAliases(jobIds, jobMap) {
  const aliases = new Set();

  jobIds.forEach((jobId) => {
    const job = jobMap.get(jobId);
    if (!job) return;

    const title = getJobTitle(job);
    if (title) aliases.add(title);
  });

  return Array.from(aliases).sort((a, b) => a.localeCompare(b, "vi"));
}

function buildKktList(jobIds, termsByJob) {
  const termMap = new Map();

  jobIds.forEach((jobId) => {
    const jobTerms = termsByJob.get(jobId);
    if (!jobTerms) return;

    jobTerms.forEach((term) => {
      const termKey = buildTermKey(term);

      if (!termMap.has(termKey)) {
        termMap.set(termKey, {
          entity_id: term.entity_id || "",
          kkt_type: term.kkt_type,
          canonical_name: term.canonical_name,
          job_count: 0,
          job_ids: new Set(),
          evidence_examples: []
        });
      }

      const savedTerm = termMap.get(termKey);

      if (!savedTerm.job_ids.has(jobId)) {
        savedTerm.job_ids.add(jobId);
        savedTerm.job_count += 1;
      }

      if (
        term.evidence_snippet &&
        savedTerm.evidence_examples.length < 3
      ) {
        savedTerm.evidence_examples.push({
          job_id: jobId,
          field: term.field || "",
          matched_term: term.matched_term || "",
          method: term.method || "",
          coverage_status: term.coverage_status || "",
          evidence_snippet: term.evidence_snippet
        });
      }
    });
  });

  return Array.from(termMap.values())
    .map((term) => ({
      entity_id: term.entity_id,
      kkt_type: term.kkt_type,
      canonical_name: term.canonical_name,
      job_count: term.job_count,
      evidence_examples: term.evidence_examples
    }))
    .sort((a, b) => {
      if (a.kkt_type !== b.kkt_type) {
        return a.kkt_type.localeCompare(b.kkt_type);
      }

      if (b.job_count !== a.job_count) {
        return b.job_count - a.job_count;
      }

      return a.canonical_name.localeCompare(b.canonical_name, "vi");
    });
}

function countByKktType(kktList, type) {
  return kktList.filter((item) => item.kkt_type === type).length;
}

function buildPositionProfiles(jobs, jobKktRows) {
  const jobMap = buildJobMap(jobs);
  const termsByJob = buildTermsByJob(jobKktRows);

  const profiles = POSITION_PROFILE_CATALOG.map((catalogItem, index) => {
    const sourceJobIds = Array.from(new Set(catalogItem.job_ids));
    const foundJobIds = sourceJobIds.filter((jobId) => jobMap.has(jobId));
    const missingJobIds = sourceJobIds.filter((jobId) => !jobMap.has(jobId));

    const jobsWithKktIds = foundJobIds.filter((jobId) => termsByJob.has(jobId));
    const jobsWithoutKktIds = foundJobIds.filter((jobId) => !termsByJob.has(jobId));

    const kktList = buildKktList(foundJobIds, termsByJob);

    return {
      position_id: `PP${String(index + 1).padStart(3, "0")}`,
      order: index + 1,

      position_name: catalogItem.position_name,
      field: catalogItem.job_group,
      job_group: catalogItem.job_group,
      major_field: getDominantMajorField(foundJobIds, jobMap),

      source_job_count: sourceJobIds.length,
      source_job_ids: sourceJobIds,

      job_count: foundJobIds.length,
      job_ids: foundJobIds,

      aliases: buildAliases(foundJobIds, jobMap),

      found_job_count: foundJobIds.length,
      missing_job_ids: missingJobIds,

      jobs_with_kkt_count: jobsWithKktIds.length,
      jobs_with_kkt_ids: jobsWithKktIds,
      jobs_without_kkt_count: jobsWithoutKktIds.length,
      jobs_without_kkt_ids: jobsWithoutKktIds,

      kkt_count: kktList.length,
      knowledge_count: countByKktType(kktList, "K"),
      skill_count: countByKktType(kktList, "S"),
      tool_count: countByKktType(kktList, "T"),

      kkt_list: kktList
    };
  });

  if (profiles.length !== 44) {
    throw new Error(
      `Số hồ sơ vị trí tạo ra không đúng. Hiện có ${profiles.length}, yêu cầu 44.`
    );
  }

  return profiles;
}

function writeAuditReport(profiles) {
  ensureReportsDir();

  const audit = {
    generated_at: new Date().toISOString(),
    total_profiles: profiles.length,
    empty_profile_count: profiles.filter((profile) => profile.kkt_count === 0).length,
    low_kkt_profile_count: profiles.filter(
      (profile) => profile.kkt_count > 0 && profile.kkt_count < 3
    ).length,
    profiles: profiles.map((profile) => ({
      position_id: profile.position_id,
      position_name: profile.position_name,
      source_job_count: profile.source_job_count,
      found_job_count: profile.found_job_count,
      jobs_with_kkt_count: profile.jobs_with_kkt_count,
      jobs_without_kkt_count: profile.jobs_without_kkt_count,
      jobs_without_kkt_ids: profile.jobs_without_kkt_ids,
      kkt_count: profile.kkt_count,
      knowledge_count: profile.knowledge_count,
      skill_count: profile.skill_count,
      tool_count: profile.tool_count
    }))
  };

  writeJson(AUDIT_PATH, audit);
}

function main() {
  const jobs = readJson(JOBS_PATH);
  const jobKktRows = readJson(JOB_KKT_PATH);

  const profiles = buildPositionProfiles(jobs, jobKktRows);

  const output = {
    generated_at: new Date().toISOString(),
    source_note:
      "Generated from a fixed 44-position catalog embedded in tools/build-position-profiles.js. KST data is aggregated from enriched data/job_kkt.json.",
    total_profiles: profiles.length,
    position_profiles: profiles
  };

  writeJson(OUTPUT_PATH, output);
  writeAuditReport(profiles);

  console.log(`Đã tạo ${profiles.length} hồ sơ vị trí.`);
  console.log(`File xuất ra: ${OUTPUT_PATH}`);
  console.log(`File kiểm tra dữ liệu: ${AUDIT_PATH}`);

  const emptyProfiles = profiles.filter((profile) => profile.kkt_count === 0);
  const lowKktProfiles = profiles.filter(
    (profile) => profile.kkt_count > 0 && profile.kkt_count < 3
  );

  if (emptyProfiles.length) {
    console.warn("\nCảnh báo: Có hồ sơ vị trí chưa có K–S–T:");
    emptyProfiles.forEach((profile) => {
      console.warn(
        `- ${profile.position_id} | ${profile.position_name} | jobs_without_kkt=${profile.jobs_without_kkt_ids.join(", ")}`
      );
    });
  }

  if (lowKktProfiles.length) {
    console.warn("\nCảnh báo: Có hồ sơ vị trí có ít hơn 3 K–S–T:");
    lowKktProfiles.forEach((profile) => {
      console.warn(
        `- ${profile.position_id} | ${profile.position_name} | kkt_count=${profile.kkt_count}`
      );
    });
  }
}

main();
