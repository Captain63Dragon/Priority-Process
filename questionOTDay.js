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
loadFromLS();

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
  let bodyStr = "query=taskList&state=FALSE&mode=none&x=" + randValue;

  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
  .then(data => {
    // console.log(data.substring(3,8));
    if (data.substring(3,8) === "tasks") {
      let result = JSON.parse(data)[0];
      tasks = result.tasks;
      tasks.forEach(task => { task.id = parseInt(task.id) });
      createTaskPairsArray(currQue.tasks);
      setQuestionUI();
      } else {
      console.log(data);
    }
  })
  .catch(error => {
      console.log(error);
  });
};

function loadFromLS() {
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
  let questionsStr = localStorage.getItem('questions');
  if (questionsStr === null) {
    // must have questions. Load question list page to generate or select a question.
    goToQuestionList(); 
  } else {
    questions = JSON.parse(questionsStr);
  }

  // Array.findIndex(function(cValue, ind, Arr), tValue)
  if (typeof questionID == 'number') {
    questionIndex = questions.findIndex((q) => (q.questionID === questionID )); 
  } else {
    questionIndex = 0;
  }
  currQue = questions[questionIndex];
  if (true) {
    loadTasksFromSQL();
  } else {
    let tasksStr = localStorage.getItem('tasksBundle');
    if (tasksStr === null) {
      tasks = []; 
    } else {
      let tasksBundle = JSON.parse(tasksStr);
      tasks = tasksBundle.tasks;
    }
    createTaskPairsArray(currQue.tasks);
    setQuestionUI();
  }
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
    storeQuestionInLS();
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
  let cp = que.pairIndex;
  let match;
  console.log(tasks);
  console.assert(cp <= que.taskPairs.length,'Invalid pair index. Bigger than array!');
  console.assert(cp >= 0, 'Invalid pair index. Less than zero!');
  let id = que.taskPairs[cp].pair[0].taskID;
  let hist = que.taskPairs[cp].pair[0].selHist;
  if ((match = findTaskID(tasks,id)) !== null ) {
    addTask(match.task, (hist === '') ? false : (hist.slice(-1,)) === ">", 0);
  } else {
    alert(`Task with id ${id} not found in question's task list`);
  }
  id = que.taskPairs[cp].pair[1].taskID;
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
    let res1 = taskIDs.findIndex((id) => aPair.pair[0].taskID === id);
    let res2 = taskIDs.findIndex((id) => aPair.pair[1].taskID === id);
    // console.log(res1, res2, aPair);
    if (res1 >= 0 && res2 >= 0) {
      // console.log('Adding good pair '+ JSON.stringify(currQue.taskPairs[index]));
      goodPair.push(aPair);
    } else {
      dirty = true; // this pair is being removed, to need to save update
    }
  });

  // replace the old array with the good pairs. 
  // Splice(index,1) messes up a forEach, so had to do it this way.
  currQue.taskPairs = goodPair;
  
  // for all the task ids selected for this question, add only new pairs
  while (i < tasks.length) {
    j=0;
    while (j < i) {
      let res = currQue.taskPairs.find(function(aPair) {
        return pairAlreadyExists(aPair,tasks[i],tasks[j]);
      });
      if (!res) {
      //   console.log('found match for ' +tasks[i] + ' ' + tasks[j]);
      // } else { // not found, so add the pair
        // create pair with id address, tasks[i] and tasks[j]
        let str = `{"pair": [{"taskID": ${tasks[i]}, "selHist": ""}, {"taskID": ${tasks[j]}, "selHist": ""}]}`;
        // console.log('Adding '+str);
        currQue.taskPairs.push(JSON.parse(str));
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
  if (aPair.pair[0].taskID === left) {
    if (aPair.pair[1].taskID === right) {
      return true;
    } 
  } else if (aPair.pair[1].taskID === left){
    if (aPair.pair[0].taskID === right) {
      return true;
    }
  }
  return false;
}

// For sanity, save state for any changes
function storeQuestionInLS(question, id) {
  let str = localStorage.getItem('questions');
  let tempQues;
  if (str === null) {
    tempQues = [];
  } else{
    tempQues = JSON.parse(str);
  }
  tempQues[questionIndex].taskPairs = currQue.taskPairs;
  tempQues[questionIndex].pairIndex;
  localStorage.setItem('questions', JSON.stringify(tempQues));
}