const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const portfolioCard = `
<div class="card" style="grid-column:1/-1;">
  <h2>Portfolio Tracker</h2>
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
    <input id="portfolioAddr" placeholder="Wallet address (0x...)" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px 12px;border-radius:8px;font-size:12px;flex:1;"/>
    <button class="btn btn-start" onclick="fetchPortfolio()">Track</button>
    <button class="btn btn-refresh" onclick="trackMyWallet()">My Wallet</button>
    <button class="btn btn-refresh" onclick="trackAgentWallet()">Agent</button>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
    <input id="customToken" placeholder="Add custom token address" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px 12px;border-radius:8px;font-size:12px;flex:1;"/>
    <button class="btn btn-refresh" onclick="addToken()">Add Token</button>
  </div>
  <div id="portfolioResult" style="font-size:11px;color:#69f0ae;margin-bottom:8px;"></div>
  <div id="portfolioList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;"></div>
  <div style="margin-top:8px;font-size:10px;color:#37474f;" id="portfolioTime"></div>
</div>`;

const portfolioJS = `
async function fetchPortfolio() {
  const addr = document.getElementById('portfolioAddr').value.trim();
  if (!addr) { document.getElementById('portfolioResult').textContent = 'Enter a wallet address'; return; }
  document.getElementById('portfolioResult').textContent = 'Loading...';
  try {
    const r = await fetch('/portfolio/' + addr);
    const d = await r.json();
    if (d.error) { document.getElementById('portfolioResult').textContent = 'Error: ' + d.error; return; }
    renderPortfolio(d);
  } catch(e) { document.getElementById('portfolioResult').textContent = 'Error: ' + e.message; }
}

function renderPortfolio(data) {
  document.getElementById('portfolioResult').textContent = '';
  document.getElementById('portfolioTime').textContent = 'Updated: ' + new Date(data.timestamp).toLocaleTimeString();
  const list = document.getElementById('portfolioList');
  list.innerHTML = data.tokens.map(t => {
    const bal = parseFloat(t.balance);
    const color = bal > 0 ? '#69f0ae' : '#546e7a';
    return '<div style="background:#060d1a;border:1px solid #1e3a5f;border-radius:8px;padding:12px;text-align:center;">' +
      '<div style="font-size:13px;color:#4fc3f7;font-weight:bold;">' + t.symbol + '</div>' +
      '<div style="font-size:11px;color:#546e7a;margin:2px 0;">' + t.name + '</div>' +
      '<div style="font-size:16px;color:' + color + ';font-weight:bold;">' + bal.toFixed(4) + '</div>' +
      '</div>';
  }).join('');
}

function trackMyWallet() {
  if (mmAddress) {
    document.getElementById('portfolioAddr').value = mmAddress;
    fetchPortfolio();
  } else {
    alert('Connect MetaMask first!');
  }
}

async function trackAgentWallet() {
  try {
    const r = await fetch('/portfolio');
    const d = await r.json();
    if (d.error) { document.getElementById('portfolioResult').textContent = 'Error: ' + d.error; return; }
    document.getElementById('portfolioAddr').value = d.address;
    renderPortfolio(d);
  } catch(e) { document.getElementById('portfolioResult').textContent = 'Error: ' + e.message; }
}

async function addToken() {
  const addr = document.getElementById('portfolioAddr').value.trim();
  const token = document.getElementById('customToken').value.trim();
  if (!addr || !token) { document.getElementById('portfolioResult').textContent = 'Enter wallet and token address'; return; }
  try {
    const r = await fetch('/portfolio/token', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ address: addr, tokenAddress: token }) });
    const d = await r.json();
    document.getElementById('portfolioResult').textContent = d.error ? 'Error: ' + d.error : 'Token added: ' + d.symbol;
    document.getElementById('customToken').value = '';
    fetchPortfolio();
  } catch(e) { document.getElementById('portfolioResult').textContent = 'Error: ' + e.message; }
}

trackAgentWallet();
`;

c = c.replace('<div class="card" style="grid-column:1/-1;"><h2>AI Agent Chat</h2>', portfolioCard + '\n<div class="card" style="grid-column:1/-1;"><h2>AI Agent Chat</h2>');
c = c.replace('</script>\n</body>', portfolioJS + '\n</script>\n</body>');
fs.writeFileSync(p, c);
console.log('Portfolio UI added!');
