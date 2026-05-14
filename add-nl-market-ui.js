const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const nlCard = `
<div class="card" style="grid-column:1/-1;">
  <h2>Natural Language Transactions</h2>
  <div style="font-size:12px;color:#546e7a;margin-bottom:12px;">Type what you want to do in plain English</div>
  <div style="display:flex;gap:8px;margin-bottom:8px;">
    <input id="nlInput" placeholder='e.g. "send 5 USDC to 0x..." or "stake 10 USDC"' style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:10px 14px;border-radius:8px;font-family:inherit;font-size:13px;flex:1;" onkeydown="if(event.key==='Enter')parseNL()"/>
    <button class="btn btn-refresh" onclick="parseNL()">Parse</button>
    <button class="btn btn-start" onclick="executeNL()">Execute</button>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
    <button onclick="nlQuick('send 5 USDC to 0x000')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Send USDC</button>
    <button onclick="nlQuick('stake 10 USDC')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Stake</button>
    <button onclick="nlQuick('claim my rewards')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Claim rewards</button>
    <button onclick="nlQuick('bridge 2 USDC to sepolia')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Bridge</button>
    <button onclick="nlQuick('invoice 20 USDC for design work')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Invoice</button>
  </div>
  <div id="nlParsed" style="background:#060d1a;border:1px solid #1e3a5f;border-radius:8px;padding:12px;font-size:12px;display:none;"></div>
  <div id="nlResult" style="margin-top:8px;font-size:12px;color:#69f0ae;"></div>
</div>`;

const marketCard = `
<div class="card" style="grid-column:1/-1;">
  <h2>Agent Marketplace</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
    <div style="flex:1;min-width:100px;background:#060d1a;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:11px;color:#546e7a;">Open Tasks</div><div style="font-size:20px;color:#69f0ae;font-weight:bold;" id="mktOpen">0</div></div>
    <div style="flex:1;min-width:100px;background:#060d1a;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:11px;color:#546e7a;">Completed</div><div style="font-size:20px;color:#4fc3f7;font-weight:bold;" id="mktDone">0</div></div>
    <div style="flex:1;min-width:100px;background:#060d1a;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:11px;color:#546e7a;">Total Rewards</div><div style="font-size:20px;color:#ffd54f;font-weight:bold;" id="mktRewards">0</div></div>
  </div>
  <div style="background:#060d1a;border:1px solid #1e3a5f;border-radius:8px;padding:12px;margin-bottom:12px;">
    <div style="font-size:12px;color:#4fc3f7;margin-bottom:8px;">Post a Task</div>
    <input id="mktTitle" placeholder="Task title" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;width:100%;margin-bottom:6px;"/>
    <input id="mktDesc" placeholder="Description" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;width:100%;margin-bottom:6px;"/>
    <div style="display:flex;gap:8px;">
      <input id="mktReward" placeholder="Reward USDC" type="number" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;flex:1;"/>
      <button class="btn btn-start" onclick="postTask()">Post</button>
    </div>
    <div id="mktPostResult" style="margin-top:6px;font-size:11px;color:#69f0ae;"></div>
  </div>
  <div id="mktTasks" style="max-height:400px;overflow-y:auto;"></div>
</div>`;

const nlJS = `
let nlParsedData = null;

async function parseNL() {
  const cmd = document.getElementById('nlInput').value.trim();
  if (!cmd) return;
  const addr = mmAddress || process.env.AGENT_WALLET_ADDRESS || '';
  document.getElementById('nlResult').textContent = 'Parsing...';
  try {
    const r = await fetch('/nl/parse', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ command: cmd, address: addr }) });
    nlParsedData = await r.json();
    const box = document.getElementById('nlParsed');
    box.style.display = 'block';
    if (nlParsedData.error) {
      box.innerHTML = '<span style="color:#ff8a80">Error: ' + nlParsedData.error + '</span>';
    } else {
      box.innerHTML =
        '<div style="color:#4fc3f7;margin-bottom:4px;">Parsed Command:</div>' +
        '<div style="color:#e0e6f0;">Action: <span style="color:#69f0ae">' + nlParsedData.action + '</span></div>' +
        (nlParsedData.amount ? '<div style="color:#e0e6f0;">Amount: <span style="color:#69f0ae">' + nlParsedData.amount + ' ' + (nlParsedData.token||'') + '</span></div>' : '') +
        (nlParsedData.recipient ? '<div style="color:#e0e6f0;">Recipient: <span style="color:#81d4fa">' + nlParsedData.recipient + '</span></div>' : '') +
        '<div style="color:#e0e6f0;">Confidence: <span style="color:' + (nlParsedData.confidence>70?'#69f0ae':'#ffd54f') + '">' + nlParsedData.confidence + '%</span></div>' +
        '<div style="color:#90a4ae;margin-top:4px;">' + (nlParsedData.humanReadable||'') + '</div>';
    }
    document.getElementById('nlResult').textContent = '';
  } catch(e) { document.getElementById('nlResult').textContent = 'Error: ' + e.message; }
}

async function executeNL() {
  const cmd = document.getElementById('nlInput').value.trim();
  if (!cmd) return;
  const addr = mmAddress || '';
  document.getElementById('nlResult').textContent = 'Executing...';
  try {
    const r = await fetch('/nl/execute', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ command: cmd, address: addr }) });
    const d = await r.json();
    document.getElementById('nlResult').textContent = d.success ? 'Success! ' + (d.result?.txHash ? 'TX: ' + d.result.txHash : JSON.stringify(d.result)) : 'Failed: ' + (d.error || d.result?.error);
  } catch(e) { document.getElementById('nlResult').textContent = 'Error: ' + e.message; }
}

function nlQuick(cmd) {
  document.getElementById('nlInput').value = cmd;
  parseNL();
}
`;

