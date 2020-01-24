import { request } from './request.js';

// Housekeeping variables.
// const isDebug = true;
const isDebug = false;
let randValue = Math.random();
if (isDebug) { randValue = -1; } 
let lastTaskID = -1;
let serverless = false; // Assume server is active until it fails
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};

// Define UI Variables.
const form = document.querySelector('#task-form');
const taskList = document.querySelector('.collection');
const questionListBtn = document.querySelector('.goto-question-list');
const clearBtn = document.querySelector('.clear-tasks');
const filter = document.querySelector('#filter');
const taskInput = document.querySelector('#task');

// ------------------ Controller functions ------------------//

// Load all event listeners
loadEventListeners();

//Load all event listeners
function loadEventListeners() {
  // DOM Load event
  document.addEventListener('DOMContentLoaded', loadTasksFromSQL);
  // Add task event
  form.addEventListener('submit', addTask);
  // Remove task event
  taskList.addEventListener('click', actionOnTask);
  // Clear task event
  questionListBtn.addEventListener('click', goToQuestionList);
  // Clear task event
  clearBtn.addEventListener('click', clearTasks);
  // Filter tasks event
  filter.addEventListener('keyup',filterTasks);
}

// -------------------- Model functions ---------------------//

function loadTasksFromSQL() {
  let tasks;
  let bodyStr = "query=taskList&state=FALSE&mode=none&x=" + randValue;

  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      // console.log("Returned data is", data);
      // console.log(data, data.substring(3,8));
      if (data.substring(3,8) === "tasks") { 
        let result = JSON.parse(data)[0];
        tasks = result.tasks;
        lastTaskID = result.lastId;
        clearTasksFromLS();
        hideServerWarning(true);
        serverless = false; // reset this in case server has returned somehow.
        cacheTasksLS(tasks, lastTaskID);
        populateTasks(tasks);
      } else {
        hideServerWarning(false); // ie. display server warning
        loadTasksFromLS();
        serverless = true;
        alert("Server returned incorrectly formatted data!");
        console.log(data);
        // display server unavailable warning
        // load whatever is available from local storage
      }
    })
    .catch(error => {
      hideServerWarning(false); // ie. display server warning
      loadTasksFromLS();
      serverless = true;
      console.log(error);
      // display server unavailable warning
      // load whatever is available from local storage
    });
};

// Get Tasks from LS. If these are being used, may be in serverless mode.
function loadTasksFromLS() {
  let tasksStr = localStorage.getItem('tasksBundle');
  let tasks;
  let tasksBundle;
  if(tasksStr === null) {
    tasks = [];
  } else {
    tasksBundle = JSON.parse(localStorage.getItem('tasksBundle'));
    tasks = tasksBundle.tasks;
    lastTaskID = tasksBundle.lastTaskID;  
  }
  populateTasks(tasks);
}

// If server is unavailable, show this warning. On by default in HTML so hide if true
// Clear Tasks from Local Storage
function clearTasksFromLS() {
  let val = JSON.stringify ({tasks: [], lastTaskID: lastTaskID});
  localStorage.setItem('tasksBundle',val);
}

// Clear Tasks from the database
function clearTasksFromSQL() {
  let answer = prompt("Type 'delete' to permanently delete all tasks. ","mark done only");
  answer = answer.toLowerCase();
  let bodyStr = '';
  let action = '';
  if (answer === 'delete') {
    action = "deleteActive";
  } else {
    action = "markDone";
  }
  bodyStr = `query=${action}&mode=none&x=${randValue}`;
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
  .then(data => {
    if (data.substring(2,5) === "num") {
      let result = JSON.parse(data);
      if (result.num > 0) {
        console.log(`${action}: updated ${result.num} database entries.`);
      } else {
        console.log(`${action}: No database entries updated. `);
        // TODO: does something need to be updated if this is not successful?
      }
    }
  })
}

