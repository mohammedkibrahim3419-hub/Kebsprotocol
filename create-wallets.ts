import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET,
});

const walletSet = await client.createWalletSet({ name: 'Agent Wallets' });
console.log('Wallet Set ID:', walletSet.data?.walletSet?.id);

const wallets = await client.createWallets({
  blockchains: ['ARC-TESTNET'],
  count: 2,
  walletSetId: walletSet.data?.walletSet?.id ?? '',
});

wallets.data?.wallets?.forEach((w, i) => {
  console.log('Wallet', i+1, ':', w.address);
});
