import { request } from './request.js';

// Housekeeping variables.
const RAPID_MODE = 'rapid';
const SEQUENTIAL_MODE = 'sequential';
const DEFAULT_SELECT_MODE = SEQUENTIAL_MODE;
let selectMode = DEFAULT_SELECT_MODE;
const isDebug = false;
// const isDebug = true;
let randValue = Math.random();
if (isDebug) { ramdValue = -1; }
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};


// Define UI Variables.
const selectModeCheck = document.querySelector('.select-mode');
const prevBtn = document.querySelector('.prev-pair');
const doneBtn = document.querySelector('.accept-done');
const nextBtn = document.querySelector('.next-pair');
const itemList = document.querySelector('.collection');
const questionStatement = document.querySelector('#question-statement');
const progressDisplay = document.querySelector('#question-amt-complete');

// global variables
let questions = [];
let questionIndex = null;
let currQue;
let tasks = []; // from the tasksBundle. Names of tasks.
let [paramName, questionID] = location.search.substring(1).split('=');
if (paramName.toLowerCase() === 'quid') {
  // if ID is not a number, this will return index 0, which should be fine.
  questionID = parseInt(questionID);
} else {
  console.log('question not specified! ' + location.search);
  if (localStorage.getItem('selectedQuestionID') != null) {
    questionID = JSON.parse(localStorage.getItem('selectedQuestionID'));
  } else {
    // default to question list page to select a question.
    goToQuestionList(null);
  }
}


// Load all event listeners
loadEventListeners();
loadFromSQL();

function loadEventListeners() {
  // handle click on the checkbox icon associated with the mode prompt
  selectModeCheck.addEventListener('click',toggleSelectMode);
  // handle clicks on the checkbox icon associated with one of the task pair
  itemList.addEventListener('click',itemSelected);
  // handle previous button
  prevBtn.addEventListener('click', previousPairUI);
  // handle done button
  doneBtn.addEventListener('click', goToPriorityList);
  // handle next button
  nextBtn.addEventListener('click', nextPairUI);
}

function loadTasksFromSQL() {
  return new Promise ((resolve,reject) => {
    let bodyStr = "query=taskList&state=FALSE&mode=none&x=" + randValue;
    request({url: "model/dbAccess.php", body: bodyStr, headers: myHeader})
    .then(data => {
      if (data.substring(3,8) === "tasks") {
        let result = JSON.parse(data)[0];
        tasks = result.tasks;
        tasks.forEach(task => { task.id = parseInt(task.id) });
      } else {
        console.log(data);
      }
      resolve(tasks.length);
    })
    .catch(error => {
        console.log(error);
        reject(error);
    });
  })
}

function loadFromSQL() {
  // load local storage values for display modes
  if(localStorage.getItem('selectMode') === null) {
    // use the default as defined above
  } else {
    selectMode = JSON.parse(localStorage.getItem('selectMode'));
  }
  if (selectMode === SEQUENTIAL_MODE) {
    setSequentialModeUI();
  } else if (selectMode === RAPID_MODE) {
    setRapidModeUI();
  } else { // select the default mode
    selectMode = DEFAULT_SELECT_MODE;
    if (selectMode === SEQUENTIAL_MODE) {
      setSequentialModeUI();
    } else {
      setRapidModeUI();
    }
  }
  // .. then load data from db
  loadTasksFromSQL()
  .then (() => loadQuestionFromSQL(questionID))
  .then(questionStr => {
    if (questionStr === null) {
      // must have questions. Load question list page to generate or select a question.
      goToQuestionList(); 
    }
    return loadQtasksFromSQL(questionID);
  })
  .then(() => loadQtasksFromSQL(questionID))
  .then(() => createTaskPairsInSQL(questionID))
  .catch(error => console.log(error)) 
  .finally(() => { 
    setQuestionUI() 
  })
}

function loadQuestionFromSQL(quid) {
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=questionList&state=FALSE&mode=active&x=" + randValue;
    request({url: "model/dbAccess.php", body: bodyStr, headers: myHeader})
    .then(data => {
      let res = JSON.parse(data)[0].questions;
      let quest = res.find(item => parseInt(item.id) === quid);
      if (quest !== undefined) {
        currQue = {
          question: quest.question, 
          questionID: quest.id,
          tasks: [],
          taskPairs: [],
        }
        resolve(quest.question);
      } else {
        // resolve as this just means no tasks have been selected yet
        reject(`Question with id ${quid} not found in database.`);
      }
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  })
}

