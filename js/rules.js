// Правила E&N. Только чистые функции: без DOM, без текущего времени.
// Дни передаются строками 'YYYY-MM-DD', неделя начинается с понедельника, месяц это 'YYYY-MM'.
// Все числа берутся из настроек дневника, здесь только значения по умолчанию.

/** Полезное по неделям: цель на неделю каждому. */
export const WEEKLY = ['sport', 'read'];
/** Полезное по месяцам: цель на месяц каждому. */
export const MONTHLY = ['cook'];
export const GOOD = [...WEEKLY, ...MONTHLY];
/** Питание: общий каталог, лимит на месяц у каждого свой. */
export const FOOD = ['chips', 'shawarma', 'fastfood', 'burger', 'bun', 'croissant', 'chocolate', 'flatbread', 'curd'];
/** Что считается фастфудом в достижении «месяц без фастфуда». */
export const FAST = ['shawarma', 'fastfood', 'burger'];
export const KINDS = [...GOOD, ...FOOD];
export const isFood = (kind) => FOOD.includes(kind);

/** В базе «этому не считаем» хранится как -1: Firebase стирает null. */
export const OFF = -1;

export const DEFAULTS = {
  // цели: на неделю спорт и чтение, на месяц готовка
  goals: { sport: [3, 3], read: [3, 3], cook: [5, 5] },
  // лимиты на месяц: null значит «этому не считаем»
  limits: {
    chips: [1, 1],
    shawarma: [1, 1],
    fastfood: [1, 1],
    burger: [2, 2],
    bun: [3, 2],
    croissant: [null, 3],
    chocolate: [1, 1],
    flatbread: [5, 5],
    curd: [5, null],
  },
  // поза: кашляет после стольких дней без спорта, в форме от стольких тренировок за неделю
  coughDays: 7,
  fitSport: 2,
  // цели достижений
  goalSport: 10,
  goalRead: 10,
  goalCook: 10,
  goalNoFast: 1,
};
// Уровней, бриллиантов и «вместе» больше нет (владелец 29.10.2026: не соревноваться друг с другом).
// Старые ключи настроек (gem1..3, lvl*, badMonthGems, resetDay, goalGems, goalLevel, overCost, cookCost) просто не читаются.

/** Достижения с числом: в какой настройке лежит цель. */
export const GOAL_KEYS = { sport: 'goalSport', read: 'goalRead', cook: 'goalCook', nofast: 'goalNoFast' };
export const GOAL_MAX = 99;
/** Пределы чисел в настройках: [от, до]. Меню и нормализация берут их отсюда. */
export const RANGE = {
  weekGoal: [1, 14],
  cookGoal: [0, 31],
  limit: [0, 30],
  coughDays: [1, 30],
  fitSport: [1, 14],
};

// --- даты ---------------------------------------------------------------

const DAY_MS = 86400000;
const toUTC = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUTC = (ms) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (day, n) => fromUTC(toUTC(day) + n * DAY_MS);
export const diffDays = (a, b) => Math.round((toUTC(a) - toUTC(b)) / DAY_MS);
/** 0 = понедельник, 6 = воскресенье */
export const dow = (day) => (new Date(toUTC(day)).getUTCDay() + 6) % 7;
export const weekOf = (day) => addDays(day, -dow(day));
export const weekDays = (weekStart) => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

/** День по Москве 'YYYY-MM-DD': «сегодня» у всего приложения московское, новый день начинается в 00:00 по Москве. */
const MSK = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
export function moscowDay(date = new Date()) {
  return MSK.format(date);
}

/** Последний день месяца 'YYYY-MM'. */
export function monthEnd(month) {
  const [y, m] = month.split('-').map(Number);
  return fromUTC(Date.UTC(y, m, 0));
}

/** Недели (понедельники), которые задевают месяц 'YYYY-MM'. */
export function monthWeeks(month) {
  const last = monthEnd(month);
  const out = [];
  for (let w = weekOf(`${month}-01`); w <= last; w = addDays(w, 7)) out.push(w);
  return out;
}

