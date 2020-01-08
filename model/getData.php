<?php
  /* queryPriorityDB - interface spec:
    query=<type>&<optionalParam>&x=<randomized>
    where type is
      taskList
      createTask
      updateTaskState (was updateState)
      deleteTaskId (was deleteId)
      deleteActiveTasks (or deleteActive) // perm delete all active.
      markTasksDone (was markDone)  // mark all active done rather than delete.
      questionList
      createQuestion
      updateQuestionState
      deleteQuestionId
      createTaskPairs
      updateQTask
      updateTaskPair
    createTask takes an URLencoded task string: taskStr=like%20so
    taskList does not have any optional parameters
    deleteId takes a parameter id=1493
    updateState takes two parameters like: &id=1493&state=<state> Note there currently is no way to update a task, only delete and re-add
  // */
  $debug = ""; // "DEBUG"; // uncomment to override debug flag passed in by user
  if ( $debug !== "DEBUG") {
    // override parameter passed in by user. Set $debug = "" to allow user to control instrumentation.
    if ($_POST["mode"] == "DEBUG") {
      $debug = "DEBUG";
    }
  } 
  
  if ($debug == "DEBUG") {
    $taskTable = 'taskbak';
    $questionTable = 'question'; // using the same table for now. This will change.
  } elseif ($_POST["x"] == "-1") {
    $taskTable = 'taskbak';
    $questionTable = 'question';
    // TODO: intend to use this code to select the table in the future. Replace X with User or someting suitable
  } else {
    $taskTable = 'tasks';
    $questionTable = 'question';
  }

  // debugging instrumentation that is echoed if $debug is defined. Will likely mess up data transfer for the 
  // caller so they should know debug is on as well
  function cLog($str) {
    global $debug;
    if ($debug == "DEBUG") {
      echo $str;
    }
  }

  function openDatabase() {
    // Connect to the database
    include 'pwd.php'; // load local values for $userName and $password
    $connection = new mysqli("localhost", $userName, $password, "priority");
    
    if($connection->connect_error) {
      cLog("died<br>\n");
      die("Connection failed: " . $connection->connect_error); 
    }
    mysqli_autocommit($connection, TRUE);
    return $connection;
  }

/******************************************************************************/  
/*******************----> Task table related functions <----*******************/
/******************************************************************************/
  
  function doTaskList($connection, $table, $state) {
  
    // Query to run
    if ($state === "TRUE") {
      $myQu = "SELECT task, id, done FROM "  .  $table . " WHERE done";
    } elseif ($state === "FALSE") {
      $myQu = "SELECT task, id, done FROM "  .  $table . " WHERE NOT done";
    } else { // otherwise any status
      $myQu = "SELECT task, id, done FROM "  .  $table;
    }
    cLog("The query I've built is: " . $myQu . "<br />");
    $query = mysqli_query($connection,  $myQu );
    // Create empty array to hold query results
    $someArray = [];

    // Loop through query and push results into $someArray;
    while ($row = mysqli_fetch_assoc($query)) {
      array_push($someArray, [
        'task'   => $row['task'],
        'id' => $row['id'],
        'done' => $row['done']
      ]);
    }
    $myQu = "SELECT MAX(id) FROM "  .  $table . " LIMIT 1";
    cLog("The query I've built is: " . $myQu . "<br />");
    $query = mysqli_query($connection, $myQu);
    $res = mysqli_fetch_all($query,MYSQLI_NUM);
    $taskBundle =[];
    array_push($taskBundle, [
      'tasks' => $someArray,
      'lastId' => $res[0][0]
    ]);
    // Convert the Array to a JSON String and echo it
    $someJSON = json_encode($taskBundle);
    echo $someJSON;
  }

  function doCreateTask($connection, $table, $taskStr) {
    cLog("do the create/insert function <br />\n");
    if ($taskStr == "") {
      cLog("Invalid task name: " . $taskStr . "<br />\n");
    } else {
      $myQu = 'INSERT INTO '  .  $table . ' (task) VALUES ("' . $taskStr . '")';
      $connection->query($myQu);
      cLog("the query i've built: " . $myQu . "<br />\n" );
      if ($connection->affected_rows != 1) {
        cLog(mysqli_error($connection) . " Task not inserted <br />\n");
        echo json_encode(['id' => -1]);
      } else {
        $newId = mysqli_insert_id($connection);
        cLog("Task " . $newId . " inserted");
        echo json_encode(['id' => $newId]);
      }
    }
  }

  function doUpdateState($connection, $table, $id, $newState) {
    cLog("do the Update function <br />");
    if ($id == -1) {
      $myQu = 'UPDATE priority.'  .  $table . ' SET done=' . $newState . ' where done = FALSE';
    } else {
      $myQu = 'UPDATE priority.'  .  $table . ' SET done=' . $newState . ' where id=' . $id;
    }
    cLog("the query I've built is: " . $myQu . "<br />");
    $connection->query($myQu);
    $rows = $connection->affected_rows;
    if ($rows > 0) {
      cLog("one or more records updated <br />\n");
      if ($id >= 0) {
        echo json_encode(['id' => $id, 'state' => $newState]);
      } else {
        echo json_encode(['num' => $rows]);
      }
    } else {
      cLog(mysqli_error($connection) . "id not found or record(s) not updated<br />\n");
      echo json_encode(['id' => -1]);
    }
  }