function loadQtasksFromSQL(quid) {
  return new Promise ((resolve, reject) => {
    let bodyStr = `query=QTaskList&quid=${quid}&mode=active&x=` + randValue;
    request({url: "model/dbAccess.php", body: bodyStr, headers: myHeader})
    .then(data => {
      if (data.substring(0,1) !== "0") { 
        let res = JSON.parse(data);
        let qtasks = [];
        res.forEach(item => {
          let id = parseInt(item.taskId);
          if (item.state === "0") {
            qtasks.push(id);
          } // ignores hidden tasks completely
        })
        currQue.tasks = qtasks;
        console.assert(tasks.length > 0, "No tasks selected in this question.");
        currQue.pairIndex = 0;
        resolve("1");
      } else {
        // resolve as this just means no tasks have been selected yet
        reject(`Question with id ${quid} not found in database.`);
      }
    })
    .catch(error => {
      console.log(error);
      reject(error);
    })
  })
}

/* This function takes the provided quid, and calls a database
  function that reads all the database qtask records
  and creates a new database taskpair record for each pair of
  tasks or updates an existing record if one is found. That function
  then returns ONLY the appropriate taskpairs. Note that 
  there may be some task pairs that have the correct quid but 
  are NOT loaded / updated as they do not match the qtask records. 
  These are retained for their history.
  Currently qtask records must be deleted when deselected. 
*/
function createTaskPairsInSQL(quid) {
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=createQuestionTaskPairs&quid=" + quid + "&mode=active&x=" + randValue;
    request({url: "model/dbAccess.php", body: bodyStr, headers: myHeader})
      .then(data => {
        if (data.substring(0,1) === '0') { 
          resolve(data); // likely means no pairs found
        } else {
          let ret = JSON.parse(data);
          ret.forEach(a => {
            a.pair[0].taskId=parseInt(a.pair[0].taskId);
            a.pair[1].taskId=parseInt(a.pair[1].taskId);
          })
          currQue.taskPairs = ret;
        }
        resolve();
      })
      .catch(error => {
          console.log(error);
          reject(error);
      });
  })
}

function goToPriorityList(e) {
  window.open(`priority.html?quid=${questionID}`,"_top");
  if (e != null) e.preventDefault();
}

function goToQuestionList(e) {
  window.open('questionList.html', '_top');
  if (e != null) e.preventDefault();
}

function saveSelectMode2LS(mode) {
  localStorage.setItem('selectMode', JSON.stringify(mode));
}

function itemSelected(ev){
  if (ev.target.parentElement.classList.contains('select-item')) {
    let li;
    let pairIdx = currQue.pairIndex;
    let selIndex = parseInt(ev.target.id);
    let selTask = currQue.taskPairs[currQue.pairIndex].pair[selIndex];
    let otherIndex = selIndex ? 0 : 1;
    let otherTask = currQue.taskPairs[currQue.pairIndex].pair[otherIndex];
    // li = ev.target.parentElement.parentElement;
    if (selectMode === RAPID_MODE) {
      selTask.selHist += '>';
      otherTask.selHist += '<';
      skipToRandomPair();
    } else {
      if (selTask.selHist.slice(-1,) === '>') {
        selTask.selHist += '=';
      } else {
        selTask.selHist += '>';
      }
    }
    storeSelHistoryInSQL(pairIdx);
    refreshPairUI();
  }
}

function toggleSelectMode(e){
  let checkIcon = selectModeCheck.firstChild.nextElementSibling.textContent;
  if (checkIcon === 'check') {
    setSequentialModeUI();
  } else {
    setRapidModeUI();
    nextInvalidPair();
    refreshPairUI();
  }
  saveSelectMode2LS(selectMode);
}

function setSequentialModeUI() {
  let checkIcon = 'check_box_outline_blank';
  let html = `<i class="material-icons" style="font-size:20px">${checkIcon}</i>`;
  updateModeUIComponents(html);

  // show prev button
  prevBtn.style.visibility='visible';
  // switch label for next button to Next
  nextBtn.textContent = 'Next'
  selectMode = SEQUENTIAL_MODE;
}