export function addMonths(month, n) {
  const [y, m] = month.split('-').map(Number);
  return fromUTC(Date.UTC(y, m - 1 + n, 1)).slice(0, 7);
}

// --- вспомогательное ----------------------------------------------------

const clampInt = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.trunc(n) || 0));
const byTime = (a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : (a.at || 0) - (b.at || 0));
const live = (obj) => Object.values(obj || {}).filter((r) => r && !r.del && KINDS.includes(r.kind) && (r.who === 0 || r.who === 1));
const isDay = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Сколько в одной записи: еды бывает несколько за раз, полезное всегда одно. */
export const qty = (e) => (isFood(e.kind) ? clampInt(e.n || 1, 1, 9) : 1);
/** Значение на двоих из настроек: {p0, p1} или одно число на обоих. */
const pair = (v) => (v && typeof v === 'object' ? [v.p0, v.p1] : [v, v]);

export function normalize(settings) {
  const raw = settings || {};
  const s = { ...DEFAULTS, ...raw };
  for (const key of Object.keys(RANGE)) if (key in DEFAULTS) s[key] = clampInt(s[key], ...RANGE[key]);
  s.start = isDay(raw.start) ? weekOf(raw.start) : '';
  s.createdDay = isDay(raw.createdDay) ? raw.createdDay : s.start;
  for (const key of Object.values(GOAL_KEYS)) s[key] = clampInt(s[key], 1, GOAL_MAX);

  s.goals = {};
  for (const kind of WEEKLY) {
    const v = pair(raw.weekly && raw.weekly[kind] && raw.weekly[kind].goal);
    s.goals[kind] = [0, 1].map((who) => clampInt(v[who] ?? DEFAULTS.goals[kind][who], ...RANGE.weekGoal));
  }
  for (const kind of MONTHLY) {
    const v = pair(raw.monthly && raw.monthly[kind] && raw.monthly[kind].goal);
    s.goals[kind] = [0, 1].map((who) => clampInt(v[who] ?? DEFAULTS.goals[kind][who], ...RANGE.cookGoal));
  }
  s.limits = {};
  for (const id of FOOD) {
    const v = pair(raw.food && raw.food[id]);
    s.limits[id] = [0, 1].map((who) => {
      const x = v[who];
      if (x === undefined) return DEFAULTS.limits[id][who];
      if (x === null || x === false || Number(x) < 0) return null;
      return clampInt(x, ...RANGE.limit);
    });
  }
  s.carry = raw.carry && typeof raw.carry === 'object' ? raw.carry : {};
  return s;
}

/** Продукты, которые человек считает. */
export const foodsOf = (s, who) => FOOD.filter((id) => s.limits[id][who] != null);

/** Перенесенное до приложения: сколько чего было в месяце у человека. */
const carried = (s, month, who, kind) => {
  const c = s.carry[month] && s.carry[month][`p${who}`];
  return c ? clampInt(c[kind], 0, 999) : 0;
};

// --- неделя: спорт и чтение -------------------------------------------------

function countIn(events, from, to) {
  const counts = {};
  for (const kind of KINDS) counts[kind] = [0, 0];
  for (const e of events) if (e.day >= from && e.day <= to) counts[e.kind][e.who] += qty(e);
  return counts;
}

/** Неделя: сколько чего сделано и набрана ли цель спорта и чтения у каждого. Без оценок. */
function summarizeWeek(s, events, w, today) {
  const end = addDays(w, 6);
  const counts = countIn(events, w, end);
  return {
    start: w,
    end,
    index: diffDays(w, s.start) / 7 + 1,
    closed: end < today,
    counts,
    met: [0, 1].map((who) => Object.fromEntries(WEEKLY.map((kind) => [kind, counts[kind][who] >= s.goals[kind][who]]))),
  };
}

