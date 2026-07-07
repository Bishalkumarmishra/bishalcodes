const { downloadZip, predictLength } = require('client-zip');
const fs = require('fs');

async function run() {
  const file1 = {
    name: "hello.txt",
    input: "Hello World!",
    lastModified: new Date()
  };
  const file2 = {
    name: "nested/test.txt",
    input: "This is a nested file.",
    lastModified: new Date()
  };

  const inputs = [file1, file2];
  const response = downloadZip(inputs);
  const buffer = await response.arrayBuffer();

  fs.writeFileSync('test-output.zip', Buffer.from(buffer));
  console.log("ZIP file written successfully. Size:", buffer.byteLength);
}

run().catch(console.error);
