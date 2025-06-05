// index.js
import inquirer from 'inquirer';
import pg from 'pg';

const { Client } = pg; // load pg client to talk to PostgreSQL

const client = new Client({
  user: 'postgres', // database username
  password: 'B0wser!!12', // your postgres password
  database: 'employee_tracker', // database to connect to
  host: 'localhost', // local machine
  port: 5432, // default PostgreSQL port
});

client.connect() // connect to PostgreSQL
  .then(() => {
    console.log('Connected to employee_tracker database'); // confirm connection
    startApp(); // start the app prompt loop
  })
  .catch(err => console.error('Connection error', err.stack)); // handle errors

function startApp() {
  inquirer.prompt([
    {
      type: 'list', // present choices as a list
      name: 'action', // store answer under 'action'
      message: 'What would you like to do?', // prompt message
      choices: [
        'View All Departments',
        'View All Roles',
        'View All Employees',
        'Add Department',
        'Add Role',
        'Add Employee',
        'Update Employee Role',
        'Exit',
      ],
    }
  ]).then(answer => {
    switch (answer.action) {
      case 'View All Departments':
        viewDepartments();
        break;
      case 'View All Roles':
        viewRoles();
        break;
      case 'View All Employees':
        viewEmployees();
        break;
      case 'Add Department':
        addDepartment();
        break;
      case 'Add Role':
        addRole();
        break;
      case 'Add Employee':
        addEmployee();
        break;
      case 'Update Employee Role':
        updateEmployeeRole();
        break;
      case 'Exit':
        client.end(); // close DB connection
        console.log('Goodbye!');
        break;
    }
  });
}

// Placeholder functions for next steps:
function viewDepartments() {
  client.query('SELECT id, name FROM department ORDER BY id;') // get departments ordered by id
    .then(res => {
      console.table(res.rows); // display results in table format
      startApp(); // go back to main menu
    })
    .catch(err => {
      console.error('Error viewing departments:', err); // show error
      startApp(); // continue app anyway
    });
}

function viewRoles() {
  const sql = `
    SELECT role.id, role.title, department.name AS department, role.salary
    FROM role
    JOIN department ON role.department_id = department.id
    ORDER BY role.id;
  `; // SQL to get roles with department name

  client.query(sql)
    .then(res => {
      console.table(res.rows); // show roles in table
      startApp(); // back to menu
    })
    .catch(err => {
      console.error('Error viewing roles:', err);
      startApp();
    });
}

function viewEmployees() {
  const sql = `
    SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary,
      CONCAT(m.first_name, ' ', m.last_name) AS manager
    FROM employee e
    LEFT JOIN employee m ON e.manager_id = m.id
    JOIN role ON e.role_id = role.id
    JOIN department ON role.department_id = department.id
    ORDER BY e.id;
  `; // SQL to get employee info with roles, departments, managers

  client.query(sql)
    .then(res => {
      console.table(res.rows); // show employees table
      startApp(); // back to menu
    })
    .catch(err => {
      console.error('Error viewing employees:', err);
      startApp();
    });
}

function addDepartment() {
  inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Enter the name of the new department:',
      validate: input => input ? true : 'Please enter a department name.',
    }
  ]).then(answer => {
    client.query('INSERT INTO department (name) VALUES ($1)', [answer.name])
      .then(() => {
        console.log(`Department "${answer.name}" added.`);
        startApp();
      })
      .catch(err => {
        console.error('Error adding department:', err);
        startApp();
      });
  });
}

function addRole() {
  // first get departments to choose from
  client.query('SELECT id, name FROM department')
    .then(res => {
      const departments = res.rows.map(dep => ({ name: dep.name, value: dep.id }));
      inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the title of the new role:',
          validate: input => input ? true : 'Please enter a role title.',
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the salary for this role:',
          validate: input => !isNaN(input) && input > 0 ? true : 'Please enter a positive number.',
        },
        {
          type: 'list',
          name: 'department_id',
          message: 'Select the department for this role:',
          choices: departments,
        }
      ]).then(answers => {
        client.query(
          'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
          [answers.title, answers.salary, answers.department_id]
        )
          .then(() => {
            console.log(`Role "${answers.title}" added.`);
            startApp();
          })
          .catch(err => {
            console.error('Error adding role:', err);
            startApp();
          });
      });
    })
    .catch(err => {
      console.error('Error fetching departments:', err);
      startApp();
    });
}

function addEmployee() {
  Promise.all([
    client.query('SELECT id, title FROM role'),
    client.query('SELECT id, first_name, last_name FROM employee'),
  ])
    .then(([rolesRes, employeesRes]) => {
      const roles = rolesRes.rows.map(r => ({ name: r.title, value: r.id }));
      const managers = employeesRes.rows.map(e => ({ name: `${e.first_name} ${e.last_name}`, value: e.id }));
      managers.unshift({ name: 'None', value: null }); // option for no manager

      inquirer.prompt([
        {
          type: 'input',
          name: 'first_name',
          message: "Enter the employee's first name:",
          validate: input => input ? true : 'Please enter a first name.',
        },
        {
          type: 'input',
          name: 'last_name',
          message: "Enter the employee's last name:",
          validate: input => input ? true : 'Please enter a last name.',
        },
        {
          type: 'list',
          name: 'role_id',
          message: "Select the employee's role:",
          choices: roles,
        },
        {
          type: 'list',
          name: 'manager_id',
          message: "Select the employee's manager:",
          choices: managers,
        }
      ]).then(answers => {
        client.query(
          'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
          [answers.first_name, answers.last_name, answers.role_id, answers.manager_id]
        )
          .then(() => {
            console.log(`Employee ${answers.first_name} ${answers.last_name} added.`);
            startApp();
          })
          .catch(err => {
            console.error('Error adding employee:', err);
            startApp();
          });
      });
    })
    .catch(err => {
      console.error('Error fetching roles or employees:', err);
      startApp();
    });
}

function updateEmployeeRole() {
  Promise.all([
    client.query('SELECT id, first_name, last_name FROM employee'),
    client.query('SELECT id, title FROM role'),
  ])
    .then(([employeesRes, rolesRes]) => {
      const employees = employeesRes.rows.map(e => ({ name: `${e.first_name} ${e.last_name}`, value: e.id }));
      const roles = rolesRes.rows.map(r => ({ name: r.title, value: r.id }));

      inquirer.prompt([
        {
          type: 'list',
          name: 'employee_id',
          message: 'Select the employee to update:',
          choices: employees,
        },
        {
          type: 'list',
          name: 'role_id',
          message: 'Select the new role:',
          choices: roles,
        }
      ]).then(answers => {
        client.query(
          'UPDATE employee SET role_id = $1 WHERE id = $2',
          [answers.role_id, answers.employee_id]
        )
          .then(() => {
            console.log('Employee role updated.');
            startApp();
          })
          .catch(err => {
            console.error('Error updating employee role:', err);
            startApp();
          });
      });
    })
    .catch(err => {
      console.error('Error fetching employees or roles:', err);
      startApp();
    });
}

