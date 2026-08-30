$srcIcon = "C:\Users\bishal\.gemini\antigravity-ide\brain\0b93e702-5657-4696-8eda-1ed09ac9c98a\file_transfer_white_icon_1788053665422.jpg"
$destPlaystoreDir = "G:\bishal\playstore_assets"
$resDir = "G:\bishal\android-file-transfer\app\src\main\res"

if (-not (Test-Path $destPlaystoreDir)) {
    New-Item -ItemType Directory -Path $destPlaystoreDir -Force
}

Add-Type -AssemblyName System.Drawing

# 1. Update Play Store 512x512 Icon
$imgIcon = [System.Drawing.Image]::FromFile($srcIcon)

$bmpIcon = New-Object System.Drawing.Bitmap 512, 512
$gIcon = [System.Drawing.Graphics]::FromImage($bmpIcon)
$gIcon.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIcon.DrawImage($imgIcon, 0, 0, 512, 512)
$bmpIcon.Save("$destPlaystoreDir\app_icon_512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gIcon.Dispose()
$bmpIcon.Dispose()

# 2. Generate Feature Graphic (1024x500 PNG) on clean white/emerald theme
$bmpFeature = New-Object System.Drawing.Bitmap 1024, 500
$gFeature = [System.Drawing.Graphics]::FromImage($bmpFeature)
$gFeature.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

# Background: Crisp white
$gFeature.Clear([System.Drawing.Color]::White)

# Draw subtle light emerald accent gradient/banner on right side
$brushAccent = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point 0, 0),
    (New-Object System.Drawing.Point 1024, 500),
    [System.Drawing.Color]::FromArgb(245, 255, 250),
    [System.Drawing.Color]::FromArgb(220, 248, 235)
)
$gFeature.FillRectangle($brushAccent, 0, 0, 1024, 500)

# Draw icon on right side of banner
$gFeature.DrawImage($imgIcon, 550, 25, 450, 450)

# Draw Typography on left side
$fontTitle = New-Object System.Drawing.Font("Arial", 42, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Regular)
$brushDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 40, 30))
$brushGreen = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 180, 100))

$gFeature.DrawString("File Transfer", $fontTitle, $brushGreen, 50, 180)
$gFeature.DrawString("Fast & Secure Cross-Platform Sharing", $fontSubtitle, $brushDark, 50, 250)

$bmpFeature.Save("$destPlaystoreDir\feature_graphic_1024x500.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gFeature.Dispose()
$bmpFeature.Dispose()

# 3. Generate Android Mipmap Icons for APK/AAB
$densities = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($folder in $densities.Keys) {
    $size = $densities[$folder]
    $targetFolder = "$resDir\$folder"
    if (-not (Test-Path $targetFolder)) {
        New-Item -ItemType Directory -Path $targetFolder -Force
    }

    $bmpResized = New-Object System.Drawing.Bitmap $size, $size
    $gResized = [System.Drawing.Graphics]::FromImage($bmpResized)
    $gResized.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gResized.DrawImage($imgIcon, 0, 0, $size, $size)
    
    # Save standard & round launcher icons
    $bmpResized.Save("$targetFolder\ic_launcher.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpResized.Save("$targetFolder\ic_launcher_round.png", [System.Drawing.Imaging.ImageFormat]::Png)
    
    $gResized.Dispose()
    $bmpResized.Dispose()
}

$imgIcon.Dispose()

Write-Host "ANDROID_MIPMAP_AND_PLAYSTORE_WHITE_ICONS_UPDATED"
