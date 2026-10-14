#!/bin/sh
# Spielt einen hochgeladenen Build von Brain Food ein (Aufruf durch tools/Online-aktualisieren.cmd).
# Ablauf: entpacken nach releases/<Zeit>, .gz-Dateien daneben erzeugen, dann den Link "current" in einem Schritt
# umstellen. Wer gerade lädt, bekommt also nie einen halben Stand. Die drei neuesten Stände bleiben liegen.
# Rollback: sh /opt/brainfood/deploy.sh --zurueck  (schaltet auf den vorherigen Stand)
# Gesicherte Fassungen: sh /opt/brainfood/deploy.sh --sichern v1  (aktuellen Stand fest als site/v1 ablegen)
#                       sh /opt/brainfood/deploy.sh --auf v1      (live auf site/v1 umschalten)
# Gesicherte Fassungen liegen außerhalb von releases/ und werden nie automatisch gelöscht.
set -eu
BASE=/opt/brainfood

if [ "${1:-}" = "--sichern" ]; then
    NAME="${2:?Name fehlt, z. B. v1}"
    AKTUELL=$(readlink "$BASE/site/current")
    [ -e "$BASE/site/$NAME" ] && { echo "site/$NAME gibt es schon, nichts überschrieben."; exit 1; }
    cp -a "$BASE/site/$AKTUELL" "$BASE/site/$NAME"
    echo "Gesichert: $AKTUELL -> site/$NAME"
    exit 0
fi

if [ "${1:-}" = "--auf" ]; then
    NAME="${2:?Name fehlt, z. B. v1}"
    [ -f "$BASE/site/$NAME/index.html" ] || { echo "site/$NAME fehlt oder ist unvollständig."; exit 1; }
    ln -sfn "$NAME" "$BASE/site/current.neu"
    mv -T "$BASE/site/current.neu" "$BASE/site/current"
    echo "Live geschaltet auf $NAME"
    exit 0
fi

if [ "${1:-}" = "--zurueck" ]; then
    VORHER=$(ls -1 "$BASE/site/releases" | sort -r | sed -n 2p)
    [ -n "$VORHER" ] || { echo "Kein vorheriger Stand vorhanden."; exit 1; }
    ln -sfn "releases/$VORHER" "$BASE/site/current.neu"
    mv -T "$BASE/site/current.neu" "$BASE/site/current"
    echo "Zurückgeschaltet auf $VORHER"
    exit 0
fi

ARCHIV="${1:?Archiv fehlt}"
ZEIT=$(date +%Y%m%d-%H%M%S)
ZIEL="$BASE/site/releases/$ZEIT"
mkdir -p "$ZIEL"
tar -xzf "$ARCHIV" -C "$ZIEL"
if [ ! -f "$ZIEL/index.html" ]; then
    echo "index.html fehlt im Archiv, nichts umgestellt."
    rm -rf -- "${ZIEL:?}"
    exit 1
fi
find "$ZIEL" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' -o -name '*.svg' \) -exec gzip -9 -k -f {} \;
chmod -R a+rX "$ZIEL"
ln -sfn "releases/$ZEIT" "$BASE/site/current.neu"
mv -T "$BASE/site/current.neu" "$BASE/site/current"
rm -f -- "${ARCHIV:?}"
ls -1 "$BASE/site/releases" | sort -r | tail -n +4 | while read -r alt; do
    rm -rf -- "${BASE:?}/site/releases/${alt:?}"
done
echo "Online: https://brainfood.hoffja.de (Stand $ZEIT)"
