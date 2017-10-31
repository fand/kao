const fs = require('fs');
const path = require('path');
const got = require('got');

got('https://raw.githubusercontent.com/tiwanari/emoticon/master/emoticon.txt')
  .then(r => r.body)
  .then(body => fs.writeFileSync(path.resolve(__dirname, 'emoticon.txt'), body, 'utf8'))
  .then(() => console.log('Updated emoticon.txt'))
  .catch(console.error);
