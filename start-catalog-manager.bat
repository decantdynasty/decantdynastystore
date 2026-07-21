@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  set "DD_PYTHON=py"
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python was not found. Install Python or open this folder with a local web server.
    pause
    exit /b 1
  )
  set "DD_PYTHON=python"
)

echo Opening the private Decant Dynasty Catalog Manager...
echo Keep this window open while editing. Close it when finished.
start "" "http://127.0.0.1:8765/catalog-manager.html"
%DD_PYTHON% -m http.server 8765 --bind 127.0.0.1
