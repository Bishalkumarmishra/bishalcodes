const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'desktop-calendar-app');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');

console.log("=== Starting Desktop Calendar App Builder ===");

// 1. Ensure fresh transparent icons are generated
try {
  console.log("Generating fresh premium transparent app icons...");
  execSync('node scripts/generate-desktop-icon.js', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.warn("Warning: Icon generation script failed, verifying if icons exist:", err);
  const iconPaths = [
    path.join(appDir, 'icon.png'),
    path.join(appDir, 'logo-icon.png'),
    path.join(appDir, 'tray-icon.png'),
  ];
  const missing = iconPaths.filter(p => !fs.existsSync(p));
  if (missing.length > 0) {
    console.error("Missing critical icons and failed to generate them:", missing);
    process.exit(1);
  }
}

// 2. Install dependencies in desktop-calendar-app
console.log("\nInstalling Electron dependencies in desktop-calendar-app...");
try {
  execSync('npm install', { cwd: appDir, stdio: 'inherit' });
  console.log("Dependencies installed successfully.");
} catch (err) {
  console.error("Failed to install dependencies inside desktop-calendar-app directory:", err);
  process.exit(1);
}

// 3. Compile and Package Electron application with electron-builder
console.log("\nBuilding Electron Installer (.exe) with electron-builder...");
try {
  // We run electron-builder via npm run package
  execSync('npm run package', { cwd: appDir, stdio: 'inherit' });
  console.log("Electron application installer built successfully.");
} catch (err) {
  console.error("Failed to build Electron application:", err);
  process.exit(1);
}

// 4. Ensure public downloads directory exists
if (!fs.existsSync(publicDownloadsDir)) {
  fs.mkdirSync(publicDownloadsDir, { recursive: true });
  console.log(`Created downloads directory: ${publicDownloadsDir}`);
}

// 5. Copy Installer Setup to public/downloads
const distDir = path.join(appDir, 'dist');
const packageJson = require(path.join(appDir, 'package.json'));
const version = packageJson.version;
const destZipName = `NepaliCalendar-Setup-v${version}.zip`;
const destZip = path.join(publicDownloadsDir, destZipName);

try {
  const files = fs.readdirSync(distDir);
  const exeFile = files.find(f => f.endsWith('.exe') && !f.includes('blockmap'));
  
  if (exeFile) {
    const sourceExe = path.join(distDir, exeFile);
    console.log(`\nCompressing Installer to public/downloads: ${sourceExe} -> ${destZip}`);
    
    // Ensure the public/downloads directory exists
    if (!fs.existsSync(publicDownloadsDir)) {
      fs.mkdirSync(publicDownloadsDir, { recursive: true });
    }

    // Delete the old zip files if they exist to avoid confusion
    const oldZips = ['NepaliCalendar-Setup.zip', 'NepaliCalendar-Windows.zip'];
    oldZips.forEach(z => {
      const oldZipPath = path.join(publicDownloadsDir, z);
      if (fs.existsSync(oldZipPath)) fs.unlinkSync(oldZipPath);
    });
    
    // Compress the new exe directly to the public folder
    execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${sourceExe}' -DestinationPath '${destZip}' -Force"`, { stdio: 'inherit' });
    
    console.log(`\nInstaller successfully compressed to public/downloads/${destZipName}!`);
  } else {
    console.error("Could not find the generated Setup .exe in dist folder.");
    process.exit(1);
  }
} catch (err) {
  console.error("Failed to copy Installer:", err);
  process.exit(1);
}

console.log("\n=== Desktop App Packaging Completed Successfully! ===");
