// Выдуманный журнал для режима ?demo: пять недель до сегодняшней включительно.
// Нужен, чтобы посмотреть интерфейс с данными, не трогая настоящий дневник.

import { addDays, weekOf } from './rules.js';

export function demoState(today) {
  const cur = weekOf(today);
  const start = addDays(cur, -28);
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

  // Елисей: три тренировки и три чтения почти каждую неделю
  for (let w = 0; w < 5; w++) {
    [0, 2, 4].forEach((d) => put(0, 'sport', at(w, d)));
    (w === 1 ? [3] : [1, 3, 5]).forEach((d) => put(0, 'read', at(w, d)));
  }
  // Неля: много читает, спорт был, но давно
  for (let w = 0; w < 5; w++) [0, 2, 4, 6].forEach((d) => put(1, 'read', at(w, d)));
  [
    [0, 1],
    [0, 3],
    [1, 2],
    [1, 5],
    [2, 2],
  ].forEach(([w, d]) => put(1, 'sport', at(w, d)));
  // вместе: оба в один день
  put(1, 'sport', at(0, 2));
  put(0, 'read', at(2, 4));
  // готовка
  [0, 9, 16].forEach((k) => put(0, 'cook', addDays(today, -k)));
  [1, 3, 6, 10, 13, 20, 24].forEach((k) => put(1, 'cook', addDays(today, -k)));
  put(0, 'cook', at(3, 5));
  put(1, 'cook', at(3, 5));
  // питание в этом месяце: у Нели шоколад сверх лимита сегодня, у Елисея булочки ровно в лимите
  put(0, 'bun', thisMonth(5), { n: 2 });
  put(0, 'bun', thisMonth(1));
  put(0, 'curd', thisMonth(2), { n: 2 });
  put(0, 'burger', thisMonth(8));
  put(1, 'croissant', thisMonth(4));
  put(1, 'bun', thisMonth(3));
  put(1, 'chocolate', today, { n: 2 });
  put(1, 'flatbread', thisMonth(6));
  // прошлые недели: немного еды в прошлом месяце
  put(0, 'chips', at(0, 5));
  put(0, 'shawarma', at(1, 6));
  put(1, 'fastfood', at(1, 6));
  put(1, 'bun', at(0, 3), { n: 3 });

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
