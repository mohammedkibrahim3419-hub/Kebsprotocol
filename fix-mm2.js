const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const mmScript = `
async function connectMM() {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask not found! Open this page inside MetaMask browser.');
    return;
  }
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    await loadMMAccount();
  } catch(e) {
    alert('Failed: ' + e.message);
  }
}

async function loadMMAccount() {
  if (typeof window.ethereum === 'undefined') return;
  const accounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (!accounts || accounts.length === 0) return;
  mmAddress = accounts[0];
  mmProvider = new ethers.providers.Web3Provider(window.ethereum);
  mmSigner = mmProvider.getSigner();
  showMMConnected();
}

async function showMMConnected() {
  document.getElementById('mmOff').style.display = 'none';
  document.getElementById('mmOn').style.display = 'block';
  document.getElementById('mmAddr').textContent = mmAddress.slice(0,8)+'...'+mmAddress.slice(-6);
  try {
    const net = await mmProvider.getNetwork();
    document.getElementById('mmNet').textContent = 'Chain ' + net.chainId;
  } catch(e) {}
  try {
    const bal = await mmProvider.getBalance(mmAddress);
    document.getElementById('mmBal').textContent = parseFloat(ethers.utils.formatEther(bal)).toFixed(4) + ' ETH';
  } catch(e) {}
  fetchStaking();
  fetchInvoices();
}

function disconnectMM() {
  mmAddress = null;
  mmProvider = null;
  mmSigner = null;
  document.getElementById('mmOff').style.display = 'block';
  document.getElementById('mmOn').style.display = 'none';
}

async function addArc() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x13A4292',
        chainName: 'Arc Testnet',
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: ['https://rpc.testnet.arc.network'],
        blockExplorerUrls: ['https://testnet.arcscan.app']
      }]
    });
  } catch(e) { alert('Error: ' + e.message); }
}

function toggleSend() {
  const f = document.getElementById('sendForm');
  f.style.display = f.style.display === 'none' ? 'block' : 'none';
}

async function sendUSDC() {
  const to = document.getElementById('sendTo').value;
  const amt = document.getElementById('sendAmt').value;
  if (!to || !amt) { document.getElementById('sendResult').textContent = 'Fill all fields'; return; }
  try {
    const usdc = new ethers.Contract(
      '0x3600000000000000000000000000000000000000',
      ['function transfer(address,uint256) returns(bool)', 'function decimals() view returns(uint8)'],
      mmSigner
    );
    const dec = await usdc.decimals();
    const tx = await usdc.transfer(to, ethers.utils.parseUnits(amt, dec));
    document.getElementById('sendResult').textContent = 'Waiting...';
    await tx.wait();
    document.getElementById('sendResult').textContent = 'Sent! TX: ' + tx.hash;
  } catch(e) { document.getElementById('sendResult').textContent = 'Error: ' + e.message; }
}

// Auto connect on load
window.addEventListener('load', async () => {
  if (typeof window.ethereum !== 'undefined') {
    await loadMMAccount();
    window.ethereum.on('accountsChanged', async (accounts) => {
      if (accounts.length > 0) { mmAddress = accounts[0]; await showMMConnected(); }
      else disconnectMM();
    });
    window.ethereum.on('chainChanged', () => window.location.reload());
  }
});
`;

// Replace old MM functions
const start = c.indexOf('// MetaMask');
const end = c.indexOf('// Agent', start);
if (start !== -1 && end !== -1) {
  c = c.slice(0, start) + mmScript + '\n' + c.slice(end);
  fs.writeFileSync(p, c);
  console.log('MetaMask fixed!');
} else {
  console.log('Could not find MM section - start:', start, 'end:', end);
}
