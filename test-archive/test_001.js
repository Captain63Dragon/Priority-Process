let isDebug = true;

// This iteration of test.js functions properly. It does not, however, work in the proper order.
// Some functions complete quickly and others do not. Thus the update is complete before any of the
// list have filled in. In the next iteration, I will try with promises instead.

// These foo functions are the start of working with async functions. Nothing to do with the other stuff I was trying
function doSomething() {
  console.log("doSomething");
  if(false) throw "this is a bogus error!";
  return 10;
}
function doSomethingElse(prev) {
  console.log("doSomethingElse");
  if(false) throw "this is a bogus error!";
  return prev + 10;
}
function doThirdThing(prev) {
  console.log("doThirdThing");
  if(true) throw "this is a bogus error!";
  return prev * 10;
}
function failureCallback(error) {
  console.log("failureCallback");
}
async function foo() {
  try {
    const result = await doSomething();
    const newResult = await doSomethingElse(result);
    const finalResult = await doThirdThing(newResult);
    console.log(`Got the final result: ${finalResult}`);
  } catch(error) {
    failureCallback(error);
  }
}

function databaseTests() {
  isDebug = false;
  testId = 33;
  createTask("This is a new one");
  updateTaskState(15, "TRUE");
  deleteTask(testId);
  displayTaskList("taskList");
}

function initiateXHttp(xhttp, module, id, newState ) {
  let debugStr = (isDebug) ? "&mode=DEBUG" : "";
  let rndStr = "&x=" + Math.random();
  xhttp.open("POST", "model/getData.php", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  let sendStr = "";
  switch (module) {
    case "taskList":
      sendStr = "query="+ module;
      break;

    case "deleteId":
      sendStr = "query=" + module + "&id=" + id;
      break;

    case "createTask":
      // add the random number so that a cached response is not sent.
      let taskStr = encodeURIComponent(id, "UTF-8");
      console.log(taskStr);
      sendStr = "query=" + module + "&taskStr=" + taskStr;
      break;
      
    case "updateState":
      sendStr = "query=" + module + "&id=" + id + "&state=" + newState;
      break;
        
    default:
      // Todo: signal invalid command
      break;
  }
  sendStr += debugStr + rndStr;
  console.log(sendStr);
  xhttp.send(sendStr);
}


function displayTaskList(listClass) {
  var xhttp = new XMLHttpRequest();

  // callback for xml http request object
  xhttp.onreadystatechange=function() {
    if (this.readyState == 4 && this.status == 200) {
      let txt;
      let res = this.responseText;
      if (res.substring(0,5) === "DEBUG") {
        txt = res;
      } else {
        res = JSON.parse(this.responseText);
        txt = '<ul>\n';
        res.forEach(item => {
          if (item.done == "1") {
            txt += '<li class="done">';
          } else {
            txt += '<li class="active">';
          }
          txt += `${item.id} - ${item.task}<br /></li>\n`;
        });
        txt += '\n</ul>\n';
      }
      document.querySelector(`.${listClass}`).innerHTML = txt;
    }
  };
  initiateXHttp(xhttp, "taskList");
}

function deleteTask(id) {
  var xhttp = new XMLHttpRequest();

  // callback for xml http request object
  xhttp.onreadystatechange=function() {
    if (this.readyState == 4 && this.status == 200) {
      let txt;
      let res = this.responseText;
      if (res.substring(0,5) === "DEBUG") {
        txt = res;
      } else {
        let result = JSON.parse(res);
        if (result.id < 0) {
          txt = `Delete task:<br />\nTask with Id ${id} not found. Returned ${result.id}<br />\n`;
        } else {
          txt =  `Delete task:<br />\nTask with ID ${result.id} found and deleted<br />\n`;
        }
      }
      displayTaskList("deleteTaskList");
      document.querySelector(".deleteId").innerHTML = txt;
    }
  };
  initiateXHttp(xhttp, "deleteId", id);
}

function createTask(taskStr) {
  var xhttp = new XMLHttpRequest();
  let res = 6;
  // callback for xml http request object
  xhttp.onreadystatechange=function() {
    if (this.readyState == 4 && this.status == 200) {
      let txt;
      let res = this.responseText;
      if (res.substring(0,5) === "DEBUG") {
        txt = res;
      } else {
        let res = JSON.parse(this.responseText); 
        if (res.id <0) {
          txt = `Create Task:<br />\nTask not created. Id returned:<br />\n${res.id} - ${taskStr}<br />\n`;
        } else {
          txt = `Create Task:<br />\nSuccessfully created task:<br />\n${res.id} - ${taskStr}<br />\n`
        }
      }
      displayTaskList("createTaskList");
      document.querySelector(".createTask").innerHTML = txt;
    }
  };
  initiateXHttp(xhttp, "createTask", taskStr);
}

function updateTaskState(id, newState) {
  var xhttp = new XMLHttpRequest();

  // callback for xml http request object
  xhttp.onreadystatechange=function() {
    if (this.readyState == 4 && this.status == 200) {
      let txt;
      let res = this.responseText;
      if (res.substring(0,5) === "DEBUG") {
        txt = res;
      } else {
        let result = JSON.parse(res);
        if (result.id < 0 ) {
          txt = `Update Task:<br />\nTask state not changed or id ${id} not found<br />\n`
        } else {
          txt = `Update Task:<br />\nTask state changed to ${result.state} for id ${result.id}<br />\n`
        }
      }
      displayTaskList("updateTaskList");
      document.querySelector(".updateState").innerHTML = txt;
    }
  };
  initiateXHttp(xhttp, "updateState", id, newState);
}

function loadDoc() {
  databaseTests();
  // foo();
}

document.addEventListener('DOMContentLoaded', loadDoc);