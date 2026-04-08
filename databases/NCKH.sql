CREATE DATABASE NCKH_JOB_MATCH;
GO

Use NCKH_JOB_MATCH;
GO

--Check thử
SELECT TOP 10 * FROM COURSE;
SELECT TOP 10 * FROM JOB_POST;
SELECT TOP 10 * FROM KKT_ENTITY;
SELECT TOP 10 * FROM KKT_OCCURRENCE;
--Check thử




/* =========================================================
   RÀNG BUỘC PK - FK - CHECK CHO 4 BẢNG
   SQL Server
   Áp dụng cho các bảng import từ Excel:
   [COURSE], [JOB_POST], [KKT_ENTITY], [KKT_OCCURRENCE]
   ========================================================= */

/* =========================================================
   0) CHUẨN HÓA DỮ LIỆU KHÓA / GIÁ TRỊ TRỐNG
   ========================================================= */

-- COURSE
UPDATE [COURSE]
SET course_id = NULLIF(LTRIM(RTRIM(CAST(course_id AS VARCHAR(20)))), '');

UPDATE [COURSE]
SET course_name = NULLIF(LTRIM(RTRIM(CAST(course_name AS NVARCHAR(255)))), '');

-- JOB_POST
UPDATE [JOB_POST]
SET job_id = NULLIF(LTRIM(RTRIM(CAST(job_id AS NVARCHAR(20)))), '');

UPDATE [JOB_POST]
SET source = NULLIF(LTRIM(RTRIM(CAST(source AS NVARCHAR(100)))), '');

UPDATE [JOB_POST]
SET company_code = NULLIF(LTRIM(RTRIM(CAST(company_code AS NVARCHAR(50)))), '');

UPDATE [JOB_POST]
SET industry = NULLIF(LTRIM(RTRIM(CAST(industry AS NVARCHAR(255)))), '');

-- KKT_ENTITY
UPDATE [KKT_ENTITY]
SET entity_id = NULLIF(LTRIM(RTRIM(CAST(entity_id AS VARCHAR(20)))), '');

UPDATE [KKT_ENTITY]
SET kkt_type = UPPER(NULLIF(LTRIM(RTRIM(CAST(kkt_type AS VARCHAR(20)))), ''));

UPDATE [KKT_ENTITY]
SET canonical_name = NULLIF(LTRIM(RTRIM(CAST(canonical_name AS NVARCHAR(255)))), '');

UPDATE [KKT_ENTITY]
SET canonical_norm = NULLIF(LTRIM(RTRIM(CAST(canonical_norm AS NVARCHAR(255)))), '');

UPDATE [KKT_ENTITY]
SET canonical_ascii = NULLIF(LTRIM(RTRIM(CAST(canonical_ascii AS NVARCHAR(255)))), '');

-- KKT_OCCURRENCE
UPDATE [KKT_OCCURRENCE]
SET occ_id = NULLIF(LTRIM(RTRIM(CAST(occ_id AS VARCHAR(20)))), '');

UPDATE [KKT_OCCURRENCE]
SET source_type = UPPER(NULLIF(LTRIM(RTRIM(CAST(source_type AS VARCHAR(20)))), ''));

UPDATE [KKT_OCCURRENCE]
SET entity_id = NULLIF(LTRIM(RTRIM(CAST(entity_id AS VARCHAR(20)))), '');

UPDATE [KKT_OCCURRENCE]
SET course_id = NULLIF(LTRIM(RTRIM(CAST(course_id AS VARCHAR(20)))), '');

UPDATE [KKT_OCCURRENCE]
SET job_id = NULLIF(LTRIM(RTRIM(CAST(job_id AS NVARCHAR(20)))), '');

UPDATE [KKT_OCCURRENCE]
SET field = NULLIF(LTRIM(RTRIM(CAST(field AS NVARCHAR(50)))), '');

UPDATE [KKT_OCCURRENCE]
SET matched_term = NULLIF(LTRIM(RTRIM(CAST(matched_term AS NVARCHAR(255)))), '');

UPDATE [KKT_OCCURRENCE]
SET method = NULLIF(LTRIM(RTRIM(CAST(method AS NVARCHAR(50)))), '');


/* =========================================================
   1) KIỂM TRA LỖI TRƯỚC KHI GẮN RÀNG BUỘC
   Nếu query nào ra kết quả thì xử lý dữ liệu trước.
   ========================================================= */

-- 1.1. Trùng khóa chính
SELECT course_id, COUNT(*) AS so_lan
FROM [COURSE]
GROUP BY course_id
HAVING COUNT(*) > 1 OR course_id IS NULL;

SELECT job_id, COUNT(*) AS so_lan
FROM [JOB_POST]
GROUP BY job_id
HAVING COUNT(*) > 1 OR job_id IS NULL;

SELECT entity_id, COUNT(*) AS so_lan
FROM [KKT_ENTITY]
GROUP BY entity_id
HAVING COUNT(*) > 1 OR entity_id IS NULL;

