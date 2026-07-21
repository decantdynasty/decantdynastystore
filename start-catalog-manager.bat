@echo off
setlocal
cd /d "%~dp0"
title Decant Dynasty Catalog Manager
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0catalog-manager-server.ps1"
if errorlevel 1 (
  echo.
  echo The Catalog Manager could not be started.
  pause
)
