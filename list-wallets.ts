import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
const client = initiateDeveloperControlledWalletsClient({ apiKey: process.env.CIRCLE_API_KEY, entitySecret: process.env.CIRCLE_ENTITY_SECRET });
const wallets = await client.listWallets({ blockchain: 'ARC-TESTNET' });
console.log(JSON.stringify(wallets.data?.wallets?.map(w => ({ id: w.id, address: w.address })), null, 2));