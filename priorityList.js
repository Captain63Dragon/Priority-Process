// Define UI variables.
const taskList = document.querySelector('.collection');
const questionStatement = document.querySelector('#question-statement');
const progressDisplay = document.querySelector('#question-amt-complete');
const itemList = document.querySelector('.collection');
const doneBtn = document.querySelector('.goto-priority');
const taskListBtn = document.querySelector('.goto-tasks');
const questionBtn = document.querySelector('.goto-qlist');

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
  itemList.addEventListener('click',itemSelected);
  doneBtn.addEventListener('click', goToQuestionOTDay);
  taskListBtn.addEventListener('click', goToTaskList);
  questionBtn.addEventListener('click', goToQuestionList);
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

function loadFromLS() {
  let questionsStr = localStorage.getItem('questions');
  let tasksStr = localStorage.getItem('tasksBundle');
  if (questionsStr === null) {
    goToQuestionList();
  } else {
    questions = JSON.parse(questionsStr);
  }

  // Array.findIndex(function(cValue, ind, Arr), tValue)
  questionIndex = questions.findIndex((q) => (q.questionID === questionID ));
  currQue = questions[questionIndex];
  if (tasksStr === null) {
    tasks = [];
  } else {
    tasksBundle = JSON.parse(tasksStr);
    tasks = tasksBundle.tasks; // note: these are ALL tasks
  }

  // for current question, determine ranks for each task  
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
    if (a.votes != null) {
      if (b.votes != null) {
        return b.votes - a.votes;
      } else {
        return -1;
      }
    } else if (b.votes != null) {
      return 1;
    } else {
      return 0;
    }
  });
  let rank = 1;
  tasks.forEach(function(task) {
    if ((currQue.tasks.findIndex((e) => e === task.id)) >= 0) {
      task.sel = 1;
    } 
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
  const span = document.createElement('span');
  span.className = 'rank-item secondary-content';
  if (task.sel > 0) {
    if (task.votes > 0) {
      span.innerHTML = `${rankStr(rank)} (${task.votes} / ${tot})&nbsp;&nbsp;&nbsp`; 
      inc = 1;
    } else {
      span.innerHTML = 'no votes&nbsp;&nbsp;&nbsp';
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