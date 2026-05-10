import os
import json
import re
import pandas as pd

# =========================
# 1. ĐƯỜNG DẪN
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(BASE_DIR)

RAW_DIR = os.path.join(REPO_DIR, "raw_data")
OUT_DIR = os.path.join(REPO_DIR, "data")

JOB_POST_FILE = os.path.join(RAW_DIR, "JOB_POST.xlsx")
KKT_OCC_FILE = os.path.join(RAW_DIR, "KKT_OCCURRENCE.xlsx")
KKT_ENTITY_FILE = os.path.join(RAW_DIR, "KKT_ENTITY.xlsx")
COURSE_FILE = os.path.join(RAW_DIR, "COURSE.xlsx")

os.makedirs(OUT_DIR, exist_ok=True)


# =========================
# 2. HÀM DÙNG CHUNG
# =========================
def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = df.columns.astype(str).str.strip()
    return df


def clean_cell(value):
    if pd.isna(value):
        return ""

    value = str(value)
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def clean_id(value):
    return clean_cell(value)


def save_json(data, filename: str) -> None:
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Đã xuất: data/{filename} ({len(data)} dòng)")


def records_from_df(df: pd.DataFrame):
    df = df.copy()
    for col in df.columns:
        df[col] = df[col].apply(clean_cell)
    return df.to_dict(orient="records")


def pick_existing_columns(df: pd.DataFrame, candidates):
    return [c for c in candidates if c in df.columns]


def require_columns(df: pd.DataFrame, required_cols, source_name: str):
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise KeyError(f"{source_name} thiếu cột bắt buộc: {', '.join(missing)}")


# =========================
# 3. ĐỌC EXCEL
# =========================
df_jobs = normalize_columns(pd.read_excel(JOB_POST_FILE, sheet_name="JOB_POST"))
df_occ = normalize_columns(pd.read_excel(KKT_OCC_FILE, sheet_name="KKT_OCCURRENCE"))
df_entity = normalize_columns(pd.read_excel(KKT_ENTITY_FILE, sheet_name="KKT_ENTITY"))
df_course = normalize_columns(pd.read_excel(COURSE_FILE, sheet_name="COURSE"))


# =========================
# 4. jobs.json
# =========================
require_columns(df_jobs, ["job_id"], "JOB_POST.xlsx")

job_candidates = [
    "job_id",
    "source",
    "company_code",
    "industry",
    "business_Entities",
    "business_entities",
    "job_title_clean",
    "job_title",
    "job_description_clean",
    "job_description",
    "job_requirements_clean",
    "job_requirement",
    "job_requirements",
    "full_text_clean",
    "full_text",
]

job_cols = pick_existing_columns(df_jobs, job_candidates)
jobs_df = df_jobs[job_cols].copy().fillna("")

jobs_df = jobs_df.rename(
    columns={
        "business_Entities": "business_entities",
        "job_title_clean": "job_title",
        "job_description_clean": "job_description",
        "job_requirements_clean": "job_requirement",
        "job_requirements": "job_requirement",
        "full_text_clean": "full_text",
    }
)

for col in [
    "job_id",
    "source",
    "company_code",
    "industry",
    "business_entities",
    "job_title",
    "job_description",
    "job_requirement",
    "full_text",
]:
    if col not in jobs_df.columns:
        jobs_df[col] = ""

jobs_df["job_id"] = jobs_df["job_id"].apply(clean_id)

jobs_df = jobs_df[
    [
        "job_id",
        "source",
        "company_code",
        "industry",
        "business_entities",
        "job_title",
        "job_description",
        "job_requirement",
        "full_text",
    ]
].copy()

jobs_df = jobs_df[jobs_df["job_id"] != ""].drop_duplicates(subset=["job_id"])

save_json(records_from_df(jobs_df), "jobs.json")


# =========================
# 5. kkt_entities.json
# =========================
require_columns(df_entity, ["entity_id", "kkt_type", "canonical_name"], "KKT_ENTITY.xlsx")

entity_candidates = [
    "entity_id",
    "kkt_type",
    "canonical_name",
    "alias_list",
    "canonical_norm",
    "canonical_ascii",
]

entity_cols = pick_existing_columns(df_entity, entity_candidates)
entity_df = df_entity[entity_cols].copy().fillna("")

for col in entity_candidates:
    if col not in entity_df.columns:
        entity_df[col] = ""

entity_df["entity_id"] = entity_df["entity_id"].apply(clean_id)
entity_df["kkt_type"] = entity_df["kkt_type"].apply(lambda x: clean_cell(x).upper())
entity_df["canonical_name"] = entity_df["canonical_name"].apply(clean_cell)

entity_df = entity_df[
    [
        "entity_id",
        "kkt_type",
        "canonical_name",
        "alias_list",
        "canonical_norm",
        "canonical_ascii",
    ]
].copy()

entity_df = entity_df[
    (entity_df["entity_id"] != "")
    & (entity_df["kkt_type"] != "")
    & (entity_df["canonical_name"] != "")
].drop_duplicates(subset=["entity_id"])

save_json(records_from_df(entity_df), "kkt_entities.json")


# =========================
# 6. courses.json
# =========================
require_columns(df_course, ["course_id", "course_name"], "COURSE.xlsx")