SELECT occ_id, COUNT(*) AS so_lan
FROM [KKT_OCCURRENCE]
GROUP BY occ_id
HAVING COUNT(*) > 1 OR occ_id IS NULL;

-- 1.2. Giá trị loại không hợp lệ
SELECT *
FROM [KKT_ENTITY]
WHERE kkt_type NOT IN ('K', 'S', 'T') OR kkt_type IS NULL;

SELECT *
FROM [KKT_OCCURRENCE]
WHERE source_type NOT IN ('COURSE', 'JOB') OR source_type IS NULL;

-- 1.3. Lỗi logic source_type với course_id / job_id
SELECT *
FROM [KKT_OCCURRENCE]
WHERE
    (source_type = 'COURSE' AND (course_id IS NULL OR job_id IS NOT NULL))
    OR
    (source_type = 'JOB' AND (job_id IS NULL OR course_id IS NOT NULL))
    OR
    (course_id IS NULL AND job_id IS NULL)
    OR
    (course_id IS NOT NULL AND job_id IS NOT NULL);

-- 1.4. Dòng mồ côi sẽ làm FK lỗi
SELECT o.*
FROM [KKT_OCCURRENCE] o
LEFT JOIN [KKT_ENTITY] e ON o.entity_id = e.entity_id
WHERE e.entity_id IS NULL;

SELECT o.*
FROM [KKT_OCCURRENCE] o
LEFT JOIN [COURSE] c ON o.course_id = c.course_id
WHERE o.course_id IS NOT NULL
  AND c.course_id IS NULL;

SELECT o.*
FROM [KKT_OCCURRENCE] o
LEFT JOIN [JOB_POST] j ON o.job_id = j.job_id
WHERE o.job_id IS NOT NULL
  AND j.job_id IS NULL;


/* =========================================================
   2) ĐỒNG BỘ KIỂU DỮ LIỆU CHO CỘT KHÓA / CỘT CHÍNH
   Lưu ý:
   - KKT_OCCURRENCE.job_id đổi sang NVARCHAR(20)
     để khớp với JOB_POST.job_id
   ========================================================= */

ALTER TABLE [COURSE]
ALTER COLUMN course_id VARCHAR(20) NOT NULL;

ALTER TABLE [COURSE]
ALTER COLUMN course_name NVARCHAR(255) NOT NULL;

ALTER TABLE [JOB_POST]
ALTER COLUMN job_id NVARCHAR(20) NOT NULL;

ALTER TABLE [JOB_POST]
ALTER COLUMN industry NVARCHAR(255) NOT NULL;


DELETE FROM [KKT_ENTITY]
WHERE entity_id IS NULL
   OR LTRIM(RTRIM(CAST(entity_id AS VARCHAR(100)))) = '';

ALTER TABLE [KKT_ENTITY]
ALTER COLUMN entity_id VARCHAR(20) NOT NULL;

ALTER TABLE [KKT_ENTITY]
ALTER COLUMN kkt_type VARCHAR(20) NOT NULL;

ALTER TABLE [KKT_ENTITY]
ALTER COLUMN canonical_name NVARCHAR(255) NOT NULL;

ALTER TABLE [KKT_ENTITY]
ALTER COLUMN canonical_norm NVARCHAR(255) NOT NULL;

ALTER TABLE [KKT_ENTITY]
ALTER COLUMN canonical_ascii NVARCHAR(255) NOT NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN occ_id VARCHAR(20) NOT NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN source_type VARCHAR(20) NOT NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN entity_id VARCHAR(20) NOT NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN course_id VARCHAR(20) NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN job_id NVARCHAR(20) NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN field NVARCHAR(50) NOT NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN matched_term NVARCHAR(255) NOT NULL;

ALTER TABLE [KKT_OCCURRENCE]
ALTER COLUMN method NVARCHAR(50) NOT NULL;


/* =========================================================
   3) PRIMARY KEY
   ========================================================= */

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'PK_COURSE'
)
ALTER TABLE [COURSE]
ADD CONSTRAINT PK_COURSE PRIMARY KEY (course_id);

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'PK_JOB_POST'
)
ALTER TABLE [JOB_POST]
ADD CONSTRAINT PK_JOB_POST PRIMARY KEY (job_id);

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'PK_KKT_ENTITY'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT PK_KKT_ENTITY PRIMARY KEY (entity_id);

IF NOT EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = 'PK_KKT_OCCURRENCE'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT PK_KKT_OCCURRENCE PRIMARY KEY (occ_id);


/* =========================================================
   4) UNIQUE NÊN CÓ
   - tránh trùng cùng 1 thực thể chuẩn trong cùng 1 loại K/S/T
   ========================================================= */

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UQ_KKT_ENTITY_TYPE_CANONICAL'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT UQ_KKT_ENTITY_TYPE_CANONICAL
UNIQUE (kkt_type, canonical_name);


/* =========================================================
   5) CHECK CONSTRAINTS
   ========================================================= */