// Remove this task from the active list in the database. 
function removeTaskFromSQL(taskItem) {
  let taskId = taskItem.id;
  let bodyStr = "query=updateState&id=" + taskId +
                "&state=TRUE" + "&mode=none&x=" + randValue;
  // console.log(bodyStr, taskItem.id);
  
  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      // console.log(data.substring(2,4));
      if (data.substring(2,4) === "id") {
        let result = JSON.parse(data);
        if (result.id < 0) {
          console.log(`Update task state: Task with Id ${taskId} and state FALSE not found. Returned ${result.id}`);
        } else {
          console.log(`Update task state: Task with ID ${result.id} found and updated to ${result.state}`);
          // remove from the GUI
          taskItem.parentElement.parentElement.remove();
        }
      } else {
        console.log(data);
        alert("Server error encountered. Malformed data response!");
      }
    })
    .catch(error => {
      hideServerWarning(false); // ie. display server warning
      alert("Server error encountered. Entering Serverless mode. Edits disabled!");
      serverless = true;
      console.log(error);
    });
};

// Remove from LS
function removeTaskFromLS(taskItem) {
  let tasksStr = localStorage.getItem('tasksBundle');
  let taskStr = taskItem.parentElement.parentElement.textContent;
  let tasks;
  let tasksBundle;
  if(tasksStr === null) {
    tasks = [];
    tasksBundle = {'tasks': tasks, 'lastTaskID': lastTaskID };
  } else {
    tasksBundle = JSON.parse(tasksStr);
    tasks = tasksBundle.tasks;
  }

  tasks.forEach(function(task, index){
    if(taskStr === task.task) {
      // console.log('found match for ' + task.task);
      tasks.splice(index, 1);
    }
  });
  localStorage.setItem('tasksBundle',JSON.stringify(tasksBundle));
}

// Store task
function storeTaskInSQL(task) {
  if (serverless === false) {
    let id = lastTaskID++;
    let taskStr = encodeURIComponent(task, "UTF-8");
    let bodyStr = "query=createTask&taskStr=" + taskStr + "&mode=none&x=" + randValue; 
  
    request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      if (data.substring(2,4) === "id") { 
        let result = JSON.parse(data);
        if (result.id < 0) {
          console.log(`Create task: task not created. Id returned: ${result.id} - ${task}`);
        } else {
          console.log(`Create task: created task: ${result.id} - ${task}`);
          addTaskToGUI(result.id);
          lastTaskID = result.id;
          id = result.id;
        }
      } else {
        console.log(data);
        alert("Server Error - Malformed data response!");
      }
    })
    .catch(error => {
      serverless = true;
      console.log(error);
    })
    .finally(storeTaskLS(task,id)); // also update LS copy
  } else {
    // TODO: would like to make this a cached task and add it later to the database
    alert("Database not available. Notify Zaudi and/or try again.");
  }
}

function storeTaskLS(task, id) {
  tasks.push({'task': task, 'id': id})
  let tasksBundle = {'tasks': tasks, 'lastTaskID': id };
  localStorage.setItem('tasksBundle', JSON.stringify(tasksBundle));
}

// Save a copy of the task list in local storage. 
// Try to keep this up to date as it may be the only copy available when 
// the server is down. Intend to hobble edits when server is missing.
function cacheTasksLS(tasks, id) {
  let tasksBundle = {'tasks': tasks, 'lastTaskID':id };
  localStorage.setItem('tasksBundle', JSON.stringify(tasksBundle));
}

// ------------- View functions ---------------- //

// User has requested a new task be added. Validate and then update task list
function addTask(e) {
  if(taskInput.value === '') {
    alert('Add a non-empty task.');
  } else {
    // attempt to Store task in SQL database
    storeTaskInSQL(taskInput.value);
  }
  e.preventDefault();
}

function addTaskToGUI(id) {
  // Create li element
  const li = document.createElement('li');
  li.className = 'collection-item';
  li.appendChild(document.createTextNode(taskInput.value));
  const link = document.createElement('a');
  link.className = 'delete-item secondary-content';
  lastTaskID++;
  link.innerHTML = `<i id="${id}" class="fa fa-remove"></i>`;
  li.appendChild(link);
  
  // Append li to ul
  taskList.appendChild(li);

  //Clear input
  taskInput.value = '';
}

