Add-Type -AssemblyName System.Drawing

# Create a 32x32 white square image
$width = 32
$height = 32

# Create bitmap
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Fill with white background
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.FillRectangle($whiteBrush, 0, 0, $width, $height)

# Create a simple icon shape (a simple white square with some basic shape)
# For a more sophisticated icon, you'd want to draw the actual logo shape
$graphics.Dispose()
$whiteBrush.Dispose()

# Save as PNG
$outputPath = "c:\Users\Harry\Documents\GitHub\redesigned-spork\src-tauri\icons\tray-icon-white.png"
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()

Write-Host "White tray icon created at: $outputPath"
Write-Host "Note: This is a simple white square. You may want to create a proper white version of your logo."
