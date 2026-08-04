const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local not found');
  process.exit(1);
}

const fileContent = fs.readFileSync(envPath, 'utf8');
const lines = fileContent.split('\n');

// Keys that Vercel already has or system generated
const skipKeys = [
  'VERCEL_OIDC_TOKEN',
  'GLOBAL_CONFIG',
  'EDGE_CONFIG',
  'BLOB_READ_WRITE_TOKEN',
  'BLOB_STORE_ID',
  'NEXT_PUBLIC_PADDLE_CLIENT_TOKEN',
  'NEXT_PUBLIC_PADDLE_ENV',
  'NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE',
  'NEXT_PUBLIC_PADDLE_PRICE_PRO',
  'PADDLE_API_KEY',
  'PADDLE_WEBHOOK_SECRET_KEY'
];

const targets = ['production', 'preview', 'development'];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;

  const match = trimmed.match(/^([^=]+)=(.*)$/);
  if (!match) continue;

  const key = match[1].trim();
  let val = match[2].trim();

  // Remove surrounding quotes if any
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }

  if (skipKeys.includes(key)) {
    console.log(`Skipping Vercel-internal variable: ${key}`);
    continue;
  }

  console.log(`Pushing ${key} to Vercel targets...`);
  for (const target of targets) {
    try {
      // Use --force to overwrite if already exists
      execSync(`npx vercel env add ${key} ${target} --value "${val.replace(/"/g, '\\"')}" --force --yes`, { stdio: 'ignore' });
      console.log(`  Successfully added/updated ${key} in ${target}`);
    } catch (err) {
      console.error(`  Warning: Failed to add ${key} to ${target}`);
    }
  }
}

console.log('Finished pushing env vars!');
