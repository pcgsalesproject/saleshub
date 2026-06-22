-- PostgreSQL Schema for SalesHub

DROP TABLE IF EXISTS asset_assignments;
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS asset_types;
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
    date_of_birth DATE,
    national_id TEXT UNIQUE,
    phone TEXT,
    email TEXT,
    department_id INT REFERENCES departments(id),
    position_id INT REFERENCES positions(id),
    sales_area_id INT REFERENCES sales_areas(id),
    manager_id INT REFERENCES employees(id),
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

CREATE TABLE document_number_sequences (
    year INT PRIMARY KEY,
    last_seq INT NOT NULL DEFAULT 0
);

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
    status VARCHAR NOT NULL DEFAULT 'found',
    comment TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_id INT REFERENCES inspection_sessions(id)
);

-- Seed Data (Optional)
INSERT INTO departments (name) VALUES 
('IT'), ('HR'), ('Finance'), ('Operations'), ('Marketing'), ('Management')
ON CONFLICT DO NOTHING;
