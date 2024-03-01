const fetch = require('node-fetch');

fetch('http://127.0.0.1:5000/query', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'Your question here'
  })
})
.then(response => response.json())
.then(data => {
  console.log(data.response);
})
.catch(error => {
  console.error(error);
});