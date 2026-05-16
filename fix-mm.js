const fs = require('fs');
const p = process.env.HOME + '/kebs-protocol/frontend/index.html';
let c = fs.readFileSync(p, 'utf8');

const newMM = `
// MetaMask
async function connectMM() {
  if (!window.ethereum) { alert('MetaMask not found!'); return; }
  try {
    const accounts = await window.ethereum.request({ method:'eth_requestAccounts' });
    mmAddress = accounts[0];
    mmProvider = new ethers.providers.Web3Provider(window.ethereum);
    mmSigner = mmProvider.getSigner();
    await updateMM();
    window.ethereum.on('accountsChanged', async a => { mmAddress=a[0]||null; if(mmAddress)await updateMM(); else disconnectMM(); });
    window.ethereum.on('chainChanged', async () => { mmProvider=new ethers.providers.Web3Provider(window.ethereum); mmSigner=mmProvider.getSigner(); await updateMM(); });
  } catch(e) { alert('Connection failed: '+e.message); }
}

async function updateMM() {
  if (!mmAddress) return;
  document.getElementById('mmOff').style.display='none';
  document.getElementById('mmOn').style.display='block';
  document.getElementById('mmAddr').textContent=mmAddress.slice(0,8)+'...'+mmAddress.slice(-6);
  try {
    const net=await mmProvider.getNetwork();
    document.getElementById('mmNet').textContent=net.name+'('+net.chainId+')';
    const bal=await mmProvider.getBalance(mmAddress);
    document.getElementById('mmBal').textContent=parseFloat(ethers.utils.formatEther(bal)).toFixed(4)+' ETH';
  } catch(e) {}
  fetchStaking();
  fetchInvoices();
}`;

c = c.replace('// MetaMask\nasync function connectMM() {', '// MetaMask_OLD\nasync function connectMM_OLD() {');
c = c.replace('async function updateMM() {', 'async function updateMM_OLD_2() {');
c = c + '\n<script>' + newMM + '\n// Auto check if already connected\nwindow.addEventListener("load", async () => { if(window.ethereum){ const accounts = await window.ethereum.request({method:"eth_accounts"}); if(accounts.length>0){ mmAddress=accounts[0]; mmProvider=new ethers.providers.Web3Provider(window.ethereum); mmSigner=mmProvider.getSigner(); await updateMM(); }} });\n</script>';

fs.writeFileSync(p, c);
console.log('Done!');
