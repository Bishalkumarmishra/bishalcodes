const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const appDir = path.join(__dirname, '../desktop-calendar-app');

function generateSvg() {
  const startX = 147;
  const startY = 215;
  const colWidth = 26;
  const colGap = 6;
  const rowHeight = 15;
  const rowGap = 6;

  let cellsSvg = '';

  // Row 1: col indices 2..6
  for (let c = 2; c <= 6; c++) {
    const x = startX + c * (colWidth + colGap);
    const y = startY;
    cellsSvg += `  <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" rx="3" ry="3" fill="none" stroke="#ffffff" stroke-width="2.5" />\n`;
  }

  // Row 2: col indices 0..6
  for (let c = 0; c <= 6; c++) {
    const x = startX + c * (colWidth + colGap);
    const y = startY + (rowHeight + rowGap);
    cellsSvg += `  <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" rx="3" ry="3" fill="none" stroke="#ffffff" stroke-width="2.5" />\n`;
  }

  // Row 3: col indices 0..6. index 3 is active ("१४")
  for (let c = 0; c <= 6; c++) {
    const x = startX + c * (colWidth + colGap);
    const y = startY + 2 * (rowHeight + rowGap);
    if (c === 3) {
      // Highlighted cell: filled white background with black text "१४"
      cellsSvg += `  <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" rx="3" ry="3" fill="#ffffff" stroke="#ffffff" stroke-width="2.5" />\n`;
      cellsSvg += `  <text x="${x + colWidth / 2}" y="${y + rowHeight / 2 + 1}" font-family="'Nirmala UI', 'Mukta', 'Noto Sans Devanagari', 'system-ui', sans-serif" font-size="12" font-weight="900" fill="#000000" text-anchor="middle" dominant-baseline="central">१४</text>\n`;
    } else {
      cellsSvg += `  <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" rx="3" ry="3" fill="none" stroke="#ffffff" stroke-width="2.5" />\n`;
    }
  }

  // Row 4: col indices 0..6
  for (let c = 0; c <= 6; c++) {
    const x = startX + c * (colWidth + colGap);
    const y = startY + 3 * (rowHeight + rowGap);
    cellsSvg += `  <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" rx="3" ry="3" fill="none" stroke="#ffffff" stroke-width="2.5" />\n`;
  }

  // Row 5: col indices 0..3
  for (let c = 0; c <= 3; c++) {
    const x = startX + c * (colWidth + colGap);
    const y = startY + 4 * (rowHeight + rowGap);
    cellsSvg += `  <rect x="${x}" y="${y}" width="${colWidth}" height="${rowHeight}" rx="3" ry="3" fill="none" stroke="#ffffff" stroke-width="2.5" />\n`;
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Outer Rounded Rectangle (Main Icon Body) - Brown Background -->
  <rect x="36" y="36" width="440" height="440" rx="90" ry="90" fill="#2a170e" />

  <!-- Calendar Binder Rings -->
  <rect x="160" y="55" width="16" height="45" rx="8" ry="8" fill="#ffffff" />
  <rect x="336" y="55" width="16" height="45" rx="8" ry="8" fill="#ffffff" />

  <!-- Main Calendar Page Card (Inside the brown card - Taller height 255 to prevent bottom grid overlap) -->
  <rect x="96" y="80" width="320" height="255" rx="16" ry="16" fill="none" stroke="#ffffff" stroke-width="8" />

  <!-- Header Separator Line -->
  <line x1="96" y1="150" x2="416" y2="150" stroke="#ffffff" stroke-width="8" />

  <!-- Header Background (White fill inside the top rounded area of the calendar page) -->
  <path d="M 96 150 L 96 96 A 16 16 0 0 1 112 80 L 400 80 A 16 16 0 0 1 416 96 L 416 150 Z" fill="#ffffff" />

  <!-- Header Text (बैशाख) -->
  <text x="256" y="125" font-family="'Nirmala UI', 'Mukta', 'Noto Sans Devanagari', 'system-ui', sans-serif" font-size="44" font-weight="900" fill="#000000" text-anchor="middle">बैशाख</text>

  <!-- B.S 2083 in Nepali (वि.सं. २०८३) -->
  <text x="256" y="192" font-family="'Nirmala UI', 'Mukta', 'Noto Sans Devanagari', 'system-ui', sans-serif" font-size="24" font-weight="bold" fill="#ffffff" text-anchor="middle">वि.सं. २०८३</text>

  <!-- Grid Cells -->
${cellsSvg}

  <!-- Bottom Labels (Fully inside the brown card) -->
  <text x="256" y="390" font-family="'Nirmala UI', 'Mukta', 'Noto Sans Devanagari', 'system-ui', sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">नेपाली पात्रो</text>
  <text x="256" y="428" font-family="'Nirmala UI', 'Segoe UI', 'system-ui', sans-serif" font-size="18" font-weight="700" fill="#ffffff" text-anchor="middle">Nepali Calendar</text>
</svg>
  `.trim();
}

async function run() {
  console.log('Generating premium transparent calendar icons...');
  const svgContent = generateSvg();

  // Save the SVG for debugging or reference
  const svgPath = path.join(appDir, 'icon-debug.svg');
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Saved debug SVG to ${svgPath}`);

  // Invoke Electron offscreen renderer to generate perfect PNGs from the SVG
  const { execSync } = require('child_process');
  const scriptsDir = __dirname;
  console.log("Invoking Electron headlessly to render the SVG to PNG...");
  try {
    execSync('npx electron scripts/render-icons-electron.js', { cwd: path.join(scriptsDir, '..'), stdio: 'inherit' });
    console.log('Icon generation and rendering completed successfully!');
  } catch (err) {
    console.warn('Warning: Failed to run npx electron, trying fallback local electron path...', err);
    try {
      const localElectron = path.join(appDir, 'node_modules/.bin/electron.cmd');
      execSync(`"${localElectron}" scripts/render-icons-electron.js`, { cwd: path.join(scriptsDir, '..'), stdio: 'inherit' });
      console.log('Icon generation and rendering completed successfully via fallback!');
    } catch (fallbackErr) {
      console.error('Fatal: Electron renderer failed on both attempts:', fallbackErr);
      throw fallbackErr;
    }
  }
}

run().catch(err => {
  console.error('Fatal error generating icons:', err);
  process.exit(1);
});
