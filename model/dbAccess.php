<?php
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
  $taskPairTable = 'taskPair';
  $qtaskTable = 'qtask';
} elseif ($_POST["x"] == "-1") {
  $taskTable = 'taskbak';
  $questionTable = 'question';
  $taskPairTable = 'taskPair';
  $qtaskTable = 'qtask';
  // TODO: intend to use this code to select the table in the future. Replace X with User or someting suitable
} else {
  $taskTable = 'tasks';
  $questionTable = 'question';
  $taskPairTable = 'taskPair';
  $qtaskTable = 'qtask';
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

function doCreateTask($connection, $table) {
  $myQu ="";
  if (!empty($_POST)) {
    if (isset($_POST['taskStr'])) {
      $taskStr = $_POST["taskStr"];
      cLog("do the create/insert function <br />\n");
      if ($taskStr == "") {
        cLog("Invalid task name: " . $taskStr . "<br />\n");
      } else {
        $myQu = 'INSERT INTO '  .  $table . 
          ' (task,category,description) VALUES ("' . $taskStr . 
          '", "Personal","")';
      }
    } else if (isset($_POST['params'])) {
      $paramStr = $_POST['params'];
      if ($paramStr == "") {
        cLog("Invalid task parameters: " . $paramStr . "<br />\n");
      } else {
        $params = json_decode($paramStr);
        $values = " (" . $params->id . ", '";
        $values .= $params->task . "', '";
        $values .= $params->category . "', '";
        $values .= $params->description . "') ";
        $upVals = " task='";
        $upVals .= $params->task . "', category='";
        $upVals .= $params->category . "', description='";
        $upVals .= $params->description . "';";
        $myQu = 'INSERT INTO '  .  $table . 
          " (id, task, category, description) VALUES" . 
          $values . "ON DUPLICATE KEY UPDATE" . $upVals ;
      }
    }
    if ($myQu != "") { 
      $connection->query($myQu);
      cLog("the query i've built: " . $myQu . "<br />\n" );
      if(isset($_POST['taskStr'])) {
        if ($connection->affected_rows != 1) {
          cLog(mysqli_error($connection) . " Task not inserted <br />\n");
          echo json_encode(['id' => -1]);
        } else {
          $newId = mysqli_insert_id($connection);
          cLog("Task " . $newId . " inserted");
          echo json_encode(['id' => $newId]);
        }
      } else if (isset($_POST['params'])) {
        if ($connection->affected_rows < 1) { // Duplicate reports 2 updates!
          cLog(mysqli_error($connection) . " Task not updated <br />\n");
          echo "1"; // also note that exact updates show no affected rows!
        } else {
          echo "0"; // successfully updated
        }
      }
    }
  }
}

function doUpdateTaskState($connection, $table, $id, $newState) {
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

function doTaskDetail($connection, $table, $id) {
  if ($id >= 0) {
    $myQu = "SELECT task, category, description, entered, touched, done " . 
      "FROM ". $table . " WHERE id=" . $id;
      cLog("The query I've built is: " . $myQu . "<br>\n");
      $query = mysqli_query($connection, $myQu);
      $resArray = [];
      while ($row = mysqli_fetch_assoc($query)) {
        array_push($resArray, [
          'task'        => $row['task'],
          'category'    => $row['category'],
          'description' => $row['description'],
          'entered'     => $row['entered'],
          'touched'     => $row['touched'],
          'done'        => $row['done'],
        ]);
      }
      echo json_encode($resArray);
  } // else if -1, special case of .. what?
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
    $myQu = "DELETE FROM " . $table . " WHERE archived = FALSE" ;
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
    $myQu = 'UPDATE priority.' . $table . ' SET archived=' . $newState . ' where archived = FALSE';
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

function doTaskPairList($connection, $table, $quid) {
  $myQu = "SELECT quid, task1, task2, historyMarks1, historyMarks2, historyTimes FROM " . 
  $table . " WHERE quid=" . $quid;
  cLog("the query I've built is: " . $myQu . "<br>\n");
  $query = mysqli_query($connection, $myQu);
  $results =[];
  while ($row = mysqli_fetch_assoc($query)) {
    array_push($results, [
      'quid' => $row['quid'],
      'task1' => $row['task1'],
      'task2' => $row['task2'],
      'historyMarks1' => $row['historyMarks1'],
      'historyMarks2' => $row['historyMarks2'],
      'historyTimes' => $row['historyTimes']
    ]);
  }
  echo json_encode($results);
}

function doQTaskList($connection, $table, $quid) {
  // QTask table is a dynamic table that depends on tasks being active
  // ie. done=0. Remove all the completed or deleted tasks first.
  $myQu = 'SELECT quid, taskId FROM qtask ' .
  'LEFT JOIN tasks t ON taskId=t.id ' . 
  'WHERE quid=' . $quid . ' AND t.done=1';
  cLog($myQu . "<br>\n");
  $query = mysqli_query($connection, $myQu);
  // build rest of where clause for the update query below
  $myQu = 'UPDATE qtask SET state=3 WHERE quid=' . $quid . ' AND ';
  while ($row = mysqli_fetch_assoc($query)) {
    $myQu = $myQu . ' taskId=' . $row['taskId']. ' OR';
  }
  $myQu = $myQu . ' taskId=-999'; // use up final OR with bogus search
  cLog($myQu . "<br>\n");
  $query = mysqli_query($connection, $myQu);
  // not interested in the results of this update. Now the actual qtask query!

  $myQu = "SELECT quid, taskId, state FROM " . 
  $table . " WHERE quid=" . $quid;
  cLog("the query I've built is: " . $myQu . "<br>\n");
  $query = mysqli_query($connection, $myQu );
  $results =[];
  while ($row = mysqli_fetch_assoc($query)) {
    array_push($results, [
      'quid' => $row['quid'],
      'taskId' => $row['taskId'],
      'state' => $row['state']
    ]);
  }
  echo json_encode($results);
}

function doCreateQuestionTaskPairs($connection, $quid) {
  cLog("do the create/update of Question task pairs<br>\n");
  // create any taskPairs that do not already exist. If they already exist
  // they were crated previously for this question.
  if($quid >= 0 ) {
    $myQu = "INSERT IGNORE INTO taskPair " . 
    "(quid, task1, task2) " .
    "(SELECT ql.quid, ql.taskId, qr.taskId " . 
    "FROM " .
      "qtask AS ql LEFT JOIN " . 
      "qtask AS qr " . 
        "ON ql.taskId < qr.taskId AND qr.quid = ql.quid AND qr.state=0 " .
        "WHERE ql.state=0 AND ql.quid=" . $quid . " AND qr.taskId!=0 )";
    cLog("the query I've build is: " . $myQu . "<br>\n");
    $query = mysqli_query($connection, $myQu);
    if ($connection->affected_rows == 0) {
      cLog(mysqli_error($connection) . "<br>\nNo Task Pairs created<br>\n");
    } else {
      cLog ("Task Pair(s) created<br>\n");
    }
    // Now get full results. Note there may be task pairs with history we are
    // keeping that are no longer selected for this question. Currently, if
    // a task gets marked as done, the qtask is given a status of 3.
    // This following code filters out inactive qtasks.
    $myQu = "SELECT task1, task2, historyMarks1, historyMarks2 FROM " . 
      "taskPair tp " .
      "LEFT JOIN qtask ql ON ql.taskId=tp.task1 " .
      "LEFT JOIN qtask qr ON qr.taskId=tp.task2 " .
      "WHERE tp.quid=" . $quid . " AND tp.quid=ql.quid AND ql.quid=qr.quid " .
       "AND ql.state=0 AND qr.state=0";
    cLog("returning relevant task pairs for quid " . $quid . "<br>\n");
    $query = mysqli_query($connection, $myQu);
    if ($connection->affected_rows > 0) {
      $results=[];
      while ($row = mysqli_fetch_assoc($query)) {
        array_push($results,  [ 'pair' => [ [
            'taskId' => $row['task1'],
            'selHist' => $row['historyMarks1'] 
          ], [
            'taskId' => $row['task2'],
            'selHist' => $row['historyMarks2'] ]
        ] ]);
      }
      if (count($results) > 0) {
        echo json_encode($results);
      } else {
        cLog("No valid task pairs found<br>\n");
        echo "0";
      }
    } else {
      cLog("No valid task pairs found<br>\n");
      echo "0";
    }
  } else {
    cLog("invalid id provided: quid: ". $quid . "<br>\n");
    echo "0";
  }
}  

function doCreateATaskPair($connection,$table,$quid,$id1,$id2,$hist1,$hist2,$ts) {
  cLog("do the create/insert function<br>\n");
  if ($quid >= 0 && $id1 >= 0 && $id2 >= 0) {
    if ($ts === "" && $hist1 === "" && $hist2 === "") {
      $myQu = 'INSERT INTO ' . $table . ' (quid, task1, task2) VALUES (' .
      $quid . ", " . 
      $id1 . ", " . 
      $id2 . ') ON DUPLICATE KEY UPDATE historyTimes=CONCAT(historyTimes,"-' . 
      $ts . '";';
    } else {
      $myQu = 'INSERT INTO ' . $table . ' (quid, task1, task2, historyMarks1, historyMarks2, historyTimes) VALUES (' .
      $quid . ", " . 
      $id1 . ", " . 
      $id2 . ', "' . 
      $hist1 . '", "' . 
      $hist2 . '", "' . 
      $ts . '") ON DUPLICATE KEY UPDATE historyMarks1="' .
      $hist1 . '", historyMarks2="' . 
      $hist2 . '", historyTimes=CONCAT(historyTimes,"-' .
      $ts . '");'; 
    } 
    cLog("The query I've built is: " . $myQu . "<br>\n");
    $query = mysqli_query($connection, $myQu);
    if ($connection->affected_rows == 0) {
      cLog(mysqli_error($connection) . "<br>\nTask Pair not inserted<br>\n");
      echo "0";
    } else if ($connection->affected_rows == 2) {
      cLog ("previous task pair found. Updated timestamp<br>\n");
      echo "1";
    } else {
      cLog ("task pair inserted for quid: " . $quid . " (" . $id1 . ", " . $id2 . ")<br>\n");
      echo "1";
    }
  } else {
    cLog("invalid id(s): question id: " . $quid . 
    " task 1: " . $id1 . 
    " task 2: " . $id2 . "<br>\nAll ids are required");
  }
}

function doCreateQTask($connection, $table, $quid, $taskId, $state) {
  cLog("do the create/inser function<br>\n");
  $myQu = 'INSERT INTO ' . $table . ' (quid, taskId, state) VALUES (' . 
    $quid . ', ' . 
    $taskId . ', ' . 
    $state . ') ON DUPLICATE KEY UPDATE state=' . $state . ';';
  cLog("the query I've built is: " . $myQu . "<br>");
  $connection->query($myQu);
  if($connection->affected_rows > 1) { 
    cLog("Updated QTask to state: " . $state . "<br\n");
    echo 1;
  } else if ($connection->affected_rows != 1) {
    cLog(mysqli_error($connection) . "<br>\nQTask not inserted <br\n");
    echo 0;
  } else {
    cLog("QTask inserted successfully<br>\n");
    echo 1;
  }
}

function doDeleteQTask($connection, $table, $quid, $taskId) {
  $myQu = 'DELETE FROM ' . $table . ' WHERE quid=' . $quid . ' AND taskId=' . $taskId;
  $connection->query($myQu);
  if($connection->affected_rows > 0) {
    echo "1";
  } else {
    echo "0";
  }
}

if ($debug == "DEBUG") {
  cLog("DEBUG<br />\n"); // put this at the top of the results so caller no longer expects actual data back
}

$function = $_POST["query"];
$con = openDatabase();

switch ($function) {
  //
  // ------->>  'tasks' table queries  <<------
  //
  case "taskList":
    $state = $_POST["state"];
    cLog("taskList state parameter " . $state . " received<br />\n");
    doTaskList($con, $taskTable, $state);
  break;
  case "taskDetail":
    $id = $_POST["id"];
    doTaskDetail($con,$taskTable,$id);
  break;
  case "createTask":
    doCreateTask($con, $taskTable);
  break;
  case "markTasksDone": // mark all active done rather than delete.
  case "markDone": // Deprecated
    doUpdateTaskState($con, $taskTable, -1, "TRUE");
  break;
  case "updateTaskState":
  case "updateState": // Deprecated
    $id = $_POST["id"];
    $state = $_POST["state"];
    cLog("case updateTaskState for id " . $id . " with new state: " . $state . " selected <br />\n");
    doUpdateTaskState($con, $taskTable, $id, $state);
  break;
  case "deleteTaskId":
  case "deleteId": // Deprecated
    $id = $_POST["id"];
    cLog("case deleteId for id " . $id . " selected <br />");
    doDelete($con, $taskTable,$id);  
  break;
  case "deleteActiveTasks": // perm delete all active.
  case "deleteActive": // Deprecated
    doDelete($con, $taskTable, -1);
  break;

  //
  // ------->>  'question' table queries  <<------
  //
  case "questionList":
    cLog("case questionList selected <br>\n");
    $state = $_POST["state"];
    cLog("questionList state parameter " . $state . " received<br>\n");
    doQuestionList($con, $questionTable, $state);
  break;
  case "createQuestion":
    $question = $_POST["questionStr"];
    cLog ($question . "<br>\n");
    doCreateQuestion($con, $questionTable, $question);
  break;
  case "updateQuestionState":
    $id = $_POST["id"];
    $state = $_POST["state"];
    cLog("case updateQuestionState for id " . $id . " with new state: " . $state . " selected <br />\n");
    $con = openDatabase();
    doUpdateQuestionState($con, $questionTable, $id, $state);
  break;
  case "deleteQuestionId":
    $id = $_POST["id"];
    cLog("case deleteQuestionId for id " . $id . " selected <br />");
    doDeleteQuestion($con, $questionTable, $id);  
  break;
  case "deleteAllQuestions":
    $id= -1;
    $con = openDatabase();
    doDeleteQuestion($con, $questionTable, $id);
  break;
  //
  // ------->>  'taskPair' table queries  <<------
  //
  case "taskPairList":
    $quid = $_POST["quid"];
    cLog("taskPairList question Id parameter " . $quid . " received<br>\n");
    doTaskPairList($con, $taskPairTable, $quid);
  break;
  case "createQuestionTaskPairs":
    $quid = $_POST["quid"];
    doCreateQuestionTaskPairs($con,$quid);
  break;
  case "createATaskPair":
    $paramStr = $_POST["paramStr"];
    cLog("task pairs parameter: " . $paramStr . " received<br>\n");
    $params = json_decode($paramStr);
    cLog("task pair parameters " . $params. "<br>\n");
    doCreateATaskPair($con,$taskPairTable,
      $params->quid,
      $params->task1,
      $params->task2,
      $params->selHist1,
      $params->selHist2,
      $params->ts); //Placeholder for the timestamp field that may not be used.
  break;

  //
  // ------->>  'qtask' table queries  <<------
  //
  case "QTaskList":
    cLog("case QTaskList selected <br>\n");
    $quid = $_POST["quid"];
    cLog("taskPairList question Id parameter " . $quid . " received<br>\n");
    doQTaskList($con, $qtaskTable, $quid);
  break;
  case "createQTask":
    $paramStr = $_POST["paramStr"];
    cLog("params: " . $paramStr . " received<br>\n");
    $params = json_decode($paramStr);
    cLog("qtask params: " . $params . "<br>\n");
    doCreateQTask($con, $qtaskTable, 
      $params->quid, 
      $params->taskId,
      $params->state);
  break;
  case "deleteQTask":
    $paramStr = $_POST["paramStr"];
    $params = json_decode($paramStr);
    doDeleteQTask($con, $qtaskTable, $params->quid, $params->taskId);
  break;
  default:
    cLog("case [" . $function . "] not recognized <br />");
}

?>

