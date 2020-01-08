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

if ($debug == "DEBUG") {
  cLog("DEBUG<br />\n"); // put this at the top of the results so caller no longer expects actual data back
}

$function = $_POST["query"];

switch ($function) {case "questionList":
  cLog("case questionList selected <br>\n");
  $state = $_POST["state"];
  cLog("questionList state parameter " . $state . " received<br>\n");
  $con = openDatabase();
  doQuestionList($con, $questionTable, $state);
break;
?>