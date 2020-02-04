<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Priority Site coming soon</title>
    </head>

    <body>
        <h1><?php 
        echo "Site Name: Priority"; ?></h1>
        <?php 
        include 'pwd.php'; // load local values for $userName and $password
        $servername ="localhost";
        $dbname = "priority";
        $conn = new mysqli($servername, $userName, $password, $dbname);
        if($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error); 
        } else {
            echo "Hmm.. Could not connect to server or database or both.";
        }

        // "2019-08-20T23:45:02.712Z"
        // YYYY-MM-DD HH:MI:SS
        $sql = "CREATE TABLE IF NOT EXISTS tasks (
            id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            task VARCHAR(50) NOT NULL,
            category VARCHAR(30) DEFAULT "Unknown",
            description TEXT DEFAULT "",
            entered DATETIME DEFAULT CURRENT_TIMESTAMP,
            touched TIMESTAMP,
            done BOOLEAN DEFAULT FALSE 
        )";

        /* Create the questions table: 
        CREATE TABLE IF NOT EXISTS question ( 
            id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
            question VARCHAR(50) NOT NULL, 
            entered DATETIME DEFAULT CURRENT_TIMESTAMP, 
            touched TIMESTAMP, 
            archived BOOLEAN DEFAULT FALSE); 
        ALTER TABLE tasks 
            ADD description TEXT DEFAULT "" AFTER task,
            ADD category VARCHAR(30) DEFAULT "Unknown" AFTER task;
        ** create the qtask table:
        CREATE TABLE IF NOT EXISTS qtask (
            quid INT(6) UNSIGNED not NULL, 
            taskId INT(6) UNSIGNED not NULL, 
            touched TIMESTAMP, 
            state INT(1) DEFAULT 0,
            PRIMARY KEY(quid,taskId));
        ** Create the taskPair table:
        CREATE TABLE IF NOT EXISTS taskPair (
            quid INT(6) UNSIGNED not NULL,
            task1 INT(6) UNSIGNED not NULL, 
            task2 INT(6) UNSIGNED not NULL,
            historyMarks1 VARCHAR(20) DEFAULT "",
            historyMarks2 VARCHAR(20) DEFAULT "",
            historyTimes VARCHAR(200) DEFAULT "",
            touched TIMESTAMP, 
            PRIMARY KEY(quid,task1,task2));
        ** Create the category table:
        CREATE TABLE IF NOT EXISTS category (
            id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY, 
            category VARCHAR(50) NOT NULL, 
            description VARCHAR(50));
        */

        // formate for dropping a table: DROP table priority.tasks
        if ($conn->query($sql) === TRUE) {
            echo "Table TASKS exists or successfully created!<br>\n";
        } else {
            echo "Frowny face. Not created<br>\n" . $conn->error;
        }

        $sql = 'INSERT INTO tasks (task) VALUES ("Add another task to MariaDB")';
        if ($conn->query($sql) === TRUE) {
            echo "\t\tAdded a task to the database in the tasks table!<br>\n";
        } else {
            echo "\t\tBummer!<br>\n" . $conn->error;
        }

        $sql = 'UPDATE priority.tasks SET task="Updated task in MariaDB" where id=1';
        if ($conn->query($sql) === TRUE) {
            echo "\t\tUpdated a task to the database in the tasks table!<br>\n";
        } else {
            echo "\t\tMakes you go, 'Hmmmm?'<br>\n" . $conn->error;
        }

        $sql = 'SELECT id, task, done FROM tasks';
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            echo "\t\t<ol>\n";
            while ($row = $result->fetch_assoc()) {
                echo "\t\t\t<li> ID: " . $row["id"] . 
                " - Task: '" . $row["task"] . "' - Status: " . 
                ($row["done"] === 1 ? "complete": "active") . "</li>\n";
            }
            echo "\t\t</ol>\n";
        } else {
            echo "Not gots any data<br>\n" . $conn->error;
        }
        $conn->close();
        ?>
    </body>

</html>

