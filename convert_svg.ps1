Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

# Read SVG content
$svgPath = "c:\Users\Harry\Documents\GitHub\redesigned-spork\src-tauri\icons\icon white.svg"
$outputPath = "c:\Users\Harry\Documents\GitHub\redesigned-spork\src-tauri\icons\tray-icon-white.png"

try {
    # For SVG conversion, we'll need to use a different approach
    # Let's try using the WebBrowser control to render SVG
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    
    # Create a simple HTML wrapper for the SVG
    $svgContent = Get-Content $svgPath -Raw
    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background: transparent; }
        svg { width: 32px; height: 32px; }
    </style>
</head>
<body>
    $svgContent
</body>
</html>
"@

    # Save temporary HTML file
    $tempHtml = "temp_svg.html"
    $htmlContent | Out-File -FilePath $tempHtml -Encoding UTF8
    
    Write-Host "HTML file created. Please manually convert the SVG to PNG using an online converter or image editor."
    Write-Host "SVG location: $svgPath"
    Write-Host "Target location: $outputPath"
    Write-Host "Required size: 32x32 pixels"
    
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}
