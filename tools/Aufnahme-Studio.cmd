@echo off
rem Startet das Aufnahme-Studio: lokaler Dev-Server (falls noch nicht aktiv) und Browser mit studio.html.
rem Die Aufnahmen landen im Projektordner unter aufnahmen\<sequenz>\<nr>.webm.
cd /d "%~dp0.."
curl -s -o nul http://localhost:5173/studio.html
if errorlevel 1 (
  start "Brain Food Dev-Server" cmd /k npx vite --port 5173 --strictPort
  timeout /t 4 /nobreak >nul
)
start "" http://localhost:5173/studio.html
