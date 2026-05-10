import json
import re
import unicodedata
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
REPORT_DIR = ROOT_DIR / "reports"

JOBS_PATH = DATA_DIR / "jobs.json"
ENTITIES_PATH = DATA_DIR / "kkt_entities.json"
JOB_KKT_PATH = DATA_DIR / "job_kkt.json"
AUDIT_PATH = REPORT_DIR / "job_kkt_enrichment_audit.json"

JOB_FIELDS = [
    ("job_title", "title"),
    ("job_description", "description"),
    ("job_requirement", "requirements"),
    ("full_text", "full_text"),
]

# Alias bổ sung ở tầng code.
# Không sửa Excel. Không tạo entity mới.
# Chỉ bổ sung alias cho canonical_name đã tồn tại trong kkt_entities.json.
SUPPLEMENTAL_ALIASES = {
    "Microsoft Excel": [
        "Excel",
        "MS Excel",
        "Microsoft Excel",
        "spreadsheet",
        "spreadsheets",
        "Google Sheets",
        "PivotTable",
        "Pivot Table",
        "VLOOKUP",
        "XLOOKUP",
        "Power Query",
    ],
    "SQL": [
        "SQL",
        "Structured Query Language",
        "SQL query",
        "SQL queries",
    ],
    "Python": [
        "Python",
        "Pandas",
        "NumPy",
        "Jupyter",
    ],
    "Cơ sở dữ liệu": [
        "cơ sở dữ liệu",
        "database",
        "databases",
        "database system",
        "data storage",
    ],
    "Hệ quản trị cơ sở dữ liệu": [
        "DBMS",
        "database management system",
        "database management systems",
        "SQL Server",
        "MySQL",
        "PostgreSQL",
        "Oracle Database",
    ],
    "Quản trị cơ sở dữ liệu": [
        "quản trị cơ sở dữ liệu",
        "database administration",
        "database administrator",
        "DBA",
        "master data",
        "master data management",
    ],
    "Phân tích dữ liệu doanh nghiệp": [
        "phân tích dữ liệu",
        "phân tích số liệu",
        "data analysis",
        "data analytics",
        "analyze data",
        "analyse data",
        "data insight",
        "business data analysis",
        "reporting analyst",
        "analytics",
    ],
    "Làm sạch dữ liệu": [
        "làm sạch dữ liệu",
        "data cleaning",
        "clean data",
        "data cleansing",
        "data preprocessing",
    ],
    "Mô hình hóa dữ liệu": [
        "mô hình hóa dữ liệu",
        "mô hình hóa quy trình",
        "data modeling",
        "data modelling",
        "data model",
        "process modeling",
        "process modelling",
    ],
    "Kho dữ liệu": [
        "kho dữ liệu",
        "data warehouse",
        "data warehousing",
        "DWH",
    ],
    "Học máy": [
        "học máy",
        "machine learning",
        "ML",
        "MLOps",
        "AI model",
        "artificial intelligence",
        "AI",
    ],
    "Dự báo": [
        "dự báo",
        "forecast",
        "forecasting",
        "prediction",
        "predictive",
    ],
    "Lập trình": [
        "lập trình",
        "programming",
        "coding",
        "code",
        "software development",
        "developer",
    ],
    "Lập trình hướng đối tượng": [
        "lập trình hướng đối tượng",
        "object-oriented programming",
        "OOP",
    ],
    "Quy trình kinh doanh": [
        "quy trình kinh doanh",
        "quy trình nghiệp vụ",
        "quy trình vận hành",
        "business process",
        "business processes",
        "business workflow",
        "workflow",
    ],
    "Enterprise Resource Planning": [
        "ERP",
        "Enterprise Resource Planning",
        "SAP",
    ],
    "Hệ thống thông tin doanh nghiệp tích hợp": [
        "hệ thống thông tin doanh nghiệp",
        "enterprise information system",
        "integrated enterprise information system",
        "ERP system",
        "business information system",
    ],
    "Chuyển đổi số": [
        "chuyển đổi số",
        "digital transformation",
        "digitalization",
        "digitization",
    ],
    "Tư duy phản biện": [
        "tư duy phản biện",
        "critical thinking",
    ],
    "Xây dựng kế hoạch": [
        "xây dựng kế hoạch",
        "lập kế hoạch",
        "planning",
        "plan development",
    ],
    "Năng lực tự học": [
        "tự học",
        "self-learning",
        "self learning",
        "self-study",
    ],
    "Giải pháp tích hợp hệ thống": [
        "tích hợp hệ thống",
        "system integration",
        "integrated solution",
    ],
    "Truyền thông xã hội": [
        "truyền thông xã hội",
        "social media",
    ],
    "Odoo Business Management Software": [
        "Odoo",
        "Odoo ERP",
    ],
    "ChatGPT": [
        "ChatGPT",
        "Generative AI",
        "GenAI",
    ],
    "C/C++": [
        "C/C++",
        "C++",
        "C language",
    ],
    "C#": [
        "C#",
        "C Sharp",
    ],
}

