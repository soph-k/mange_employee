// Required packages
const mysql = require("mysql2");
require('dotenv').config();
const inquirer = require("inquirer");
require('console.table');


const db = mysql.createConnection(
  {
    host: process.env.DB_HOST,
    port: 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: 'manage_db'
  },
  console.log(`You are now connected to the manage_db database.`)
);


// Initial questions to ask
startQuestion = () => {
  inquirer.prompt([
    {
      type: 'list',
      name: 'choices',
      message: 'What would you like to do? ',
      choices: [
        'View All Departments',
        'View All Roles',
        'View All Employees',
        'Add a Department',
        'Add a Role',
        'Add an Employee',
        'Update an Employees Role',
        'Delete a Department',
        'Delete a Role',
        'Delete an Employee',
        'Quit'
      ]
    }
  ])
  .then((response) => {
    switch (response.choices) {
      case 'View All Departments':
        departments();
        break;
      case 'View All Roles':
        roles();
        break;
      case 'View All Employees':
        employees();
        break;
      case 'Add a Department':
        addDepartment();
        break;
      case 'Add a Role':
        addRole();
        break;
      case 'Add an Employee':
        addEmployee();
        break;
      case 'Update an Employees Role':
        updateEmployee();
        break;
      case 'Delete a Department':
        deleteDepartment();
        break;
      case 'Delete a Role':
        deleteRole();
        break;
      case 'Delete a Employee':
        deleteEmployee();
        break;
      case 'Quit':
        db.end();
        break;
    }
  })
}


const departments = () => {
  getDepartmentsDB()
  .then((response) => {
    console.table(response);
    startQuestion();
  })
  .catch((err) => { 
    throw err 
  })
}


const roles = () => {
  getRolesDB()
  .then((response) => {
    console.table(response);
    startQuestion();
  })
  .catch((err) => {
    throw err 
  })
}


const employees = () => {
  getEmployeesDB()
  .then((response) => {
    console.table(response);
    startQuestion();
  })
  .catch((err) => { 
    throw err 
  })
}


const addDepartment = () => {
  inquirer
    .prompt(
      {
        type: 'input',
        message: 'Add a new department.',
        name: 'addDep',
      })
      .then((res) => {
        addDepartmentDB(res.addDep);
        console.log('Added ' + res.addDep + '.');
        startQuestion();
      })
      .catch((err) => { 
        throw (err) 
      }
    );
}


const addRole = () => {
  let departmentArray = [];
  getDepartmentsDB()
    .then((response) => {
      for (let i = 0; i < response.length; i++) {
        departmentArray.push({ name: response[i].name, value: response[i].id });
      }
      return inquirer
        .prompt([
          {
            name: "roleName",
            type: "input",
            message: "Role name. "
          },
          {
            name: "salaryAmount",
            type: "input",
            message: "Salary amount. "
          },
          {
            name: "department",
            type: "list",
            message: "Which department does the role belong to? ",
            choices: departmentArray
          }
        ])
    })
    .then((respnose) => {
      addRoleDB(respnose.roleName, respnose.salaryAmount, respnose.department);
      console.log('Added ' + respnose.roleName + '.');
      startQuestion()
    })
    .catch((err) => { 
      throw (err) 
    });
}


const addEmployee = () => {
  Promise.all([getRolesDB(), managersDB()])
    .then((response) => {
      let roleList = response[0].map(role => role.title);
      let managerList = response[1].map(manager => manager.first_name + " " + manager.last_name).sort();
      inquirer.prompt([
        {
          message: "Employee's first name?",
          type: "input",
          name: "firstName"
        },
        {
          message: "Employee's last name?",
          type: "input",
          name: "lastName"
        },
        {
          message: "Employee's role?",
          type: "list",
          name: "employeeRole",
          choices: roleList
        },
        {
          message: "Employee's manager?",
          type: "list",
          name: "employeeManager",
          choices: [...managerList, 'None']
        },
      ])
      .then(res => {
        let selectedRole = res.employeeRole;
        let selectedManager = res.employeeManager;
        let roleIndexNumber = response[0].findIndex(function (role) {
          return selectedRole === role.title;
        })
        let roleID = response[0][roleIndexNumber].id;
        let managerIndexNumber = response[1].findIndex(function (manager) {
          return selectedManager === manager.first_name + " " + manager.last_name;
        })
        let managerID = (managerIndexNumber === -1) ? null : response[1][managerIndexNumber].id;
        addEmployeeDB(res.firstName, res.lastName, roleID, managerID).then(res => { startQuestion() }).catch(err => { console.log(err) });
        console.log('Added ' + res.firstName + ' ' + res.lastName + '.');
      })
    })
    .catch(err =>
      console.log(err)
    );
}


