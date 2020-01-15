import { request } from './request.js';

// Housekeeping variables
let lastQuestionID = -1;
let randValue = Math.random();
const myHeader = {"Content-type": "application/x-www-form-urlencoded"};

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
  document.addEventListener('DOMContentLoaded', loadQuestionsFromSQL);
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
    storeQuestionInSQL(questionInput.value)
    .then(newQuid => {
      const li = document.createElement('li');
      li.className = 'collection-item';
      li.appendChild(document.createTextNode(questionInput.value));
      const link = document.createElement('a');
      link.className = 'delete-item secondary-content';
      lastQuestionID++;
      link.innerHTML = `<i "${newQuid}" class="fa fa-remove"></i>`;
      li.appendChild(link);
      questionList.appendChild(li);
      questionInput.value = '';
      window.open(`priority.html?quid=${newQuid}`,'_top');
      e.preventDefault();
    })
    .catch(error => {
      console.log(error);
    })
  }
}

function storeQuestionInSQL(question) {
  return new Promise ((resolve, reject) => {
    let quStr = encodeURIComponent(question, "UTF-8");
    let bodyStr ="query=createQuestion&questionStr=" + quStr + "&mode=DEBUG&x=" +randValue;
    request({url: "model/getData.php", body: bodyStr, headers: myHeader})
    .then(data => {
      id = -1;
      let txt;
      if (data.substring(0,5) !== "alksjdf") {
        console.log(data.substring(1,16), "Data:\n",data);
      } else {
        let res = JSON.parse(data);
        if (res.id >= 0) {
          resolve(res.id);
        } else {
          reject(`Create Question failed: Returned invalid id: ${res.id} - ${quStr}`);
        }
      }
    })
  })
  .catch(error => {
    console.log(error);
    reject(error);
  })
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
        clearQuestionsFromLS(); // todo: mark all questions inactive
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

function loadQuestionsFromSQL() {
  let bodyStr = "query=questionList&state=FALSE&mode=active&x=" + randValue;
  request({url: "model/dbAccess.php", body: bodyStr, headers: myHeader})
    .then(data => {
      if (data.substring(3,12) != "questions") {
        console.log(`"${data.substring(3,12)} from\n${data}"`);
      } else {
        let res = JSON.parse(data)[0];
        res.questions.forEach(item => {
          createQuestionLI(item.question, item.id);
        })
      }
    })
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
    createQuestionLI(que.question, que.questionID);
  });
}

function createQuestionLI(question, quid) {
  const li = document.createElement('li');
  li.className = 'collection-item';
  li.appendChild(document.createTextNode(question));
  let link = document.createElement('a');
  link.className = 'delete-item secondary-content';
  link.innerHTML = `<i id="${quid}" class="fa fa-remove"></i>`;
  li.appendChild(link);
  link = document.createElement('a');
  link.className = 'select-item secondary-content';
  let icon = (questionID === quid) ?
    'check' : 'check_box_outline_blank' ;
  link.innerHTML =
    `<i id="${quid}" class="material-icons">${icon}</i>`;
  li.appendChild(link);
  questionList.appendChild(li);

}

// remove Question
function removeQuestion (e) {
  if (e.target.parentElement.classList.contains('delete-item')) {
    let qtext = e.target.parentElement.parentElement.innerHTML;
    qtext = qtext.substr(0,qtext.indexOf('<a class'));
    if(confirm(`Removing "${qtext}". Are you sure?`)) {
      // console.log(e.target.id);
      removeQuestionFromSQL(e.target.id)
      .then( removed => {
        console.assert(e.target.id === removed, "Deletion was wonky! Check it out.");
        e.target.parentElement.parentElement.remove();
      })
      .catch(error => {
        console.log(error);
      })
    }
  }
}

function selectQuestion(e) {
  questionID = e.target.id;
  // storeQuestionInLS(); I don't think this is needed anymore.
  goToPriorityList(null);
}
function removeQuestionFromSQL(quid){
  return new Promise ((resolve, reject) => {
    let bodyStr = "query=deleteQuestionId&id=" + quid + "&mode=active&x=" + randValue;
    request({url: "model/getData.php", body: bodyStr, headers:myHeader})
      .then(data => {
        let result = JSON.parse(data);
        if (result.id >= 0) { // id of deleted record returned..
          // console.log (`deleted id: ${result.id} found and deleted<br>\n`);
          resolve(result.id);
        } else {
          reject("Deletion returned code: " + result.id);
        }
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
  })
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