#!/bin/bash
# usage: shot.sh name width height url
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
D="$(cygpath -w "$(pwd)/.shots")"
P="$D\p$RANDOM"
timeout 120 "$E" --headless --disable-gpu --no-sandbox --user-data-dir="$P" --hide-scrollbars --window-size=$2,$3 --virtual-time-budget=${5:-15000} --screenshot="$D\$1.png" "$4" >/dev/null 2>&1
ls .shots/$1.png >/dev/null 2>&1 && echo "ok $1" || echo "FAIL $1"
