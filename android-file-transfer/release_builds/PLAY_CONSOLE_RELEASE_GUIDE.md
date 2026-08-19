# Google Play Console Release Package & Checklist

This directory contains production-ready release builds for **BishalCodes File Transfer (Android)**, signed and configured to adhere to Google Play Console policies.

---

## 📦 Generated Release Artifacts

| Artifact | File Name | Size | Purpose |
| :--- | :--- | :--- | :--- |
| **AAB (Bundle)** | [BishalCodes_FileTransfer_v1.0.0.aab](file:///g:/bishal/android-file-transfer/release_builds/BishalCodes_FileTransfer_v1.0.0.aab) | **5.33 MB** | **Upload directly to Google Play Console** (Production, Open Testing, Closed Testing, or Internal Testing track) |
| **APK** | [BishalCodes_FileTransfer_v1.0.0.apk](file:///g:/bishal/android-file-transfer/release_builds/BishalCodes_FileTransfer_v1.0.0.apk) | **5.59 MB** | Standalone signed APK for direct physical device installation and sideload testing |

Original build outputs:
- AAB: [app-release.aab](file:///g:/bishal/android-file-transfer/app/build/outputs/bundle/release/app-release.aab)
- APK: [app-release.apk](file:///g:/bishal/android-file-transfer/app/build/outputs/apk/release/app-release.apk)

---

## 🔑 Keystore & Signing Credentials

A dedicated 2048-bit RSA production keystore has been created and integrated into the Gradle build pipeline:

- **Keystore File Location**: [release.keystore](file:///g:/bishal/android-file-transfer/app/release.keystore)
- **Configuration File**: [key.properties](file:///g:/bishal/android-file-transfer/key.properties)
- **Key Alias**: `bishalcodes`
- **Keystore Password**: `bishalcodes123`
- **Key Password**: `bishalcodes123`
- **Certificate Validity**: 10,000 days (until ~2053)

> **Important**: Keep `release.keystore` safe. If you use Google Play App Signing, Google will manage key distribution, but this upload key is required for future updates.

---

## 🛡️ Play Console Policy & Requirements Compliance

1. **Target API Level (targetSdkVersion 34)**:
   - Built with `compileSdk = 34` and `targetSdk = 34` (Android 14), fully satisfying Google Play's target SDK requirement.
2. **Android 14+ Foreground Service Policy**:
   - `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_DATA_SYNC` permissions are declared in [AndroidManifest.xml](file:///g:/bishal/android-file-transfer/app/src/main/AndroidManifest.xml) alongside `android:foregroundServiceType="dataSync"` for background file transfer.
3. **Component Security (android:exported)**:
   - All internal broadcast receivers and services have `android:exported="false"` to prevent automated Play Console security warnings.
4. **App Bundle Requirement**:
   - Packaged as an Android App Bundle (`.aab`) which optimizes download sizes for end users per device architecture.
5. **Java 17 / JVM Modernization**:
   - Upgraded to modern Java 17 bytecode target with Kotlin 1.9.22 and Jetpack Compose BOM 2023.08.00.

---

## 📝 Step-by-Step Play Console Submission Guide

### Step 1: Create App in Google Play Console
1. Go to [Google Play Console](https://play.google.com/console).
2. Click **Create app**.
3. Fill in:
   - **App name**: `BishalCodes File Transfer` (or preferred name)
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free

### Step 2: Set up App Content & Policy
Complete the **App content** section:
- **Privacy Policy**: Provide your privacy policy URL (e.g. `https://bishalcodes.com/privacy-policy`).
- **Data safety**:
  - Does your app collect or share data? -> No (all transfers happen locally peer-to-peer over local Wi-Fi / hotspot).
  - No user data or files are sent to external third parties without user action.
- **App access**: All functionality is available without special credentials.
- **Ads**: Declare whether the app contains ads (Select "No, my app does not contain ads" unless you integrate AdMob).
- **Target audience**: 13+ or All ages.

### Step 3: Store Listing Assets Checklist
- **App Icon**: 512 x 512 PNG, 32-bit color, max 1 MB.
- **Feature Graphic**: 1024 x 500 JPG or PNG (no transparency).
- **Phone Screenshots**: Minimum 2 screenshots (16:9 or 9:16 aspect ratio).
- **Short Description** (up to 80 chars): Fast, secure, direct Wi-Fi local file sharing between Android & PC.
- **Full Description**: Detailed overview of features (QR code connect, hotspot transfer, instant browser pair).

### Step 4: Upload the AAB
1. Navigate to **Release** -> **Production** (or **Internal testing** first).
2. Click **Create new release**.
3. Upload `BishalCodes_FileTransfer_v1.0.0.aab`.
4. Enter Release notes:
   ```text
   Initial release of BishalCodes File Transfer.
   - High-speed local Wi-Fi and hotspot file transfer.
   - Instant pairing via QR code and web interface.
   - Background service for seamless transfer sessions.
   ```
5. Click **Next** -> **Save** -> **Review and roll out release**.
