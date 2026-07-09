# Create Desktop and Start Menu shortcuts with the Sortorium icon for Windows dev builds.
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$AppName = "Sortorium POS"
$ExeName = "sortorium-pos-desktop-app.exe"
$DebugBinary = Join-Path $Root "src-tauri\target\debug\$ExeName"
$ReleaseBinary = Join-Path $Root "src-tauri\target\release\$ExeName"
$IconPath = Join-Path $Root "src-tauri\icons\icon.ico"

if (Test-Path $ReleaseBinary) {
  $Binary = $ReleaseBinary
} elseif (Test-Path $DebugBinary) {
  $Binary = $DebugBinary
} else {
  Write-Error "Build the app first: pnpm tauri dev (or pnpm tauri build)"
}

if (-not (Test-Path $IconPath)) {
  Write-Error "Missing icon file: $IconPath"
}

function New-AppShortcut {
  param(
    [string]$ShortcutPath
  )

  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($ShortcutPath)
  $shortcut.TargetPath = $Binary
  $shortcut.WorkingDirectory = Split-Path $Binary -Parent
  $shortcut.IconLocation = "$IconPath,0"
  $shortcut.Description = "Sortorium point-of-sale desktop client"
  $shortcut.Save()
}

$DesktopShortcut = Join-Path $env:USERPROFILE "Desktop\$AppName.lnk"
$StartMenuDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
$StartMenuShortcut = Join-Path $StartMenuDir "$AppName.lnk"

New-AppShortcut -ShortcutPath $DesktopShortcut
New-Item -ItemType Directory -Force -Path $StartMenuDir | Out-Null
New-AppShortcut -ShortcutPath $StartMenuShortcut

Write-Host "Installed Windows shortcuts:"
Write-Host "  $DesktopShortcut"
Write-Host "  $StartMenuShortcut"
Write-Host "Pin to taskbar from the Start Menu shortcut if needed."
