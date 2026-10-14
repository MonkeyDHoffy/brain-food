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
