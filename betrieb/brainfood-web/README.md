# Betrieb: brainfood.hoffja.de

Container `brainfood-web` auf meinserver (`/opt/brainfood`), gleiches Muster wie `acorn`.

- `docker-compose.yml`: eigenes Compose-Projekt im Netz `webserver_default`. HTTPS läuft über den vorhandenen nginx-proxy und acme-companion. Andere Sites werden nicht angefasst.
- `nginx.conf`: liefert `/srv/brainfood/current` aus. Seite, Bilder und Audios liegen hinter einem Passwort (`/opt/brainfood/htpasswd`, nicht im Repo). Außerdem noindex und gzip_static.
- `deploy.sh`: spielt ein hochgeladenes Archiv ein, legt `.gz`-Dateien an und schaltet den Link `current` in einem Schritt um. Die letzten drei Stände bleiben liegen.

## Aktualisieren

Doppelklick auf `tools\Online-aktualisieren.cmd`. Das Skript baut, lädt hoch und schaltet um, mit zwei SSH-Verbindungen. Die Firewall bremst ab etwa 6 Verbindungen in 30 Sekunden.

## Rollback

```sh
ssh meinserver "sh /opt/brainfood/deploy.sh --zurueck"
```

## Gesicherte Fassung v1

Die erste vollständige Fassung liegt fest unter `/opt/brainfood/site/v1`. Sie steht außerhalb von `releases/` und wird nie automatisch gelöscht.
Dazu kommen der Git-Tag `v1.0` und das GitHub-Release mit fertigem Build.

- Notfall, sofort auf v1: Doppelklick auf `tools\Zurueck-zu-v1.cmd` (oder `ssh meinserver "sh /opt/brainfood/deploy.sh --auf v1"`)
- Zurück auf den neuesten Stand: `tools\Online-aktualisieren.cmd`
- Weitere Fassung sichern, z. B. v2: `ssh meinserver "sh /opt/brainfood/deploy.sh --sichern v2"`
- v1 lokal wiederherstellen: `git checkout v1.0` (zurück mit `git checkout main`)

Ganz abschalten (andere Sites bleiben unberührt):

```sh
ssh meinserver "docker compose -f /opt/brainfood/docker-compose.yml down"
```

## Zugang

Benutzer `brainfood`. Das Passwort steht nur lokal in `.zugang.local.txt` im Projektordner (per `.gitignore` ausgeschlossen).
Passwort ändern:

```sh
ssh meinserver "openssl passwd -apr1 -stdin | sed 's/^/brainfood:/' > /opt/brainfood/htpasswd"   # neues Passwort per stdin
```
