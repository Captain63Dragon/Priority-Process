// Define UI Variables.
const form = document.querySelector('#task-form');
const taskList = document.querySelector('.collection');
const questionListBtn = document.querySelector('.goto-question-list');
const clearBtn = document.querySelector('.clear-tasks');
const filter = document.querySelector('#filter');
const taskInput = document.querySelector('#task');
const link2Download = document.querySelector('.link-to-download');
const exportFile = document.querySelector('#export');
let defaultFilename = 'export.json';
const tasksBundle = null;
let lastTaskID = -1;

// Load all event listeners
loadEventListeners();

//Load all event listeners
function loadEventListeners() {
  // DOM Load event
  document.addEventListener('DOMContentLoaded', loadTasksFromLS);
  // Add task event
  form.addEventListener('submit', addTask);
  // Remove task event
  taskList.addEventListener('click', removeTask);
  // Clear task event
  questionListBtn.addEventListener('click', goToQuestionList);
  // Clear task event
  clearBtn.addEventListener('click', clearTasks);
  // Filter tasks event
  filter.addEventListener('keyup',filterTasks);
  // Export data to a download file
  link2Download.addEventListener('click', exportLStoFile);
  // Export filename change
  exportFile.addEventListener('keyup', exportFileChanged);
}

// Add Task
function addTask() {
  if(taskInput.value === '') {
    alert('Add a task');
  } else {

    // Create li element
    const li = document.createElement('li');
    li.className = 'collection-item';
    li.appendChild(document.createTextNode(taskInput.value));
    const link = document.createElement('a');
    link.className = 'delete-item secondary-content';
    lastTaskID++;
    link.innerHTML = `<i "${lastTaskID}" class="fa fa-remove"></i>`;
    li.appendChild(link);
    // Append li to ul
    taskList.appendChild(li);

    // Store task in LocalStorage
    storeTaskInLocalStorage(taskInput.value, lastTaskID);

    //Clear input
    taskInput.value = '';
  }
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
        clearTasksFromLocalStorage(bundle);
      }
    }
  }
}

// Clear Tasks from Local Storage
function clearTasksFromLocalStorage(tasksBundle) {
  let val = JSON.stringify ({tasks: [], lastTaskID: lastTaskID});
  localStorage.setItem('tasksBundle',val);
}

// Export filename changed
function exportFileChanged(e) {
  let newFile = e.target.value;
  if(newFile != null && newFile != '') {
    if(newFile.endsWith('.json')) {
      // console.log(newFile + ' ends with .json already')
    } else {
      newFile += '.json';
    }
    link2Download.download=newFile;
  } else {
    link2Download.download=defaultFilename;    
  }
}

// Export LS data to a file
function exportLStoFile() {
  const content = localStorage.getItem('tasks');
  const contentType='text/plain'
  let fileName = link2Download.download;
  //  ='export2.json'
  let file = new Blob([content], {type: contentType});
  
  link2Download.href = URL.createObjectURL(file);
  link2Download.download = fileName;
}

// Filter Tasks
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

// Get Tasks from LS
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

function goToQuestionList(e) {
  window.open('questionList.html','_top');
  if (e != null) e.preventDefault();
}

// Remove Task
function removeTask (e) {
  if(e.target.parentElement.classList.contains('delete-item')) {
    if(confirm('Are you sure?')) {
      e.target.parentElement.parentElement.remove();

      // Remove from LS
      removeTaskFromLocalStorage
      (e.target.parentElement.parentElement);
    }
  }
}

// Remove from LS
function removeTaskFromLocalStorage(taskItem) {
  let tasksStr = localStorage.getItem('tasksBundle');
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
    if(taskItem.textContent === task.task) {
      // console.log('found match for ' + task.task);
      tasks.splice(index, 1);
    }
  });
  localStorage.setItem('tasksBundle',JSON.stringify(tasksBundle));
}

// Store task
function storeTaskInLocalStorage(task, id) {
  let tasksStr = localStorage.getItem('tasksBundle');
  let tasks;
  let tasksBundle;
  if(tasksStr === null) {
    tasks = [];
  } else {
    tasksBundle = JSON.parse(tasksStr);
    tasks = tasksBundle.tasks;
    tasksBundle.lastTaskID = lastTaskID;
    console.assert(lastTaskID === id);
  }

  tasks.push({'task': task, 'id': id });
  tasksBundle = {'tasks': tasks, 'lastTaskID': id };
  localStorage.setItem('tasksBundle', JSON.stringify(tasksBundle));
}

function rankStr (rank) {
  const specialRanks = ['1st','2nd','3rd'];
  // 1 2 and 3 have special string, excepting 11, 12 and 13. English is weird.
  if ((rank % 10) < 4 && (rank %10) > 0 && (rank/10).toFixed(0) != 1 ) {
    return(`${(rank/10).toFixed(0)}${specialRanks[rank % 10 - 1]}`);
  } else {
    return(`${rank}th`);
  }
}
