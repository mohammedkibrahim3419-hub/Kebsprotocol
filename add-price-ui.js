const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const priceCard = `
<div class="card" style="grid-column:1/-1;">
  <h2>Live Price Charts</h2>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
    <div style="flex:1;min-width:120px;background:#060d1a;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:11px;color:#546e7a;">USDC</div>
      <div style="font-size:18px;color:#69f0ae;font-weight:bold;" id="priceUsdc">-</div>
      <div style="font-size:11px;" id="changeUsdc">-</div>
    </div>
    <div style="flex:1;min-width:120px;background:#060d1a;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:11px;color:#546e7a;">ETH</div>
      <div style="font-size:18px;color:#4fc3f7;font-weight:bold;" id="priceEth">-</div>
      <div style="font-size:11px;" id="changeEth">-</div>
    </div>
    <div style="flex:1;min-width:120px;background:#060d1a;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:11px;color:#546e7a;">BTC</div>
      <div style="font-size:18px;color:#ffd54f;font-weight:bold;" id="priceBtc">-</div>
      <div style="font-size:11px;" id="changeBtc">-</div>
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-bottom:8px;">
    <button class="btn btn-refresh" onclick="showChart('eth')" id="btnEth">ETH</button>
    <button class="btn btn-refresh" onclick="showChart('btc')" id="btnBtc">BTC</button>
    <button class="btn btn-refresh" onclick="showChart('usdc')" id="btnUsdc">USDC</button>
  </div>
  <canvas id="priceChart" style="width:100%;max-height:200px;"></canvas>
  <div style="font-size:10px;color:#37474f;margin-top:4px;">Updates every 60 seconds via CoinGecko</div>
</div>`;

const priceJS = `
let priceChartInstance = null;
let currentCoin = 'eth';

async function fetchPriceData() {
  try {
    const r = await fetch('/prices');
    const d = await r.json();
    const { latest } = d;
    if (latest.usdc) {
      document.getElementById('priceUsdc').textContent = '$' + (latest.usdc.price||0).toFixed(4);
      const c = latest.usdc.change||0;
      document.getElementById('changeUsdc').textContent = (c>=0?'+':'')+c.toFixed(2)+'%';
      document.getElementById('changeUsdc').style.color = c>=0?'#69f0ae':'#ff8a80';
    }
    if (latest.eth) {
      document.getElementById('priceEth').textContent = '$' + (latest.eth.price||0).toLocaleString();
      const c = latest.eth.change||0;
      document.getElementById('changeEth').textContent = (c>=0?'+':'')+c.toFixed(2)+'%';
      document.getElementById('changeEth').style.color = c>=0?'#69f0ae':'#ff8a80';
    }
    if (latest.btc) {
      document.getElementById('priceBtc').textContent = '$' + (latest.btc.price||0).toLocaleString();
      const c = latest.btc.change||0;
      document.getElementById('changeBtc').textContent = (c>=0?'+':'')+c.toFixed(2)+'%';
      document.getElementById('changeBtc').style.color = c>=0?'#69f0ae':'#ff8a80';
    }
    updateChart(d.history);
  } catch(e) {}
}

function updateChart(history) {
  const data = history[currentCoin] || [];
  if (!data.length) return;
  const labels = data.map(d => d.time.slice(11,16));
  const prices = data.map(d => d.price);
  const colors = { eth: '#4fc3f7', btc: '#ffd54f', usdc: '#69f0ae' };
  const color = colors[currentCoin] || '#4fc3f7';
  const ctx = document.getElementById('priceChart').getContext('2d');
  if (priceChartInstance) priceChartInstance.destroy();
  priceChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: currentCoin.toUpperCase() + ' Price (USD)',
        data: prices,
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: 2,
        pointRadius: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#e0e6f0', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#546e7a', font: { size: 10 } }, grid: { color: '#0f2040' } },
        y: { ticks: { color: '#546e7a', font: { size: 10 } }, grid: { color: '#0f2040' } }
      }
    }
  });
}

function showChart(coin) {
  currentCoin = coin;
  fetchPriceData();
}

fetchPriceData();
setInterval(fetchPriceData, 60000);
`;

c = c.replace('<script src="https://cdn.ethers.io', '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n<script src="https://cdn.ethers.io');
c = c.replace('<div class="card" style="grid-column:1/-1;"><h2>Invoices</h2>', priceCard + '\n<div class="card" style="grid-column:1/-1;"><h2>Invoices</h2>');
c = c.replace('</script>\n</body>', priceJS + '\n</script>\n</body>');
fs.writeFileSync(p, c);
console.log('Price chart UI added!');
