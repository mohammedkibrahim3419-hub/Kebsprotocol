const express = require('express');
const { AppKit } = require('@circle-fin/app-kit');
const { EthersAdapter } = require('@circle-fin/adapter-ethers-v6');
const { ethers } = require('ethers');

const router = express.Router();

const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
function getKit() {
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const adapter = new EthersAdapter(signer);
  return new AppKit({ kitKey: process.env.KIT_KEY });
}

router.post('/swap', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;
    if (!tokenIn || !tokenOut || !amountIn)
      return res.status(400).json({ error: 'tokenIn, tokenOut, amountIn required' });
    const result = await kit.swap({
      from: { adapter, chain: 'Arc_Testnet' },
      tokenIn,
      tokenOut,
      amountIn: String(amountIn),
      config: { kitKey: process.env.KIT_KEY },
    });
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/bridge-kit', async (req, res) => {
  try {
    const { fromChain, toChain, amount } = req.body;
    if (!fromChain || !toChain || !amount)
      return res.status(400).json({ error: 'fromChain, toChain, amount required' });
    const result = await kit.bridge({
      from: { adapter, chain: fromChain },
      to:   { adapter, chain: toChain },
      amount: String(amount),
    });
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