EXTRA_SUPPLEMENTAL_ALIASES = {
    "Xây dựng và quản lý hệ thống thông tin": [
        "IT administrator",
        "system administrator",
        "systems administrator",
        "system administration",
        "system operation",
        "system operations",
        "operate system",
        "manage system",
        "manage IT system",
        "IT system",
        "information system",
        "information systems",
        "system maintenance",
        "maintain system",
        "system monitoring",
        "monitoring system",
        "technical support",
        "IT support",
        "helpdesk",
        "help desk",
        "end-user support",
        "user support",
        "troubleshooting",
        "troubleshoot",
        "resolve technical issues",
        "technical issues",
    ],

    "Cách thiết kế, vận hành hệ thống mạng": [
        "network operation",
        "network operations",
        "network administration",
        "network administrator",
        "operate network",
        "manage network",
        "network support",
        "network troubleshooting",
        "network configuration",
        "configure network",
        "network infrastructure",
        "LAN",
        "WAN",
        "router",
        "switch",
        "domain",
        "workgroup",
    ],

    "Mạng máy tính": [
        "computer network",
        "computer networks",
        "network",
        "networking",
        "LAN",
        "WAN",
        "network system",
        "network infrastructure",
        "internet connection",
    ],

    "Cài đặt và cấu hình dịch vụ mạng cơ bản trong Workgroup và Domain": [
        "workgroup",
        "domain",
        "Active Directory",
        "AD",
        "domain controller",
        "configure domain",
        "network service",
        "network services",
        "install network service",
        "configure network service",
    ],

    "Bảo mật mạng máy tính": [
        "network security",
        "security",
        "cybersecurity",
        "firewall",
        "antivirus",
        "malware",
        "security monitoring",
        "access control",
        "information security",
    ],

    "Chính sách an toàn bảo mật hệ thống thông tin": [
        "information security policy",
        "security policy",
        "system security",
        "IT security",
        "data security",
        "access permission",
        "user permission",
        "permission management",
    ],

    "Cơ sở dữ liệu": [
        "database",
        "databases",
        "database system",
        "data storage",
        "master data",
        "data records",
        "data record",
    ],

    "Hệ quản trị cơ sở dữ liệu": [
        "DBMS",
        "database management system",
        "database management systems",
        "SQL Server",
        "MySQL",
        "PostgreSQL",
        "Oracle Database",
        "database server",
    ],

    "Quản trị cơ sở dữ liệu": [
        "database administration",
        "database administrator",
        "DBA",
        "administer database",
        "manage database",
        "master data management",
        "MDM",
    ],

    "Kết nối và thao tác cơ sở dữ liệu": [
        "connect database",
        "database connection",
        "query database",
        "database query",
        "data query",
    ],

    "Phân quyền người dùng trong cơ sở dữ liệu": [
        "user permission",
        "database permission",
        "access permission",
        "grant permission",
        "user access",
        "access control",
    ],

    "Phân tích quy trình sao lưu, phục hồi cơ sở dữ liệu": [
        "backup database",
        "database backup",
        "restore database",
        "database restore",
        "backup and recovery",
        "disaster recovery",
    ],

    "Lập và thực hiện kế hoạch công tác": [
        "work plan",
        "planning",
        "make plan",
        "prepare plan",
        "implementation plan",
        "action plan",
        "task plan",
        "work schedule",
    ],

    "Xây dựng kế hoạch": [
        "planning",
        "project planning",
        "work plan",
        "timeline",
        "schedule",
        "project schedule",
        "project timeline",
        "roadmap",
        "implementation plan",
    ],

    "Xây dựng ý tưởng và lập kế hoạch triển khai dự án": [
        "project planning",
        "project implementation",
        "project execution",
        "project plan",
        "project timeline",
        "project roadmap",
        "project coordination",
        "coordinate project",
    ],

    "Hồ sơ và quản lý hồ sơ": [
        "records management",
        "record management",
        "document management",
        "manage records",
        "manage documents",
        "filing",
        "archive",
        "archiving",
        "administrative documents",
        "employee records",
        "customer records",
        "client records",
    ],

    "Lập kế hoạch lưu giữ, truy hồi, bảo vệ hồ sơ": [
        "records retention",
        "record retention",
        "retrieve records",
        "record retrieval",
        "protect records",
        "file retention",
        "document retention",
    ],

    "Mô tả thông tin, tài liệu, hành vi người dùng": [
        "documentation",
        "document description",
        "describe document",
        "information description",
        "user behavior",
        "user behaviour",
    ],

    "Quy trình kinh doanh": [
        "business process",
        "business processes",
        "business workflow",
        "workflow",
        "operation process",
        "operational process",
    ],

    "Vận hành quy trình quản lý dữ liệu và thông tin": [
        "data management",
        "information management",
        "manage data",
        "manage information",
        "data operation",
        "data operations",
        "information operation",
    ],

    "Sử dụng kiến thức mạng máy tính trong học tập và giao tiếp": [
        "communication",
        "communicate",
        "communicating",
        "online communication",
        "digital communication",
    ],

    "Vận dụng kỹ năng giao tiếp và làm việc": [
        "communication",
        "communication skills",
        "interpersonal skills",
        "teamwork",
        "team work",
        "collaboration",
        "coordinate with",
        "work with team",
        "customer communication",
        "client communication",
    ],

    "Lễ tân và giao tiếp trong môi trường văn phòng": [
        "receptionist",
        "front desk",
        "office communication",
        "customer service",
        "customer support",
        "client support",
        "receive guests",
    ],

    "Quản lý và kiểm soát thông tin": [
        "quality assurance",
        "quality control",
        "QA",
        "QC",
        "control information",
        "information control",
        "check data",
        "data checking",
        "verify information",
        "information verification",
        "accuracy check",
    ],

    "Phân tích, đánh giá, ứng dụng thông tin kinh tế hỗ trợ ra quyết định": [
        "financial analysis",
        "finance analysis",
        "business analysis",
        "strategy analysis",
        "strategic analysis",
        "decision making",
        "decision support",
        "market analysis",
        "M&A analysis",
    ],

    "Dự báo": [
        "forecast",
        "forecasting",
        "prediction",
        "predictive",
        "projection",
        "financial forecast",
        "business forecast",
    ],

    "Microsoft Excel": [
        "Excel",
        "MS Excel",
        "Microsoft Excel",
        "spreadsheet",
        "spreadsheets",
        "Google Sheets",
        "PivotTable",
        "Pivot Table",
        "VLOOKUP",
        "XLOOKUP",
        "Power Query",
        "Microsoft Office",
        "MS Office",
        "office software",
        "tin học văn phòng",
        "office tools",
    ],
}