const marketJS = `
async function fetchMarket() {
  try {
    const r = await fetch('/marketplace/stats');
    const s = await r.json();
    document.getElementById('mktOpen').textContent = s.open || 0;
    document.getElementById('mktDone').textContent = s.completed || 0;
    document.getElementById('mktRewards').textContent = (s.totalRewards||0).toFixed(2);
    const r2 = await fetch('/marketplace/tasks');
    const tasks = await r2.json();
    const box = document.getElementById('mktTasks');
    if (!tasks.length) { box.innerHTML = '<div style="color:#546e7a;font-size:12px;padding:8px;">No tasks yet. Post the first one!</div>'; return; }
    box.innerHTML = tasks.map(t =>
      '<div style="border:1px solid #1e3a5f;border-radius:8px;padding:12px;margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
      '<span style="color:#4fc3f7;font-size:13px;font-weight:bold;">' + t.title + '</span>' +
      '<span style="color:' + (t.status==='open'?'#69f0ae':t.status==='completed'?'#4fc3f7':'#ffd54f') + ';font-size:11px;">' + t.status.toUpperCase() + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#90a4ae;margin-bottom:4px;">' + (t.description||'') + '</div>' +
      '<div style="font-size:13px;color:#ffd54f;font-weight:bold;margin-bottom:6px;">Reward: ' + t.reward + ' USDC</div>' +
      '<div style="font-size:10px;color:#37474f;">Posted by: ' + t.poster.slice(0,10) + '... | Bids: ' + (t.bids?.length||0) + '</div>' +
      (t.status==="open" && mmAddress ?
        '<div style="margin-top:8px;display:flex;gap:6px;">' +
        '<input id="bid-proposal-'+t.id+'" placeholder="Your proposal" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:6px;border-radius:6px;font-size:11px;flex:1;"/>' +
        '<input id="bid-price-'+t.id+'" placeholder="USDC" type="number" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:6px;border-radius:6px;font-size:11px;width:70px;"/>' +
        '<button class="btn btn-start" style="padding:4px 10px;font-size:11px;" onclick="submitBid(\''+t.id+'\')">Bid</button>' +
        '</div>' : '') +
      '</div>'
    ).join('');
  } catch(e) {}
}

async function postTask() {
  const title = document.getElementById('mktTitle').value.trim();
  const desc = document.getElementById('mktDesc').value.trim();
  const reward = document.getElementById('mktReward').value;
  const poster = mmAddress || 'kebs-agent-1';
  if (!title || !reward) { document.getElementById('mktPostResult').textContent = 'Fill title and reward'; return; }
  try {
    const r = await fetch('/marketplace/tasks', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ poster, title, description: desc, reward }) });
    const d = await r.json();
    document.getElementById('mktPostResult').textContent = d.id ? 'Task posted: ' + d.id : 'Error';
    document.getElementById('mktTitle').value = '';
    document.getElementById('mktDesc').value = '';
    document.getElementById('mktReward').value = '';
    fetchMarket();
  } catch(e) { document.getElementById('mktPostResult').textContent = 'Error: ' + e.message; }
}

async function submitBid(taskId) {
  const proposal = document.getElementById('bid-proposal-'+taskId)?.value;
  const price = document.getElementById('bid-price-'+taskId)?.value;
  const bidder = mmAddress;
  if (!bidder) { alert('Connect MetaMask first!'); return; }
  if (!proposal || !price) { alert('Fill proposal and price'); return; }
  try {
    const r = await fetch('/marketplace/tasks/'+taskId+'/bid', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ bidder, proposal, price }) });
    const d = await r.json();
    if (d.success) { alert('Bid submitted!'); fetchMarket(); }
    else alert('Error: ' + d.error);
  } catch(e) { alert('Error: ' + e.message); }
}

fetchMarket();
setInterval(fetchMarket, 30000);
`;

c = c.replace('<div class="card" style="grid-column:1/-1;"><h2>AI Agent Chat</h2>', nlCard + '\n' + marketCard + '\n<div class="card" style="grid-column:1/-1;"><h2>AI Agent Chat</h2>');
c = c.replace('</script>\n</body>', nlJS + '\n' + marketJS + '\n</script>\n</body>');
fs.writeFileSync(p, c);
console.log('NL + Marketplace UI added!');
