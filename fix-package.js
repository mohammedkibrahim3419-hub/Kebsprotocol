const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json'));
p.scripts = { start: 'node server.js', build: 'npm install' };
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
console.log('Done!');
