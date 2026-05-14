const { ethers } = require("ethers");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL,
  1244,
  { staticNetwork: true }
);

function getWallet() {
  if (!process.env.AGENT_PRIVATE_KEY) throw new Error("AGENT_PRIVATE_KEY not set");
  return new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
}

async function getBalances() {
  const wallet = getWallet();
  const address = wallet.address.toLowerCase();
  const native = await provider.getBalance(address);
  let usdcBalance = "0";
  if (process.env.USDC_CONTRACT_ADDRESS) {
    const abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
    const usdc = new ethers.Contract(process.env.USDC_CONTRACT_ADDRESS.toLowerCase(), abi, provider);
    const [bal, dec] = await Promise.all([usdc.balanceOf(address), usdc.decimals()]);
    usdcBalance = ethers.formatUnits(bal, dec);
  }
  return { address, native: ethers.formatEther(native), usdc: usdcBalance, timestamp: new Date().toISOString() };
}

module.exports = { getWallet, getBalances, provider };
