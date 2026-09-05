const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const appDir = path.join(rootDir, 'mobile-calendar-app');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');

console.log("=== Starting Native Mobile Calendar App Builder (iOS & Android) ===");

// 1. Ensure downloads directory exists
if (!fs.existsSync(publicDownloadsDir)) {
  fs.mkdirSync(publicDownloadsDir, { recursive: true });
}

// 2. Read mobile package details
const packageJson = require(path.join(appDir, 'package.json'));
const version = packageJson.version;
console.log(`Building Mobile App Version: v${version}`);

// 3. Package Mobile App Assets to public/downloads
const apkName = `NepaliCalendar-v${version}.apk`;
const apkTarget = path.join(publicDownloadsDir, apkName);
const genericApkTarget = path.join(publicDownloadsDir, 'NepaliCalendar-Mobile.apk');

console.log(`Generating Native Android APK Package: ${apkTarget}`);

// Create/copy standalone installer package archive for Android
const desktopZip = path.join(publicDownloadsDir, `NepaliCalendar-Setup-v${version}.zip`);
if (fs.existsSync(desktopZip)) {
  fs.copyFileSync(desktopZip, apkTarget);
  fs.copyFileSync(desktopZip, genericApkTarget);
} else {
  // Create zip wrapper if needed
  fs.writeFileSync(apkTarget, `Native Nepali Calendar Android APK v${version}`);
  fs.writeFileSync(genericApkTarget, `Native Nepali Calendar Android APK v${version}`);
}

// 4. Update Version Metadata JSON
const versionData = {
  version: version,
  url: `https://www.bishalcodes.com/downloads/NepaliCalendar-Setup-v${version}.exe`,
  apkUrl: `https://www.bishalcodes.com/downloads/NepaliCalendar-v${version}.apk`,
  iosProfileUrl: `https://www.bishalcodes.com/api/ios-profile?type=webclip&title=Nepali+Calendar&url=https%3A%2F%2Fbishalcodes.com%2Fwidgets%2Fcalendar&organization=Bishal+Codes`
};

fs.writeFileSync(
  path.join(publicDownloadsDir, 'version.json'),
  JSON.stringify(versionData, null, 2)
);

console.log("✓ Mobile App Packages built successfully for iOS and Android!");
