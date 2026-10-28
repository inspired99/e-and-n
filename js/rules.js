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

/** Бриллиантов в неделе и в месяце не больше трех. */
export const GEMS = 3;
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
  // бриллианты недели по среднему прогрессу спорта и чтения, в процентах
  gem3: 100,
  gem2: 66,
  gem1: 33,
  // месяц: минус столько бриллиантов за каждый продукт сверх лимита и за цель готовки, не набранную к концу
  overCost: 1,
  cookCost: 1,
  // плохой месяц: бриллиантов не больше этого, снимает уровень
  badMonthGems: 0,
  // уровень растет за недели подряд с таким числом бриллиантов
  lvlWeeks: 2,
  lvlGems: 2,
  // плохая неделя: бриллиантов не больше этого; столько плохих подряд снимают уровень
  lvlDownGems: 0,
  lvlDownWeeks: 1,
  // уровень от -lvlMax до lvlMax
  lvlMax: 10,
  // поза: кашляет после стольких дней без спорта, в форме от стольких тренировок за неделю
  coughDays: 7,
  fitSport: 2,
  // с этого дня уровень считается заново: раньше ничего не двигает, история остается
  resetDay: '',
  // цели достижений
  goalSport: 10,
  goalRead: 10,
  goalCook: 10,
  goalNoFast: 1,
  goalGems: 3,
  goalLevel: 3,
};

