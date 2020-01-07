import { request } from './request.js';

// Define UI variables.
// const isDebug = true;
const isDebug = false;
let randValue = Math.random();
if (isDebug) { randValue = -1; }
const taskList = document.querySelector('.collection');
const questionStatement = document.querySelector('#question-statement');
const progressDisplay = document.querySelector('#question-amt-complete');
const itemList = document.querySelector('.collection');
const doneBtn = document.querySelector('.goto-priority');
const taskListBtn = document.querySelector('.goto-tasks');
const questionBtn = document.querySelector('.goto-qlist');
const visModeCheck = document.querySelector('.visibility-mode');
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};

let tasksBundle = null;
let questions;
let questionIndex = null;
let currQue;
let tasks;
let validPairs = 0;
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

// load all event listeners
loadEventListeners();

// Load all event listeners
function loadEventListeners() {
  // DOM load event
  document.addEventListener('DOMContentLoaded', loadFromLS);
  itemList.addEventListener('click',listItemAction);
  doneBtn.addEventListener('click', goToQuestionOTDay);
  taskListBtn.addEventListener('click', goToTaskList);
  questionBtn.addEventListener('click', goToQuestionList);
  visModeCheck.addEventListener('click',toggleVisibilityMode);
}

function goToQuestionOTDay(e){
  window.open(`questionOTDay.html?quid=${questionID}`,'_top');
  if (e != null) e.preventDefault();
}

function goToTaskList(e){
  window.open('taskList.html','_top');
  if (e != null) e.preventDefault();
}

function goToQuestionList(e){
  console.log('going to Priority with QuestionID: '+questionID);
  window.open(`questionList.html?quid=${questionID}`,'_top');
  if (e != null) e.preventDefault();
}

function listItemAction(ev) {
  if (ev.target.parentElement.classList.contains('visible-item')) {
    toggleTaskVisibility(ev);
  } else if (ev.target.parentElement.classList.contains('select-item')) {
    itemSelected(ev);
  }
}

function toggleTaskVisibility(ev) {
  if (ev.target.textContent === 'visibility') {
    ev.target.textContent = 'visibility_off';
  } else {
    ev.target.textContent = 'visibility';
  }
  ev.preventDefault();
}

function toggleVisibilityMode(ev) {
  let checkIcon = visModeCheck.firstChild.nextElementSibling.textContent;
  let html;
  if(checkIcon === 'check') {
    checkIcon = 'check_box_outline_blank';
    html = `<i class="material-icons" style="font-size:20px">${checkIcon}</i>`;
    updateModeUIComponent(html);
    updateHiddenTasks('hide');
  } else {
    checkIcon = 'check';
    html = `<i class="material-icons green white-text" style="font-size:20px">${checkIcon}</i>`;
    updateModeUIComponent(html);
    updateHiddenTasks('show');
  }
  ev.preventDefault();
}

function updateHiddenTasks(state) {
  document.querySelectorAll('.collection-item').forEach((item) => {
    const icon = (item.firstChild.nextSibling.nextSibling.firstChild.textContent);
    if(state == 'show') {
      // turn everything on
      item.style.display = 'block';
    } else if (state == 'hide') {
      if (icon !== 'visibility') {
        item.style.display = 'none';
      }
    }
  });
}

function updateModeUIComponent(innerHtmlString) {
  const hRef = document.createElement('a');
  hRef.className = 'visability-mode';
  hRef.innerHTML = innerHtmlString;
  visModeCheck.firstChild.nextElementSibling.remove();
  visModeCheck.appendChild(hRef);
}

function itemSelected(ev) {
  let aTask;
  if (ev.target.parentElement.classList.contains('select-item')) {
    let selectID = parseInt(ev.target.id);
    aTask = tasks.find((t) => (t.id === selectID));
    if (aTask != null) {
      if (ev.target.parentElement.textContent === 'check') {
        aTask.sel = 0;
        ev.target.textContent = 'check_box_outline_blank';
        ev.target.parentElement.parentElement.querySelector('.rank-item').textContent = '';
        removeTaskFromLS(aTask.id);
      } else {
        aTask.sel = 1;
        ev.target.textContent = 'check';
        ev.target.parentElement.parentElement.querySelector('.rank-item').innerHTML = 'no votes&nbsp;&nbsp;&nbsp';
        storeTaskInLS(aTask.id);
      }
    }
    ev.preventDefault();
  }
}

