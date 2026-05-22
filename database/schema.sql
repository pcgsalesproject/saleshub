-- ============================================================
-- Employee & IT Asset Tracking System — Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS saleshub_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE saleshub_db;

-- ------------------------------------------------------------
-- departments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- positions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- employees
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     VARCHAR(20) NOT NULL UNIQUE,
  title_th        VARCHAR(20),
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  full_name       VARCHAR(200),
  prefix          VARCHAR(10),
  first_name_en   VARCHAR(100),
  last_name_en    VARCHAR(100),
  full_name_en    VARCHAR(200),
  date_of_birth   DATE,
  national_id     VARCHAR(20),
  phone           VARCHAR(20),
  email           VARCHAR(150) UNIQUE,
  department_id   INT UNSIGNED,
  position_id     INT UNSIGNED,
  sales_zone      VARCHAR(100),
  provinces       TEXT,
  status          ENUM('Active','Inactive','Resigned') NOT NULL DEFAULT 'Active',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  CONSTRAINT fk_emp_pos  FOREIGN KEY (position_id)   REFERENCES positions(id)   ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- asset_categories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_categories (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL UNIQUE
);

INSERT IGNORE INTO asset_categories (name) VALUES
  ('Computer'),('Laptop'),('Phone'),('iPad'),('Monitor'),('Others');

-- ------------------------------------------------------------
-- assets
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asset_tag         VARCHAR(50) NOT NULL UNIQUE,
  category_id       INT UNSIGNED,
  brand             VARCHAR(100),
  model             VARCHAR(100),
  serial_number     VARCHAR(100) UNIQUE,
  purchase_date     DATE,
  start_using_date  DATE,
  warranty_period   INT UNSIGNED COMMENT 'months',
  expiration_date   DATE GENERATED ALWAYS AS (
                      DATE_ADD(start_using_date, INTERVAL warranty_period MONTH)
                    ) STORED,
  status            ENUM('Available','Assigned','Repair','Retired') NOT NULL DEFAULT 'Available',
  image_path        VARCHAR(255),
  warranty_doc_path VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_asset_cat FOREIGN KEY (category_id) REFERENCES asset_categories(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- assignments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id     INT UNSIGNED NOT NULL,
  asset_id        INT UNSIGNED NOT NULL,
  assignment_date DATE NOT NULL,
  return_date     DATE,
  status          ENUM('Active','Returned') NOT NULL DEFAULT 'Active',
  doc_path        VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_asgn_emp  FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_asgn_asset FOREIGN KEY (asset_id)   REFERENCES assets(id)
);

-- ------------------------------------------------------------
-- asset_histories
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset_histories (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asset_id        INT UNSIGNED NOT NULL,
  employee_id     INT UNSIGNED,
  action          ENUM('Assigned','Returned','Repaired','Retired','Available') NOT NULL,
  action_date     DATE NOT NULL,
  note            TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_asset FOREIGN KEY (asset_id)    REFERENCES assets(id),
  CONSTRAINT fk_hist_emp   FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- users (system login)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50) NOT NULL UNIQUE,
  email        VARCHAR(150) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  role         ENUM('Admin','User') NOT NULL DEFAULT 'User',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Seed departments
-- ------------------------------------------------------------
INSERT IGNORE INTO departments (name) VALUES
  ('IT'),('HR'),('Finance'),('Operations'),('Marketing'),('Management');
