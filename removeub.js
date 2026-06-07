const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(/const \{ UnifiedBalanceKit \} = require\('@circle-fin\/unified-balance-kit'\);[\s\S]*?}\);\n/g, '');
fs.writeFileSync('server.js', code);
console.log('Done');
