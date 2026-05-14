const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/server.js';
let c = fs.readFileSync(p, 'utf8');
const docsRoute = 'app.get("/docs", (req, res) => {\n  res.setHeader("Content-Type", "text/html");\n  res.sendFile(path.join(__dirname, "frontend", "docs.html"));\n});\n\n';
c = c.replace('app.get("/",', docsRoute + 'app.get("/",');
fs.writeFileSync(p, c);
console.log('Docs route added!');
