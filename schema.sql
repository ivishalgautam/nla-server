CREATE DATABASE quiz IF NOT EXISTS;

CREATE
OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TYPE test_type AS ENUM (
    'practice',
    'competitive',
    'olympiad',
    'eligibility'
);

CREATE TYPE package_type AS ENUM (
    'dashboard',
    'olympiad',
    'polympiad',
    'eligibility'
);

CREATE TYPE subject_type AS ENUM ('abacus', 'vedic');

CREATE TYPE gender_type AS ENUM ('male', 'female');

CREATE TABLE admin(
    email VARCHAR(40) NOT NULL,
    password VARCHAR(40) NOT NULL
);

INSERT INTO
    admin (email, password)
VALUES
    ('vishal@gmail.com', '1234');

CREATE TABLE grades(
    id INT PRIMARY KEY NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE tests(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    test_type test_type NOT NULL,
    subject subject_type NOT NULL,
    is_published BOOLEAN DEFAULT false,
    amount INT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration VARCHAR(40) NOT NULL,
    instructions TEXT [] NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Create a trigger to call the function before update
CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON tests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE questions(
    id SERIAL PRIMARY KEY,
    question VARCHAR(40) [] DEFAULT '{}',
    answer INT NOT NULL,
    test_id INT REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    gender gender_type NOT NULL,
    guardian_name VARCHAR(100),
    dob DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    school_name VARCHAR(100),
    is_subscribed BOOLEAN DEFAULT false,
    test_assigned VARCHAR(20) [],
    subject subject_type NOT NULL,
    package package_type NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    payment_received BOOLEAN DEFAULT false,
    credentials_created BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trigger_update_updated_at BEFORE
UPDATE
    ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE student_credentials(
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    student_id INT REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_results(
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    test_id INT REFERENCES tests(id) ON DELETE CASCADE NOT NULL,
    student_points INT NOT NULL,
    total_points INT NOT NULL,
    student_attempted INT NOT NULL,
    total_questions INT NOT NULL,
    grade VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE leads(
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    gender gender_type NOT NULL,
    guardian_name VARCHAR(100),
    dob DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(100) NOT NULL,
    grade INT NOT NULL,
    school_name VARCHAR(100),
    is_subscribed BOOLEAN DEFAULT false,
    test_assigned VARCHAR(20),
    subject subject_type NOT NULL,
    package package_type NOT NULL,
    is_disabled BOOLEAN DEFAULT false,
    credentials_created BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);