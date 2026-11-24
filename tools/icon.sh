#!/bin/sh
# Иконка приложения из спрайтов: Елисей слева и выше, Неля справа, ноги на одной линии ниже края.
# Неля в масштабе 0.84 от Елисея, как в комнате (--stature), поэтому она ниже.
# Запуск из корня проекта: sh tools/icon.sh
set -e
S=1.75            # масштаб Елисея
N=1.47            # масштаб Нели: 1.75 * 0.84
BG=0x4b2a17       # теплый коричневый, как обложка дневника
tmp=$(mktemp -d)
ffmpeg -loglevel error -y -f lavfi -i "color=c=$BG:s=512x512" \
  -i assets/sprites/elisey-base-idle.webp -i assets/sprites/nelya-base-idle.webp \
  -filter_complex "[1]scale=iw*$S:ih*$S:flags=neighbor[e];[2]scale=iw*$N:ih*$N:flags=neighbor[n];[0][n]overlay=98:35[t];[t][e]overlay=-199:-71" \
  -frames:v 1 "$tmp/icon.png"
cp "$tmp/icon.png" assets/icon-512.png
ffmpeg -loglevel error -y -i "$tmp/icon.png" -vf "scale=192:192:flags=area" assets/icon-192.png
ffmpeg -loglevel error -y -i "$tmp/icon.png" -vf "scale=180:180:flags=area" assets/icon-180.png
rm -rf "$tmp"
echo "иконки: assets/icon-512.png, icon-192.png, icon-180.png"