/** Счетчики недели до первой. */
export function preWeek(state, w) {
  const s = normalize(state.settings);
  return { ...summarizeWeek(s, live(state.events), w, ''), pre: true };
}

// --- месяц: готовка и питание ------------------------------------------------

/**
 * Итог месяца на двоих. Счет продукта и готовки идет с переноса (что было до приложения) плюс отметки.
 * over: продукты сверх лимита у каждого, cook: готовка против цели. Оценок за месяц нет.
 */
export function monthSummary(state, month, today) {
  const s = normalize(state.settings);
  const events = live(state.events).filter((e) => e.day.slice(0, 7) === month);
  const used = {};
  for (const kind of KINDS) used[kind] = [0, 1].map((who) => carried(s, month, who, kind));
  for (const e of events) used[e.kind][e.who] += qty(e);
  const over = [0, 1].map((who) => FOOD.filter((id) => s.limits[id][who] != null && used[id][who] > s.limits[id][who]));
  const cook = [0, 1].map((who) => ({ done: used.cook[who], goal: s.goals.cook[who], met: used.cook[who] >= s.goals.cook[who] }));
  const carry = [0, 1].some((who) => Boolean(s.carry[month] && s.carry[month][`p${who}`]));
  return { month, closed: monthEnd(month) < today, used, over, cook, carry };
}

/** Отметки еды сверх лимита: id записей. Считается по каждому месяцу от переноса и по времени. */
export function overIds(state) {
  const s = normalize(state.settings);
  const out = new Set();
  const runs = new Map();
  for (const e of live(state.events).filter((x) => isFood(x.kind)).sort(byTime)) {
    const limit = s.limits[e.kind][e.who];
    if (limit == null) continue;
    const month = e.day.slice(0, 7);
    const key = `${month}|${e.who}|${e.kind}`;
    const was = runs.has(key) ? runs.get(key) : carried(s, month, e.who, e.kind);
    const now = was + qty(e);
    runs.set(key, now);
    if (now > limit) out.add(e.id);
  }
  return out;
}

/** Первый месяц, который считается: месяц первой недели или раньше, если есть перенос. */
export function firstMonth(s) {
  const months = Object.keys(s.carry).filter((m) => /^\d{4}-\d{2}$/.test(m));
  if (s.start) months.push(s.start.slice(0, 7));
  return months.sort()[0] || null;
}

/** Месяц идет в достижения, если дневник начался не позже его первой недели или в нем есть перенос. */
const monthCounts = (s, month) => s.start <= addDays(`${month}-01`, 6) || Boolean(s.carry[month]);

/** Все недели от первой до текущей: счетчики и выполнение целей. */
export function timeline(state, today) {
  const s = normalize(state.settings);
  if (!s.start) return [];
  const cur = weekOf(today);
  const events = live(state.events);
  const out = [];
  for (let w = s.start; w <= cur; w = addDays(w, 7)) out.push(summarizeWeek(s, events, w, today));
  return out;
}

// --- состояние персонажа ---------------------------------------------------------

/**
 * Поза персонажа, по старшинству:
 *   sleep: каждый день по Москве персонаж спит до своей первой отметки в этот день. Будит любая живая запись
 *          с day === today или сделанная сегодня по Москве (at), даже задним числом;
 *   cough: coughDays дней и больше без спорта (от последнего спорта, а без него от createdDay), до следующего спорта;
 *   fit:   fitSport тренировок и больше на этой неделе, пн-вс;
 *   idle:  все остальное.
 * Перебор по еде позу не меняет: он красный в плитках питания.
 */
export function mood(state, who, today) {
  const s = normalize(state.settings);
  const mine = live(state.events).filter((e) => e.who === who);
  const awake = mine.some((e) => e.day === today || (Number(e.at) > 0 && moscowDay(new Date(Number(e.at))) === today));
  if (!awake) return 'sleep';
  const sport = mine.filter((e) => e.kind === 'sport' && e.day <= today);
  const lastSport = sport.reduce((m, e) => (e.day > m ? e.day : m), '');
  const since = lastSport || s.createdDay;
  if (since && since <= today && diffDays(today, since) >= s.coughDays) return 'cough';
  const w = weekOf(today);
  if (sport.filter((e) => e.day >= w).length >= s.fitSport) return 'fit';
  return 'idle';
}

