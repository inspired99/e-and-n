import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  addMonths,
  dow,
  foodsOf,
  monthEnd,
  monthSummary,
  monthWeeks,
  moscowDay,
  mood,
  normalize,
  overIds,
  preview,
  shoutFor,
  stickers,
  timeline,
  unseenKisses,
  moscowHour,
  seasonOf,
  timeOfDay,
  sceneAt,
  isNewYearDay,
  praiseFor,
  monthStory,
  storyDue,
  weekOf,
} from '../js/rules.js';

const START = '2026-10-26'; // понедельник
const day = (n) => addDays(START, n);

let seq = 0;
function make({ settings = {}, events = [] } = {}) {
  const state = { settings: { start: START, createdDay: '2026-10-26', ...settings }, events: {} };
  for (const [who, kind, d, extra] of events) {
    const id = `e${++seq}`;
    state.events[id] = { id, who, kind, day: d, at: seq, ...(extra || {}) };
  }
  return state;
}

/** Неделя с набранной целью: три спорта и три чтения. */
const perfect = (who, w) => [0, 2, 4].flatMap((d) => [
  [who, 'sport', day(w * 7 + d)],
  [who, 'read', day(w * 7 + d + 1)],
]);

/** Октябрь со слов владельца: что было до приложения. */
const OCTOBER = {
  p0: { cook: 1, bun: 2, chocolate: 1, curd: 3 },
  p1: { cook: 4, bun: 1, croissant: 2, chocolate: 2 },
};

