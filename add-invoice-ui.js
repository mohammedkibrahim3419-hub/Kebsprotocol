const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const invoiceCard = `
<div class="card" style="grid-column:1/-1;">
  <h2>Invoices</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
    <div class="stat" style="flex:1;min-width:100px;"><span>Total</span><span class="val" id="invTotal">0</span></div>
    <div class="stat" style="flex:1;min-width:100px;"><span>Paid</span><span class="val" id="invPaid">0</span></div>
    <div class="stat" style="flex:1;min-width:100px;"><span>Pending</span><span class="val" id="invPending">0</span></div>
    <div class="stat" style="flex:1;min-width:100px;"><span>Volume</span><span class="val" id="invVolume">0 USDC</span></div>
  </div>
  <div style="margin:12px 0;padding:12px;background:#060d1a;border-radius:8px;">
    <div style="font-size:12px;color:#4fc3f7;margin-bottom:8px;">Create Invoice</div>
    <input id="invTo" placeholder="Bill to (address)" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;width:100%;margin-bottom:6px;"/>
    <input id="invAmount" placeholder="Amount USDC" type="number" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;width:100%;margin-bottom:6px;"/>
    <input id="invDesc" placeholder="Description" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;width:100%;margin-bottom:6px;"/>
    <input id="invDue" placeholder="Due date (optional)" type="date" style="background:#0a0f1e;border:1px solid #1e3a5f;color:#e0e6f0;padding:8px;border-radius:8px;font-size:12px;width:100%;margin-bottom:6px;"/>
    <button class="btn btn-start" onclick="createInvoice()">Create Invoice</button>
    <button class="btn btn-refresh" onclick="if(mmAddress)document.getElementById('invTo').value=mmAddress;">My Address</button>
    <div id="invResult" style="margin-top:6px;font-size:11px;color:#69f0ae;"></div>
  </div>
  <div id="invList" style="max-height:300px;overflow-y:auto;"></div>
</div>`;

const invoiceJS = `
async function fetchInvoices() {
  try {
    const r = await fetch('/invoices/stats');
    const s = await r.json();
    document.getElementById('invTotal').textContent = s.total;
    document.getElementById('invPaid').textContent = s.paid;
    document.getElementById('invPending').textContent = s.pending;
    document.getElementById('invVolume').textContent = (s.totalValue||0).toFixed(2) + ' USDC';
    const addr = mmAddress || '';
    const url = addr ? '/invoices?address=' + addr : '/invoices';
    const r2 = await fetch(url);
    const invs = await r2.json();
    const list = document.getElementById('invList');
    if (!invs.length) { list.innerHTML = '<div style="color:#546e7a;font-size:12px;padding:8px;">No invoices yet</div>'; return; }
    list.innerHTML = invs.map(inv => 
      '<div style="border:1px solid #1e3a5f;border-radius:8px;padding:10px;margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
      '<span style="color:#4fc3f7;font-size:12px;">' + inv.id + '</span>' +
      '<span style="color:' + (inv.status==='paid'?'#69f0ae':inv.status==='cancelled'?'#ff8a80':'#ffd54f') + ';font-size:11px;">' + inv.status.toUpperCase() + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#81d4fa;">' + inv.description + '</div>' +
      '<div style="font-size:12px;color:#e0e6f0;margin:4px 0;">' + inv.amount + ' USDC</div>' +
      '<div style="font-size:10px;color:#546e7a;">To: ' + inv.to.slice(0,10) + '...</div>' +
      (inv.status==='pending' ? 
        '<div style="display:flex;gap:6px;margin-top:6px;">' +
        '<button class="btn btn-start" style="padding:4px 8px;font-size:10px;" onclick="payInvoice(\''+inv.id+'\')">Mark Paid</button>' +
        '<button class="btn btn-stop" style="padding:4px 8px;font-size:10px;" onclick="cancelInvoice(\''+inv.id+'\')">Cancel</button>' +
        '</div>' : '') +
      (inv.txHash ? '<div style="font-size:9px;color:#37474f;word-break:break-all;">TX: '+inv.txHash+'</div>' : '') +
      '</div>'
    ).join('');
  } catch(e) {}
}

async function createInvoice() {
  const to = document.getElementById('invTo').value;
  const amount = document.getElementById('invAmount').value;
  const desc = document.getElementById('invDesc').value;
  const due = document.getElementById('invDue').value;
  const result = document.getElementById('invResult');
  if (!to || !amount || !desc) { result.textContent = 'Fill in all required fields'; return; }
  const from = mmAddress || 'kebs-agent-1';
  try {
    const r = await fetch('/invoices/create', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ from, to, amount, description: desc, dueDate: due }) });
    const d = await r.json();
    result.textContent = 'Invoice created: ' + d.id;
    fetchInvoices();
  } catch(e) { result.textContent = 'Error: ' + e.message; }
}

async function payInvoice(id) {
  const r = await fetch('/invoices/pay/' + id, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({}) });
  const d = await r.json();
  if (d.success) fetchInvoices();
}

async function cancelInvoice(id) {
  const r = await fetch('/invoices/cancel/' + id, { method:'POST' });
  const d = await r.json();
  if (d.success) fetchInvoices();
}

fetchInvoices();
setInterval(fetchInvoices, 20000);
`;

c = c.replace('<div class="card" style="grid-column:1/-1;"><h2>Cross-Chain Bridge</h2>', invoiceCard + '\n<div class="card" style="grid-column:1/-1;"><h2>Cross-Chain Bridge</h2>');
c = c.replace('</script>\n</body>', invoiceJS + '\n</script>\n</body>');
fs.writeFileSync(p, c);
console.log('Invoice UI added!');
