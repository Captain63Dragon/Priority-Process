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
  case "taskDetail":
    $id = $_POST["id"];
    doTaskDetail($con,$taskTable,$id);
  break;
  case "questionList":
    cLog("case questionList selected <br>\n");
    $state = $_POST["state"];
    cLog("questionList state parameter " . $state . " received<br>\n");
    doQuestionList($con, $questionTable, $state);
  break;
  case "taskPairList":
    cLog("case taskPairList selected <br>\n");
    $quid = $_POST["quid"];
    cLog("taskPairList question Id parameter " . $quid . " received<br>\n");
    doTaskPairList($con, $taskPairTable, $quid);
  break;
  case "createATaskPair":
    cLog("case createATaskPairs selected<br>\n");
    $paramStr = $_POST["paramStr"];
    cLog("task pairs parameter: " . $paramStr . " received<br>\n");
    $params = json_decode($paramStr);
    cLog("task pair question parameter " . $params->quid . "<br>\n");
    cLog("task pair id1 parameter " . $params->task1 . "<br>\n");
    cLog("task pair id2 parameter " . $params->task2 . "<br>\n");
    cLog("pair selHist1 parameter " . $params->selHist1 . "<br>\n");
    cLog("pair selHist2 parameter " . $params->selHist2 . "<br>\n");
    cLog("pair ts parameter " . $params->ts . "<br>\n");
    doCreateATaskPair($con,$taskPairTable,
      $params->quid,
      $params->task1,
      $params->task2,
      $params->selHist1,
      $params->selHist2,
      $params->ts); //Placeholder for the timestamp field that may not be used.
  break;
  case "createQuestionTaskPairs":
    $quid = $_POST["quid"];
    doCreateQuestionTaskPairs($con,$quid);
  break;
  case "createQTask":
    cLog("case createQTask selected<br>\n");
    $paramStr = $_POST["paramStr"];
    cLog("params: " . $paramStr . " received<br>\n");
    $params = json_decode($paramStr);
    cLog("qtask question id: " . $params->quid . "<br>\n");
    cLog("task id parameter: " . $params->taskId . "<br>\n");
    cLog("task id parameter: " . $params->state . "<br>\n");
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
  case "QTaskList":
    cLog("case QTaskList selected <br>\n");
    $quid = $_POST["quid"];
    cLog("taskPairList question Id parameter " . $quid . " received<br>\n");
    doQTaskList($con, $qtaskTable, $quid);
  break;
  case "updateTaskPair":
    cLog('case ' . $function . ' requested,br />\n');
  break;
  default:
    cLog("case [" . $function . "] not recognized <br />");
}

?>

