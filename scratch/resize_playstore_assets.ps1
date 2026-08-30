$srcIcon = "C:\Users\bishal\.gemini\antigravity-ide\brain\0b93e702-5657-4696-8eda-1ed09ac9c98a\file_transfer_playstore_icon_1788053361710.jpg"
$srcGraphic = "C:\Users\bishal\.gemini\antigravity-ide\brain\0b93e702-5657-4696-8eda-1ed09ac9c98a\file_transfer_feature_graphic_1788053377555.jpg"
$destDir = "G:\bishal\playstore_assets"

if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force
}

Add-Type -AssemblyName System.Drawing

# Resize App Icon to 512x512 PNG
$imgIcon = [System.Drawing.Image]::FromFile($srcIcon)
$bmpIcon = New-Object System.Drawing.Bitmap 512, 512
$gIcon = [System.Drawing.Graphics]::FromImage($bmpIcon)
$gIcon.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIcon.DrawImage($imgIcon, 0, 0, 512, 512)
$bmpIcon.Save("$destDir\app_icon_512x512.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gIcon.Dispose()
$bmpIcon.Dispose()
$imgIcon.Dispose()

# Resize Feature Graphic to 1024x500 PNG
$imgGraphic = [System.Drawing.Image]::FromFile($srcGraphic)
$bmpGraphic = New-Object System.Drawing.Bitmap 1024, 500
$gGraphic = [System.Drawing.Graphics]::FromImage($bmpGraphic)
$gGraphic.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gGraphic.DrawImage($imgGraphic, 0, 0, 1024, 500)
$bmpGraphic.Save("$destDir\feature_graphic_1024x500.png", [System.Drawing.Imaging.ImageFormat]::Png)
$gGraphic.Dispose()
$bmpGraphic.Dispose()
$imgGraphic.Dispose()

Write-Host "PLAYSTORE_ASSETS_GENERATED_SUCCESSFULLY"
