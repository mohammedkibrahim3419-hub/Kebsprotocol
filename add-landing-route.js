const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/server.js';
let c = fs.readFileSync(p, 'utf8');
const routes = 'app.get("/landing", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","landing.html")); });\napp.get("/dashboard", (req, res) => { res.setHeader("Content-Type","text/html"); res.sendFile(require("path").join(__dirname,"frontend","index.html")); });\n\n';
c = c.replace('app.get("/docs"', routes + 'app.get("/docs"');
fs.writeFileSync(p, c);
console.log('Landing routes added!');
