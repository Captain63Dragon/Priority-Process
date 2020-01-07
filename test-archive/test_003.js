import { request } from './request.js';

let isDebug = true;
let randValue = -1;
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};
let lastTaskID = -1;

// this function was used prior to promises. not used.
function initiateXHttp(xhttp, module, id, newState ) {
  let debugStr = (isDebug) ? "&mode=DEBUG" : "";
  let rndStr = "&x=" + randValue;
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
      // valid states are boolean TRUE and FALSE passed to the MySQL 
      sendStr = "query=" + module + "&id=" + id + "&state=" + newState;
      break;
        
    case "clearTasks":
      // note for mode: Delete removes all records, Done set all records to done
      let mode = (id < 0) ? "delete" : "done";
      sendStr = "query=" + module + "&mode=" + mode; 
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
  let bodyStr = "query=taskList&state=FALSE&x=" + randValue;

  // callback for xml http request object
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      let txt;
      if (data.substring(0,5) === "DEBUG") {
        txt = data;
      } else {
        let res = JSON.parse(data)[0];
        // console.log(res);
        txt = '<ul>\n';
        res.tasks.forEach(item => {
          if (item.done == "1") {
            txt += '<li class="done">';
          } else {
            txt += '<li class="active">';
          }
          txt += `${item.id} - ${item.task}<br /></li>\n`;
        });
        lastTaskID = parseInt(res.lastId);
        // console.log(lastTaskID);
        txt += '\n</ul>\n';
      }
      document.querySelector(`.${listClass}`).innerHTML = txt;
    })
    .catch(error => {
        console.log(error);
    });
  };

function deleteTask(id) {
  let bodyStr = "query=deleteId&id=" + id + "mode=DEBUG&x=" + randValue;
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      // console.log(data.substring(3,7));
      let txt ='';
      if (data.substring(0,5) === "DEBUG") {
        txt = data;
      } else {
        let result = JSON.parse(data);
        if (result.id < 0) {
          txt = `Delete task:<br />\nTask with Id ${id} not found. Returned ${result.id}<br />\n`;
        } else {
          txt =  `Delete task:<br />\nTask with ID ${result.id} found and deleted<br />\n`;
        }
      }
      document.querySelector(".deleteId").innerHTML = txt;
    })
    .catch(error => {
        console.log(error);
    });
}

function createTask(newTaskStr) {
  let taskStr = encodeURIComponent(newTaskStr, "UTF-8");
  let bodyStr = "query=createTask&taskStr=" + taskStr + "mode=DEBUG&x=" + randValue;

  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      // console.log(data.substring(3,7));
      let txt;
      if (data.substring(0,5) === "DEBUG") {
        txt = data;
      } else {
        let res = JSON.parse(data); 
        if (res.id < 0) {
          txt = `Create Task:<br />\nTask not created. Id returned:<br />\n${res.id} - ${taskStr}<br />\n`;
        } else {
          txt = `Create Task:<br />\nSuccessfully created task:<br />\n${res.id} - ${taskStr}<br />\n`
        }
      }
      document.querySelector(".createTask").innerHTML = txt;
    })
    .catch(error => {
        console.log(error);
    });
}

function updateTaskState(id, newState) {
  let bodyStr = "query=updateState&id=" + id + "&state=" + newState +"&mode=DEBUG&x=" + randValue;

  // callback for xml http request object
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
  .then(data => {
    let txt;
    if (data.substring(0,5) === "DEBUG") {
      txt = data;
    } else {
      let result = JSON.parse(data);
      if (result.id < 0 ) {
        txt = `Update Task:<br />\nTask state not changed or id ${id} not found<br />\n`
      } else {
        txt = `Update Task:<br />\nTask state changed to ${result.state} for id ${result.id}<br />\n`
      }
    }
    document.querySelector(".updateState").innerHTML = txt;
  })
  .catch(error => {
      console.log(error);
  });
}

let tests = paramObj => {
  return new Promise((resolve, reject) => {
    // TODO: this is a little bogus at the moment but seems to work.
    if (paramObj > 0) {
      resolve('ok'); // wait 
    } else {
      reject('not ok');// return
    }
  })
}

function clearTasks (id, mode) {
  // Note: mode is less than 0 for 
  let bodyStr = "query=clearTasks" + newState + "&mode=DEBUG&x=" + randValue;
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      let txt;
      if (data.substring(0,5) === "DEBUG") {
        txt = data;
      } else {
        let result = JSON.parse(data);
        if (result.id < 0 ) {
          txt = `Clear Task:<br />\nTask state not changed or id ${id} invalid<br />\n`
        } else {
          txt = `Update Task:<br />\nTask state changed to ${result.state} for id ${result.id}<br />\n`
        }
      }
      document.querySelector(".updateState").innerHTML = txt;
      })
    .catch(error => {
        console.log(error);
    });
}
function markDone() {
  let bodyStr = '';
  let action = '';
  let answer = prompt("Type 'delete' to permanently delete all tasks. ","mark done only");
  answer = answer.toLowerCase();
  if (answer === 'delete') {
    action = "deleteActive";
  } else {
    action = "markDone";
  }
  bodyStr = `query=${action}&mode=DEBUG&x=${randValue}`;
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
  .then(data => {
    let txt;
    console.log(data.substring(0,5), data);
    if (data.substring(0,5) === "DEBUG") {
      txt = data;
    } else {
      if (data.substring(2,5) === "num") {
        let result = JSON.parse(data);
        if (result.num > 0) {
          console.log(`${action}: updated ${result.num} database entries.`);
        } else {
          console.log(`${action}: No database entries updated. `);
          // TODO: does something need to be updated if this is not successful?
        }
        txt = 'success';
      }
    }
    document.querySelector(".deleteId").innerHTML = txt;
  })
}
function loadDoc() {
  let testId = 33;
  // TODO: tests(1) could pass a delay or timeout or something. Not useful as is.
  tests(1)
    // .then(data => {
    //   createTask("This is a new one");  
    // })
    // .then(data => {
    //   displayTaskList("createTaskList");
    // })
    // .then(data => {
    //   updateTaskState(15, "TRUE");
    // })
    // .then(data => {
    //   displayTaskList("updateTaskList");
    // })
    // .then(data => {
    //   deleteTask(testId);
    // })
    // .then(data => {
    //   displayTaskList("deleteTaskList");
    // })
    // .then(data => {
    //   displayTaskList("taskList");
    // })
    .then(data => {
      markDone("deleteTaskList");
    })
    .then(data => {
      displayTaskList("taskList");
    })
    .catch(error => {
      console.log(error);
    })
      
}

document.addEventListener('DOMContentLoaded', loadDoc);
