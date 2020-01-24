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
      updateQTask
    createTask takes an URLencoded task string: taskStr=like%20so
    taskList does not have any optional parameters
    deleteTaskId takes a parameter id=1493
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

  if ($debug == "DEBUG") {
    cLog("DEBUG<br />\n"); // put this at the top of the results so caller no longer expects actual data back
  }

  $function = $_POST["query"];

  switch ($function) {

    default:
      cLog('case ' . $function . ' requested,br />\n');
  }
  // mysqli_close($con);
?>