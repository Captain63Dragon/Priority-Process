// Define UI Variables.
const form = document.querySelector('#task-form');
const taskList = document.querySelector('.collection');
const clearBtn = document.querySelector('.clear-tasks');
const filter = document.querySelector('#filter');
const taskInput = document.querySelector('#task');
const link2Download = document.querySelector('.link-to-download');
const exportFile = document.querySelector('#export');
let defaultFilename = 'export.json';

// Load all event listeners
loadEventListeners();

//Load all event listeners
function loadEventListeners() {
  // DOM Load event
  document.addEventListener('DOMContentLoaded', getTasks);
  // Add task event
  form.addEventListener('submit', addTask);
  // Remove task event
  taskList.addEventListener('click', removeTask);
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
function addTask(e) {
  if(taskInput.value === '') {
    alert('Add a task');
  } else {

    // Create li element
    const li = document.createElement('li');
    // Add class
    li.className = 'collection-item';
    // create text node and append to li
    li.appendChild(document.createTextNode(taskInput.value));
    // Create new link elelment
    const link = document.createElement('a');
    // Add class
    link.className = 'delete-item secondary-content';
    // Add icon html
    link.innerHTML = '<i class="fa fa-remove"></i>';
    // Append the link to li
    li.appendChild(link);

    // Append li to ul
    taskList.appendChild(li);

    // Store task in LocalStorage
    storeTaskInLocalStorage(taskInput.value);

    //Clear input
    taskInput.value = '';
  }

  e.preventDefault();
}

// Clear Tasks
function clearTasks() {
  if(localStorage.getItem('tasks') != null ||
     taskList.firstChild != null) {
    if(confirm('Are you sure you want to remove ALL tasks?')) {
      // taskList.innerHTML = '';
      // Faster
      while(taskList.firstChild) {
        taskList.removeChild(taskList.firstChild);
      }
      // Clear for localStorage
      clearTasksFromLocalStorage();
    }
  }
}

// Clear Tasks from Local Storage
function clearTasksFromLocalStorage() {
  localStorage.clear();
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
function getTasks() {
  let tasks;
  if(localStorage.getItem('tasks') === null) {
    tasks = [];
  } else {
    tasks = JSON.parse(localStorage.getItem('tasks'));
  }

  tasks.forEach(function(task) {
    // Create li element
    const li = document.createElement('li');
    // Add class
    li.className = 'collection-item';
    // create text node and append to li
    li.appendChild(document.createTextNode(task));
    // Create new link elelment
    const link = document.createElement('a');
    // Add class
    link.className = 'delete-item secondary-content';
    // Add icon html
    link.innerHTML = '<i class="fa fa-remove"></i>';
    // Append the link to li
    li.appendChild(link);

    // Append li to ul
    taskList.appendChild(li);
  });
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
  let tasks;
  if(localStorage.getItem('tasks') === null) {
    tasks = [];
  } else {
    tasks = JSON.parse(localStorage.getItem('tasks'));
  }

  tasks.forEach(function(task, index){
    if(taskItem.textContent === task) {
      tasks.splice(index, 1);
    }
  });
  localStorage.setItem('tasks',JSON.stringify(tasks));
}

// Store task
function storeTaskInLocalStorage(task) {
  let tasks;
  if(localStorage.getItem('tasks') === null) {
    tasks = [];
  } else {
    tasks = JSON.parse(localStorage.getItem('tasks'));
  }
  tasks.push(task);

  localStorage.setItem('tasks', JSON.stringify(tasks));
}

