const { list } = require('@vercel/blob');

const tokens = [
  "vercel_blob_rw_h0f2xzbTd4xwqWqx_zPXqoCadxukmvdKc90T9u5JDBu2T09", // lowercase x
  "vercel_blob_rw_h0f2XzbTd4xwqWqx_zPXqoCadxukmvdKc90T9u5JDBu2T09"  // uppercase X
];

async function run() {
  for (const token of tokens) {
    console.log(`Testing token: ${token}`);
    try {
      const res = await list({ token });
      console.log('  Success! Found blobs:', res.blobs.length);
      return;
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }
}

run();
