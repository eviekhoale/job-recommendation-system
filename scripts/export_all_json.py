import os
import json
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
    df.columns = df.columns.str.strip()
    return df


def save_json(data, filename: str) -> None:
    path = os.path.join(OUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Đã xuất: data/{filename}")


def records_from_df(df: pd.DataFrame):
    return df.fillna("").to_dict(orient="records")


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
job_candidates = [
    "job_id",
    "source",
    "company_code",
    "industry",
    "business_Entities",
    "job_title_clean",
    "job_description_clean",
    "job_requirements_clean",
]
job_cols = [c for c in job_candidates if c in df_jobs.columns]

jobs_df = df_jobs[job_cols].copy().fillna("")

jobs_df = jobs_df.rename(
    columns={
        "business_Entities": "business_entities",
        "job_title_clean": "job_title",
        "job_description_clean": "job_description",
        "job_requirements_clean": "job_requirement",
    }
)

save_json(records_from_df(jobs_df), "jobs.json")


# =========================
# 5. kkt_entities.json
# =========================
entity_candidates = [
    "entity_id",
    "kkt_type",
    "canonical_name",
    "alias_list",
    "canonical_norm",
    "canonical_ascii",
]
entity_cols = [c for c in entity_candidates if c in df_entity.columns]

entity_df = df_entity[entity_cols].copy().fillna("")
save_json(records_from_df(entity_df), "kkt_entities.json")


# =========================
# 6. courses.json
# =========================
course_candidates = [
    "course_id",
    "course_name",
    "course_description_clean",
    "learning_outcomes_clean",
    "full_text_clean",
]
course_cols = [c for c in course_candidates if c in df_course.columns]

courses_df = df_course[course_cols].copy().fillna("")
courses_df = courses_df.rename(
    columns={
        "course_description_clean": "course_description",
        "learning_outcomes_clean": "learning_outcomes",
        "full_text_clean": "full_text",
    }
)

save_json(records_from_df(courses_df), "courses.json")


# =========================
# 7. job_kkt.json
# KKT_OCCURRENCE phải nối với KKT_ENTITY
# =========================
job_occ = df_occ[df_occ["source_type"].astype(str).str.upper() == "JOB"].copy()

if "job_id_raw" in job_occ.columns:
    job_occ = job_occ.rename(columns={"job_id_raw": "job_id_source"})
elif "job_id" in job_occ.columns:
    job_occ["job_id_source"] = job_occ["job_id"]
else:
    raise KeyError("Không tìm thấy cột 'job_id_raw' hoặc 'job_id' trong KKT_OCCURRENCE.xlsx")

job_occ = job_occ.merge(
    df_entity[["entity_id", "kkt_type", "canonical_name"]],
    on="entity_id",
    how="left",
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
job_kkt_cols = [c for c in job_kkt_candidates if c in job_occ.columns]

job_kkt_df = job_occ[job_kkt_cols].copy().fillna("")
job_kkt_df = job_kkt_df.rename(columns={"job_id_source": "job_id"})

save_json(records_from_df(job_kkt_df), "job_kkt.json")


# =========================
# 8. position_profiles.json
# Tạm dùng industry làm position_name cho demo
# =========================
job_join_cols = [c for c in ["job_id", "industry", "job_title_clean"] if c in df_jobs.columns]

job_occ_for_position = job_occ.merge(
    df_jobs[job_join_cols],
    left_on="job_id_source",
    right_on="job_id",
    how="left",
)

job_occ_for_position = job_occ_for_position.dropna(subset=["industry", "canonical_name"])

position_profiles = []

for industry_name, group in job_occ_for_position.groupby("industry"):
    job_count = int(group["job_id_source"].nunique())

    kkt_unique = (
        group[["kkt_type", "canonical_name"]]
        .drop_duplicates()
        .sort_values(by=["kkt_type", "canonical_name"])
        .fillna("")
    )

    position_profiles.append(
        {
            "position_name": industry_name,
            "job_count": job_count,
            "kkt_list": kkt_unique.to_dict(orient="records"),
        }
    )

save_json(position_profiles, "position_profiles.json")


# =========================
# 9. KẾT THÚC
# =========================
print("\nHoàn tất xuất JSON.")
print("Các file đã tạo trong thư mục data/:")
print("- jobs.json")
print("- job_kkt.json")
print("- position_profiles.json")
print("- courses.json")
print("- kkt_entities.json")
