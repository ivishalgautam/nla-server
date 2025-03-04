-- Create Database (Must be done manually in psql or pgAdmin)
CREATE DATABASE quiz;

-- Connect to the Database (You must connect manually)
-- \c quiz

-- Create ENUM Types
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
        CREATE TYPE role_enum AS ENUM ('admin', 'superAdmin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'test_type_enum') THEN
        CREATE TYPE test_type_enum AS ENUM ('practice', 'competitive', 'olympiad', 'eligibility');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_type_enum') THEN
        CREATE TYPE subject_type_enum AS ENUM ('abacus', 'vedic');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_type_enum') THEN
        CREATE TYPE package_type_enum AS ENUM ('dashboard', 'olympiad', 'polympiad', 'eligibility');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM ('male', 'female');
    END IF;
END $$;

-- Create Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    logo VARCHAR(255),
    role role_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin (name, email, password, role)
VALUES ('Vishal', 'vishal@gmail.com', '1234', 'admin')
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;

-- Create Grades Table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    admin_id INT NOT NULL
);

-- Create Tests Table
CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    test_type test_type_enum NOT NULL,
    subject subject_type_enum NOT NULL,
    is_published BOOLEAN DEFAULT false,
    amount INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration VARCHAR(40) NOT NULL,
    instructions TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NOT NULL
);

-- Create Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    heading VARCHAR(40),
    question TEXT NOT NULL,
    answer VARCHAR(255) NOT NULL,
    test_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NOT NULL
);

-- Create Students Table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    gender gender_enum NOT NULL,
    guardian_name VARCHAR(100),
    dob DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    class VARCHAR(255),
    school_name VARCHAR(100),
    is_subscribed BOOLEAN DEFAULT false,
    test_assigned JSONB DEFAULT NULL,
    subject subject_type_enum NOT NULL,
    package package_type_enum NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    payment_received BOOLEAN DEFAULT false,
    credentials_created BOOLEAN DEFAULT false,
    expiration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NOT NULL
);

-- Create Student Credentials Table
CREATE TABLE IF NOT EXISTS student_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    student_id INT NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NOT NULL
);

-- Create Student Results Table
CREATE TABLE IF NOT EXISTS student_results (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    test_id INT NOT NULL,
    user_answers JSONB NOT NULL,
    time_taken VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NOT NULL
);

-- Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    gender gender_enum NOT NULL,
    guardian_name VARCHAR(100),
    dob DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    class VARCHAR(255),
    school_name VARCHAR(100),
    is_subscribed BOOLEAN DEFAULT false,
    test_assigned JSONB DEFAULT NULL,
    subject subject_type_enum NOT NULL,
    package package_type_enum NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    credentials_created BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    admin_id INT NOT NULL
);