// --- подсказки и возгласы -----------------------------------------------------

/** Что будет после отметки: сколько станет за неделю или за месяц и предел. */
export function preview(state, today, { who, kind, day, n = 1 }) {
  const s = normalize(state.settings);
  const events = live(state.events).filter((e) => e.who === who && e.kind === kind);
  if (WEEKLY.includes(kind)) {
    const w = weekOf(day);
    const had = events.filter((e) => e.day >= w && e.day <= addDays(w, 6)).length;
    return { scope: 'week', had, will: had + 1, goal: s.goals[kind][who] };
  }
  const month = day.slice(0, 7);
  const had = events.filter((e) => e.day.slice(0, 7) === month).reduce((sum, e) => sum + qty(e), carried(s, month, who, kind));
  if (kind === 'cook') return { scope: 'month', had, will: had + 1, goal: s.goals.cook[who] };
  const limit = s.limits[kind][who];
  const will = had + n;
  return { scope: 'month', had, will, limit, over: limit != null && will > limit };
}

/**
 * Какой возглас показать после отметки. Считается по состоянию до записи.
 * targets: кому отмечаем. Возвращает код: week-goal, month-goal, good, over, last, ok.
 */
export function shoutFor(state, today, { targets, kind, day, n = 1 }) {
  const who = targets[0];
  if (GOOD.includes(kind)) {
    const p = preview(state, today, { who, kind, day });
    if (p.had < p.goal && p.will >= p.goal) return p.scope === 'week' ? 'week-goal' : 'month-goal';
    return 'good';
  }
  const res = targets.map((t) => preview(state, today, { who: t, kind, day, n })).filter((p) => p.limit != null);
  if (!res.length) return null;
  if (res.some((p) => p.over)) return 'over';
  if (res.some((p) => p.will === p.limit)) return 'last';
  return 'ok';
}

// --- достижения -----------------------------------------------------------------

/** Закрытые месяцы, которые считаются: от первого до прошлого. */
export function closedMonths(s, today) {
  const first = firstMonth(s);
  if (!first) return [];
  const out = [];
  for (let m = first; monthEnd(m) < today; m = addMonths(m, 1)) if (monthCounts(s, m)) out.push(m);
  return out;
}

/** Достижения человека: have (сколько набрано), need (цель из настроек), got. */
export function stickers(state, today) {
  const s = normalize(state.settings);
  const events = live(state.events).filter((e) => e.day <= today);
  const months = closedMonths(s, today).map((m) => monthSummary(state, m, today));
  const out = [];
  for (const who of [0, 1]) {
    const count = (kind) => events.filter((e) => e.who === who && e.kind === kind).length;
    const cookCarry = Object.keys(s.carry).reduce((n, m) => n + carried(s, m, who, 'cook'), 0);
    const have = {
      sport: count('sport'),
      read: count('read'),
      cook: count('cook') + cookCarry,
      nofast: months.filter((ms) => FAST.every((id) => ms.used[id][who] === 0)).length,
    };
    for (const [id, key] of Object.entries(GOAL_KEYS)) out.push({ id, who, have: have[id], need: s[key], got: have[id] >= s[key] });
  }
  return out;
}

// --- поцелуи ------------------------------------------------------------------

/** Поцелуй старше стольких дней уже не показываем, даже если устройство его не видело. */
export const KISS_DAYS = 3;

/**
 * Непоказанные поцелуи человеку: адресованы ему, не убраны, новее того, что это устройство уже показало (seenAt),
 * и моложе KISS_DAYS. Возвращает null или { n, from, last }: сколько, от кого последний, время последнего.
 */
