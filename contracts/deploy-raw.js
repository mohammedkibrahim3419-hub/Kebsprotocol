require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { ethers } = require("ethers");
const solc = require("solc");
const fs = require("fs");
const path = require("path");

async function deploy() {
  const source = fs.readFileSync(path.join(__dirname, "KebsRegistry.sol"), "utf8");
  const input = {
    language: "Solidity",
    sources: { "KebsRegistry.sol": { content: source } },
    settings: { outputSelection: { "*": { "*": ["abi", "evm.bytecode"] } } }
  };
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const contract = output.contracts["KebsRegistry.sol"]["KebsRegistry"];
  const bytecode = "0x" + contract.evm.bytecode.object;
  const abi = contract.abi;

  const provider = new ethers.JsonRpcProvider("https://rpc.testnet.arc.network", 5042002, { staticNetwork: true });
  const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider);
  
  console.log("Deployer:", wallet.address);
  console.log("Bytecode size:", bytecode.length / 2, "bytes");

  const nonce = await provider.getTransactionCount(wallet.address);
  const feeData = await provider.getFeeData();

  const tx = {
    nonce,
    gasLimit: 500000,
    gasPrice: feeData.gasPrice,
    data: bytecode,
    chainId: 5042002
  };

  console.log("Signing transaction...");
  const signed = await wallet.signTransaction(tx);
  console.log("Sending raw transaction...");
  const response = await provider.broadcastTransaction(signed);
  console.log("TX hash:", response.hash);
  console.log("Waiting...");
  const receipt = await response.wait();
  console.log("Deployed at:", receipt.contractAddress);

  fs.writeFileSync(path.join(__dirname, "KebsRegistry.abi.json"), JSON.stringify(abi, null, 2));
  console.log("ABI saved.");
}

deploy().catch(console.error);
