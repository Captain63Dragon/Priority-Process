// Housekeeping variables
let lastQuestionID = -1;


// Define UI variables.
const form = document.querySelector('#question-form');
const questionList = document.querySelector('.collection');
const clearBtn = document.querySelector('.clear-questions');
const taskListBtn = document.querySelector('.goto-taskList');
const filter = document.querySelector('#filter');
const questionInput = document.querySelector('#question');

// Load query parameter to get question id. Not expecting any other parameter.
let [paramName, questionID] = location.search.substring(1).split('=');
if (paramName.toLowerCase() === 'quid') {
  // if ID is not a number, this will return index 0, which should be fine.
  questionID = parseInt(questionID);
} else {
  console.log('question not specified! ' + location.search);
  questionID = null;
}

// load all event listeners
loadEventListeners();

// Load all event listeners
function loadEventListeners(){
  document.addEventListener('DOMContentLoaded', loadQuestionsFromLS);
  form.addEventListener('submit', addQuestion);
  questionList.addEventListener('click', listItemAction);
  clearBtn.addEventListener('click', clearQuestions);
  taskListBtn.addEventListener('click', goToTaskList);
  filter.addEventListener('keyup', filterQuestions);
}

// one of the UL items has been clicked. Determine if select or delete
// and pass to appropriate action routine.
function listItemAction(e) {
  if (e.target.parentElement.classList.contains('delete-item')) {
    removeQuestion(e);
  } else if (e.target.parentElement.classList.contains('select-item')) {
    selectQuestion(e);
  }
}

function addQuestion(e) {
  if (questionInput.value === '') {
    alert('Add a Question');
  } else {
    const li = document.createElement('li');
    li.className = 'collection-item';
    li.appendChild(document.createTextNode(questionInput.value));
    const link = document.createElement('a');
    link.className = 'delete-item secondary-content';
    lastQuestionID++;
    link.innerHTML = `<i "${lastQuestionID}" class="fa fa-remove"></i>`;
    li.appendChild(link);
    questionList.appendChild(li);
    storeQuestionInLS(questionInput.value, lastQuestionID);
    questionInput.value = '';
    window.open(`priority.html?quid=${lastQuestionID}`,'_top');
    e.preventDefault();
  }
}

function storeQuestionInLS(question, id) {
  let str = localStorage.getItem('questions');
  let questions;
  if (str === null) {
    questions = [];
  } else{
    questions = JSON.parse(str);
  }
  if(question != null) {
    questions.push(
      { 'question':question,
        'questionID':id,
        'tasks':[],
        'taskPairs':[],
        'pairIndex':0
      });
  }
  localStorage.setItem('questions', JSON.stringify(questions));
  localStorage.setItem('lastQuestionID',JSON.stringify(lastQuestionID));
  localStorage.setItem('selectedQuestionID', parseInt(questionID));
}

// Clear Questions buttion
function clearQuestions() {
  let questions = localStorage.getItem('questions');
  // if local storage is not emty or the screen has a question..
  if (questions != null || questionList.firstChild != null) {
    questions = JSON.parse(questions);
    if (questions != null && Array.isArray(questions)) {
      if (confirm('Are you sure you want to remove ALL questions?')) {
        while(questionList.firstChild) {
          questionList.removeChild(questionList.firstChild);
        }
        clearQuestionsFromLS();
      }
    }
  }
}

function goToTaskList(e){
  window.open('taskList.html','_top');
  if (e != null) e.preventDefault();
}
function goToPriorityList(e){
  console.log('going to Priority with QuestionID: '+questionID);
  window.open(`priority.html?quid=${questionID}`,'_top');
  if (e != null) e.preventDefault();
}

function clearQuestionsFromLS() {
  let val = JSON.stringify([]);
  localStorage.setItem('questions',val);
}

// Filter Questions
function filterQuestions(e) {
  const text = e.target.value.toLowerCase();

  document.querySelectorAll('.collection-item').forEach(function(que) {
    const item = que.firstChild.textContent;
    if (item.toLowerCase().indexOf(text) != -1) {
      que.style.display = 'block';
    } else {
      que.style.display = 'none';
    }
  });
}

// Get questions from LS
function loadQuestionsFromLS() {
  let str = localStorage.getItem('questions');
  let questions;
  if (str === null) {
    questions = [];
  } else {
    questions = JSON.parse(str);
  }
  str = localStorage.getItem('lastQuestionID');
  if (str === null) {
    lastQuestionID = -1;
  } else {
    lastQuestionID = JSON.parse(str);
  }

  questions.forEach(function(que) {
    const li = document.createElement('li');
    li.className = 'collection-item';
    li.appendChild(document.createTextNode(que.question));
    let link = document.createElement('a');
    link.className = 'delete-item secondary-content';
    link.innerHTML = `<i id="${que.questionID}" class="fa fa-remove"></i>`;
    li.appendChild(link);
    link = document.createElement('a');
    link.className = 'select-item secondary-content';
    let icon = (que.questionID === questionID) ? 
      'check' : 'check_box_outline_blank' ;
    link.innerHTML = 
      `<i id="${que.questionID}" class="material-icons">${icon}</i>`;
    li.appendChild(link);
    questionList.appendChild(li);
  });
}

// remove Question
function removeQuestion (e) {
  if (e.target.parentElement.classList.contains('delete-item')) {
    if (confirm('Are you sure?')) {
      e.target.parentElement.parentElement.remove();
      console.log(e.target.id);
      removeQuestionFromLS(e.target.id);
    }
  }
}

function selectQuestion(e) {
  questionID = e.target.id;
  storeQuestionInLS();
  goToPriorityList(null);
}

function removeQuestionFromLS(questId) {
  let str = localStorage.getItem('questions');
  let questions;
  if (str === null) {
    questions = [];
  } else {
    questions = JSON.parse(str);
  }

  questions.forEach(function(que, index) {
    if (questId == parseInt(que.questionID)) {
      questions.splice(index, 1); // remove the match
    }
  });
  localStorage.setItem('questions', JSON.stringify(questions));
}