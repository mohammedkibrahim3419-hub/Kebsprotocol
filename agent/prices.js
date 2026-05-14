const https = require("https");

const priceHistory = {
  usdc: [],
  eth: [],
  btc: []
};

function fetchPrice(coinId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    https.get(url, { headers: { "Accept": "application/json" } }, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on("error", reject);
  });
}

async function updatePrices() {
  try {
    const [usdcData, ethData, btcData] = await Promise.all([
      fetchPrice("usd-coin"),
      fetchPrice("ethereum"),
      fetchPrice("bitcoin")
    ]);

    const time = new Date().toISOString();

    if (usdcData["usd-coin"]) {
      priceHistory.usdc.push({ time, price: usdcData["usd-coin"].usd, change: usdcData["usd-coin"].usd_24h_change });
      if (priceHistory.usdc.length > 100) priceHistory.usdc.shift();
    }
    if (ethData.ethereum) {
      priceHistory.eth.push({ time, price: ethData.ethereum.usd, change: ethData.ethereum.usd_24h_change });
      if (priceHistory.eth.length > 100) priceHistory.eth.shift();
    }
    if (btcData.bitcoin) {
      priceHistory.btc.push({ time, price: btcData.bitcoin.usd, change: btcData.bitcoin.usd_24h_change });
      if (priceHistory.btc.length > 100) priceHistory.btc.shift();
    }

    console.log("[PRICES] Updated:", new Date().toLocaleTimeString());
  } catch(e) {
    console.error("[PRICES] Error:", e.message);
  }
}

function getPrices() {
  const latest = {
    usdc: priceHistory.usdc[priceHistory.usdc.length - 1] || null,
    eth: priceHistory.eth[priceHistory.eth.length - 1] || null,
    btc: priceHistory.btc[priceHistory.btc.length - 1] || null
  };
  return { latest, history: priceHistory };
}

// Update every 60 seconds
updatePrices();
setInterval(updatePrices, 60000);

module.exports = { getPrices, updatePrices };