export function unseenKisses(state, who, seenAt = 0, now = Date.now()) {
  const fresh = Object.values(state.kisses || {}).filter((k) => {
    const at = Number(k && k.at);
    return k && !k.del && k.to === who && at > seenAt && at <= now + DAY_MS && now - at < KISS_DAYS * DAY_MS;
  });
  if (!fresh.length) return null;
  const lastKiss = fresh.reduce((a, b) => (Number(b.at) > Number(a.at) ? b : a));
  return { n: fresh.length, from: lastKiss.from === 1 ? 1 : 0, last: Number(lastKiss.at) };
}

// --- время суток и сезон ---------------------------------------------------------

const MSK_HOUR = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', hourCycle: 'h23' });
/** Час по Москве, от 0 до 23. */
export function moscowHour(date = new Date()) {
  return Number(MSK_HOUR.format(date)) % 24;
}

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
export const TIMES = ['day', 'evening', 'night'];
/** Во сколько по Москве начинаются день, вечер и ночь в каждом сезоне. Ночь идет до начала дня. */
export const DAY_HOURS = { winter: [9, 16, 21], spring: [7, 19, 22], summer: [6, 20, 23], autumn: [8, 17, 21] };

/** Сезон по дате: зима 15.11 - 14.03, весна 15.03 - 31.05, лето июнь - август, осень 01.09 - 14.11. */
export function seasonOf(day) {
  const md = day.slice(5, 10);
  if (md >= '11-15' || md < '03-15') return 'winter';
  if (md < '06-01') return 'spring';
  if (md < '09-01') return 'summer';
  return 'autumn';
}

/** Новогодняя комната: с начала зимы 15.11 по старый Новый год 14.01 включительно. */
export function isNewYearDay(day) {
  const md = day.slice(5, 10);
  return md >= '11-15' || md <= '01-14';
}

/** День, вечер или ночь в этот час по часам этого сезона. */
export function timeOfDay(season, hour) {
  const [day, evening, night] = DAY_HOURS[season] || DAY_HOURS.autumn;
  if (hour >= night || hour < day) return 'night';
  if (hour >= evening) return 'evening';
  return 'day';
}

/**
 * Что сейчас в комнате: сезон и время суток по Москве, если на устройстве не выбрано свое.
 * Часы дня, вечера и ночи всегда по настоящему сезону: свет за окном от выбранной картинки не меняется.
 */
export function sceneAt(date, { season = 'auto', time = 'auto' } = {}) {
  const day = moscowDay(date);
  const autoSeason = seasonOf(day);
  const autoTime = timeOfDay(autoSeason, moscowHour(date));
  const shown = SEASONS.includes(season) ? season : autoSeason;
  return {
    season: shown,
    time: TIMES.includes(time) ? time : autoTime,
    autoSeason,
    autoTime,
    // елка и гирлянды стоят, пока зима и на календаре праздники
    festive: shown === 'winter' && isNewYearDay(day),
  };
}

// --- итог месяца: подбадривать, а не сравнивать ------------------------------------

const round1 = (x) => Math.round(x * 10) / 10;

/** Самая длинная серия дней подряд с полезным в месяце у человека: { len, from, to }. */
function longestStreak(days) {
  let best = { len: 0, from: '', to: '' };
  let run = null;
  for (const d of [...new Set(days)].sort()) {
    run = run && diffDays(d, run.to) === 1 ? { ...run, to: d, len: run.len + 1 } : { len: 1, from: d, to: d };
    if (run.len > best.len) best = run;
  }
  return best;
}

