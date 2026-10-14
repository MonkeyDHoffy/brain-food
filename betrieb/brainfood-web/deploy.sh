#!/bin/sh
# Spielt einen hochgeladenen Build von Brain Food ein (Aufruf durch tools/Online-aktualisieren.cmd).
# Ablauf: entpacken nach releases/<Zeit>, .gz-Dateien daneben erzeugen, dann den Link "current" in einem Schritt
# umstellen. Wer gerade lädt, bekommt also nie einen halben Stand. Die drei neuesten Stände bleiben liegen.
# Rollback: sh /opt/brainfood/deploy.sh --zurueck  (schaltet auf den vorherigen Stand)
set -eu
BASE=/opt/brainfood

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
