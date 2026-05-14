require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL,
  5042002,
  { staticNetwork: true }
);

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)"
];

const KNOWN_TOKENS = [
  { address: "0x3600000000000000000000000000000000000000", symbol: "USDC", name: "USD Coin" },
  { address: "0x89b50855aa3be2f677cd6303cec089b5f319d72a", symbol: "EURC", name: "Euro Coin" }
];

async function getTokenBalance(walletAddress, tokenAddress) {
  try {
    const contract = new ethers.Contract(tokenAddress.toLowerCase(), ERC20_ABI, provider);
    const [balance, decimals, symbol, name] = await Promise.all([
      contract.balanceOf(walletAddress.toLowerCase()),
      contract.decimals(),
      contract.symbol(),
      contract.name()
    ]);
    return {
      address: tokenAddress.toLowerCase(),
      symbol,
      name,
      balance: ethers.formatUnits(balance, decimals),
      decimals: Number(decimals)
    };
  } catch(e) {
    return null;
  }
}

async function getPortfolio(walletAddress) {
  if (!walletAddress) throw new Error("No wallet address provided");
  const addr = walletAddress.toLowerCase();

  const native = await provider.getBalance(addr);
  const nativeBalance = {
    symbol: "ARC",
    name: "Arc Native",
    balance: ethers.formatEther(native),
    address: "native",
    decimals: 18
  };

  const tokenBalances = await Promise.all(
    KNOWN_TOKENS.map(t => getTokenBalance(addr, t.address))
  );

  const tokens = [nativeBalance, ...tokenBalances.filter(t => t !== null)];
  const totalUSDC = parseFloat(tokenBalances.find(t => t?.symbol === "USDC")?.balance || 0);

  return {
    address: addr,
    tokens,
    totalUSDC,
    timestamp: new Date().toISOString()
  };
}

async function addCustomToken(walletAddress, tokenAddress) {
  const token = await getTokenBalance(walletAddress, tokenAddress);
  if (!token) throw new Error("Could not fetch token");
  const exists = KNOWN_TOKENS.find(t => t.address.toLowerCase() === tokenAddress.toLowerCase());
  if (!exists) KNOWN_TOKENS.push({ address: tokenAddress.toLowerCase(), symbol: token.symbol, name: token.name });
  return token;
}

function getKnownTokens() { return KNOWN_TOKENS; }

module.exports = { getPortfolio, addCustomToken, getKnownTokens };