course_candidates = [
    "course_id",
    "course_name",
    "course_description_clean",
    "course_description",
    "learning_outcomes_clean",
    "learning_outcomes",
    "full_text_clean",
    "full_text",
]

course_cols = pick_existing_columns(df_course, course_candidates)
courses_df = df_course[course_cols].copy().fillna("")

courses_df = courses_df.rename(
    columns={
        "course_description_clean": "course_description",
        "learning_outcomes_clean": "learning_outcomes",
        "full_text_clean": "full_text",
    }
)

for col in [
    "course_id",
    "course_name",
    "course_description",
    "learning_outcomes",
    "full_text",
]:
    if col not in courses_df.columns:
        courses_df[col] = ""

courses_df["course_id"] = courses_df["course_id"].apply(clean_id)

courses_df = courses_df[
    [
        "course_id",
        "course_name",
        "course_description",
        "learning_outcomes",
        "full_text",
    ]
].copy()

courses_df = courses_df[courses_df["course_id"] != ""].drop_duplicates(subset=["course_id"])

save_json(records_from_df(courses_df), "courses.json")


# =========================
# 7. job_kkt.json
# Xuất occurrence gốc từ Excel.
# Bước làm giàu tự động sẽ chạy sau bằng scripts/enrich_job_kkt.py
# =========================
require_columns(df_occ, ["source_type", "entity_id"], "KKT_OCCURRENCE.xlsx")

job_occ = df_occ[df_occ["source_type"].astype(str).str.strip().str.upper() == "JOB"].copy()

if "job_id_raw" in job_occ.columns:
    job_occ = job_occ.rename(columns={"job_id_raw": "job_id_source"})
elif "job_id" in job_occ.columns:
    job_occ["job_id_source"] = job_occ["job_id"]
else:
    raise KeyError("Không tìm thấy cột 'job_id_raw' hoặc 'job_id' trong KKT_OCCURRENCE.xlsx")

job_occ["job_id_source"] = job_occ["job_id_source"].apply(clean_id)
job_occ["entity_id"] = job_occ["entity_id"].apply(clean_id)

entity_lookup = entity_df[["entity_id", "kkt_type", "canonical_name"]].copy()

job_occ = job_occ.merge(
    entity_lookup,
    on="entity_id",
    how="left",
    suffixes=("", "_entity"),
)

job_kkt_candidates = [
    "occ_id",
    "job_id_source",
    "entity_id",
    "kkt_type",
    "canonical_name",
    "field",
    "matched_term",
    "method",
    "evidence_snippet",
    "coverage_status",
    "job_count_for_entity",
    "course_count_for_entity",
]

job_kkt_cols = pick_existing_columns(job_occ, job_kkt_candidates)
job_kkt_df = job_occ[job_kkt_cols].copy().fillna("")
job_kkt_df = job_kkt_df.rename(columns={"job_id_source": "job_id"})

for col in [
    "occ_id",
    "job_id",
    "entity_id",
    "kkt_type",
    "canonical_name",
    "field",
    "matched_term",
    "method",
    "evidence_snippet",
    "coverage_status",
    "job_count_for_entity",
    "course_count_for_entity",
]:
    if col not in job_kkt_df.columns:
        job_kkt_df[col] = ""

job_kkt_df["job_id"] = job_kkt_df["job_id"].apply(clean_id)
job_kkt_df["entity_id"] = job_kkt_df["entity_id"].apply(clean_id)
job_kkt_df["kkt_type"] = job_kkt_df["kkt_type"].apply(lambda x: clean_cell(x).upper())
job_kkt_df["canonical_name"] = job_kkt_df["canonical_name"].apply(clean_cell)
job_kkt_df["field"] = job_kkt_df["field"].apply(clean_cell)

job_kkt_df = job_kkt_df[
    (job_kkt_df["job_id"] != "")
    & (job_kkt_df["entity_id"] != "")
    & (job_kkt_df["kkt_type"] != "")
    & (job_kkt_df["canonical_name"] != "")
].copy()

job_kkt_df = job_kkt_df.drop_duplicates(
    subset=["job_id", "entity_id", "field"]
).reset_index(drop=True)

job_kkt_df["occ_id"] = [
    f"OCC{str(i + 1).zfill(6)}" for i in range(len(job_kkt_df))
]

job_kkt_df = job_kkt_df[
    [
        "occ_id",
        "job_id",
        "entity_id",
        "kkt_type",
        "canonical_name",
        "field",
        "matched_term",
        "method",
        "evidence_snippet",
        "coverage_status",
        "job_count_for_entity",
        "course_count_for_entity",
    ]
].copy()

save_json(records_from_df(job_kkt_df), "job_kkt.json")


# =========================
# 8. KHÔNG XUẤT position_profiles.json Ở ĐÂY
# =========================
# position_profiles.json được tạo ở tools/build-position-profiles.js
# để bảo đảm dùng đúng catalog 44 hồ sơ vị trí.


# =========================
# 9. KẾT THÚC
# =========================
print("\nHoàn tất xuất JSON nền từ Excel.")
print("Các file đã tạo trong thư mục data/:")
print("- jobs.json")
print("- job_kkt.json")
print("- courses.json")
print("- kkt_entities.json")
print("\nBước tiếp theo:")
print("- Chạy scripts/enrich_job_kkt.py")
print("- Chạy tools/build-position-profiles.js")