function setRapidModeUI (){
  let checkIcon = 'check';
  let html = `<i class="material-icons green white-text" style="font-size:20px">${checkIcon}</i>`;
  updateModeUIComponents(html);

  // hide prev button
  prevBtn.style.visibility='hidden';
  // switch label for next button to Skip
  nextBtn.textContent = 'Skip';
  selectMode = RAPID_MODE;
}

function updateModeUIComponents(innerHtmlString) {
  const hRef = document.createElement('a');
  hRef.className = 'select-mode';
  hRef.innerHTML = innerHtmlString;
  selectModeCheck.firstChild.nextElementSibling.remove();
  selectModeCheck.appendChild(hRef);
}

function setQuestionUI() {
  questionStatement.textContent = currQue.question;
  addTaskPairs(currQue);
  if(selectMode === RAPID_MODE) {
    skipToRandomPair();
    refreshPairUI();
  }
}

// add Task pair from question to UI elements
function addTaskPairs(que) {
  let cp = que.pairIndex === undefined ? 0 : que.pairIndex;
  let match;
  console.assert(cp <= que.taskPairs.length,'Invalid pair index. Bigger than array!');
  console.assert(cp >= 0, 'Invalid pair index. Less than zero!');
  let id = que.taskPairs[cp].pair[0].taskId;
  let hist = que.taskPairs[cp].pair[0].selHist;
  if ((match = findTaskID(tasks,id)) !== null ) {
    addTask(match.task, (hist === '') ? false : (hist.slice(-1,)) === ">", 0);
  } else {
    alert(`Task with id ${id} not found in question's task list`);
  }
  id = que.taskPairs[cp].pair[1].taskId;
  hist = que.taskPairs[cp].pair[1].selHist;
  if ((match = findTaskID(tasks,id)) !== null ) {
    addTask(match.task, (hist === '') ? false : (hist.slice(-1,)) === ">", 1);
  } else {
    alert(`Task with id ${id} not found in question's task list`);
  }
  updateProgress();
}

function findTaskID(tasks, searchID) {
  let match = null;
  tasks.forEach((aTask) => {
    if(aTask.id === searchID) {
      match = aTask;
    } 
  });
  return match;
} 

// Add Task
function addTask(taskString, selected,id) {
  const li = document.createElement('li');
  li.className = 'collection-item';
  li.appendChild(document.createTextNode(taskString));
  // Create new link elelment
  const link = document.createElement('a');
  // Add class
  link.className = 'select-item secondary-content';
  // Add icon html
  if (selected) {
    link.innerHTML = `<i id="${id}" class="material-icons">check</i>`;
  } else {
    link.innerHTML = `<i id="${id}" class="material-icons">check_box_outline_blank</i>`;
  }
  li.appendChild(link);
  // Append li to ul
  itemList.appendChild(li);
}

// Previous button pressed
function previousPairUI() {
  // move to the proper previous pair
  prevTaskPair();
  refreshPairUI();
}

// next/skip button pressed
function nextPairUI() {
  // move to the proper next pair
  if (selectMode === RAPID_MODE){
    // maybe update history for this pair for skip?
    // User is skipping this invalid pair. Move to a random invalid pair, 
    // if any are left.
    skipToRandomPair();
  } else {
    nextTaskPair();
  }
  refreshPairUI();
  }
  
function refreshPairUI() {  
  // remove old pair
  while(itemList.firstChild) {
    itemList.removeChild(itemList.firstChild);
  }
  // add new pair
  addTaskPairs(currQue);
}

function skipToRandomPair() {
  let current = Math.trunc(Math.random() * (currQue.taskPairs.length));
  currQue.pairIndex = current;
  nextInvalidPair();
}

function nextInvalidPair() {
  // remember starting place.
  let start = currQue.pairIndex;
  let current = null;
  let aPair = currQue.taskPairs[start].pair;
  let valid = (
    (aPair[0].selHist.slice(-1,) === '>') !=
    (aPair[1].selHist.slice(-1,) === '>') 
  );
  // If current in valid go to next pair and see if it is valid
  // stop on invalid or when arrive back at start
  while(valid && (current != start)) {
    nextTaskPair();
    current = currQue.pairIndex;
    aPair = currQue.taskPairs[current].pair;
    valid = (
      (aPair[0].selHist.slice(-1,) === '>') !=
      (aPair[1].selHist.slice(-1,) === '>') 
    );
    aPair = currQue.taskPairs[current].pair;
  } 
}

