const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const chatCard = `
<div class="card" style="grid-column:1/-1;">
  <h2>AI Agent Chat</h2>
  <div style="font-size:12px;color:#546e7a;margin-bottom:12px;">Ask the Kebs Protocol AI anything about DeFi, Arc Testnet, or your wallet</div>
  <div id="chatBox" style="background:#060d1a;border:1px solid #1e3a5f;border-radius:8px;padding:12px;height:250px;overflow-y:auto;margin-bottom:12px;font-size:12px;line-height:1.8;"></div>
  <div style="display:flex;gap:8px;">
    <input id="chatInput" placeholder="Ask anything... e.g. What is my USDC balance?" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:10px 14px;border-radius:8px;font-family:inherit;font-size:13px;flex:1;" onkeydown="if(event.key==='Enter')sendChat()"/>
    <button class="btn btn-start" onclick="sendChat()">Send</button>
    <button class="btn btn-refresh" onclick="clearChat()">Clear</button>
  </div>
  <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
    <button onclick="quickChat('What is my agent wallet balance?')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Balance?</button>
    <button onclick="quickChat('How do I bridge USDC to Sepolia?')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Bridge help</button>
    <button onclick="quickChat('Explain token staking rewards')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Staking?</button>
    <button onclick="quickChat('What is Kebs Protocol?')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">About Kebs</button>
    <button onclick="quickChat('How does cross-chain bridging work?')" style="background:#0d1530;border:1px solid #1e3a5f;color:#4fc3f7;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;font-family:inherit;">Cross-chain?</button>
  </div>
</div>`;

const chatJS = `
const chatMessages = [];

function appendMessage(role, text) {
  chatMessages.push({ role, text });
  const box = document.getElementById('chatBox');
  const color = role === 'user' ? '#81d4fa' : '#69f0ae';
  const label = role === 'user' ? 'You' : 'Kebs AI';
  box.innerHTML += '<div style="margin-bottom:10px;"><span style="color:' + color + ';font-weight:bold;">' + label + ':</span> <span style="color:#e0e6f0;">' + text + '</span></div>';
  box.scrollTop = box.scrollHeight;
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  appendMessage('user', msg);
  appendMessage('assistant', 'Thinking...');
  try {
    const r = await fetch('/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const d = await r.json();
    const box = document.getElementById('chatBox');
    const divs = box.querySelectorAll('div');
    divs[divs.length-1].innerHTML = '<span style="color:#69f0ae;font-weight:bold;">Kebs AI:</span> <span style="color:#e0e6f0;">' + (d.reply || d.error) + '</span>';
    box.scrollTop = box.scrollHeight;
  } catch(e) {
    appendMessage('assistant', 'Error: ' + e.message);
  }
}

function quickChat(msg) {
  document.getElementById('chatInput').value = msg;
  sendChat();
}

async function clearChat() {
  await fetch('/chat/history', { method: 'DELETE' });
  document.getElementById('chatBox').innerHTML = '';
  chatMessages.length = 0;
}

appendMessage('assistant', 'Hello! I am the Kebs Protocol AI agent. Ask me anything about DeFi, Arc Testnet, staking, bridging, or your wallet!');
`;

c = c.replace('<div class="card" style="grid-column:1/-1;"><h2>Live Price Charts</h2>', chatCard + '\n<div class="card" style="grid-column:1/-1;"><h2>Live Price Charts</h2>');
c = c.replace('</script>\n</body>', chatJS + '\n</script>\n</body>');
fs.writeFileSync(p, c);
console.log('Chat UI added!');
