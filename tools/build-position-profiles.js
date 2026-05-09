const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");

const JOBS_PATH = path.join(DATA_DIR, "jobs.json");
const JOB_KKT_PATH = path.join(DATA_DIR, "job_kkt.json");
const OUTPUT_PATH = path.join(DATA_DIR, "position_profiles.json");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  if (Array.isArray(data)) return data;

  return (
    data.jobs ||
    data.job_kkt ||
    data.position_profiles ||
    data.data ||
    []
  );
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
    if (value !== undefined && value !== null && String(value).trim() !== "") {
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
      "Chưa xác định"
    )
  ).trim();
}

function mapFieldName(rawField) {
  const value = normalizeText(rawField);

  if (value.includes("khoa hoc thong tin") || value.includes("information science")) {
    return "Khoa học thông tin";
  }

  if (
    value.includes("cong nghe thong tin") ||
    value.includes("truyen thong") ||
    value.includes("ict") ||
    value.includes("information technology")
  ) {
    return "Công nghệ thông tin - truyền thông";
  }

  if (
    value.includes("quan ly") ||
    value.includes("management")
  ) {
    return "Quản lý";
  }

  return rawField || "Chưa xác định";
}

/**
 * Quy tắc chuẩn hóa tên vị trí.
 * Có thể bổ sung thêm rule nếu dữ liệu của nhóm có nhiều tên chức danh khác.
 */
const POSITION_RULES = [
  {
    position_name: "Business Analyst",
    patterns: [
      /\bbusiness analyst\b/,
      /\bit business analyst\b/,
      /phan tich nghiep vu/,
      /chuyen vien phan tich nghiep vu/,
      /system analyst/,
      /phan tich he thong/
    ]
  },
  {
    position_name: "Data Analyst / BI Analyst",
    patterns: [
      /\bdata analyst\b/,
      /\bbi analyst\b/,
      /business intelligence/,
      /phan tich du lieu/,
      /bao cao du lieu/,
      /dashboard/,
      /power bi/
    ]
  },
  {
    position_name: "ERP / CRM Consultant",
    patterns: [
      /\berp\b/,
      /\bcrm\b/,
      /odoo/,
      /sap/,
      /oracle/,
      /tu van trien khai/,
      /trien khai he thong/,
      /trien khai phan mem/,
      /implementation consultant/,
      /functional consultant/
    ]
  },
  {
    position_name: "IT Support / Helpdesk",
    patterns: [
      /\bit support\b/,
      /helpdesk/,
      /technical support/,
      /ho tro ky thuat/,
      /nhan vien it/,
      /quan tri he thong/,
      /system admin/
    ]
  },
  {
    position_name: "Database Administrator / Data Management",
    patterns: [
      /\bdatabase administrator\b/,
      /\bdba\b/,
      /quan tri co so du lieu/,
      /quan tri csdl/,
      /data management/,
      /quan ly du lieu/,
      /co so du lieu/
    ]
  },
  {
    position_name: "Project Coordinator / Project Management",
    patterns: [
      /\bproject coordinator\b/,
      /\bproject manager\b/,
      /quan ly du an/,
      /tro ly du an/,
      /dieu phoi du an/,
      /project assistant/
    ]
  },
  {
    position_name: "Web Developer / Web Administrator",
    patterns: [
      /\bweb developer\b/,
      /\bfrontend\b/,
      /\bfront-end\b/,
      /\bbackend\b/,
      /\bback-end\b/,
      /lap trinh web/,
      /quan tri website/,
      /website administrator/,
      /web admin/
    ]
  },
  {
    position_name: "Software Developer / Programmer",
    patterns: [
      /\bsoftware developer\b/,
      /\bsoftware engineer\b/,
      /\bdeveloper\b/,
      /\bprogrammer\b/,
      /lap trinh vien/,
      /ky su phan mem/,
      /\bpython\b/,
      /\bjava\b/,
      /\.net/,
      /\bc#\b/
    ]
  },
  {
    position_name: "Marketing / Communications",
    patterns: [
      /\bmarketing\b/,
      /truyen thong/,
      /content/,
      /\bseo\b/,
      /digital marketing/,
      /social media/
    ]
  },
  {
    position_name: "Administrative / Office / Records",
    patterns: [
      /hanh chinh/,
      /van phong/,
      /van thu/,
      /luu tru/,
      /ho so/,
      /\badmin\b/,
      /office/
    ]
  },
  {
    position_name: "Information Specialist / Knowledge Management",
    patterns: [
      /quan ly thong tin/,
      /chuyen vien thong tin/,
      /information specialist/,
      /knowledge management/,
      /thu vien/,
      /library/
    ]
  }
];

function classifyPosition(title) {
  const normalizedTitle = normalizeText(title);

  for (const rule of POSITION_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalizedTitle))) {
      return rule.position_name;
    }
  }

  return cleanFallbackPositionName(title);
}

function cleanFallbackPositionName(title) {
  return String(title || "")
    .replace(/\s+/g, " ")
    .replace(/\((.*?)\)/g, "")
    .replace(/\[(.*?)\]/g, "")
    .replace(/^\s*(tuyển dụng|urgent|hot)\s*/i, "")
    .replace(/\s*-\s*$/g, "")
    .trim();
}