// Clear Tasks
function clearTasks() {
  let bundle = localStorage.getItem('tasksBundle');
  if(bundle != null || taskList.firstChild != null) {
    bundle = JSON.parse(bundle);
    if (bundle.tasks != null) {
      if(confirm('Are you sure you want to remove ALL tasks?')) {
        while(taskList.firstChild) {
          taskList.removeChild(taskList.firstChild);
        }
        // Clear for localStorage
        clearTasksFromLS();
        clearTasksFromSQL();
      }
    }
  }
}

// A task element has been clicked. Find out where and pass to the appropriate
// handler
function actionOnTask(e) {
  // console.log(e.target);
  if (e.target.parentElement.classList.contains('delete-item')) {
    removeTask(e);
  } else if (e.target.classList.contains('collection-item')) {
    // console.log(e.target.firstChild.nextElementSibling);
    // console.log(e.target.firstChild.nextElementSibling.firstChild);
    // console.log(e.target.firstChild.nextElementSibling.firstChild.id);
    // nav down to the delete item where the id lives
    let id = e.target.firstChild.nextElementSibling.firstChild.id;
    goToTaskDetail(id);
  }
}

// Remove Task from GUI and update the data stores. LS is updated in case the server goes away.
function removeTask (e) {
  if(e.target.parentElement.classList.contains('delete-item')) {
    // console.log(e.target.parentElement.parentElement.textContent);
    if(confirm(`Removing "${e.target.parentElement.parentElement.textContent}". Are you sure?`)) {
      // moved into removeSQL function so it is removed only if delete works
      // e.target.parentElement.parentElement.remove();
      removeTaskFromSQL(e.target);
      removeTaskFromLS(e.target)
    }
  }
}

// Server warning is included in the html. Remove it if server responds correctly or refresh it just in case if server is down.
function hideServerWarning(hideit) {
  var warning = document.querySelector(".offline");
  if (hideit) {
    warning.style.display = "none";
  } else {
    warning.text = 'Server/Database unavailable. Offline editing only!';
    warning.style.display = "block";
  }
}

//Reload the GUI with an array of tasks from LS or SQL.
function populateTasks(tasks) {
  tasks.forEach(function(task) {
    // Create li element
    const li = document.createElement('li');
    li.className = 'collection-item';
    li.appendChild(document.createTextNode(task.task));
    const link = document.createElement('a');
    link.className = 'delete-item secondary-content';
    // Add icon html
    link.innerHTML = `<i id="${task.id}" class="fa fa-remove"></i>`;
    li.appendChild(link);

    // Append li to ul
    taskList.appendChild(li);
  });
}

// Filter Tasks - currently just a pattern search
function filterTasks(e) {
  const text = e.target.value.toLowerCase();

  document.querySelectorAll('.collection-item').forEach(function(task) {
    const item = task.firstChild.textContent;
    if(item.toLowerCase().indexOf(text) != -1) {
      task.style.display = 'block';
    } else {
      task.style.display = 'none';
    }
  });
}

// Question list requested. Jump to the question page.
function goToQuestionList(e) {
  window.open('questionList.html','_top');
  if (e != null) e.preventDefault();
}

// Task Detail requested. Jump to the Task Details page.
function goToTaskDetail(taskId) {
  window.open('taskDetail.html?taskID=' + taskId,'_top');
}

// Convert 1 to 1st, 11 to 11th and 21 to 21st, etc.
function rankStr (rank) {
  const specialRanks = ['1st','2nd','3rd'];
  // 1 2 and 3 have special string, excepting 11, 12 and 13. English is weird.
  if ((rank % 10) < 4 && (rank %10) > 0 && (rank/10).toFixed(0) != 1 ) {
    return(`${(rank/10).toFixed(0)}${specialRanks[rank % 10 - 1]}`);
  } else {
    return(`${rank}th`);
  }
}
