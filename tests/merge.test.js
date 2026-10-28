// Перенос отметок из другого дневника: добавляем только то, чего нет, повторы пропускаем.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeWrites } from '../js/merge.js';

const ev = (id, who, kind, day, extra = {}) => ({ id, who, kind, day, at: 1, ...extra });

test('переносятся отметки, которых здесь нет', () => {
  const target = { events: { a: ev('a', 0, 'sport', '2026-10-10') } };
  const source = { events: { b: ev('b', 0, 'bun', '2026-10-13', { n: 2 }), c: ev('c', 1, 'read', '2026-10-14') } };
  const writes = mergeWrites(target, source);
  assert.deepEqual(writes.map((w) => w.path), ['events/b', 'events/c']);
  assert.equal(writes[0].value.n, 2);
});

test('повторы и удаленное не переносятся', () => {
  const target = { events: { a: ev('a', 0, 'sport', '2026-10-10'), x: ev('x', 1, 'cook', '2026-10-11') } };
  const source = {
    events: {
      a: ev('a', 0, 'sport', '2026-10-10'), // та же запись
      d: ev('d', 1, 'cook', '2026-10-11'), // то же событие, записанное второй раз
      e: ev('e', 0, 'read', '2026-10-12', { del: true }), // удалено
      f: ev('f', 0, 'sport', '2026-10-13'),
      g: ev('g', 0, 'sport', '2026-10-13'), // дубль внутри источника
    },
  };
  assert.deepEqual(mergeWrites(target, source).map((w) => w.path), ['events/f']);
});

test('пустой источник или пустой дневник', () => {
  assert.deepEqual(mergeWrites({}, {}), []);
  assert.equal(mergeWrites({}, { events: { a: ev('a', 0, 'sport', '2026-10-10') } }).length, 1);
});
