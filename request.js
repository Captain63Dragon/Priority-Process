// Define a nameless arrow function that has the parameter obj that returns a promise as defined below.
// This promise wrappers an asynchronous XML request to the mySQL database. obj recognizes key value pairs of
// url, headers and body 
export let request = obj => {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", obj.url); // open as POST protocol with url passed in via the obj parameter
    if (obj.headers) { // headers is an optional parameter. Defaults used if not present.
      Object.keys(obj.headers).forEach(key => {
        xhr.setRequestHeader(key, obj.headers[key]);
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      }
      else {
        reject(xhr.statusText);
      }
    };
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send(obj.body); // This is the activation configuration. Body is also configured by the caller via obj. Caller activates this object.
  });
};

export function waitms(ms) {
  var start = new Date().getTime();
  var end  = start; 
  while (end < start + ms) {
    end = new Date().getTime();
  }
  return (`Done waiting ${ms} milliseconds`);
}