function buildTermKey(term) {
  return `${normalizeText(term.kkt_type)}|${normalizeText(term.canonical_name)}`;
}

function getDominantField(fieldCountMap) {
  const entries = Array.from(fieldCountMap.entries());

  if (!entries.length) return "Chưa xác định";

  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0], "vi");
  });

  return entries[0][0];
}

function buildTermsByJob(jobKktRows) {
  const termsByJob = new Map();

  jobKktRows.forEach((row) => {
    const sourceType = String(row.source_type || "").toUpperCase().trim();

    // Nếu dữ liệu có source_type thì chỉ lấy dòng thuộc JOB.
    // Nếu không có source_type, mặc định xem đây là file job_kkt đã lọc sẵn.
    if (sourceType && sourceType !== "JOB") return;

    const jobId = String(
      getFirstValue(row, ["job_id", "Mã tin"], "")
    ).trim();

    const kktType = String(
      getFirstValue(row, ["kkt_type", "type", "Loại"], "")
    ).toUpperCase().trim();

    const canonicalName = String(
      getFirstValue(row, ["canonical_name", "canonical", "Tên chuẩn (Canonical)"], "")
    ).trim();

    if (!jobId || !["K", "S", "T"].includes(kktType) || !canonicalName) return;

    if (!termsByJob.has(jobId)) {
      termsByJob.set(jobId, new Map());
    }

    const term = {
      kkt_type: kktType,
      canonical_name: canonicalName
    };

    const termKey = buildTermKey(term);

    // Trong cùng một job, một K–S–T chỉ tính 1 lần.
    if (!termsByJob.get(jobId).has(termKey)) {
      termsByJob.get(jobId).set(termKey, term);
    }
  });

  return termsByJob;
}

function buildPositionProfiles(jobs, termsByJob) {
  const profileMap = new Map();

  jobs.forEach((job) => {
    const jobId = getJobId(job);
    const rawTitle = getJobTitle(job);
    const rawField = getJobField(job);

    if (!jobId || !rawTitle) return;

    const positionName = classifyPosition(rawTitle);
    const positionKey = normalizeText(positionName);
    const fieldName = mapFieldName(rawField);

    if (!profileMap.has(positionKey)) {
      profileMap.set(positionKey, {
        position_name: positionName,
        field_count: new Map(),
        job_ids: new Set(),
        aliases: new Set(),
        term_map: new Map()
      });
    }

    const profile = profileMap.get(positionKey);

    profile.job_ids.add(jobId);
    profile.aliases.add(rawTitle);

    profile.field_count.set(
      fieldName,
      (profile.field_count.get(fieldName) || 0) + 1
    );

    const jobTerms = termsByJob.get(jobId);
    if (!jobTerms) return;

    jobTerms.forEach((term) => {
      const termKey = buildTermKey(term);

      if (!profile.term_map.has(termKey)) {
        profile.term_map.set(termKey, {
          kkt_type: term.kkt_type,
          canonical_name: term.canonical_name,
          job_count: 0,
          job_ids: new Set()
        });
      }

      const savedTerm = profile.term_map.get(termKey);

      if (!savedTerm.job_ids.has(jobId)) {
        savedTerm.job_ids.add(jobId);
        savedTerm.job_count += 1;
      }
    });
  });

  const profiles = Array.from(profileMap.values()).map((profile, index) => {
    const kktList = Array.from(profile.term_map.values())
      .map((term) => ({
        kkt_type: term.kkt_type,
        canonical_name: term.canonical_name,
        job_count: term.job_count
      }))
      .sort((a, b) => {
        if (a.kkt_type !== b.kkt_type) return a.kkt_type.localeCompare(b.kkt_type);
        if (b.job_count !== a.job_count) return b.job_count - a.job_count;
        return a.canonical_name.localeCompare(b.canonical_name, "vi");
      });

    return {
      position_id: `PP${String(index + 1).padStart(3, "0")}`,
      position_name: profile.position_name,
      field: getDominantField(profile.field_count),
      job_count: profile.job_ids.size,
      job_ids: Array.from(profile.job_ids).sort(),
      aliases: Array.from(profile.aliases).sort((a, b) => a.localeCompare(b, "vi")),
      kkt_list: kktList
    };
  });

  profiles.sort((a, b) => {
    const fieldCompare = a.field.localeCompare(b.field, "vi");
    if (fieldCompare !== 0) return fieldCompare;

    return a.position_name.localeCompare(b.position_name, "vi");
  });

  profiles.forEach((profile, index) => {
    profile.position_id = `PP${String(index + 1).padStart(3, "0")}`;
  });

  return profiles;
}

function main() {
  const jobs = readJson(JOBS_PATH);
  const jobKktRows = readJson(JOB_KKT_PATH);

  const termsByJob = buildTermsByJob(jobKktRows);
  const profiles = buildPositionProfiles(jobs, termsByJob);

  const output = {
    generated_at: new Date().toISOString(),
    total_profiles: profiles.length,
    position_profiles: profiles
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8");

  console.log(`Đã tạo ${profiles.length} hồ sơ vị trí.`);
  console.log(`File xuất ra: ${OUTPUT_PATH}`);
}

main();
