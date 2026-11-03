-- The app reads sales_areas.area_name / area_code. Databases created from an older schema.sql
-- have `name` instead; bring them in line. Safe to run on databases that already match.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'sales_areas' AND column_name = 'name')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = current_schema() AND table_name = 'sales_areas' AND column_name = 'area_name') THEN
    ALTER TABLE sales_areas RENAME COLUMN name TO area_name;
  END IF;
END $$;

ALTER TABLE sales_areas ADD COLUMN IF NOT EXISTS area_code TEXT;