/** Достижения с числом: в какой настройке лежит цель. */
export const GOAL_KEYS = { sport: 'goalSport', read: 'goalRead', cook: 'goalCook', nofast: 'goalNoFast', gems: 'goalGems', level: 'goalLevel' };
export const GOAL_MAX = 99;
/** Пределы чисел в настройках: [от, до]. Меню и нормализация берут их отсюда. */
export const RANGE = {
  weekGoal: [1, 14],
  cookGoal: [0, 31],
  limit: [0, 30],
  gem3: [1, 100],
  gem2: [1, 100],
  gem1: [0, 100],
  overCost: [0, 3],
  cookCost: [0, 3],
  badMonthGems: [0, 2],
  lvlWeeks: [1, 8],
  lvlGems: [1, 3],
  lvlDownGems: [0, 2],
  lvlDownWeeks: [1, 8],
  lvlMax: [1, 50],
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
  // пороги бриллиантов не могут идти задом наперед
  s.gem2 = Math.min(s.gem2, s.gem3);
  s.gem1 = Math.min(s.gem1, s.gem2);
  s.resetDay = isDay(s.resetDay) ? s.resetDay : '';
  s.start = isDay(raw.start) ? weekOf(raw.start) : '';
  s.createdDay = isDay(raw.createdDay) ? raw.createdDay : s.start;
  for (const key of Object.values(GOAL_KEYS)) s[key] = clampInt(s[key], 1, GOAL_MAX);
  s.goalLevel = Math.min(s.goalLevel, s.lvlMax);

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

/** Бриллианты недели по среднему прогрессу: доля от 0 до 1. */
export function weekGems(avg, s) {
  const pct = Math.round(avg * 100);
  if (pct >= s.gem3) return 3;
  if (pct >= s.gem2) return 2;
  if (pct >= s.gem1 && pct > 0) return 1;
  return 0;
}

function countIn(events, from, to) {
  const counts = {};
  for (const kind of KINDS) counts[kind] = [0, 0];
  for (const e of events) if (e.day >= from && e.day <= to) counts[e.kind][e.who] += qty(e);
  return counts;
}

function summarizeWeek(s, events, w, today, cur) {
  const end = addDays(w, 6);
  const counts = countIn(events, w, end);
  const progress = [0, 1].map((who) => {
    const parts = WEEKLY.map((kind) => Math.min(1, counts[kind][who] / s.goals[kind][who]));
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  });
  const future = w > cur;
  return {
    start: w,
    end,
    index: diffDays(w, s.start) / 7 + 1,
    closed: end < today,
    future,
    counts,
    progress,
    gems: progress.map((p) => (future ? null : weekGems(p, s))),
    lvlUp: [false, false],
    lvlDown: [false, false],
    // в эту неделю закрылся месяц, и он был плохим: уровень снят за месяц
    monthDown: [false, false],
    badMonth: null,
  };
}

/** Счетчики недели до первой: без целей и оценок. */
export function preWeek(state, w) {
  const end = addDays(w, 6);
  return { start: w, end, pre: true, counts: countIn(live(state.events), w, end), gems: [null, null], lvlUp: [false, false], lvlDown: [false, false], monthDown: [false, false] };
}

// --- месяц: готовка и питание ------------------------------------------------

/**
 * Итог месяца на двоих. Счет продукта и готовки идет с переноса (что было до приложения) плюс отметки.
 * Бриллиантов три, минус overCost за каждый продукт сверх лимита и минус cookCost, если готовки меньше цели.
 * Пока месяц идет, бриллианты считаются так, будто он кончился сегодня, и помечены «пока».
 */
export function monthSummary(state, month, today) {
  const s = normalize(state.settings);
  const events = live(state.events).filter((e) => e.day.slice(0, 7) === month);
  const used = {};
  for (const kind of KINDS) used[kind] = [0, 1].map((who) => carried(s, month, who, kind));
  for (const e of events) used[e.kind][e.who] += qty(e);
  const over = [0, 1].map((who) => FOOD.filter((id) => s.limits[id][who] != null && used[id][who] > s.limits[id][who]));
  const cook = [0, 1].map((who) => ({ done: used.cook[who], goal: s.goals.cook[who], met: used.cook[who] >= s.goals.cook[who] }));
  const gems = [0, 1].map((who) => Math.max(0, GEMS - over[who].length * s.overCost - (cook[who].met ? 0 : s.cookCost)));
  const carry = [0, 1].some((who) => Boolean(s.carry[month] && s.carry[month][`p${who}`]));
  return { month, closed: monthEnd(month) < today, used, over, cook, gems, carry };
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

/** Месяц идет в уровень, если дневник начался не позже его первой недели или в нем есть перенос. */
const monthCounts = (s, month) => s.start <= addDays(`${month}-01`, 6) || Boolean(s.carry[month]);

// --- уровень ------------------------------------------------------------------

/**
 * Все недели от первой до текущей.
 * Уровень растет на один за каждые lvlWeeks закрытых недель подряд, где бриллиантов не меньше lvlGems (lvlUp).
 * Плохая неделя (бриллиантов не больше lvlDownGems) обнуляет счет, lvlDownWeeks плохих подряд снимают уровень (lvlDown).
 * Закрылся месяц, и бриллиантов в нем не больше badMonthGems: уровень тоже падает (monthDown на неделе, где месяц кончился).
 * Уровень от -lvlMax до lvlMax. До resetDay уровень не двигается.
 */
export function timeline(state, today) {
  const s = normalize(state.settings);
  if (!s.start) return [];
  const cur = weekOf(today);
  const events = live(state.events);
  const runs = [0, 0];
  const badRuns = [0, 0];
  const lvls = [0, 0];
  const out = [];
  for (let w = s.start; w <= cur; w = addDays(w, 7)) {
    const wk = summarizeWeek(s, events, w, today, cur);
    out.push(wk);
    if (!wk.closed) continue;
    const counts = !s.resetDay || w >= weekOf(s.resetDay);
    for (const who of [0, 1]) {
      if (!counts) continue;
      if (wk.gems[who] <= s.lvlDownGems) {
        runs[who] = 0;
        badRuns[who] += 1;
        if (badRuns[who] >= s.lvlDownWeeks && lvls[who] > -s.lvlMax) {
          wk.lvlDown[who] = true;
          lvls[who] -= 1;
          badRuns[who] = 0;
        }
      } else {
        badRuns[who] = 0;
        runs[who] = wk.gems[who] >= s.lvlGems ? runs[who] + 1 : 0;
        if (runs[who] >= s.lvlWeeks && lvls[who] < s.lvlMax) {
          wk.lvlUp[who] = true;
          lvls[who] += 1;
          runs[who] = 0;
        }
      }
    }
    // месяц, который кончился на этой неделе
    const ended = wk.end.slice(0, 7) !== w.slice(0, 7) || wk.end === monthEnd(w.slice(0, 7)) ? w.slice(0, 7) : null;
    if (ended && monthCounts(s, ended) && (!s.resetDay || monthEnd(ended) >= s.resetDay)) {
      const ms = monthSummary(state, ended, today);
      wk.badMonth = ended;
      for (const who of [0, 1]) {
        if (ms.gems[who] > s.badMonthGems || lvls[who] <= -s.lvlMax) continue;
        wk.monthDown[who] = true;
        lvls[who] -= 1;
        runs[who] = 0;
      }
    }
  }
  return out;
}

/** Уровень персонажа: сколько раз вырос минус сколько раз упал. */
export function level(weeks, who) {
  return weeks.reduce((n, wk) => n + (wk.lvlUp[who] ? 1 : 0) - (wk.lvlDown[who] ? 1 : 0) - (wk.monthDown[who] ? 1 : 0), 0);
}

// --- состояние персонажа и «вместе» --------------------------------------------

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

/** Дни, когда оба сделали одно полезное: [{day, kind}], с from по to включительно. */
export function together(state, from, to) {
  const seen = new Map();
  for (const e of live(state.events)) {
    if (!GOOD.includes(e.kind) || e.day < from || e.day > to) continue;
    const key = `${e.day}|${e.kind}`;
    seen.set(key, (seen.get(key) || 0) | (1 << e.who));
  }
  return [...seen].filter(([, mask]) => mask === 3).map(([key]) => {
    const [day, kind] = key.split('|');
    return { day, kind };
  });
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
 * targets: кому отмечаем. Возвращает код: together, week-goal, month-goal, good, over, last, ok.
 */
export function shoutFor(state, today, { targets, kind, day, n = 1 }) {
  const who = targets[0];
  if (GOOD.includes(kind)) {
    const other = who === 0 ? 1 : 0;
    const otherDid = live(state.events).some((e) => e.who === other && e.kind === kind && e.day === day);
    if (targets.length > 1 || otherDid) return 'together';
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
export function stickers(state, weeks, today) {
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
      gems: weeks.filter((w) => w.closed && w.gems[who] === GEMS).length,
      level: level(weeks, who),
    };
    for (const [id, key] of Object.entries(GOAL_KEYS)) out.push({ id, who, have: have[id], need: s[key], got: have[id] >= s[key] });
  }
  return out;
}