// save task to Local Storage
function storeTaskInLS(id) {
  let queStr = localStorage.getItem('questions');
  let tempQues;
  if (queStr === null) {
    tempQues = []; // todo, what to do if questions not here?
  } else {
    tempQues = JSON.parse(queStr);
  }
  tempQues[questionIndex].tasks.push(id);
  const tTask = [... new Set(tempQues[questionIndex].tasks)];
  tempQues[questionIndex].tasks = tTask;
  // this does not change but saving her for reloading selected later
  localStorage.setItem('selectedQuestionID',
    JSON.stringify(questionID.toFixed(0)));
  localStorage.setItem('questions', JSON.stringify(tempQues));
}

// Remove task from Local Storage
function removeTaskFromLS(id) {
  let queStr = localStorage.getItem('questions');
  let tempQue;
  if (queStr === null) {
    tempQue = []; // todo, no questions should be invalid here
  } else {
    tempQue = JSON.parse(queStr);
  }
  tempQue[questionIndex].tasks.forEach((e,index) => 
    (e === id) ? tempQue[questionIndex].tasks.splice(index,1):0 );
  localStorage.setItem('questions', JSON.stringify(tempQue))
}

// assumes question variables have all been previously calculated
function setQuestionUI() {
  let count = validPairs;
  let tot = currQue.taskPairs.length;
  questionStatement.textContent = currQue.question;
  if (tot > 0) {
    progressDisplay.textContent = `${count}/${tot} (${(100*count/tot).toFixed(0)}%)`;
  } else {
    progressDisplay.textContent = `${count}/${tot} (0%)`;  
  }
}

function loadTasksFromSQL() {
  let bodyStr = "query=taskList&state=FALSE&mode=none&x=" + randValue;

  request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      // console.log(data.substring(3,7));
      if (data.substring(3,8) === "tasks") {
        let result = JSON.parse(data)[0];
        tasks = result.tasks;
        // lastTaskID = result.lastId; // This returned value is not needed here
        tasks.forEach(task => { task.id = parseInt(task.id) });
      } else {
        console.log(data);
      }
    })
    .catch(error => { 
      console.log(error);
      loadTasksFromLS()
    })
    .finally(() => {
      populateTaskPairs();
    });
}

function loadTasksFromLS() {
  let tasksStr = localStorage.getItem('tasksBundle');
  if (tasksStr === null) {
    tasks = [];
  } else {
    tasksBundle = JSON.parse(tasksStr);
    tasks = tasksBundle.tasks; // note: these are ALL tasks
    // lastTaskID = tasksBundle.lastTaskID;
  }  
}

function loadFromLS() {
  let questionsStr = localStorage.getItem('questions');
  if (questionsStr === null) {
    goToQuestionList();
  } else {
    questions = JSON.parse(questionsStr);
  }
  
  // Array.findIndex(function(cValue, ind, Arr), tValue)
  questionIndex = questions.findIndex((q) => (q.questionID === questionID ));
  currQue = questions[questionIndex];
  loadTasksFromSQL();
}

