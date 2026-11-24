// Выдуманный журнал для режима ?demo: десять недель до сегодняшней включительно,
// чтобы целиком был виден и прошлый месяц (для итога месяца).
// Нужен, чтобы посмотреть интерфейс с данными, не трогая настоящий дневник.

import { addDays, weekOf } from './rules.js';

const WEEKS = 10;

export function demoState(today) {
  const cur = weekOf(today);
  const start = addDays(cur, -7 * (WEEKS - 1));
  const monthStart = `${today.slice(0, 7)}-01`;
  const events = {};
  let n = 0;
  const put = (who, kind, day, extra = {}) => {
    if (day > today || day < start) return;
    n += 1;
    const id = `demo${n}`;
    events[id] = { id, who, kind, day, at: n, ...extra };
  };
  const at = (w, d) => addDays(start, w * 7 + d);
  /** день этого месяца: k дней назад, но не раньше первого числа */
  const thisMonth = (k) => {
    const d = addDays(today, -k);
    return d < monthStart ? monthStart : d;
  };

  // Елисей: три тренировки почти каждую неделю, чтение то три раза, то раз
  for (let w = 0; w < WEEKS; w++) {
    (w % 4 === 2 ? [0, 4] : [0, 2, 4]).forEach((d) => put(0, 'sport', at(w, d)));
    (w % 3 === 1 ? [3] : [1, 3, 5]).forEach((d) => put(0, 'read', at(w, d)));
  }
  // Неля: много читает; спорт был, но последние две недели его нет
  for (let w = 0; w < WEEKS; w++) [0, 2, 4, 6].forEach((d) => put(1, 'read', at(w, d)));
  for (let w = 0; w < WEEKS - 2; w++) [1, w % 2 ? 5 : 3].forEach((d) => put(1, 'sport', at(w, d)));
  // готовка: у Нели часто, у Елисея реже
  for (let k = 1; k < 70; k += 4) put(1, 'cook', addDays(today, -k));
  for (let k = 0; k < 70; k += 9) put(0, 'cook', addDays(today, -k));
  // питание в этом месяце: у Нели шоколад сверх лимита сегодня, у Елисея булочки ровно в лимите
  put(0, 'bun', thisMonth(5), { n: 2 });
  put(0, 'bun', thisMonth(1));
  put(0, 'curd', thisMonth(2), { n: 2 });
  put(0, 'burger', thisMonth(8));
  put(1, 'croissant', thisMonth(4));
  put(1, 'bun', thisMonth(3));
  put(1, 'chocolate', today, { n: 2 });
  put(1, 'flatbread', thisMonth(6));
  // прошлые недели: немного еды
  put(0, 'chips', at(1, 5));
  put(0, 'shawarma', at(3, 6));
  put(0, 'bun', at(4, 2), { n: 2 });
  put(1, 'fastfood', at(3, 6));
  put(1, 'bun', at(2, 3), { n: 3 });
  put(1, 'croissant', at(5, 1));

  return {
    settings: {
      players: [{ name: 'Елисей' }, { name: 'Неля' }],
      start,
      createdDay: addDays(start, -1),
      looks: { p0: 'sport', p1: 'casual' },
    },
    events,
  };
}