-- COURSE
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_COURSE_ID_NOT_BLANK'
)
ALTER TABLE [COURSE]
ADD CONSTRAINT CK_COURSE_ID_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(course_id))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_COURSE_NAME_NOT_BLANK'
)
ALTER TABLE [COURSE]
ADD CONSTRAINT CK_COURSE_NAME_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(course_name))) > 0);

-- JOB_POST
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_JOB_POST_ID_NOT_BLANK'
)
ALTER TABLE [JOB_POST]
ADD CONSTRAINT CK_JOB_POST_ID_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(job_id))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_JOB_POST_INDUSTRY_NOT_BLANK'
)
ALTER TABLE [JOB_POST]
ADD CONSTRAINT CK_JOB_POST_INDUSTRY_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(industry))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_JOB_POST_SOURCE_ALLOWED'
)
ALTER TABLE [JOB_POST]
ADD CONSTRAINT CK_JOB_POST_SOURCE_ALLOWED
CHECK (
    source IS NULL
    OR UPPER(LTRIM(RTRIM(source))) IN ('TOPCV', 'VIETNAMWORKS', 'LINKEDIN', 'INDEED')
);

-- KKT_ENTITY
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_ENTITY_ID_NOT_BLANK'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT CK_KKT_ENTITY_ID_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(entity_id))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_ENTITY_TYPE_ALLOWED'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT CK_KKT_ENTITY_TYPE_ALLOWED
CHECK (kkt_type IN ('K', 'S', 'T'));

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_ENTITY_CANONICAL_NAME_NOT_BLANK'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT CK_KKT_ENTITY_CANONICAL_NAME_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(canonical_name))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_ENTITY_CANONICAL_NORM_NOT_BLANK'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT CK_KKT_ENTITY_CANONICAL_NORM_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(canonical_norm))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_ENTITY_CANONICAL_ASCII_NOT_BLANK'
)
ALTER TABLE [KKT_ENTITY]
ADD CONSTRAINT CK_KKT_ENTITY_CANONICAL_ASCII_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(canonical_ascii))) > 0);

-- KKT_OCCURRENCE
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_OCCURRENCE_ID_NOT_BLANK'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT CK_KKT_OCCURRENCE_ID_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(occ_id))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_OCCURRENCE_SOURCE_TYPE_ALLOWED'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT CK_KKT_OCCURRENCE_SOURCE_TYPE_ALLOWED
CHECK (source_type IN ('COURSE', 'JOB'));

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_OCCURRENCE_FIELD_NOT_BLANK'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT CK_KKT_OCCURRENCE_FIELD_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(field))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_OCCURRENCE_MATCHED_TERM_NOT_BLANK'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT CK_KKT_OCCURRENCE_MATCHED_TERM_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(matched_term))) > 0);

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_OCCURRENCE_METHOD_NOT_BLANK'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT CK_KKT_OCCURRENCE_METHOD_NOT_BLANK
CHECK (LEN(LTRIM(RTRIM(method))) > 0);

-- Ràng buộc logic quan trọng nhất:
-- COURSE -> phải có course_id và job_id phải NULL
-- JOB    -> phải có job_id và course_id phải NULL
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = 'CK_KKT_OCCURRENCE_SOURCE_PARENT_MATCH'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT CK_KKT_OCCURRENCE_SOURCE_PARENT_MATCH
CHECK (
    (source_type = 'COURSE' AND course_id IS NOT NULL AND job_id IS NULL)
    OR
    (source_type = 'JOB' AND job_id IS NOT NULL AND course_id IS NULL)
);


/* =========================================================
   6) FOREIGN KEY
   ========================================================= */

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_KKT_OCCURRENCE_ENTITY'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT FK_KKT_OCCURRENCE_ENTITY
FOREIGN KEY (entity_id)
REFERENCES [KKT_ENTITY](entity_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_KKT_OCCURRENCE_COURSE'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT FK_KKT_OCCURRENCE_COURSE
FOREIGN KEY (course_id)
REFERENCES [COURSE](course_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_KKT_OCCURRENCE_JOB'
)
ALTER TABLE [KKT_OCCURRENCE]
ADD CONSTRAINT FK_KKT_OCCURRENCE_JOB
FOREIGN KEY (job_id)
REFERENCES [JOB_POST](job_id);


/* =========================================================
   7) INDEX PHỤ TRỢ TRUY VẤN / JOIN
   Không bắt buộc, nhưng nên có
   ========================================================= */

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_KKT_OCCURRENCE_ENTITY_ID'
)
CREATE INDEX IX_KKT_OCCURRENCE_ENTITY_ID
ON [KKT_OCCURRENCE](entity_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_KKT_OCCURRENCE_COURSE_ID'
)
CREATE INDEX IX_KKT_OCCURRENCE_COURSE_ID
ON [KKT_OCCURRENCE](course_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_KKT_OCCURRENCE_JOB_ID'
)
CREATE INDEX IX_KKT_OCCURRENCE_JOB_ID
ON [KKT_OCCURRENCE](job_id);

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = 'IX_KKT_ENTITY_TYPE'
)
CREATE INDEX IX_KKT_ENTITY_TYPE
ON [KKT_ENTITY](kkt_type);








