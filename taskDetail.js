import { request } from './request.js';
import { waitms } from './request.js';

// Housekeeping variables.
// const isDebug = true;
const isDebug = false;
let newTask = {}; // empty task detail information
let oldTask = {}; // read and filled in from the database
let randValue = Math.random();
if (isDebug) { randValue = -1; } 
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};
const LATE_THRESHOLD_SEC = 2592000; // older than one month of seconds

// Get taskID from the URL search parameters. 
let [paramName, taskID] = location.search.substring(1).split('=');
if (paramName.toLowerCase() === 'taskid') {
  taskID = parseInt(taskID);
} else {
  console.log(location.search, paramName, taskID);
  // TaskID not specified, return to taskList
  // goToTaskList();
}

// UI Variables.
const created = document.querySelector('.task-entered');
const elapsed = document.querySelector('.task-elapsed');
const updated = document.querySelector('.task-updated');
const form = document.querySelector('#task-form');
const taskInput= document.querySelector('#task');
const category = document.querySelector('#category');
const taskDetail = document.querySelector('#details');
const statsBtn = document.querySelector('.stats');
const cancelBtn = document.querySelector('.cancel-back');
const saveBtn = document.querySelector('.save');
const dirty = new CustomEvent('taskUpdated');
let selectInstance; // Materialize select instance; filled on load.

// load event listeners
loadEventListeners();

function loadEventListeners() {
  document.addEventListener('DOMContentLoaded',loadTaskFromSQL); // after load do..
  form.addEventListener('submit',updateTaskStr);
  statsBtn.addEventListener('click',goToTaskStats);
  cancelBtn.addEventListener('click',abandonChanges);
  saveBtn.addEventListener('click',saveTaskChanges);
  category.addEventListener('change',changeCategory);
  taskDetail.addEventListener('keyup',changeDetail);
  taskInput.addEventListener('taskUpdated', showHideSave);
  window.addEventListener("beforeunload", readyToLeave);
}
function readyToLeave(e) {
  if(checkForDirty()) {
    // dirty? then update ie,
    e.preventDefault();
    e.returnValue='\o/';
    return "\o/"; // for chrome, safari and firefox, this string is ignored
  } else {
    return; // no message set, so free to load next page.
  }
}
function checkForDirty() {
  if(newTask.category !== undefined) {
    return true;
  } 
  return false;
}

function loadTaskFromSQL() {
  return new Promise ((resolve, reject) => {
    let bodyStr =`query=taskDetail&id=${taskID}&mode=active&x=${randValue}`;
    request({url: "model/dbAccess.php", body: bodyStr, headers:myHeader})
    .then(data => {
      if (data.substring(3,7) === 'task') {
        let result = JSON.parse(data)[0];
        oldTask = result;
        updateTaskTimes(result.entered, result.touched, result.done);
        updateCategory(result.category);
        taskInput.value = result.task;
        taskDetail.textContent = result.description;
      }
    })
  })
}

// function storeTaskToSQL() {
//   return new Promise ((resolve, reject) => {
//     let bodyStr =`query=updateTaskDetail&id=${taskID}&mode=active&x${randValue}`;
//     request({url: "model/dbAccess.php", body: bodyStr, headers:myHeader})
//     .then(data => {
//       if (data === "1") {}
//     })
//   })
// }

// Based on times in database formats and task done-ness, update HTML on 
// task detail page
function updateTaskTimes(entered, touched, done) {
  let halfSpan = "";
  created.innerHTML = "Created: <span class='normal'>&nbsp;" +
    myDateString(entered) + "&nbsp;</span>";
  if (done == "1") {
    elapsed.innerHTML = "Done after: <span class='completed'>&nbsp;" + 
      elapsedString(entered, touched) + "&nbsp;</span>";
    updated.innerHTML = "Completed: <span class='completed'> " +
      `&nbsp;${myDateString(touched)}&nbsp;</span>`;
  } else {
    if (numberOfSec(entered, undefined) > LATE_THRESHOLD_SEC) {
      halfSpan = "Open for: <span class='late'>&nbsp;"
    } else {
      halfSpan = "Open for: <span class='normal'>&nbsp;" 
    }
    elapsed.innerHTML = halfSpan + elapsedString(entered, undefined) + 
      "&nbsp;</span>";
    updated.innerHTML = "Last updated: <span class='normal'>&nbsp;" + 
      myDateString(touched) + "&nbsp;</span>";
  }
}

