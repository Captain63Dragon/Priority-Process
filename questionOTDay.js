// Housekeeping variables.
const RAPID_MODE = 'rapid';
const SEQUENTIAL_MODE = 'sequential';
const DEFAULT_SELECT_MODE = SEQUENTIAL_MODE;

let selectMode = DEFAULT_SELECT_MODE;
// Define UI Variables.
const selectModeCheck = document.querySelector('.select-mode');
const prevBtn = document.querySelector('.prev-pair');
const doneBtn = document.querySelector('.accept-done');
const nextBtn = document.querySelector('.next-pair');
const itemList = document.querySelector('.collection');
const questionStatement = document.querySelector('#question-statement');
const progressDisplay = document.querySelector('#question-amt-complete');

// testing variables
let questionIndex = 0;
const taskPairs = [
  {pair: [{taskID: 10, selHist: '>'}, {taskID: 20, selHist: ''}]},
  {pair: [{taskID: 11, selHist: ''}, {taskID: 21, selHist: ''}]},
  {pair: [{taskID: 12, selHist: ''}, {taskID: 22, selHist: ''}]},
  {pair: [{taskID: 31, selHist: '>'}, {taskID: 32, selHist: ''}]}
]; 

const tasks = [
  {task: 'Weed the garden', id: 10},
  {task: 'Code Priority Process', id: 11},
  {task: 'Spec Sales Force for Customer', id: 12},
  {task: 'Research for Chris', id: 20},
  {task: 'Pick Saskatoons', id: 21},
  {task: 'Eat Pie', id: 22},
  {task: 'Fix kitchen sink', id: 31},
  {task: 'Replace bathroom fan', id: 32}
];

const questions = [
  {
    question: 'What is the best way to make money?',
    questionID: 1,
    tasks: [],
    taskPairs: [],
    pairIndex: 0
  }
];
questions[questionIndex].tasks = tasks;
questions[questionIndex].taskPairs = taskPairs;

// console.log(questions);

// Load all event listeners
loadEventListeners();
loadFromLocalStorage();

function loadFromLocalStorage() {
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
  // load question from LocalStorage here
  setQuestionUI();
}

function saveSelectMode2LS(mode) {
  localStorage.setItem('selectMode', JSON.stringify(mode));
}

function loadEventListeners() {
  // handle click on the checkbox icon associated with the mode prompt
  selectModeCheck.addEventListener('click',toggleSelectMode);
  // handle clicks on the checkbox icon associated with one of the task pair
  itemList.addEventListener('click',itemSelected);
  // handle previous button
  prevBtn.addEventListener('click', previousPairUI);
  // handle next button
  nextBtn.addEventListener('click', nextPairUI);
}
function itemSelected(ev){
  if (ev.target.parentElement.classList.contains('select-item')) {
    let li;
    let toChecked = null;
    let que = questions[questionIndex];
    let selIndex = parseInt(ev.target.id);
    let selTask = que.taskPairs[que.pairIndex].pair[selIndex];
    let otherIndex = selIndex ? 0 : 1;
    let otherTask = que.taskPairs[que.pairIndex].pair[otherIndex];
    // li = ev.target.parentElement.parentElement;
    if (selectMode === RAPID_MODE) {
      selTask.selHist += '>';
      otherTask.selHist += '<';
      nextInvalidPair();
      refreshPairUI();
    } else {
      if (selTask.selHist.slice(-1,) === '>') {
        selTask.selHist += '=';
      } else {
        selTask.selHist += '>';
      }
      refreshPairUI();
    }
  }
}



function toggleSelectMode(e){
  let checkIcon = selectModeCheck.firstChild.nextElementSibling.textContent;
  let val;
  if (checkIcon === 'check') {
    setSequentialModeUI();
  } else {
    setRapidModeUI();
    nextInvalidPair();
    refreshPairUI();
  }
  saveSelectMode2LS(selectMode);
  // console.log(hRef);
  // alert('Got to toggleSelectMode ' + val);
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
  questionStatement.textContent = questions[questionIndex].question;
  addTaskPairs(questions[questionIndex]);
  if(selectMode === RAPID_MODE) {
    nextInvalidPair();
    refreshPairUI();
  }
}

// add Task pair from question to UI elements
function addTaskPairs(que) {
  let cp = que.pairIndex;
  console.assert(cp <= que.taskPairs.length,'Invalid pair index. Bigger than array!');
  console.assert(cp >= 0, 'Invalid pair index. Less than zero!');
  let id = que.taskPairs[cp].pair[0].taskID;
  let hist = que.taskPairs[cp].pair[0].selHist;
  let questionTasks = que.tasks;
  if ((match = findTaskID(questionTasks,id)) !== null ) {
    addTask(match.task, (hist === '') ? false : (hist.slice(-1,)) === ">", 0);
  } else {
    alert(`Task with id ${id} not found in question's task list`);
  }
  id = que.taskPairs[cp].pair[1].taskID;
  hist = que.taskPairs[cp].pair[1].selHist;
  if ((match = findTaskID(questionTasks,id)) !== null ) {
    addTask(match.task, (hist === '') ? false : (hist.slice(-1,)) === ">", 1);
  } else {
    alert(`Task with id ${id} not found in question's task list`);
  }
  updateProgress();
}

function findTaskID(tasks, searchID) {
  let match = null;
  tasks.forEach(aTask => {
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
    // User is skippin this invalid pair. Move to the next invalid pair, if any
    nextTaskPair();
    nextInvalidPair();
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
  addTaskPairs(questions[questionIndex]);
}

function nextInvalidPair() {
  // remember starting place.
  let start = questions[questionIndex].pairIndex;
  let current = null;
  let aPair = questions[questionIndex].taskPairs[start].pair;
  let valid = (
    (aPair[0].selHist.slice(-1,) === '>') !=
    (aPair[1].selHist.slice(-1,) === '>') 
  );
console.log(start,current,valid);
  // If current in valid go to next pair and see if it is valid
  // stop on invalid or when arrive back at start
  while(valid && (current != start)) {
    nextTaskPair();
    current = questions[questionIndex].pairIndex;
    aPair = questions[questionIndex].taskPairs[current].pair;
    valid = (
      (aPair[0].selHist.slice(-1,) === '>') !=
      (aPair[1].selHist.slice(-1,) === '>') 
    );
    console.log(`start: ${start} current: ${current} valid: ${valid}`)
    aPair = questions[questionIndex].taskPairs[current].pair;
    console.log(aPair);
  } 
}

// logically move to the next pair. This does not update the UI
function nextTaskPair() {
  let index = questions[questionIndex].pairIndex;
  if (index + 1 < questions[questionIndex].taskPairs.length) {
    questions[questionIndex].pairIndex++;
  } else {
    questions[questionIndex].pairIndex = 0;
  }
}

// logically move to the previous pair. This does not update the UI
function prevTaskPair() {
  let index = questions[questionIndex].pairIndex;
  if (index == 0) {
    questions[questionIndex].pairIndex = questions[questionIndex].taskPairs.length - 1;
  } else {
    questions[questionIndex].pairIndex--;
  }
}

function updateProgress() {
  let tot = 0;
  let count = 0;
  questions[questionIndex].taskPairs.forEach(aPair => {
    // fancy XOR of the two states. If only one is > then the pair is complete
    if ( (aPair.pair[0].selHist.slice(-1,) === '>') !=
         (aPair.pair[1].selHist.slice(-1,) === '>') ) {
      count++;
    }
    tot++;
  });
  progressDisplay.textContent = `${count}/${tot} (${(100*count/tot).toFixed(0)}%)`;
}