test('даты: неделя с понедельника, месяцы и их недели', () => {
  assert.equal(dow('2026-10-26'), 0);
  assert.equal(weekOf('2026-11-01'), '2026-10-26');
  assert.equal(monthEnd('2026-02'), '2026-02-28');
  assert.equal(monthEnd('2026-10'), '2026-10-31');
  assert.deepEqual(monthWeeks('2026-10'), ['2026-09-28', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  assert.equal(addMonths('2026-12', 1), '2027-01');
});

test('настройки по умолчанию: цели по 3, готовка 5, лимиты из таблицы владельца', () => {
  const s = normalize({});
  assert.deepEqual(s.goals, { sport: [3, 3], read: [3, 3], cook: [5, 5] });
  assert.deepEqual(s.limits.croissant, [null, 3]); // Елисей круассаны не считает
  assert.deepEqual(s.limits.curd, [5, null]); // Неля не считает сырки
  assert.deepEqual(s.limits.bun, [3, 2]);
  assert.equal(foodsOf(s, 0).includes('croissant'), false);
  assert.equal(foodsOf(s, 1).length, 8);
});

test('«не считаем» хранится как -1, свои цели и лимиты на каждого', () => {
  const s = normalize({ food: { chips: { p0: -1, p1: 4 } }, weekly: { sport: { goal: { p0: 2, p1: 5 } } }, monthly: { cook: { goal: { p0: 0, p1: 8 } } } });
  assert.deepEqual(s.limits.chips, [null, 4]);
  assert.deepEqual(s.limits.shawarma, [1, 1]); // остальное по умолчанию
  assert.deepEqual(s.goals.sport, [2, 5]);
  assert.deepEqual(s.goals.read, [3, 3]);
  assert.deepEqual(s.goals.cook, [0, 8]);
});

test('неделя: счетчики спорта и чтения и выполнение цели, без оценок', () => {
  const state = make({ events: [...perfect(0, 0), [0, 'sport', day(6)], [1, 'sport', day(0)], [1, 'read', day(1)], [1, 'read', day(2)]] });
  const [wk] = timeline(state, day(7));
  assert.equal(wk.closed, true);
  assert.deepEqual(wk.counts.sport, [4, 1]);
  assert.deepEqual(wk.counts.read, [3, 2]);
  assert.deepEqual(wk.met, [{ sport: true, read: true }, { sport: false, read: false }]);
  assert.equal('gems' in wk, false); // бриллиантов больше нет
  assert.equal('lvlUp' in wk, false); // и уровня тоже
});

test('свои цели: у кого цель спорта 1, тому хватает одной тренировки', () => {
  const state = make({ settings: { weekly: { sport: { goal: { p0: 1 } }, read: { goal: { p0: 1 } } } }, events: [[0, 'sport', day(0)], [0, 'read', day(0)]] });
  assert.deepEqual(timeline(state, day(1))[0].met[0], { sport: true, read: true });
});

test('старые настройки уровня и бриллиантов не мешают', () => {
  const state = make({ settings: { lvlWeeks: 1, lvlMax: 3, gem3: 50, resetDay: day(3), goalLevel: 2, goalGems: 4, overCost: 2, cookCost: 3 }, events: perfect(0, 0) });
  const weeks = timeline(state, day(14));
  assert.equal(weeks.length, 3);
  assert.equal(stickers(state, day(14)).length, 8);
});

test('месяц: лимиты, перебор и цель готовки', () => {
  const state = make({
    events: [
      [0, 'chips', '2026-11-03'],
      [0, 'chips', '2026-11-10'], // вторые чипсы при лимите 1
      [0, 'bun', '2026-11-04', { n: 3 }], // три булочки при лимите 3: ровно в лимите
      ...[2, 5, 9, 12, 16].map((d) => [0, 'cook', `2026-11-${String(d).padStart(2, '0')}`]),
      [1, 'cook', '2026-11-02'],
    ],
  });
  const ms = monthSummary(state, '2026-11', '2026-12-01');
  assert.equal(ms.closed, true);
  assert.deepEqual(ms.used.chips, [2, 0]);
  assert.deepEqual(ms.over[0], ['chips']);
  assert.deepEqual(ms.over[1], []);
  assert.deepEqual(ms.cook.map((c) => c.met), [true, false]);
  assert.equal('gems' in ms, false); // оценок за месяц нет
  // отметка, которая перешла лимит, красная; та, что в лимите, нет
  const ids = overIds(state);
  const chips = Object.values(state.events).filter((e) => e.kind === 'chips').sort((a, b) => a.at - b.at);
  assert.equal(ids.has(chips[0].id), false);
  assert.equal(ids.has(chips[1].id), true);
  assert.equal(ids.size, 1);
});

test('продукт, который человек не считает, не дает перебора', () => {
  const state = make({ events: [[0, 'croissant', '2026-11-05', { n: 4 }]] });
  const ms = monthSummary(state, '2026-11', '2026-11-20');
  assert.deepEqual(ms.over[0], []);
  assert.equal(overIds(state).size, 0);
});

test('перенос октября: у Нели шоколад 2 / 1 и готовка 4 из 5, у Елисея сырки 3 / 5', () => {
  const state = make({ settings: { carry: { '2026-10': OCTOBER } } });
  const oct = monthSummary(state, '2026-10', '2026-10-28');
  assert.equal(oct.carry, true);
  assert.equal(oct.closed, false);
  assert.deepEqual(oct.used.chocolate, [1, 2]);
  assert.deepEqual(oct.over[1], ['chocolate']);
  assert.deepEqual(oct.over[0], []);
  assert.deepEqual([oct.cook[1].done, oct.cook[1].goal], [4, 5]);
  assert.deepEqual([oct.cook[0].done, oct.cook[0].goal], [1, 5]);
  assert.deepEqual(oct.used.curd, [3, 0]);
  assert.deepEqual(oct.used.croissant, [0, 2]);
  assert.deepEqual(oct.cook.map((c) => c.met), [false, false]);
  // готовка в последние дни дотягивает Нелю до цели
  const cooked = make({ settings: { carry: { '2026-10': OCTOBER } }, events: [[1, 'cook', '2026-10-29']] });
  assert.deepEqual(monthSummary(cooked, '2026-10', '2026-10-30').cook.map((c) => c.met), [false, true]);
  // шоколад сверху переноса сразу красный, сырки до лимита нет
  const more = make({ settings: { carry: { '2026-10': OCTOBER } }, events: [[0, 'curd', '2026-10-29', { n: 2 }], [0, 'chocolate', '2026-10-29']] });
  const ids = overIds(more);
  const [curd, choc] = Object.values(more.events);
  assert.equal(ids.has(curd.id), false); // 3 + 2 = 5 из 5
  assert.equal(ids.has(choc.id), true); // 1 + 1 = 2 из 1
  // в ноябре перенос не действует
  assert.deepEqual(monthSummary(state, '2026-11', '2026-11-02').used.chocolate, [0, 0]);
});

test('подсказка при отметке: будет столько из цели или из лимита', () => {
  const state = make({ settings: { carry: { '2026-10': OCTOBER } }, events: [[0, 'sport', day(0)]] });
  assert.deepEqual(preview(state, day(2), { who: 0, kind: 'sport', day: day(2) }), { scope: 'week', had: 1, will: 2, goal: 3 });
  assert.deepEqual(preview(state, day(2), { who: 1, kind: 'cook', day: day(2) }), { scope: 'month', had: 4, will: 5, goal: 5 });
  const bun = preview(state, day(2), { who: 1, kind: 'bun', day: day(2), n: 2 });
  assert.equal(bun.will, 3);
  assert.equal(bun.limit, 2);
  assert.equal(bun.over, true);
});

test('сегодня по Москве: 23:30 UTC это уже следующий день', () => {
  assert.equal(moscowDay(new Date('2026-10-28T20:59:00Z')), '2026-10-28');
  assert.equal(moscowDay(new Date('2026-10-28T21:00:00Z')), '2026-10-29');
  assert.equal(moscowDay(new Date('2026-10-28T23:30:00Z')), '2026-10-29');
});

test('поза: каждый день спит до первой своей отметки', () => {
  const at = (iso) => ({ at: Date.parse(iso) });
  const state = make({ events: [[0, 'read', day(2), at('2026-10-28T09:00:00Z')]] });
  assert.equal(mood(state, 0, day(2)), 'idle');
  assert.equal(mood(state, 1, day(2)), 'sleep'); // Неля сегодня ничего не отмечала
  assert.equal(mood(state, 0, day(3)), 'sleep'); // наступил новый день по Москве
  // отметка задним числом, сделанная сегодня, тоже будит
  const late = make({ events: [[1, 'cook', day(0), at('2026-10-29T08:00:00Z')]] });
  assert.equal(mood(late, 1, day(3)), 'idle');
  // 23:30 UTC 28-го это 29-е по Москве: будит 29-е, а не 28-е
  const night = make({ events: [[1, 'read', day(1), at('2026-10-28T23:30:00Z')]] });
  assert.equal(mood(night, 1, day(3)), 'idle');
  assert.equal(mood(night, 1, day(2)), 'sleep');
  // удаленная запись не будит
  const gone = make({ events: [[0, 'read', day(2), { del: true }]] });
  assert.equal(mood(gone, 0, day(2)), 'sleep');
});

test('поза: неделя без спорта, кашель до следующего спорта', () => {
  const state = make({ events: [[0, 'sport', day(0)], [0, 'read', day(7)], [0, 'read', day(8)]] });
  assert.equal(mood(state, 0, day(7)), 'cough'); // ровно семь дней без спорта
  const sporty = make({ events: [[0, 'sport', day(0)], [0, 'sport', day(8)]] });
  assert.equal(mood(sporty, 0, day(8)), 'idle'); // спорт вернулся, но на неделе он один
  // без спорта вообще счет идет от создания дневника
  const fresh = make({ settings: { createdDay: day(0) }, events: [[1, 'read', day(6)], [1, 'read', day(7)]] });
  assert.equal(mood(fresh, 1, day(6)), 'idle');
  assert.equal(mood(fresh, 1, day(7)), 'cough');
  // порог в настройках
  const soft = make({ settings: { coughDays: 10 }, events: [[0, 'sport', day(0)], [0, 'read', day(7)]] });
  assert.equal(mood(soft, 0, day(7)), 'idle');
});

test('поза: две тренировки за неделю, и перебор по еде позу не меняет', () => {
  const state = make({ events: [[0, 'sport', day(0)], [0, 'sport', day(2)], [0, 'chips', day(2), { n: 3 }], [1, 'sport', day(1)], [1, 'chips', day(2), { n: 3 }]] });
  assert.equal(mood(state, 0, day(2)), 'fit');
  assert.equal(mood(state, 1, day(2)), 'idle'); // один спорт, чипсы сверх лимита: не кашляет
  assert.equal(mood(state, 0, day(8)), 'sleep'); // новая неделя, сегодня ничего
  const one = make({ settings: { fitSport: 1 }, events: [[1, 'sport', day(1)]] });
  assert.equal(mood(one, 1, day(1)), 'fit');
});

test('«вместе» больше нет: одно полезное в один день у обоих дает обычный возглас', () => {
  const state = make({ events: [[1, 'sport', day(1)], [1, 'read', day(3)]] });
  assert.equal(shoutFor(state, day(3), { targets: [0], kind: 'read', day: day(3) }), 'good');
  assert.equal(shoutFor(state, day(1), { targets: [0, 1], kind: 'sport', day: day(1) }), 'good');
});

test('возгласы: цель недели, цель месяца, лимит', () => {
  const state = make({ settings: { carry: { '2026-10': OCTOBER } }, events: [[0, 'sport', day(0)], [0, 'sport', day(1)]] });
  assert.equal(shoutFor(state, day(2), { targets: [0], kind: 'sport', day: day(2) }), 'week-goal');
  assert.equal(shoutFor(state, day(2), { targets: [0], kind: 'read', day: day(2) }), 'good');
  assert.equal(shoutFor(state, day(2), { targets: [1], kind: 'cook', day: day(2) }), 'month-goal');
  assert.equal(shoutFor(state, day(2), { targets: [1], kind: 'bun', day: day(2) }), 'last'); // 1 + 1 = 2 из 2
  assert.equal(shoutFor(state, day(2), { targets: [0], kind: 'flatbread', day: day(2) }), 'ok');
  assert.equal(shoutFor(state, day(2), { targets: [1], kind: 'chocolate', day: day(2) }), 'over');
  assert.equal(shoutFor(state, day(2), { targets: [0], kind: 'croissant', day: day(2) }), null); // не считает
});

test('достижения: спорт, чтение, готовка с переносом, месяц без фастфуда', () => {
  const state = make({
    settings: { carry: { '2026-10': OCTOBER }, goalCook: 3 },
    events: [...perfect(0, 0), ...perfect(0, 1), [1, 'shawarma', '2026-11-04'], [0, 'cook', '2026-11-03']],
  });
  const today = '2026-12-02';
  const st = (who, id) => stickers(state, today).find((x) => x.who === who && x.id === id);
  assert.equal(st(0, 'sport').have, 6);
  assert.equal(st(0, 'read').have, 6);
  assert.equal(st(0, 'cook').have, 2); // 1 перенос + 1 отметка
  assert.equal(st(1, 'cook').have, 4);
  assert.equal(st(1, 'cook').got, true);
  assert.equal(st(0, 'nofast').have, 2); // октябрь и ноябрь
  assert.equal(st(1, 'nofast').have, 1); // в ноябре шаурма
  assert.equal(st(0, 'gems'), undefined);
  assert.equal(st(0, 'level'), undefined);
  assert.equal(stickers(state, today).length, 8);
});

test('поцелуи: непоказанные человеку, моложе трех дней, несколько сливаются в ×N', () => {
  const now = Date.parse('2026-10-29T12:00:00Z');
  const h = 3600000;
  const kisses = {
    a: { id: 'a', from: 0, to: 1, at: now - 2 * h },
    b: { id: 'b', from: 0, to: 1, at: now - 1 * h },
    c: { id: 'c', from: 0, to: 1, at: now - 30 * h },
    old: { id: 'old', from: 0, to: 1, at: now - 73 * h }, // старше трех дней
    gone: { id: 'gone', from: 0, to: 1, at: now - h / 2, del: true }, // убран
    mine: { id: 'mine', from: 1, to: 0, at: now - h / 4 }, // Нелин поцелуй Елисею
  };
  const state = { kisses };
  assert.deepEqual(unseenKisses(state, 1, 0, now), { n: 3, from: 0, last: now - h });
  // устройство уже показало все до a включительно: остался один
  assert.deepEqual(unseenKisses(state, 1, now - 2 * h, now), { n: 1, from: 0, last: now - h });
  assert.equal(unseenKisses(state, 1, now - h, now), null); // все показаны
  assert.deepEqual(unseenKisses(state, 0, 0, now), { n: 1, from: 1, last: now - h / 4 });
  assert.equal(unseenKisses({}, 0, 0, now), null);
  // через три дня тот же поцелуй уже не всплывает
  assert.equal(unseenKisses({ kisses: { a: kisses.a } }, 1, 0, now + 72 * h), null);
});

test('сезон по дате: границы 15 ноября, 15 марта, 1 июня и 1 сентября', () => {
  const cases = {
    '2026-11-14': 'autumn',
    '2026-11-15': 'winter',
    '2026-12-31': 'winter',
    '2027-01-01': 'winter',
    '2027-03-14': 'winter',
    '2027-03-15': 'spring',
    '2027-05-31': 'spring',
    '2027-06-01': 'summer',
    '2027-08-31': 'summer',
    '2027-09-01': 'autumn',
  };
  for (const [day, season] of Object.entries(cases)) assert.equal(seasonOf(day), season, day);
});

test('время суток: часы каждого сезона, края включительно', () => {
  // зима: день 9-16, вечер 16-21, ночь 21-9
  assert.deepEqual([8, 9, 15, 16, 20, 21, 0].map((h) => timeOfDay('winter', h)), ['night', 'day', 'day', 'evening', 'evening', 'night', 'night']);
  // осень: день 8-17, вечер 17-21
  assert.deepEqual([7, 8, 16, 17, 20, 21].map((h) => timeOfDay('autumn', h)), ['night', 'day', 'day', 'evening', 'evening', 'night']);
  // весна: день 7-19, вечер 19-22
  assert.deepEqual([6, 7, 18, 19, 21, 22].map((h) => timeOfDay('spring', h)), ['night', 'day', 'day', 'evening', 'evening', 'night']);
  // лето: день 6-20, вечер 20-23
  assert.deepEqual([5, 6, 19, 20, 22, 23].map((h) => timeOfDay('summer', h)), ['night', 'day', 'day', 'evening', 'evening', 'night']);
});

test('сейчас в комнате: по Москве, 23:30 UTC это уже ночь следующего дня', () => {
  assert.equal(moscowHour(new Date('2026-11-23T23:30:00Z')), 2);
  assert.deepEqual(sceneAt(new Date('2026-11-23T23:30:00Z')), { season: 'winter', time: 'night', autoSeason: 'winter', autoTime: 'night', festive: true });
  // 14 ноября 20:59 по Москве: еще осень и вечер; 21:00 уже ночь
  assert.deepEqual(sceneAt(new Date('2026-11-14T17:59:00Z')), { season: 'autumn', time: 'evening', autoSeason: 'autumn', autoTime: 'evening', festive: false });
  assert.equal(sceneAt(new Date('2026-11-14T18:00:00Z')).time, 'night');
  // 15 ноября 00:30 по Москве (14-го 21:30 UTC): уже зима
  assert.equal(sceneAt(new Date('2026-11-14T21:30:00Z')).season, 'winter');
  // зимний день: 12:00 по Москве
  assert.equal(sceneAt(new Date('2026-12-10T09:00:00Z')).time, 'day');
  // выбор на устройстве важнее, но часы считаются по настоящему сезону
  const forced = sceneAt(new Date('2026-12-10T09:00:00Z'), { season: 'summer', time: 'auto' });
  assert.deepEqual([forced.season, forced.time], ['summer', 'day']);
  assert.equal(sceneAt(new Date('2026-12-10T09:00:00Z'), { time: 'night' }).time, 'night');
  assert.equal(sceneAt(new Date('2026-12-10T09:00:00Z'), { season: 'нет такого' }).season, 'winter');
});

test('новогодняя комната: с 15 ноября по 14 января, только зимой', () => {
  const cases = { '2026-11-14': false, '2026-11-15': true, '2026-12-31': true, '2027-01-01': true, '2027-01-14': true, '2027-01-15': false, '2027-02-20': false, '2027-07-01': false };
  for (const [day, want] of Object.entries(cases)) assert.equal(isNewYearDay(day), want, day);
  // 14 января 23:30 по Москве еще праздник, 15 января 00:30 уже нет
  assert.equal(sceneAt(new Date('2027-01-14T20:30:00Z')).festive, true);
  assert.equal(sceneAt(new Date('2027-01-14T21:30:00Z')).festive, false);
  // выбрано лето на устройстве: елки нет даже в праздники
  assert.equal(sceneAt(new Date('2026-12-10T09:00:00Z'), { season: 'summer' }).festive, false);
});

/** Цифры месяца для проверки похвалы. */
const facts = (over = {}) => ({
  month: '2026-11',
  sport: 8,
  read: 10,
  perWeek: { sport: 1.9, read: 2.3 },
  cook: { done: 3, goal: 5, met: false },
  food: { counted: 8, over: ['chips'], inLimit: 7 },
  weeks: 4,
  weeksMet: 1,
  streak: { len: 2, from: '2026-11-03', to: '2026-11-04' },
  useful: 21,
  ...over,
});

test('похвала: цель готовки, вся еда в лимите и недели с целями идут первыми, не больше трех', () => {
  const p = praiseFor(facts({ cook: { done: 5, goal: 5, met: true }, food: { counted: 8, over: [], inLimit: 8 }, weeksMet: 3, streak: { len: 6, from: '2026-11-10', to: '2026-11-15' } }), facts({ sport: 2 }));
  assert.deepEqual(p.map((x) => x.code), ['cook-goal', 'food-all', 'week-goals']);
  assert.deepEqual(p[0], { code: 'cook-goal', done: 5, goal: 5 });
});

test('похвала: больше, чем в прошлом месяце у себя же, и длинная серия', () => {
  const p = praiseFor(facts({ sport: 12, streak: { len: 5, from: '2026-11-10', to: '2026-11-14' } }), facts({ month: '2026-10', sport: 7, read: 12 }));
  assert.deepEqual(p.map((x) => x.code), ['more-sport', 'streak', 'food-most']);
  assert.deepEqual(p[0], { code: 'more-sport', now: 12, was: 7, month: '2026-10' });
  // чтения меньше, чем в прошлом: про чтение молчим
  assert.ok(!p.some((x) => x.code === 'more-read'));
});

test('похвала: без прошлого месяца и почти без поводов все равно две строки, тихий месяц тоже', () => {
  const p = praiseFor(facts({ food: { counted: 8, over: ['chips', 'bun', 'burger', 'shawarma', 'fastfood'], inLimit: 3 } }), null);
  assert.deepEqual(p.map((x) => x.code), ['steady']);
  // одна строка дополняется до двух
  const one = praiseFor(facts(), null);
  assert.deepEqual(one.map((x) => x.code), ['food-most', 'steady']);
  const quiet = praiseFor(facts({ sport: 0, read: 0, useful: 0, cook: { done: 0, goal: 5, met: false }, food: { counted: 0, over: [], inLimit: 0 } }), null);
  assert.deepEqual(quiet.map((x) => x.code), ['quiet']);
});

test('итог месяца по журналу: октябрь с переносом, сравнение только с собой', () => {
  const state = make({
    settings: { carry: { '2026-10': OCTOBER } },
    events: [
      [0, 'sport', '2026-10-26'],
      [0, 'sport', '2026-10-28'],
      [0, 'read', '2026-10-27'],
      [0, 'read', '2026-10-28'],
      [0, 'read', '2026-10-29'],
      [0, 'read', '2026-10-30'],
      [1, 'cook', '2026-10-29'],
      [0, 'sport', '2026-11-02'],
      [0, 'sport', '2026-11-03'],
      [0, 'sport', '2026-11-05'],
    ],
  });
  const oct = monthStory(state, 1, '2026-10', '2026-11-24');
  assert.equal(oct.cook.done, 5);
  assert.equal(oct.cook.met, true);
  assert.deepEqual(oct.food.over, ['chocolate']);
  assert.equal(oct.food.inLimit, 7);
  assert.equal(oct.praise[0].code, 'cook-goal'); // Неля дотянула готовку до цели
  const el = monthStory(state, 0, '2026-10', '2026-11-24');
  assert.deepEqual([el.sport, el.read], [2, 4]);
  assert.equal(el.perWeek.sport, 0.5); // 2 за 31 день: 0,45 в неделю
  assert.deepEqual(el.streak, { len: 5, from: '2026-10-26', to: '2026-10-30' });
  assert.ok(el.praise.some((p) => p.code === 'streak'));
  assert.ok(el.praise.some((p) => p.code === 'food-all')); // сырки 3 / 5, шоколад 1 / 1: все в лимите
  // в ноябре спорта больше, чем в октябре
  const nov = monthStory(state, 0, '2026-11', '2026-12-02');
  assert.deepEqual(nov.praise.find((p) => p.code === 'more-sport'), { code: 'more-sport', now: 3, was: 2, month: '2026-10' });
});

test('итог при входе: первые 7 дней месяца, один раз, только если дневник уже был', () => {
  const state = make({ settings: { carry: { '2026-10': OCTOBER } } });
  assert.equal(storyDue(state, '2026-11-01', null), '2026-10');
  assert.equal(storyDue(state, '2026-11-07', '2026-09'), '2026-10');
  assert.equal(storyDue(state, '2026-11-08', null), null); // позже седьмого не всплывает
  assert.equal(storyDue(state, '2026-11-03', '2026-10'), null); // уже показан
  assert.equal(storyDue(state, '2026-10-03', null), null); // в сентябре дневника не было
  assert.equal(storyDue(state, '2026-12-02', '2026-10'), '2026-11');
});
