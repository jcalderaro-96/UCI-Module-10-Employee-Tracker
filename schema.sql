-- schema.sql
-- 🟩 Create department table
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS department;

CREATE TABLE department (
  id SERIAL PRIMARY KEY, -- 🟩 unique ID for department
  name VARCHAR(30) UNIQUE NOT NULL -- 🟩 department name
);

-- 🟩 Create role table
CREATE TABLE role (
  id SERIAL PRIMARY KEY, -- 🟩 unique ID for role
  title VARCHAR(30) UNIQUE NOT NULL, -- 🟩 role title
  salary DECIMAL NOT NULL, -- 🟩 salary for this role
  department_id INTEGER NOT NULL REFERENCES department(id) -- 🟩 linked department
);

-- 🟩 Create employee table
CREATE TABLE employee (
  id SERIAL PRIMARY KEY, -- 🟩 unique ID for employee
  first_name VARCHAR(30) NOT NULL, -- 🟩 employee's first name
  last_name VARCHAR(30) NOT NULL, -- 🟩 employee's last name
  role_id INTEGER NOT NULL REFERENCES role(id), -- 🟩 linked role
  manager_id INTEGER REFERENCES employee(id) -- 🟩 optional manager (can be null)
);

-- 🟩 Insert sample departments
INSERT INTO department (name) VALUES
  ('Engineering'),
  ('Sales'),
  ('HR');

-- 🟩 Insert sample roles
INSERT INTO role (title, salary, department_id) VALUES
  ('Engineer', 80000, 1),
  ('Salesperson', 60000, 2),
  ('HR Manager', 70000, 3);

-- 🟩 Insert sample employees
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES
  ('Alice', 'Smith', 1, NULL), -- 🟩 Engineer with no manager
  ('Bob', 'Jones', 2, NULL), -- 🟩 Salesperson with no manager
  ('Carol', 'White', 3, NULL); -- 🟩 HR Manager with no manager

-- end of file
