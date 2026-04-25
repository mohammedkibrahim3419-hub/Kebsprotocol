import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';
dotenv.config();

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY as string,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET as string,
});

const CONTRACT = process.env.CONTRACT_ADDRESS as string;
const WALLET_ID = process.env.WALLET_ID as string;

async function main() {
  const wallets = await client.listWallets({ blockchain: 'ARC-TESTNET' });
  const wallet = wallets.data?.wallets?.[0];
  console.log('Wallet:', wallet?.address);

  console.log('Sending payment...');
  const tx = await client.createContractExecutionTransaction({
    walletId: WALLET_ID,
    contractAddress: CONTRACT,
    abiFunctionSignature: 'transfer(address,uint256)',
    abiParameters: [wallet?.address as string, '100'],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  console.log('Payment TX:', tx.data?.id);
  console.log('Explorer: https://testnet.arcscan.app/tx/' + tx.data?.id);
}

main().catch(console.error);
