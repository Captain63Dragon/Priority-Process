function initiateXHttp(xhttp, module, id, newState ) {
  let debugStr = (isDebug) ? "&mode=DEBUG" : "";
  let rndStr = "&x=" + Math.random();
  xhttp.open("POST", "model/getData.php", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  let sendStr = "";
  switch (module) {
    case "taskList":
      sendStr = "query="+ module;
      break;

    case "deleteId":
      sendStr = "query=" + module + "&id=" + id;
      break;

    case "createTask":
      // add the random number so that a cached response is not sent.
      let taskStr = encodeURIComponent(id, "UTF-8");
      console.log(taskStr);
      sendStr = "query=" + module + "&taskStr=" + taskStr;
      break;
      
    case "updateState":
      sendStr = "query=" + module + "&id=" + id + "&state=" + newState;
      break;
        
    default:
      // Todo: signal invalid command
      break;
  }
  sendStr += debugStr + rndStr;
  console.log(sendStr);
  xhttp.send(sendStr);
}

function displayTaskList(listClass) {
  var xhttp = new XMLHttpRequest();

  // callback for xml http request object
  xhttp.onreadystatechange=function() {
    if (this.readyState == 4 && this.status == 200) {
      let txt;
      let res = this.responseText;
      if (res.substring(0,5) === "DEBUG") {
        txt = res;
      } else {
        res = JSON.parse(this.responseText);
        txt = '<ul>\n';
        res.forEach(item => {
          if (item.done == "1") {
            txt += '<li class="done">';
          } else {
            txt += '<li class="active">';
          }
          txt += `${item.id} - ${item.task}<br /></li>\n`;
        });
        txt += '\n</ul>\n';
      }
      document.querySelector(`.${listClass}`).innerHTML = txt;
    }
  };
  initiateXHttp(xhttp, "taskList");
}

// Define a nameless arrow function that has the parameter obj that returns a promise as defined below.
// This promise wrappers an asynchronous XML request to the mySQL database. obj recognizes key value pairs of
// url, headers and body 
let request = obj => {
  return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.open("POST", obj.url);
      if (obj.headers) {
          Object.keys(obj.headers).forEach(key => {
              xhr.setRequestHeader(key, obj.headers[key]);
          });
      }
      xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
              resolve(xhr.response);
          } else {
              reject(xhr.statusText);
          }
      };
      xhr.onerror = () => reject(xhr.statusText);
      xhr.send(obj.body);
  });
};

request({url: "model/getData.php", body: "query=taskList", headers: {"Content-type": "application/x-www-form-urlencoded"}})
    .then(data => {
      // console.log(data);
      let res = JSON.parse(data);
      let txt = '<ul>\n';
      if (data.substring(0,5) === "DEBUG") {
        txt = res;
      } else {
        res.forEach(item => {
          if (item.done == "1") {
            txt += '<li class="done">';
          } else {
            txt += '<li class="active">';
          }
          txt += `${item.id} - ${item.task}<br /></li>\n`;
        });
        txt += '\n</ul>\n';
      }
      document.querySelector('.taskList').innerHTML = txt;
    })
    .catch(error => {
        console.log(error);
    });