def ensure_dirs():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path):
    if not path.exists():
        return []

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data

    for key in ["jobs", "kkt_entities", "entities", "job_kkt", "data"]:
        if isinstance(data, dict) and isinstance(data.get(key), list):
            return data[key]

    return []


def write_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def strip_vietnamese_marks(text):
    text = unicodedata.normalize("NFD", str(text or ""))
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def normalize_text(text):
    text = str(text or "").lower()
    text = strip_vietnamese_marks(text)
    text = text.replace("–", "-").replace("—", "-")
    text = text.replace("&", " and ")
    text = re.sub(r"[“”\"']", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_for_match(text):
    text = normalize_text(text)
    text = re.sub(r"[(){}\[\],;:!?]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_alias_list(value):
    if not value:
        return []

    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]

    return [p.strip() for p in re.split(r"\n|;|\|", str(value)) if p.strip()]


def get_first(row, keys, default=""):
    for key in keys:
        value = row.get(key)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return default


def get_job_id(job):
    return get_first(job, ["job_id", "id", "job_code"])


def build_entity_index(entities):
    index = []

    for entity in entities:
        entity_id = get_first(entity, ["entity_id"])
        kkt_type = get_first(entity, ["kkt_type"]).upper()
        canonical_name = get_first(entity, ["canonical_name"])

        if not entity_id or kkt_type not in {"K", "S", "T"} or not canonical_name:
            continue

        raw_terms = [
    canonical_name,
    entity.get("canonical_norm", ""),
    entity.get("canonical_ascii", ""),
    *split_alias_list(entity.get("alias_list", "")),
    *SUPPLEMENTAL_ALIASES.get(canonical_name, []),
    *EXTRA_SUPPLEMENTAL_ALIASES.get(canonical_name, []),
]

        term_map = {}

        for term in raw_terms:
            raw = str(term or "").strip()
            norm = normalize_for_match(raw)

            if not raw or not norm:
                continue

            if len(norm) <= 2 and norm not in {"ai", "ml", "sql", "c#", "c++"}:
                continue

            term_map[norm] = raw

        terms = [{"raw": raw, "norm": norm} for norm, raw in term_map.items()]
        terms.sort(key=lambda x: len(x["norm"]), reverse=True)

        if terms:
            index.append(
                {
                    "entity_id": entity_id,
                    "kkt_type": kkt_type,
                    "canonical_name": canonical_name,
                    "terms": terms,
                }
            )

    return index


def has_term(text_norm, term_norm):
    if not text_norm or not term_norm:
        return False

    escaped = re.escape(term_norm)
    pattern = rf"(^|[^a-z0-9]){escaped}([^a-z0-9]|$)"
    return re.search(pattern, f" {text_norm} ", flags=re.IGNORECASE) is not None


def split_bullets(text):
    text = str(text or "").replace("\r", "\n")
    parts = re.split(r"\n+|(?=\s*[-•●]\s+)", text)

    bullets = []
    for part in parts:
        item = re.sub(r"^\s*[-•●]\s*", "", part).strip()
        if len(item) >= 6:
            bullets.append(item)

    return bullets


def find_evidence_snippet(raw_text, matched_term):
    term_norm = normalize_for_match(matched_term)

    for bullet in split_bullets(raw_text):
        if has_term(normalize_for_match(bullet), term_norm):
            return bullet

    compact = re.sub(r"\s+", " ", str(raw_text or "")).strip()
    return compact[:260] + "..." if len(compact) > 260 else compact


def occurrence_key(occ):
    return "|".join(
        [
            str(occ.get("job_id", "")).strip(),
            str(occ.get("entity_id", "")).strip(),
            str(occ.get("field", "")).strip(),
        ]
    )


def normalize_base_occurrence(occ):
    return {
        "occ_id": str(occ.get("occ_id", "")).strip(),
        "job_id": str(occ.get("job_id", "")).strip(),
        "entity_id": str(occ.get("entity_id", "")).strip(),
        "kkt_type": str(occ.get("kkt_type", "")).strip().upper(),
        "canonical_name": str(occ.get("canonical_name", "")).strip(),
        "field": str(occ.get("field", "")).strip(),
        "matched_term": str(occ.get("matched_term", "")).strip(),
        "method": str(occ.get("method", "")).strip() or "excel_export",
        "evidence_snippet": str(occ.get("evidence_snippet", "")).strip(),
        "coverage_status": str(occ.get("coverage_status", "")).strip(),
        "job_count_for_entity": str(occ.get("job_count_for_entity", "")).strip(),
        "course_count_for_entity": str(occ.get("course_count_for_entity", "")).strip(),
    }


def extract_occurrences_from_job(job, entity_index):
    job_id = get_job_id(job)
    if not job_id:
        return []

    occurrences = []
    seen = set()

    for source_key, field_name in JOB_FIELDS:
        raw_text = str(job.get(source_key, "") or "")
        text_norm = normalize_for_match(raw_text)

        if not text_norm:
            continue

        for entity in entity_index:
            for term in entity["terms"]:
                if not has_term(text_norm, term["norm"]):
                    continue

                key = (job_id, entity["entity_id"], field_name)

                if key in seen:
                    break

                seen.add(key)

                canonical_norm = normalize_for_match(entity["canonical_name"])
                method = (
                    "auto_canonical_norm"
                    if term["norm"] == canonical_norm
                    else "auto_alias_norm"
                )

                occurrences.append(
                    {
                        "occ_id": "",
                        "job_id": job_id,
                        "entity_id": entity["entity_id"],
                        "kkt_type": entity["kkt_type"],
                        "canonical_name": entity["canonical_name"],
                        "field": field_name,
                        "matched_term": term["raw"],
                        "method": method,
                        "evidence_snippet": find_evidence_snippet(raw_text, term["raw"]),
                        "coverage_status": "auto_enriched",
                        "job_count_for_entity": "",
                        "course_count_for_entity": "",
                    }
                )

                break

    return occurrences


def main():
    ensure_dirs()

    jobs = load_json(JOBS_PATH)
    entities = load_json(ENTITIES_PATH)
    base_job_kkt = load_json(JOB_KKT_PATH)

    entity_index = build_entity_index(entities)

    merged = []
    seen = set()

    for occ in base_job_kkt:
        item = normalize_base_occurrence(occ)

        if not item["job_id"] or not item["entity_id"] or not item["canonical_name"]:
            continue

        key = occurrence_key(item)
        if key in seen:
            continue

        seen.add(key)
        merged.append(item)

    auto_added = []

    for job in jobs:
        extracted = extract_occurrences_from_job(job, entity_index)

        for occ in extracted:
            key = occurrence_key(occ)

            if key in seen:
                continue

            seen.add(key)
            merged.append(occ)
            auto_added.append(occ)

    for index, occ in enumerate(merged, start=1):
        occ["occ_id"] = f"OCC{index:06d}"

    write_json(JOB_KKT_PATH, merged)

    all_job_ids = {get_job_id(job) for job in jobs if get_job_id(job)}
    job_ids_with_kkt = {str(occ.get("job_id", "")).strip() for occ in merged}
    jobs_without_kkt = sorted(all_job_ids - job_ids_with_kkt)

    audit = {
        "base_occurrence_count": len(base_job_kkt),
        "auto_added_count": len(auto_added),
        "final_occurrence_count": len(merged),
        "job_count": len(all_job_ids),
        "jobs_with_kkt_count": len(job_ids_with_kkt),
        "jobs_without_kkt_count": len(jobs_without_kkt),
        "jobs_without_kkt": jobs_without_kkt,
    }

    write_json(AUDIT_PATH, audit)

    print(f"Base job_kkt rows: {len(base_job_kkt)}")
    print(f"Auto-added rows: {len(auto_added)}")
    print(f"Final job_kkt rows: {len(merged)}")
    print(f"Jobs without KST: {len(jobs_without_kkt)}")
    print(f"Audit written to: {AUDIT_PATH}")


if __name__ == "__main__":
    main()
