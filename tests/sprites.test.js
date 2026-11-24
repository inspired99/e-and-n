import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FOOD, GOOD } from '../js/rules.js';
import { LOOKS, POSES, allGrids, hero, icon, roomArt } from '../js/sprites.js';
import { ROOM_ART } from '../js/room-art.js';

test('все сетки прямоугольные и нужного размера', () => {
  for (const g of allGrids()) {
    assert.equal(g.rows.length, g.h, `${g.name}: строк ${g.rows.length}, ждали ${g.h}`);
    g.rows.forEach((row, y) => {
      assert.equal(row.length, g.w, `${g.name}: строка ${y} длиной ${row.length}, ждали ${g.w}`);
      assert.match(row, /^[.A-Z]+$/, `${g.name}: строка ${y}`);
    });
  }
});

test('у каждого вида отметки свой значок', () => {
  const names = allGrids().map((g) => g.name);
  for (const kind of [...GOOD, ...FOOD]) assert.ok(names.includes(`icon ${kind}`), kind);
  assert.match(icon('sport'), /^<svg class="px"/);
});

test('у каждого образа есть картинка на каждую позу', () => {
  const src = (html) => html.match(/src="([^"]+)"/)[1];
  LOOKS.forEach((looks, who) => {
    for (const look of looks) for (const pose of POSES) assert.ok(fs.existsSync(src(hero(who, look, pose))), `${who} ${look} ${pose}`);
  });
  assert.match(hero(0, 'нет такого', 'нет такой'), /elisey-base-idle/);
  assert.match(hero(1, 'winter', 'cough'), /nelya-winter-cough/);
  assert.match(hero(0, 'winter', 'idle'), /elisey-winter-idle/); // зимний у Елисея появился 29.10
});

test('картинки комнаты: список совпадает с файлами, без запросов к несуществующим', () => {
  const files = fs.readdirSync('assets/bg').filter((f) => /^room-.+\.webp$/.test(f)).map((f) => f.slice(5, -5)).sort();
  assert.deepEqual([...ROOM_ART].sort(), files);
  for (const season of ['winter', 'spring', 'summer', 'autumn']) {
    for (const time of ['day', 'evening', 'night']) {
      const art = roomArt(season, time);
      assert.ok(fs.existsSync(art.file), `${season} ${time}: ${art.file}`);
    }
  }
});

test('ближайшая картинка: сначала то же время суток, потом соседний сезон; свет, если время другое', () => {
  assert.deepEqual(roomArt('winter', 'night', ['autumn-evening']), { file: 'assets/bg/room-autumn-evening.webp', light: 'night' });
  assert.deepEqual(roomArt('autumn', 'evening', ['autumn-evening']), { file: 'assets/bg/room-autumn-evening.webp', light: null });
  // ночь любого сезона лучше вечера того же сезона
  assert.deepEqual(roomArt('winter', 'night', ['winter-evening', 'summer-night']), { file: 'assets/bg/room-summer-night.webp', light: null });
  // из двух ночей ближе соседний сезон: у зимы это осень, а не лето
  assert.equal(roomArt('winter', 'night', ['summer-night', 'autumn-night']).file, 'assets/bg/room-autumn-night.webp');
  assert.deepEqual(roomArt('winter', 'day', ['winter-night']), { file: 'assets/bg/room-winter-night.webp', light: 'day' });
  assert.deepEqual(roomArt('spring', 'day', []), { file: null, light: 'day' });
});

test('новогодняя комната: в праздники своя картинка, в остальные дни ее нет даже как запасной', () => {
  const list = ['winter-night', 'newyear-night', 'newyear-evening'];
  assert.deepEqual(roomArt('winter', 'night', list, true), { file: 'assets/bg/room-newyear-night.webp', light: null });
  assert.deepEqual(roomArt('winter', 'night', list, false), { file: 'assets/bg/room-winter-night.webp', light: null });
  // нет новогоднего дня: обычный зимний подбор, без елки
  assert.equal(roomArt('winter', 'day', list, true).file, 'assets/bg/room-winter-night.webp');
  assert.equal(roomArt('autumn', 'evening', ['newyear-evening', 'autumn-night'], false).file, 'assets/bg/room-autumn-night.webp');
});
