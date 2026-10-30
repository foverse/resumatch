@echo off
setlocal
title CV Adapt
cd /d "%~dp0"

where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js n'est pas installe ou n'est pas accessible.
  echo Installez Node.js, puis relancez ce fichier.
  pause
  exit /b 1
)

if not exist "node_modules\express" (
  echo Preparation des dependances de CV Adapt...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo L'installation a echoue.
    pause
    exit /b 1
  )
)

start "CV Adapt Server" /min cmd.exe /c "node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/"

endlocal
exit /b 0
