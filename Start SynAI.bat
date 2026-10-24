@echo off
setlocal
cd /d "%~dp0"

set "PATH=%LOCALAPPDATA%\pi-node\current;%PATH%"

where node >nul 2>nul
if errorlevel 1 (
  echo SynAI needs Node.js.
  echo Install Node, then double-click this file again.
  pause
  exit /b 1
)

if not exist "%~dp0node_modules\" (
  call npm install
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

if not exist "%~dp0dist\index.html" (
  call npm run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)

node server\desktop.js
if errorlevel 1 pause
