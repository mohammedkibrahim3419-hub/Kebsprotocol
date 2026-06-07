const fs = require('fs');
let html = fs.readFileSync('frontend/landing.html', 'utf8');
html = html.replace(
  '<div class="hero-badge">⚡ Built on Arc Testnet</div>',
  '<div class="hero-badge">⚡ Agentic Commerce on Arc</div>'
);
html = html.replace(
  'Kebs Protocol is the autonomous commerce layer on Arc. Smart contracts that trigger USDC payments automatically — no approvals, no middlemen, no delays.',
  'Kebs Protocol is the autonomous commerce layer on Arc. We\'re building exactly what Circle built Arc for — smart contracts that trigger USDC payments automatically. No approvals. No middlemen. No delays.'
);
fs.writeFileSync('frontend/landing.html', html);
console.log('Done');
