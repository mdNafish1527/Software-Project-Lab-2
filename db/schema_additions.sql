-- ═══════════════════════════════════════════════════════════════════════════
--   GaanBajna — SCHEMA ADDITIONS (FIXED)
--   FILE LOCATION: db/schema_additions.sql
--   Run AFTER schema.sql. Safe to run multiple times (IF NOT EXISTS).
--
--   FIXES APPLIED:
--   1. Table names corrected: events → EVENT, marketplace_items → ITEM
--   2. Removed duplicate custom_url (already in EVENT from schema.sql)
--   3. Removed redundant ticket_price_student / total_tickets_student
--      (schema.sql already has tier3_price / tier3_quantity for this)
--   4. Added missing is_available column to ITEM
--   5. Fixed index table name references
-- ═══════════════════════════════════════════════════════════════════════════

USE gaanbajna;

-- ─────────────────────────────────────────────────────────────────────────────
--  EVENT table — add columns missing from base schema
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE EVENT
  ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS genre            VARCHAR(80)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS duration_minutes INT          DEFAULT 120;

-- ─────────────────────────────────────────────────────────────────────────────
--  ITEM table — add columns missing from base schema
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE ITEM
  ADD COLUMN IF NOT EXISTS is_available     BOOLEAN        DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN        DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_price   DECIMAL(10,2)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_name      VARCHAR(100)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_dept      VARCHAR(100)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_contact   VARCHAR(20)    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS seller_hall      VARCHAR(100)   DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tags             TEXT           DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS views            INT            DEFAULT 0,
  ADD COLUMN IF NOT EXISTS condition_status ENUM('New','Like New','Good','Fair') DEFAULT 'Good';

-- ─────────────────────────────────────────────────────────────────────────────
--  Indexes for fast public browsing (fixed table names)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_featured  ON EVENT(is_featured, status, date);
CREATE INDEX IF NOT EXISTS idx_event_genre     ON EVENT(genre);
CREATE INDEX IF NOT EXISTS idx_item_featured   ON ITEM(is_featured, is_available);
CREATE INDEX IF NOT EXISTS idx_item_type       ON ITEM(type, is_available);

SELECT 'Schema additions applied successfully!' AS result;
