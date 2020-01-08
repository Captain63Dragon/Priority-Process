import { request } from './request.js';

let isDebug = true;
let randValue = -1;
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};
let lastTaskID = -1;
let lastQuestionId = -1;
let id = -1; // this has a setter and getter.

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
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=taskList&state=ALL&x=" + randValue;
    if (listClass !== "") {
      request({url: "model/getData.php", body: bodyStr, headers: myHeader})
        .then(data => {
          let txt;
          if (data.substring(0,5) === "DEBUG") {
            txt = data;
          } else {
            console.log(`Display Task List for ${listClass}<br />\n`);
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
          console.log("Return from ",listClass);
          resolve();
          /* list of some of the list classes:
          markTasksDoneList,       deleteActiveTasksList, questionList,    createQuestionList, deleteQuestionIdList,
          updateQuestionStateList, createTaskPairsList,   updateQTaskList, updateTaskPairList */
        })
        .catch(error => {
            console.log(error);
            reject(error);
        });
    } else {
      resolve();
    }
  })
}

function doDeleteTaskId(id) {
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=deleteId&id=" + id + "&mode=DEBUG&x=" + randValue;
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
        document.querySelector(".deleteTaskId").innerHTML = txt;
        console.log("Finished doDeleteTaskId");
        resolve();
      })
      .catch(error => {
          console.log(error);
          reject(error);
      });
  })
}

function createTask(newTaskStr) {
  return new Promise ((resolve, reject) => {
    let taskStr = encodeURIComponent(newTaskStr, "UTF-8");
    let bodyStr = "query=createTask&taskStr=" + taskStr + "&mode=DEBUG&x=" + randValue;

    request({url: "model/getData.php", body: bodyStr, headers: myHeader})
      .then(data => {
        id = -1;
        // console.log(data.substring(3,7));
        let txt;
        if (data.substring(0,5) === "DEBUG") {
          txt = data;
          id = parseInt(data.substring(213,216));
        } else {
          let res = JSON.parse(data);
          if (res.id < 0) {
            txt = `Create Task:<br />\nTask not created. Id returned:<br />\n${res.id} - ${taskStr}<br />\n`;
          } else {
            txt = `Create Task:<br />\nSuccessfully created task:<br />\n${res.id} - ${taskStr}<br />\n`;
            setId(res.id);
          }
        }
        document.querySelector(".createTask").innerHTML += txt;
        console.log("Finished CreateTask");
        resolve(getId());
      })
      .catch(error => {
          console.log(error);
          reject(error);
      });
  })
}

function getId() { return id; } ;
function setId(newId) { id = newId} ;

