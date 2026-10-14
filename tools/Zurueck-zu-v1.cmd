@echo off
rem Notfall: schaltet https://brainfood.hoffja.de sofort zurueck auf die gesicherte Fassung v1.
rem Die Sicherung liegt auf dem Server unter /opt/brainfood/site/v1 und wird nie automatisch geloescht.
rem Wieder auf den neuesten Stand: tools\Online-aktualisieren.cmd ausfuehren.
ssh -o BatchMode=yes meinserver "sh /opt/brainfood/deploy.sh --auf v1" || exit /b 1
pause
