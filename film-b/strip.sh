#!/bin/bash
# usage: strip.sh <scene-id> <t1,t2,...>  -> renders stills and a contact strip into the scratchpad
set -e
S=/tmp/claude-0/-home-user-Chobbot/39ca6013-05ba-5510-8c27-b4dd3ea1a515/scratchpad
export CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome FFMPEG=$S/ffmpeg
cd "$(dirname "$0")/app"
rm -rf ../out/wip/$1
bun scripts/render.ts stills --t $2 --only $1 --out ../out/wip/$1 ${3:-} 2>&1 | grep -v "GL Driver\|^\.\./out" | grep -v "^BROWSER LOG:$" || true
ins=(); n=0; for f in ../out/wip/$1/*.png; do ins+=(-i "$f"); n=$((n+1)); done
$S/ffmpeg -loglevel error -y "${ins[@]}" -filter_complex "hstack=$n,scale=$((n*360)):-1" $S/strip_$1.png
echo $S/strip_$1.png
