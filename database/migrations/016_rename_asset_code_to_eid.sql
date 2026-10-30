-- Rename assets.asset_code (รหัสทรัพย์สิน บัญชี) to eid. Data and the UNIQUE constraint are kept.
ALTER TABLE assets RENAME COLUMN asset_code TO eid;