/** Цифры месяца у одного человека. Без сравнения со вторым и без оценок. */
function monthFacts(state, s, who, month, today) {
  const ms = monthSummary(state, month, today);
  const all = live(state.events).filter((e) => e.who === who && e.day <= today);
  const mine = all.filter((e) => e.day.slice(0, 7) === month);
  const count = (kind) => mine.filter((e) => e.kind === kind).length;
  const days = Number(monthEnd(month).slice(8, 10));
  const sport = count('sport');
  const read = count('read');
  // недели месяца: те, у которых четверг в этом месяце, и только начатые дневником
  const weeks = monthWeeks(month).filter((w) => addDays(w, 3).slice(0, 7) === month && (!s.start || w >= s.start) && addDays(w, 6) < today);
  // неделя на стыке месяцев считается целиком
  const weekCount = (kind, w) => all.filter((e) => e.kind === kind && e.day >= w && e.day <= addDays(w, 6)).length;
  const weeksMet = weeks.filter((w) => WEEKLY.every((kind) => weekCount(kind, w) >= s.goals[kind][who])).length;
  const foods = foodsOf(s, who);
  return {
    month,
    sport,
    read,
    perWeek: { sport: round1(sport / (days / 7)), read: round1(read / (days / 7)) },
    cook: ms.cook[who],
    food: { counted: foods.length, over: ms.over[who], inLimit: foods.length - ms.over[who].length },
    weeks: weeks.length,
    weeksMet,
    streak: longestStreak(mine.filter((e) => GOOD.includes(e.kind)).map((e) => e.day)),
    useful: mine.filter((e) => GOOD.includes(e.kind)).length + (s.carry[month] ? carried(s, month, who, 'cook') : 0),
  };
}

/**
 * Похвала за месяц: 2-3 строки по правилам, по порядку важности. Каждая строка это код и цифры к нему,
 * слова подставляет copy.js. Сравнение только с собой же в прошлом месяце, если тогда дневник уже был.
 */
export function praiseFor(facts, prev) {
  const out = [];
  const add = (code, data = {}) => out.push({ code, ...data });
  if (facts.cook.goal > 0 && facts.cook.met) add('cook-goal', { done: facts.cook.done, goal: facts.cook.goal });
  if (facts.food.counted > 0 && facts.food.over.length === 0) add('food-all', { counted: facts.food.counted });
  if (facts.weeksMet >= 2) add('week-goals', { n: facts.weeksMet, of: facts.weeks });
  if (prev && facts.sport > prev.sport) add('more-sport', { now: facts.sport, was: prev.sport, month: prev.month });
  if (prev && facts.read > prev.read) add('more-read', { now: facts.read, was: prev.read, month: prev.month });
  if (facts.streak.len >= 4) add('streak', { ...facts.streak });
  if (prev && facts.cook.done > prev.cook.done && !out.some((p) => p.code === 'cook-goal')) add('more-cook', { now: facts.cook.done, was: prev.cook.done, month: prev.month });
  if (facts.food.counted > 0 && facts.food.over.length > 0 && facts.food.inLimit * 2 >= facts.food.counted) add('food-most', { n: facts.food.inLimit, of: facts.food.counted });
  const top = out.slice(0, 3);
  if (top.length < 2) top.push(facts.useful > 0 ? { code: 'steady', n: facts.useful } : { code: 'quiet' });
  return top;
}

/** Итог месяца у человека: цифры и похвала. */
export function monthStory(state, who, month, today) {
  const s = normalize(state.settings);
  const facts = monthFacts(state, s, who, month, today);
  const before = addMonths(month, -1);
  const first = firstMonth(s);
  const prev = first && before >= first ? monthFacts(state, s, who, before, today) : null;
  return { who, ...facts, praise: praiseFor(facts, prev) };
}

/**
 * Какой итог показать при входе: в первые 7 дней месяца, за прошлый месяц, если на этом устройстве
 * его этому человеку еще не показывали и дневник тогда уже был. Иначе null.
 */
export function storyDue(state, today, shownMonth) {
  if (Number(today.slice(8, 10)) > 7) return null;
  const s = normalize(state.settings);
  const prev = addMonths(today.slice(0, 7), -1);
  const first = firstMonth(s);
  if (!first || prev < first || shownMonth === prev) return null;
  return prev;
}
