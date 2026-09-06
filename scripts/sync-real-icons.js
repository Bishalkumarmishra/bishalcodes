
const fs = require('fs');
const path = require('path');

const rootDir = 'g:/bishal';

// 1. Read real 3D icon
const icon3dPath = path.join(rootDir, 'public', 'mero-patro-app-icon-3d.png');
if (fs.existsSync(icon3dPath)) {
  const buf3d = fs.readFileSync(icon3dPath);
  const base64_3d = buf3d.toString('base64');
  const svg3d = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <image width="512" height="512" xlink:href="data:image/png;base64,${base64_3d}" />
</svg>`;
  fs.writeFileSync(path.join(rootDir, 'public', 'mero-patro-app-icon-3d.svg'), svg3d);
  fs.writeFileSync(path.join(rootDir, 'public', 'calendar-desktop-icon.svg'), svg3d);
  fs.copyFileSync(icon3dPath, path.join(rootDir, 'public', 'calendar-desktop-icon.png'));
  fs.copyFileSync(icon3dPath, path.join(rootDir, 'public', 'logo-icon.png'));
  fs.copyFileSync(icon3dPath, path.join(rootDir, 'mobile-calendar-app', 'www', 'assets', 'app-icon.png'));
  fs.copyFileSync(icon3dPath, path.join(rootDir, 'mobile-calendar-app', 'www', 'assets', 'logo.png'));
  console.log('Processed 3D Icon into SVG, PNG and mobile assets.');
}

// 2. Read real 2D logo uploaded by user
const logo2dPath = path.join(rootDir, 'public', 'mero-patro-logo.png');
if (fs.existsSync(logo2dPath)) {
  const buf2d = fs.readFileSync(logo2dPath);
  const base64_2d = buf2d.toString('base64');
  const svg2d = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <image width="512" height="512" xlink:href="data:image/png;base64,${base64_2d}" />
</svg>`;
  fs.writeFileSync(path.join(rootDir, 'public', 'mero-patro-logo.svg'), svg2d);
  fs.writeFileSync(path.join(rootDir, 'public', 'hamro-patro-logo.svg'), svg2d);
  console.log('Processed 2D Logo into SVG and PNG assets.');
}