const updateEmployee = () => {
  Promise.all([getEmployeesDB(), getRolesDB()])
    .then((response) => {
      let currentEmployees = response[0].map((employee =>  employee.first_name + " " + employee.last_name))
      let currentRoles = response[1].map((employee => employee.title ))
      inquirer.prompt([
        {
          type: "list",
          message: "Updated selected employee's? ",
          name: "employeeName",
          choices: currentEmployees
        },
        {
          type: "list",
          message: "Role to assign the selected employee? ",
          name: "selectRole",
          choices: currentRoles
        }
        ])
        .then(res => {
          let selectedEmployee = res.employeeName;
          let selectedRole = res.selectRole;
          let employeeIndexNumber = response[0].findIndex(function (employee) {
            return selectedEmployee === employee.first_name + " " + employee.last_name;
        })
          let thisEmployeeId = response[1][employeeIndexNumber].id;
          let roleIndexNumber = response[1].findIndex((role => selectedRole === role.title));
          let roleID = response[1][roleIndexNumber].id;
          db.query(`UPDATE employee SET role_id = ? WHERE id= ?`, [roleID, thisEmployeeId], (err, response) => {
            console.log("Updated " + selectedEmployee + "'s role.")
            startQuestion();
          })
        })
    })
}


const deleteDepartment = () => {
  let departmentArray = [];
  db.query("SELECT id, name FROM department", (err, res) => {
    for (var i = 0; i < res.length; i++) {
      departmentArray.push(Object(res[i]));
    }
    console.table(res);
    inquirer
    .prompt(
      {
        name: 'delDepartment',
        type: 'list',
        message: 'Delete a department.',
        choices: function () {
          let choiceArray = [];
          for (let i = 0; i < departmentArray.length; i++) {
            choiceArray.push(departmentArray[i])
          }
          return choiceArray;
        }
      })
      .then((response) => {
        for (i = 0; i < departmentArray.length; i++) {
          if (response.delDepartment === departmentArray[i].name) {
            newChoice = departmentArray[i].id
            deleteDepartmentDB(newChoice)
            .then(response => { 
              startQuestion() 
            })
            .catch(err => { 
              console.log(err) 
            });
            console.log("Deleted " + response.delDepartment + " succesfully.");
          }
        }
      })
  })
}


const deleteRole = () => {
    let roleArray = [];
    db.query("SELECT id, title FROM role", (err, response) => {
      for (var i = 0; i < response.length; i++) {
        roleArray.push(Object(response[i]));
      }
      console.table(response);
      inquirer.prompt(
        {
          type: 'list',
          name: 'delRole',
          message: 'Delete a role. ',
          choices: roleArray.map(role => role.title),
        })
        .then((response) => {
          for (i = 0; i < roleArray.length; i++) {
            if (response.delRole === roleArray[i].title) {
              newChoice = roleArray[i].id
              deleteRoleDB(newChoice)
              .then(response => {
                startQuestion();
              })
              .catch(err => { 
                console.log(err)
              });
              console.log("Deleted " + response.delRole + " succesfully.");
            }
          }
            startQuestion();
        })
    })
}


const deleteEmployee = () => {
  let employeeList = [];
  db.query("SELECT id, first_name, last_name FROM employee", (err, res) => {
    employeeList = response;
    console.table(response);
      inquirer
        .prompt([
          {
            name: "employee",
            type: "list",
            message: "Delete an employee.",
            choices: employeeList.map(employee => employee.first_name + " " + employee.last_name),
          },
        ])
        .then((response) => {
          let empId = employeeList.find(employee => employee.first_name + " " + employee.last_name === response.employee).id;
          deleteEmployeeDB(empId).then(res => { startQuestion() }).catch(err => { console.log(err) });
          console.log("Deleted " + response.employee + "  succesfully.");
        });
  });
};



const getDepartmentsDB = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT id, name FROM department", 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const getRolesDB = () => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT role.id, title, name AS Department, salary FROM role JOIN department ON role.department_id = department.id;`, 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  });
}

const getEmployeesDB = () => {
  return new Promise((resolve, reject) => {
    db.query(`SELECT employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(e.first_name, ' ' ,e.last_name) AS Manager FROM employee INNER JOIN role on role.id = employee.role_id INNER JOIN department on department.id = role.department_id LEFT JOIN employee e on employee.manager_id = e.id`, 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  });
}

const addDepartmentDB = (addDep) => {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO department SET ?',
    {
      name: addDep,
    },
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  });
}

const addRoleDB = (roleName, salaryAmount, department) => {
  return new Promise((resolve, reject) => {
    db.query("INSERT INTO role SET ?",
    {
      title: roleName,
      salary: salaryAmount,
      department_id: department,
    },
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const addEmployeeDB = (firstName, lastName, roleID, managerID) => {
  return new Promise((resolve, reject) => {
    db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)`, [firstName, lastName, roleID, managerID], 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const updateEmployeeDB = (id, firstName, lastName, roleId, managerId) => {
  return new Promise((resolve, reject) => {
    db.query(`UPDATE employee SET first_name = ?, last_name = ?, role_id = ?, manager_id = ? WHERE id = ?`, [firstName, lastName, roleId, managerId, id], 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const deleteDepartmentDB = (newChoice) => {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM department Where id = ${newChoice}`, 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const deleteRoleDB = (newChoice) => {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM role Where id = ${newChoice}`, 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const deleteEmployeeDB = (empId) => {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM employee WHERE id = ?`, [empId], 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  })
}

const managersDB = () => {
  return new Promise((resolve, reject) => {
    db.query('SELECT first_name, last_name, id FROM employee WHERE manager_id IS NULL', 
    (err, res) => {
      err && reject(err) || resolve(res);
    })
  });
}


startQuestion ();
