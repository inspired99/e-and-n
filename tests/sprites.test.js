import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FOOD, GOOD } from '../js/rules.js';
import { LOOKS, POSES, allGrids, hero, icon } from '../js/sprites.js';

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
  assert.match(hero(0, 'winter', 'idle'), /elisey-base-idle/); // зимнего у Елисея пока нет
});