function doUpdateTaskState(obj) {
  return new Promise ((resolve, reject) => {
    let id = obj.id;
    let newState = obj.state;
    let bodyStr = "query=updateState&id=" + id + 
    "&state=" + newState +
    "&mode=DEBUG&x=" + randValue;

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
      document.querySelector(".updateTaskState").innerHTML = txt;
      console.log("Finished doUpdatetaskState");
      resolve();
    })
    .catch(error => {
        console.log(error);
        reject(error);
    });
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

function doMarkTaskDone() {
  return new Promise ((resolve, reject) => {
    let bodyStr = '';
    let action = '';
    // let answer = prompt("Type 'delete' to permanently delete all tasks. ","mark done only");
    let answer = 'markDone';
    if (answer !== null) { // user cancelled request!
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
        document.querySelector(".markTasksDone").innerHTML = txt;
        console.log("Finished doMarkTaskDone");
        resolve(true);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    } else {
      resolve(false);
    }
  })
}

function doDeleteActiveTasks() {
  return new Promise ((resolve, reject) => {
    let bodyStr = `query=deleteActiveTasks&mode=DEBUG&${randValue}`;
    request({url:"model/getData.php", body:bodyStr, headers:myHeader})
    .then(data => {
      let txt;
      if (data.substr(0,5) === "DEBUG") {
        txt = data;
      } else {
        if (data.substring(2,5) == "num") {
          console.log(`Deleted ${result.num} databse entries.`);
        } else {
          console.log('No database entries found to remove.');
          // TODO: does there need to be an update if this did not succeed? 
        }
        txt = 'success.';
      }
      document.querySelector('.deleteActiveTasks').innerHTML = txt;
      console.log('doDeleteActiveTasks');
      resolve();
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  })
}

function displayQuestionList(listClass) {
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=questionList&state=ALL&mode=real&x=" + randValue;
    if (listClass !== "") {
      request({url: "model/getData.php", body: bodyStr, headers: myHeader})
      .then(data => {
        let txt;
        console.log(data);
        // console.log("Here is the current data:",data);
        if (data.substring(0,5) === "DEBUG") {
          txt = data;
        } else {
          let res = JSON.parse(data)[0];
          txt = '<ul>\n';
          res.questions.forEach(item => {
            if (item.archived == "1") {
              txt += '<li class="done">';
            } else {
              txt += '<li class="active">';
            }
            txt += `${item.id} - ${item.question}<br></li>\n`;
          });
          lastQuestionId = parseInt(res.lastId);
          txt += '\n</ul>\n';
        }
        document.querySelector(`.${listClass}`).innerHTML = txt;
        resolve();
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    } else {
      resolve();
    }
  })
}

function doCreateQuestion(newQuStr) {
  return new Promise ((resolve, reject) => {
    let quStr = encodeURIComponent(newQuStr, "UTF-8");
    let bodyStr ="query=createQuestion&questionStr=" + quStr + "&mode=DEBUG&x=" +randValue;
    // console.log('doCreateQuestion with bodyStr: ',bodyStr);
    request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      id = -1;
      let txt;
      if (data.substring(0,5) === "DEBUG") {
        txt = data;
        id = parseInt(data.substring(237,240));
        // console.log("snippit: ", data.substring(230,245));
      } else {
        let res = JSON.parse(data);
        if (res.id < 0) {
          txt = `Create Question:<br>\nQuestion not created. Id returned:<br>\n${res.id} - ${quStr}<br>\n`;
        } else {
          txt = `Create Question:<br>\nSuccessfully create question:<br>\n${res.id} - ${quStr}<br>\n`;
          id = res.id;
        }
      }
      document.querySelector(".createQuestion").innerHTML += txt;
      resolve(id);
    })
  })
  .catch(error => {
    console.log(error);
    reject(error);
  })
}

function doDeleteQuestionId(id) {
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=deleteQuestionId&id=" + id + "&mode=DEBUG&x=" + randValue;
    request({url: "model/getData.php", body: bodyStr, headers:myHeader})
    .then(data => {
      let txt = '';
      if (data.substring(0,5) === "DEBUG") {
        txt = data;
      } else {
        let result = JSON.parse(data);
        if (result.id < 0) {
          txt = `Delete question:<br>\nQuestion with Id ${id} not found. Returned ${result.id}<br>\n`;
        } else {
          txt = `Delete question:<br>\nQuestion with Id ${result.id} found and deleted<br>\n`;
        }
      }
      document.querySelector(".deleteQuestionId").innerHTML = txt;
      resolve();
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  })
}

function doUpdateQuestionState(obj) {
  return new Promise ((resolve, reject) => {
    let id = obj.id;
    let newState = obj.state;
    let bodyStr = "query=updateQuestionState&id=" + id + 
    "&state=" + newState + 
    "&mode=DEBUG&x=" + randValue
    request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      let txt;
      if (data.substr(0,5) === "DEBUG") {
        txt = data;
      } else {
        let res = JSON.parse(data);
        if (res.id < 0) {
          txt = `Update Question State:<br>\nQuestion state not changed or id ${id} not found<br>\n`;
        } else {
          txt = `Update Question State:<br>\nQuestion state changed to ${res.state} for id ${res.id}<br>\n`;
        }
      }
      document.querySelector(".updateQuestionState").innerHTML = txt;
      resolve();
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  })
}

function doCreateTaskPairs() {
  return new Promise ((resolve, reject) => {
    console.log('doCreateTaskPairs');
    resolve();
  })
}

function doUpdateQTask() {
  return new Promise ((resolve, reject) => {
    console.log('doUpdateQTask');
    resolve();
  })
}

function doUpdateTaskPair() {
  return new Promise ((resolve, reject) => {
    console.log('doUpdateTaskPair');
    resolve();
  })
}

function loadDoc() {
  // createTask("Adding a task in CreateTask")
  // .then(id => {
  //   setId(id);
  //   return displayTaskList("createTaskList")
  // })
  // .then(() => doUpdateTaskState( {id:getId(), state: "TRUE"}))
  // .then(() => displayTaskList("updateTaskStateList"))
  // .then(() => doDeleteTaskId(getId()))
  // .then(() => displayTaskList("deleteTaskIdList"))
  // .then(() => createTask("padding a task in CreateTas"))
  // .then(() => displayTaskList("createTaskList"))
  // .then(() => doMarkTaskDone())
  // .then(() => displayTaskList("markTasksDoneList")) 
  // .then(() => doDeleteActiveTasks())
  // .then(() => displayTaskList("deleteActiveTasksList"))
  doCreateQuestion('Adding a question in CreateQuestion')
  .then(data => {
    console.log(data); 
    setId(data);
    return displayQuestionList("createQuestionList")
  }) 
  .then(() => doUpdateQuestionState( {id:getId(), state: "TRUE"}))
  .then(() => displayQuestionList("updateQuestionStateList"))
  .then(() => doDeleteQuestionId(getId()))
  .then(() => displayQuestionList("deleteQuestionIdList"))
  // .then(() => doCreateTaskPairs())
  // .then(() => displayTaskList("createTaskPairsList"))
  // .then(() => doUpdateQTask())
  // .then(() => displayTaskList("updateQTaskList"))
  // .then(() => doUpdateTaskPair())
  // .then(() => displayTaskList("updateTaskPairList"))
  // .then(() => displayTaskList("questionList"))
  .catch(error => {
    console.log("Error in promise chain: ", error);
  })
}

document.addEventListener('DOMContentLoaded', loadDoc);
