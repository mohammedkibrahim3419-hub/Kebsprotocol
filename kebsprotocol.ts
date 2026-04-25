import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import dotenv from 'dotenv';
dotenv.config();

const client = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY as string,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET as string,
});

const CONTRACT = process.env.CONTRACT_ADDRESS as string;
const WALLET_ID = process.env.WALLET_ID as string;

// ✅ Mint Token
async function mintToken(toAddress: string, amount: string) {
  console.log('Minting KebsToken...');
  const tx = await client.createContractExecutionTransaction({
    walletId: WALLET_ID,
    contractAddress: CONTRACT,
    abiFunctionSignature: 'mint(address,uint256)',
    abiParameters: [toAddress, amount],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  console.log('Mint Token TX:', tx.data?.id);
  console.log('Explorer: https://testnet.arcscan.app/tx/' + tx.data?.id);
}

// ✅ Mint NFT
async function mintNFT(toAddress: string, tokenURI: string) {
  console.log('Minting KebsNFT...');
  const tx = await client.createContractExecutionTransaction({
    walletId: WALLET_ID,
    contractAddress: CONTRACT,
    abiFunctionSignature: 'safeMint(address,string)',
    abiParameters: [toAddress, tokenURI],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  console.log('Mint NFT TX:', tx.data?.id);
  console.log('Explorer: https://testnet.arcscan.app/tx/' + tx.data?.id);
}

// ✅ Send Payment
async function sendPayment(toAddress: string, amount: string) {
  console.log('Sending payment...');
  const tx = await client.createContractExecutionTransaction({
    walletId: WALLET_ID,
    contractAddress: CONTRACT,
    abiFunctionSignature: 'transfer(address,uint256)',
    abiParameters: [toAddress, amount],
    fee: { type: 'level', config: { feeLevel: 'MEDIUM' } },
  });
  console.log('Payment TX:', tx.data?.id);
  console.log('Explorer: https://testnet.arcscan.app/tx/' + tx.data?.id);
}

// ✅ Main
async function main() {
  const wallets = await client.listWallets({ blockchain: 'ARC-TESTNET' });
  const wallet = wallets.data?.wallets?.[0];
  console.log('Wallet:', wallet?.address);

  await mintToken(wallet?.address as string, '1000000000000000000');
  await mintNFT(wallet?.address as string, 'ipfs://kebsprotocol-nft-metadata');
  await sendPayment(wallet?.address as string, '100000000000000000');
}

main().catch(console.error);
