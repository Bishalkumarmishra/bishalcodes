const { fork } = require('child_process');
const path = require('path');

const startServerPath = require.resolve('next/dist/server/lib/start-server');

const child = fork(startServerPath, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PRIVATE_WORKER: '1',
    NODE_OPTIONS: '' // Prevents Node 24 V8 memory override crash on Windows
  }
});

child.on('message', (msg) => {
  if (msg && msg.nextWorkerReady) {
    child.send({
      nextWorkerOptions: {
        dir: path.resolve('.'),
        port: 3000,
        isDev: true,
        hostname: '127.0.0.1',
        allowRetry: true
      }
    });
  }
});

child.on('exit', (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});