function loadCategoriesFromSQL() {
  // something like SELECT DISTINCT category FROM tasks;
  let cat = [
    {value:"work", text: "@Work"},
    {value:"personal", text: "@Personal"},
    {value:"unknown", text: "@Zknown"}
  ]
  return cat;
}

function updateCategory(category) {
  let myCategories = loadCategoriesFromSQL();
  let elems = document.querySelectorAll('select');
  let found = -1;
  if (category === 'Unknown') {
    let pers = myCategories.find(el => el.value==='personal');
    category = pers.value;
    taskInput.dispatchEvent(dirty);
  }
  myCategories.forEach((opt, idx)  => {
    let option = document.createElement('option');
    [option.text, option.value] = [opt.text, opt.value];
    if (opt.value === category.toLowerCase()) {
      option.selected = true;
    }
    elems[0].add(option); // assuming there is only one select...
  });
  let options={};
  selectInstance = M.FormSelect.init(elems,options);
} 

function showHideSave() {
  if (newTask !== {} ) {
    saveBtn.style.visibility='visible';
    cancelBtn.textContent = 'Cancel';
  } else {
    saveBtn.style.visibility='hidden';
    cancelBtn.textContent = 'Done';
  }
}

// convert a mysql date into a display timestamp
function myDateString(date) {
  if (date == undefined) {
    return "<No Date>"
  }
  const months ='JanFebMarAprMayJunJulAugSepOctNovDec';
  let [year, month, day, hr, min, sec] = date.split(/[- :]/);
  let nMonth=parseInt(month), nHr = parseInt(hr);
  let amPm = (nHr > 11) ? "PM" : "AM";
  hr = (nHr > 12) ? nHr - 12 : ((nHr == 0) ? 12 : nHr);

  month = months.substr(3*nMonth-3,3);
  return (`${hr}:${min}:${sec} ${amPm}, ${month} ${day}, ${year}`);
}

// accepts data strings as recognized by the date function.
// if date is undefined, use Now in place of it.
function numberOfSec(from, to) {
  const f = (from == undefined) ? Date.now() : new Date(from);
  const t = (to == undefined) ? Date.now() : new Date(to);
  return ((t - f)/1000).toFixed(0);
}

function elapsedString(entered, touched) {
  const secs = numberOfSec(entered, touched);
  const sec = secs % 60, mins = (secs - sec) / 60;
  const min = mins % 60, hrs = (mins - min) / 60;
  const hr = hrs % 24, days = (hrs - hr) / 24;
  const day = days % 30, months = (days - day) / 30;
  const year = ((days - day) / 365).toFixed(0);
  let res ="";
  if (year > 0) { res += year + " years, "}
  if (months > 0) { res += months + " month(s), " }
  if (days > 0) { res += day + " day(s), "}
  res += hr + " hr(s), " + min + " min(s)";
  return res;
}

function updateTaskStr() {
	alert('action: updateTaskStr');
}

function goToTaskStats(e) {
  window.open(`statsList.html?id=${taskID}`,'_top');
  if (e != null) e.preventDefault();
}

function goToTaskList() {
  window.open('taskList.html', '_top');
}

function abandonChanges(e) {
	if (dirty == false) {
    goToTaskList();
  }
}

function saveTaskChanges() {
	alert('action: saveTaskChanges');
}

function changeCategory() {
  // if (category.options[category.selectedIndex].value === newTask
}

function changeDetail() {
	alert('action: changeDetail');
}
