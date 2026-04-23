import { registerEntitySecretCiphertext } from '@circle-fin/developer-controlled-wallets';
const response = await registerEntitySecretCiphertext({
  apiKey: process.env.CIRCLE_API_KEY,
  entitySecret: 'b8f53797c9d1b449a6a27f41993db000e4a6e33fe7ca82dc41e589cf2ec144b1',
  recoveryFileDownloadPath: './',
});
console.log('Done!', response.data);