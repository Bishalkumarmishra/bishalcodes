const http = require('http');

const testEndpoint = (path) => {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ path, statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ path, statusCode: res.statusCode, body: data });
        }
      });
    }).on('error', (err) => {
      resolve({ path, error: err.message });
    });
  });
};

async function run() {
  const edgeRes = await testEndpoint('/api/vercel/edge-config');
  const blobRes = await testEndpoint('/api/vercel/blob');
  const statusRes = await testEndpoint('/api/vercel/status');

  console.log('--- Edge Config Test ---');
  console.log(JSON.stringify(edgeRes, null, 2));

  console.log('\n--- Blob Test ---');
  console.log(JSON.stringify(blobRes, null, 2));

  console.log('\n--- Status Test ---');
  console.log(JSON.stringify(statusRes, null, 2));
}

run();
