// Картинки комнаты по сезону и времени суток.
//   node tools/rooms.mjs
// Берет assets/src/rooms/<сезон>-<время>.png (сезон winter, spring, summer, autumn; время day, evening, night),
// уменьшает до 1280 px по ширине, пишет assets/bg/room-<сезон>-<время>.webp и список готовых картинок
// в js/room-art.js. По этому списку приложение выбирает картинку и не просит несуществующих файлов.
// Нужны ffmpeg и cwebp.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const TIMES = ['day', 'evening', 'night'];
const SRC = 'assets/src/rooms';
const OUT = 'assets/bg';
const WIDTH = 1280;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'en-rooms-'));
const done = [];
for (const file of fs.readdirSync(SRC).sort()) {
  const m = file.match(/^([a-z]+)-([a-z]+)\.(png|webp|jpe?g)$/);
  if (!m || !SEASONS.includes(m[1]) || !TIMES.includes(m[2])) {
    console.log(`пропускаю ${file}: имя должно быть <сезон>-<время>.png`);
    continue;
  }
  const name = `${m[1]}-${m[2]}`;
  const png = path.join(tmp, `${name}.png`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(SRC, file), '-vf', `scale=${WIDTH}:-2:flags=lanczos`, png]);
  execFileSync('cwebp', ['-quiet', '-q', '84', '-m', '6', png, '-o', path.join(OUT, `room-${name}.webp`)]);
  done.push(name);
  console.log(`room-${name}.webp`);
}
fs.rmSync(tmp, { recursive: true, force: true });

const list = done.map((n) => `  '${n}',`).join('\n');
fs.writeFileSync(
  'js/room-art.js',
  `// Какие картинки комнаты нарисованы: assets/bg/room-<сезон>-<время>.webp.
// Файл пишет tools/rooms.mjs, руками не править. Чего здесь нет, то приложение заменяет ближайшей картинкой и светом.
export const ROOM_ART = [
${list}
];
`,
);
console.log(`готово: ${done.length}, список в js/room-art.js`);
