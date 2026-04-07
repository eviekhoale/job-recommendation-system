import pandas as pd
import json
import os

# =========================
# 1) ĐƯỜNG DẪN FILE
# =========================
JOB_POST_FILE = "../raw data/JOB_POST.xlsx"
KKT_OCC_FILE = "../raw data/KKT_OCCURRENCE.xlsx"
KKT_ENTITY_FILE = "../raw data/KKT_ENTITY.xlsx"
COURSE_FILE = "../raw data/COURSE.xlsx"

OUTPUT_DIR = "../data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# 2) ĐỌC 4 FILE EXCEL
# =========================
df_jobs = pd.read_excel(JOB_POST_FILE, sheet_name="JOB_POST")
df_occ = pd.read_excel(KKT_OCC_FILE, sheet_name="KKT_OCCURRENCE")
df_entity = pd.read_excel(KKT_ENTITY_FILE, sheet_name="KKT_ENTITY")
df_course = pd.read_excel(COURSE_FILE, sheet_name="COURSE")

# Xóa khoảng trắng thừa ở tên cột
df_jobs.columns = df_jobs.columns.str.strip()
df_occ.columns = df_occ.columns.str.strip()
df_entity.columns = df_entity.columns.str.strip()
df_course.columns = df_course.columns.str.strip()

# =========================
# 3) jobs.json
# =========================
jobs_cols = [
    "job_id",
    "source",
    "company_code",
    "industry",
    "business_Entities",
    "job_title_clean",
    "job_description_clean",
    "job_requirements_clean"
]

jobs_available_cols = [c for c in jobs_cols if c in df_jobs.columns]
jobs_df = df_jobs[jobs_available_cols].copy().fillna("")

jobs_df = jobs_df.rename(columns={
    "business_Entities": "business_entities",
    "job_title_clean": "job_title",
    "job_description_clean": "job_description",
    "job_requirements_clean": "job_requirement"
})

jobs_df.to_json(
    os.path.join(OUTPUT_DIR, "jobs.json"),
    orient="records",
    force_ascii=False,
    indent=2
)

print("Đã xuất: data/jobs.json")

# =========================
# 4) kkt_entities.json
# =========================
entity_cols = [
    "entity_id",
    "kkt_type",
    "canonical_name",
    "alias_list",
    "canonical_norm",
    "canonical_ascii"
]

entity_available_cols = [c for c in entity_cols if c in df_entity.columns]
entity_df = df_entity[entity_available_cols].copy().fillna("")

entity_df.to_json(
    os.path.join(OUTPUT_DIR, "kkt_entities.json"),
    orient="records",
    force_ascii=False,
    indent=2
)

print("Đã xuất: data/kkt_entities.json")

# =========================
# 5) courses.json
# =========================
course_cols = [
    "course_id",
    "course_name",
    "course_description_clean",
    "learning_outcomes_clean",
    "full_text_clean"
]

course_available_cols = [c for c in course_cols if c in df_course.columns]
course_df = df_course[course_available_cols].copy().fillna("")

course_df = course_df.rename(columns={
    "course_description_clean": "course_description",
    "learning_outcomes_clean": "learning_outcomes",
    "full_text_clean": "full_text"
})

course_df.to_json(
    os.path.join(OUTPUT_DIR, "courses.json"),
    orient="records",
    force_ascii=False,
    indent=2
)

print("Đã xuất: data/courses.json")

# =========================
# 6) job_kkt.json
# KKT_OCCURRENCE phải nối với KKT_ENTITY
# =========================
job_occ = df_occ[df_occ["source_type"].astype(str).str.upper() == "JOB"].copy()

# Dùng job_id_raw vì job_id trong file này có thể là chuỗi gộp
if "job_id_raw" in job_occ.columns:
    job_occ = job_occ.rename(columns={"job_id_raw": "job_id_source"})
else:
    job_occ["job_id_source"] = job_occ["job_id"]

job_occ = job_occ.merge(
    df_entity[["entity_id", "kkt_type", "canonical_name"]],
    on="entity_id",
    how="left"
)

job_kkt_cols = [
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
    "course_count_for_entity"
]

job_kkt_available_cols = [c for c in job_kkt_cols if c in job_occ.columns]
job_kkt_df = job_occ[job_kkt_available_cols].copy().fillna("")

job_kkt_df = job_kkt_df.rename(columns={
    "job_id_source": "job_id"
})

job_kkt_df.to_json(
    os.path.join(OUTPUT_DIR, "job_kkt.json"),
    orient="records",
    force_ascii=False,
    indent=2
)

print("Đã xuất: data/job_kkt.json")

# =========================
# 7) position_profiles.json
# Tạm dùng industry làm position_name cho demo
# =========================
job_occ_for_position = job_occ.merge(
    df_jobs[["job_id", "industry", "job_title_clean"]],
    left_on="job_id_source",
    right_on="job_id",
    how="left"
)

job_occ_for_position = job_occ_for_position.dropna(subset=["industry", "canonical_name"])

position_profiles = []

for industry_name, group in job_occ_for_position.groupby("industry"):
    job_count = group["job_id_source"].nunique()

    kkt_unique = group[["kkt_type", "canonical_name"]].drop_duplicates().sort_values(
        by=["kkt_type", "canonical_name"]
    )

    profile = {
        "position_name": industry_name,
        "job_count": int(job_count),
        "kkt_list": kkt_unique.fillna("").to_dict(orient="records")
    }

    position_profiles.append(profile)

with open(os.path.join(OUTPUT_DIR, "position_profiles.json"), "w", encoding="utf-8") as f:
    json.dump(position_profiles, f, ensure_ascii=False, indent=2)

print("Đã xuất: data/position_profiles.json")

# =========================
# 8) HOÀN TẤT
# =========================
print("\nHoàn tất xuất JSON.")
print("Các file đã tạo trong thư mục data/:")
print("- jobs.json")
print("- job_kkt.json")
print("- position_profiles.json")
print("- courses.json")
print("- kkt_entities.json")
