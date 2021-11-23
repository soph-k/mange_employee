USE manage_db;

INSERT INTO department (name)
VALUES ("Education"), 
        ("Science"),
        ("Health");

INSERT INTO role (title, salary, department_id)
VALUES ("Teacher", 1000.00, 001), 
        ("Professor", 10000.00, 001),
        ("Researcher", 2000.00, 002),
        ("Nurse", 4000.00, 003), 
        ("Doctor", 20000.00, 003); 

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("Maryam" , "Haji", 1, null),
        ("Keyvan" , "Shah", 2, 001),
        ("Mohammad" , "Esmaeili", 3, null),
        ("Sami" , "Heydari", 3, 002),
        ("Majid" , "Khosravi", 4, null),
        ("Sara" , "Rostami", 5, 003);