function doDelete($connection, $table, $id) {
    cLog("do the delete function <br />\n");
    if ($id == -1) { 
      $myQu = "DELETE FROM "  .  $table . " WHERE done = FALSE";
    } else {
      $myQu = "DELETE FROM "  .  $table . " WHERE id = " . $id;
    }
    cLog("The query I've built is: " . $myQu . "<br />");
    $connection->query($myQu);
    $rows = $connection->affected_rows;
    if ($rows > 0) {
      cLog("one or more rows deleted<br>\n");
      if ($id >= 0) {
        echo json_encode(['id' => $id]);
      } else {
        echo json_encode(['num' => $rows]);
      }
    } else {
      cLog(mysqli_error($connection) . " delete failed or id not found.<br>\n");
      echo json_encode(['id' => -1]);
    }
  }

  
/******************************************************************************/  
/*****************----> Question table related functions <----*****************/
/******************************************************************************/
  
  function doQuestionList($connection, $table, $state) {
    if ($state == "TRUE") {
      $myQu = "SELECT question, id, archived FROM ". $table . " WHERE archived";
    } elseif ($state === "FALSE") {
      $myQu = "SELECT question, id, archived FROM ". $table . " WHERE NOT archived";
    } else { // otherwise return all questions 
      $myQu = "SELECT question, id, archived FROM ". $table;
    }
    cLog("The query I've built is: " .$myQu . "<br>");
    $query = mysqli_query($connection, $myQu);
    $quArray = [];
    while ($row = mysqli_fetch_assoc($query)) {
      array_push($quArray, [
        'question' => $row['question'],
        'id' => $row['id'],
        'archived' => $row['archived']
      ]);
    }
    $myQu = "SELECT MAX(id) FROM " . $table . " LIMIT 1";
    cLog("Requesting last Id: " . $myQu . "<br>");
    $query = mysqli_query($connection, $myQu);
    $res = mysqli_fetch_all($query, MYSQLI_NUM);
    $questionArray = [];
    array_push($questionArray, [
      'questions' => $quArray,
      'lastId' => $res[0][0]
    ]);
    $someJSON = json_encode($questionArray);
    echo $someJSON;
  }

  function doCreateQuestion($connection, $table, $quStr) {
    cLog("do the create/insert function<br>\n");
    if ($quStr == "") {
      cLog("Invalid question name:" . $quStr ."<br>\n");
    } else {
      $myQu = 'INSERT INTO ' . $table . ' (question) VALUES ("' . $quStr . '")';
      cLog("The query I've built is: " . $myQu . "<br />");
      $connection->query($myQu);
      if ($connection->affected_rows != 1) {
        cLog(mysqli_error($connection) . " Question not inserted<br>\n");
        echo json_encode(['id' => -1]);
      } else {
        $newId = mysqli_insert_id($connection);
        cLog("Question " . $newId . " inserted");
        echo json_encode(['id' => $newId]);
      }
    } 
  }

  function doDeleteQuestion($connection, $table, $id) {
    cLog("do the question delete function<br>\n");
    if ($id == -1) {
      $myQu = "DELETE FROM " . $table . " WHERE archive = FALSE" ;
    } else {
      $myQu = "DELETE FROM " . $table . " WHERE id = " . $id;
    }
    cLog("The query I've built is: " . $myQu . "<br>");
    $connection->query($myQu);
    $rows = $connection->affected_rows;
    if ($rows > 0) {
      cLog("one or more rows deleted<br>\n");
      if ($id >= 0) {
        echo json_encode(['id' => $id]);
      } else {
        echo json_encode(['num' => $rows]);
      }
    } else {
      cLog(mysqli_error($connection) . " delete failed or id not found.<br>\n");
      echo json_encode(['id' => -1]);
    }
  }

  function doUpdateQuestionState($connection, $table, $id, $newState) {
    cLog("do the Question Update function<br>");
    if ($id == -1) {
      $myQu = 'UPDATE priority.' . $table . ' SET archived=' . $newState . ' where arcived = FALSE';
    } else {
      $myQu = 'UPDATE priority.' . $table . ' SET archived=' . $newState . ' where id =' . $id;
    }
    cLog("the query I've built is: " . $myQu . "<br>\n");
    $connection->query($myQu);
    $rows = $connection ->affected_rows;
    if ($rows > 0) {
      cLog("one or more records updated<br>\n");
      if ($id > 0) {
        echo json_encode(['id' => $id, 'state' => $newState]);
      } else {
        echo json_encode(['num' => $rows]);
      }
    } else {
      cLog(mysqli_error($connection) . " id not found or records(s) not updated<br>\n");
      echo json_encode(['id' => -1]);
    }
  }

  if ($debug == "DEBUG") {
    cLog("DEBUG<br />\n"); // put this at the top of the results so caller no longer expects actual data back
  }

  $function = $_POST["query"];

  switch ($function) {

    case "taskList":
      cLog("case taskList selected <br />");
      $state = $_POST["state"];
      cLog("taskList state parameter " . $state . " received<br />\n");
      $con = openDatabase();
      doTaskList($con, $taskTable, $state);
    break;
    case "createTask":
      cLog ("case createTask selected <br />");
      $task = $_POST["taskStr"];
      cLog ($task . "<br />\n");
      $con = openDatabase();
      doCreateTask($con, $taskTable, $task);
    break;
    case "deleteTaskId":
    case "deleteId":
      $id = $_POST["id"];
      cLog("case deleteId for id " . $id . " selected <br />");
      $con = openDatabase();
      doDelete($con, $taskTable,$id);  
    break;
    case "deleteActiveTasks":
    case "deleteActive": // perm delete all active.
      cLog("case deleteActive selected <br />");
      $con = openDatabase();
      doDelete($con, $taskTable, -1);
    break;
    case "markTasksDone":
    case "markDone":  // mark all active done rather than delete.
      cLog("case markDone selected <br />");
      $con = openDatabase();
      doUpdateState($con, $taskTable, -1, "TRUE");
    break;
    case "updateTaskState":
    case "updateState":
      $id = $_POST["id"];
      $state = $_POST["state"];
      cLog("case updateState for id " . $id . " with new state: " . $state . " selected <br />\n");
      $con = openDatabase();
      doUpdateState($con, $taskTable, $id, $state);
    break;
    case "questionList":
      cLog("case questionList selected <br>\n");
      $state = $_POST["state"];
      cLog("questionList state parameter " . $state . " received<br>\n");
      $con = openDatabase();
      doQuestionList($con, $questionTable, $state);
    break;
    case "createQuestion":
      cLog("case create question selected <br>");
      $question = $_POST["questionStr"];
      cLog ($question . "<br>\n");
      $con = openDatabase();
      doCreateQuestion($con, $questionTable, $question);
    break;
    case "deleteQuestionId":
      $id = $_POST["id"];
      cLog("case deleteQuestionId for id " . $id . " selected <br />");
      $con = openDatabase();
      doDeleteQuestion($con, $questionTable, $id);  
    break;
    case "updateQuestionState":
      $id = $_POST["id"];
      $state = $_POST["state"];
      cLog("case updateQuestionState for id " . $id . " with new state: " . $state . " selected <br />\n");
      $con = openDatabase();
      doUpdateQuestionState($con, $questionTable, $id, $state);
    break;
    case "createTaskPairs":
    case "updateQTask":
    case "updateTaskPair":
      cLog('case ' . $function . ' requested,br />\n');
    break;
  default:
    cLog("case not recognized <br />");
  }
  // mysqli_close($con);
?>