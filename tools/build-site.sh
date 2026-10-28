#!/bin/sh
# Собирает сайт в папку: только его файлы, без тестов, инструментов и исходников картинок,
# и пишет версию (version.json и js/build.js) по хешу и времени коммита.
#   sh tools/build-site.sh _site
# Так собирают и GitHub Pages (.github/workflows/pages.yml), и Cloudflare Pages
# (команда сборки `sh tools/build-site.sh _site`, папка `_site`).
set -eu

out="${1:?нужна папка: sh tools/build-site.sh _site}"
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

# папка должна быть новой: в CI она всегда пустая
mkdir -p "$out/assets"
cp index.html manifest.webmanifest config.js .nojekyll "$out/"
cp -R css js "$out/"
cp -R assets/bg assets/sprites assets/props "$out/assets/"
cp assets/icon-*.png "$out/assets/"
find "$out/assets" -name '*.json' -exec rm -f {} +

sha="${CF_PAGES_COMMIT_SHA:-${GITHUB_SHA:-$(git rev-parse --verify -q HEAD 2>/dev/null || echo local)}}"
at="$(git log -1 --format=%cI 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)"
# по этому файлу открытое приложение узнает, что вышла новая версия
printf '{"v":"%s"}\n' "$sha" > "$out/version.json"
# версия внутри самого кода: хеш и время коммита, их видно внизу главной и в меню
printf "export const BUILD = { v: '%s', at: '%s' };\n" "$sha" "$at" > "$out/js/build.js"
echo "сайт собран в $out, версия $sha"
