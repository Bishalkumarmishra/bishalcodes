const { downloadZip, predictLength } = require('client-zip');

const files = [
  {
    name: 'test.txt',
    input: Buffer.from('hello world'),
    size: 11,
    lastModified: new Date()
  }
];

// Predict size without input field
const predInputs = files.map(f => ({
  name: f.name,
  size: f.size
}));
const predicted = predictLength(predInputs);

// Actual size
const response = downloadZip(files);
let actualSize = 0;
const reader = response.body.getReader();

(async () => {
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    actualSize += value.byteLength;
  }
  console.log('Predicted Size:', Number(predicted));
  console.log('Actual Size:', actualSize);
  console.log('Match:', Number(predicted) === actualSize);
})();