// logically move to the next pair. This does not update the UI
function nextTaskPair() {
  let index = currQue.pairIndex;
  if (index + 1 < currQue.taskPairs.length) {
    currQue.pairIndex++;
  } else {
    currQue.pairIndex = 0;
  }
}

// logically move to the previous pair. This does not update the UI
function prevTaskPair() {
  let index = currQue.pairIndex;
  if (index == 0) {
    currQue.pairIndex = currQue.taskPairs.length - 1;
  } else {
    currQue.pairIndex--;
  }
}

// progress is the string after the question showing how many pairs have been prioritized
function updateProgress() {
  let tot = 0;
  let count = 0;
  currQue.taskPairs.forEach(aPair => {
    // fancy XOR of the two states. If only one is > then the pair is complete
    if ( (aPair.pair[0].selHist.slice(-1,) === '>') !=
         (aPair.pair[1].selHist.slice(-1,) === '>') ) {
      count++;
    }
    tot++;
  });
  progressDisplay.textContent = `${count}/${tot} (${(100*count/tot).toFixed(0)}%)`;
}

// Bend over backwards to save pair histories.
function createTaskPairsArray(tasks) {
  let i = 1, j = 0;
  let dirty = false;
  let taskIDs = currQue.tasks;
  const goodPair = [];

  // first remove pairs containing task ids that are nolonger part of this
  // question. This will lose the history for these. Oh well.
  currQue.taskPairs.forEach(function(aPair, index){
    let res1 = taskIDs.findIndex((id) => aPair.pair[0].taskId === id);
    let res2 = taskIDs.findIndex((id) => aPair.pair[1].taskId === id);
    if (res1 >= 0 && res2 >= 0) {
      goodPair.push(aPair);
    } else {
      dirty = true; // this pair is being removed, so need to save update
    }
  });

  // replace the old array with the good pairs. 
  // Splice(index,1) messes up a forEach, so had to do it this way.
  currQue.taskPairs = goodPair;
  
  // for all the task ids selected for this question, add only new pairs
  while (i < tasks.length) {
    j=0;
    while (j < i) {
      let res = currQue.taskPairs.find(aPair => 
          pairAlreadyExists(aPair,tasks[i],tasks[j]));
      if (!res) {
        // create pair with id address, tasks[i] and tasks[j]
        let aPair = {
          pair: [ 
            { taskID: tasks[i], selHist: ""}, 
            { taskID: tasks[j], selHist: ""}
          ]
        };
        currQue.taskPairs.push(aPair);
        dirty = true; // new pair added; save update
      }
      j++;
    }
    i++;
  }
  if (dirty) {
    // if pairs were touched above, save the changes
    storeQuestionInLS();
  }
}

// Pairs may be left-right or right-left so check both.
// for now, the order does not matter
function pairAlreadyExists(aPair,left,right) {
  if (aPair.pair[0].taskId === left) {
    if (aPair.pair[1].taskId === right) {
      return true;
    } 
  } else if (aPair.pair[1].taskId === left){
    if (aPair.pair[0].taskId === right) {
      return true;
    }
  }
  return false;
}

// For sanity, save state for any changes
function storeSelHistoryInSQL(idx) {
  return new Promise ((resolve, reject) => {
    let aPair = currQue.taskPairs[idx].pair;
    let params = {
      quid: questionID, 
      task1: aPair[0].taskId, 
      task2: aPair[1].taskId,
      selHist1: aPair[0].selHist,
      selHist2: aPair[1].selHist,
      ts: Date.now()
    }
    let paramStr = JSON.stringify(params);
    let bodyStr = "query=createATaskPair&paramStr=" + paramStr + "&mode=active&x=" + randValue;
    request({url: "model/dbAccess.php", body: bodyStr, headers: myHeader})
      .then(data => resolve(data))
      .catch(error => {
          console.log(error);
          reject(error);
      });
  })
}