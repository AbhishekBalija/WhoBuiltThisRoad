CREATE TABLE work_orders (
  id                  SERIAL PRIMARY KEY,
  road_id             INTEGER REFERENCES roads(id) ON DELETE CASCADE,
  serial_no           TEXT,
  raw_description     TEXT,

  contractor_name     TEXT,
  contractor_phone    TEXT,

  ae_name             TEXT,
  ae_phone            TEXT,
  aee_name            TEXT,
  aee_phone           TEXT,
  ee_name             TEXT,
  ee_phone            TEXT,

  completion_date     DATE,
  dlp_period_years    NUMERIC(3, 1),
  dlp_expiry_date     DATE,
  project_cost        NUMERIC(15, 2),
  amount_paid         NUMERIC(15, 2),

  source_document     TEXT NOT NULL,
  source_label        TEXT NOT NULL,
  source_verified     BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE VIEW work_orders_with_status AS
SELECT
  wo.*,
  CASE
    WHEN wo.dlp_expiry_date IS NULL THEN 'unknown'
    WHEN wo.dlp_expiry_date > NOW() + INTERVAL '60 days' THEN 'active'
    WHEN wo.dlp_expiry_date > NOW() THEN 'expiring_soon'
    ELSE 'expired'
  END AS dlp_status,
  CASE
    WHEN wo.dlp_expiry_date > NOW() THEN
      EXTRACT(DAY FROM (wo.dlp_expiry_date - NOW()))::INTEGER
    ELSE NULL
  END AS days_remaining
FROM work_orders wo;
