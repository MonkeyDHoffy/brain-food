@echo off
rem Baut die Praesentation und laedt sie nach https://brainfood.hoffja.de hoch (mit Passwort).
rem Braucht "ssh meinserver" mit Schluessel. Auf dem Server spielt /opt/brainfood/deploy.sh den Stand ein und
rem schaltet in einem Schritt um. Zwei SSH-Verbindungen, damit die Firewall (Begrenzung pro 30 s) nicht bremst.
rem Rollback: ssh meinserver "sh /opt/brainfood/deploy.sh --zurueck"
cd /d "%~dp0.."
call npm run build || exit /b 1
if not exist "dist\index.html" (
  echo Build fehlgeschlagen: dist\index.html fehlt.
  exit /b 1
)
set "ARCHIV=%TEMP%\brainfood-web.tar.gz"
tar -czf "%ARCHIV%" -C dist . || exit /b 1
scp -q -o BatchMode=yes "%ARCHIV%" meinserver:/opt/brainfood/upload/brainfood-web.tar.gz || exit /b 1
ssh -o BatchMode=yes meinserver "sh /opt/brainfood/deploy.sh /opt/brainfood/upload/brainfood-web.tar.gz" || exit /b 1
del "%ARCHIV%"
