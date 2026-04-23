import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

const client = initiateDeveloperControlledWalletsClient({ apiKey: process.env.CIRCLE_API_KEY, entitySecret: process.env.CIRCLE_ENTITY_SECRET });

const tx = await client.createContractExecutionTransaction({
  walletId: process.env.OWNER_WALLET_ID,
  contractAddress: '0x0000000000000000000000000000000000008004',
  abiFunctionSignature: 'registerAgent(string)',
  abiParameters: ['https://ipfs.io/ipfs/QmExampleAgentMetadata'],
  fee: { type: 'EIP1559', maxFee: '0.001', maxPriorityFee: '0.001' },
});

console.log('Agent registered! TX:', tx.data?.id);