-- PostgreSQL Schema for SalesHub

DROP TABLE IF EXISTS org_chart_nodes;
DROP TABLE IF EXISTS asset_checks;
DROP TABLE IF EXISTS inspection_sessions;
DROP TABLE IF EXISTS inspection_rounds;
DROP TABLE IF EXISTS document_number_sequences;
DROP TABLE IF EXISTS asset_assignments;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_types;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS sales_areas;
DROP TABLE IF EXISTS positions;
DROP TABLE IF EXISTS departments;

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    position TEXT NOT NULL,
    position_en TEXT
);

CREATE TABLE sales_areas (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    department INT REFERENCES departments(id)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    prefix_th TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    prefix_en TEXT,
    first_name_en TEXT,
    last_name_en TEXT,
    nickname TEXT,
    date_of_birth DATE,
    national_id TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')),
    department_id INT REFERENCES departments(id),
    position_id INT REFERENCES positions(id),
    sales_area_id INT REFERENCES sales_areas(id),
    manager_id INT REFERENCES employees(id),
    photo_url TEXT,
    start_date DATE,
    resigned_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR UNIQUE,
    name VARCHAR NOT NULL
);

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_tag VARCHAR NOT NULL UNIQUE,
    asset_code VARCHAR UNIQUE,
    asset_name VARCHAR NOT NULL,
    asset_type_id INT REFERENCES asset_types(id),
    brand VARCHAR,
    model VARCHAR,
    serial_number VARCHAR UNIQUE,
    phone_number VARCHAR,
    purchase_price NUMERIC,
    po_number VARCHAR,
    vendor VARCHAR,
    warranty_conditions TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    status VARCHAR,
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE asset_assignments (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    asset_id INT REFERENCES assets(id),
    assigned_at TIMESTAMP,
    returned_at TIMESTAMP,
    note TEXT,
    doc_number TEXT,
    proposed_by_id INT REFERENCES employees(id),
    endorsed_by_id INT REFERENCES employees(id),
    approved_by_id INT REFERENCES employees(id),
    return_doc_number TEXT,
    condition TEXT,
    return_proposed_by_id INT REFERENCES employees(id),
    return_endorsed_by_id INT REFERENCES employees(id),
    return_approved_by_id INT REFERENCES employees(id)
);

-- Only one active (not yet returned) assignment per asset at a time
CREATE UNIQUE INDEX asset_assignments_active_asset_idx ON asset_assignments (asset_id) WHERE returned_at IS NULL;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL CHECK (name IN ('admin', 'viewer'))
);

CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('admin'), ('viewer') ON CONFLICT DO NOTHING;

-- Bootstrap: assign the first admin manually after seeding, e.g.
-- INSERT INTO user_roles (email, role_id) VALUES ('you@example.com', (SELECT id FROM roles WHERE name = 'admin'));
-- Any authenticated user without a row in user_roles is treated as 'viewer' (read-only).

CREATE TABLE document_number_sequences (
    year INT PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

CREATE TABLE inspection_rounds (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- Only one round can be open at a time
CREATE UNIQUE INDEX inspection_rounds_one_open_idx ON inspection_rounds (status) WHERE status = 'open';

CREATE TABLE inspection_sessions (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id),
    checked_by_id INT REFERENCES employees(id),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asset_checks (
    id SERIAL PRIMARY KEY,
    asset_id INT NOT NULL REFERENCES assets(id),
    checked_by_id INT REFERENCES employees(id),
    -- Snapshot of who was holding the asset at the moment it was checked
    -- (captured at insert time), used for reporting so a later transfer of
    -- the asset never re-attributes this historical check to someone else.
    holder_employee_id INT REFERENCES employees(id),
    status VARCHAR NOT NULL DEFAULT 'found',
    comment TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id INT REFERENCES inspection_sessions(id),
    round_id INT REFERENCES inspection_rounds(id)
);

CREATE TABLE org_chart_nodes (
    id SERIAL PRIMARY KEY,
    chart_key TEXT NOT NULL DEFAULT 'sales-admin',
    parent_id INT REFERENCES org_chart_nodes(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    tag TEXT,
    is_exec BOOLEAN NOT NULL DEFAULT false,
    note TEXT,
    pair_group TEXT,
    responsibilities TEXT[],
    employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX org_chart_nodes_parent_idx ON org_chart_nodes (parent_id);

-- Seed the fixed Sales Admin structure once: root (Head of Sales Admin) + 4 team-lead slots
DO $$
DECLARE
  root_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND parent_id IS NULL) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, tag, is_exec)
    VALUES ('sales-admin', NULL, 0, NULL, true)
    RETURNING id INTO root_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, tag, is_exec) VALUES
      ('sales-admin', root_id, 0, 'Admin TT', false),
      ('sales-admin', root_id, 1, 'Admin MT', false),
      ('sales-admin', root_id, 2, 'Admin CLM', false),
      ('sales-admin', root_id, 3, 'System Admin', false);
  END IF;
END $$;

-- Seed Data (Optional)
INSERT INTO departments (name) VALUES
('IT'), ('HR'), ('Finance'), ('Operations'), ('Marketing'), ('Management')
ON CONFLICT DO NOTHING;