// for current question, determine ranks for each task  
function populateTaskPairs() {
  let pairs = currQue.taskPairs;
  validPairs = 0; // reset count and recalculate
  pairs.forEach(function(pair) {
    let result = higherIDInPair(pair.pair);
    let leftTask  = tasks.find((t) => (t.id === pair.pair[0].taskID) ? t : null);
    let rightTask = tasks.find((t) => (t.id === pair.pair[1].taskID) ? t : null); 
    // if either task is not in the tasks, it is not a valid pair. Ignore or Remove?
    if (leftTask !== null || rightTask !== null) {
      // Add ALL the tasks from the pairs to the end of the task array.
      // Duplicates are removed later
      currQue.tasks.push(leftTask.id);
      currQue.tasks.push(rightTask.id);
      if (result != null)
        validPairs++;
        if (leftTask.id === result) {
          if (leftTask.votes != null) {
            leftTask.votes++;
          } else {
            leftTask.votes = 1;
          }
        }
        if (rightTask.id === result) {
          if (rightTask.votes != null) {
            rightTask.votes++;
          } else {
            rightTask.votes = 1;
          }
        }
    }
  });
  // Now remove the duplicates from the question's tasks array
  const tTasks = [... new Set(currQue.tasks)];
  currQue.tasks = tTasks;
  setQuestionUI();
  
  // after determining vote counts for tasks, sort by votes and apply rank.
  tasks.sort(function(a, b) {
    //the following two tests fail once only for each instance of a and b
    if(a.sel === undefined) {
      a.sel =((currQue.tasks.findIndex((e) => e === a.id)) >= 0)?1:0;
    }
    if(b.sel === undefined) {
      b.sel =((currQue.tasks.findIndex((e) => e === b.id)) >= 0)?1:0;
    }
    if (a.votes != null) {
      if (b.votes != null) {
        return b.votes - a.votes;
      } else {
        return -1;  // if a has votes then a over b.
      }
    } else if (b.votes != null) {
      return 1; // if only b has votes then b higher than a
    // not chosen on votes. What about selected?
    } else {
      return b.sel - a.sel;
    }
  });
  let rank = 1;
  tasks.forEach(function(task) {
    if (task.votes > 0) {
      rank += createLIHtml(task, rank, pairs.length);
    } else {
      createLIHtml(task,0,pairs.length);
    }
  });
}

function createLIHtml(task, rank, tot) {
  let inc = 0;
  const li = document.createElement('li');
  li.className = 'collection-item';
  li.appendChild(document.createTextNode(task.task));
  let link = document.createElement('a');
  link.className = 'select-item secondary-content';
  link.href ='#';
  if (task.sel > 0){
    link.innerHTML = `<i id="${task.id}" class="material-icons">check</i>`;
  } else {
    link.innerHTML = `<i id="${task.id}" class="material-icons">check_box_outline_blank</i>`;
  }
  li.appendChild(link);
  link = document.createElement('a');
  link.className = 'visible-item secondary-content';
  link.href ='#';
  link.innerHTML = '<i class="material-icons">visibility</i>&nbsp; '
  li.appendChild(link);
  link = document.createElement('br');
  li.appendChild(link);
  const span = document.createElement('span');
  span.className = 'rank-item';
  span.style.cssText = 'color: darkcyan';
  if (task.sel > 0) {
    if (task.votes > 0) {
      span.innerHTML = `${rankStr(rank)} (${task.votes} / ${tot})`; 
      inc = 1;
    } else {
      span.innerHTML = 'no votes';
    }
  } /*else { // this case is where you would comment on an unselected task
    span.innerHTML = '&nbsp;&nbsp;&nbsp'; 
  } */
  li.appendChild(span);
  
  // Append li to ul
  taskList.appendChild(li);
  return inc;
}

function rankStr (rank) {
  const specialRanks = ['1st','2nd','3rd'];
  // 1 2 and 3 have special string, excepting 11, 12 and 13. English is weird.
  if ((rank % 10) < 4 && (rank %10) > 0 && (rank/10).toFixed(0) != 1 ) {
    if (rank > 9) {
      return(`${(rank/10).toFixed(0)}${specialRanks[rank % 10 - 1]}`);
    } else {
      return(`${specialRanks[rank - 1]}`);
    }
  } else {
    return(`${rank}th`);
  }
}

// return the ID of the higher priority of the pair and null if no priority yet.
function higherIDInPair(pair) {
  // Note: In this case, the pair is just the 2 element array of objects.
  // eg: {taskID: xx, selHist: ''} 
  let left = pair[0];
  let right = pair[1];
  if ((left.selHist.slice(-1,) === '>') &&
      (right.selHist.slice(-1,) !== '>')) {
    return left.taskID;
  }
  if ((right.selHist.slice(-1,) === '>') &&
      (left.selHist.slice(-1,) !== '>')) {
    return right.taskID;
  }
  return null;
}
