// Разметка E&N. Каждая функция получает модель и возвращает строку HTML.
// Все пользовательские строки проходят через esc(). Состояние показываем картинкой,
// но каждое число подписано словом.

import { FOOD, GEMS, GOAL_KEYS, GOAL_MAX, GOOD, RANGE, WEEKLY, addDays, dow, isFood, monthWeeks, preview, qty, weekDays } from './rules.js';
import * as C from './copy.js';
import { LOOKS, STATURE, gem, hero, heroTogether, icon, navIcon, prop, sticker } from './sprites.js';

const { esc } = C;

const stroke = 'fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"';
const svg = (cls, d) => `<svg class="${cls}" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="${d}" ${stroke}/></svg>`;
const chevron = (dir) => svg('chev', dir === 'left' ? 'M10 3 5 8l5 5' : 'M6 3l5 5-5 5');
const plus = svg('plus', 'M8 3v10M3 8h10');
const minus = svg('minus', 'M3 8h10');

// сколько штук еды можно выбрать одним касанием
const QTY = [1, 2, 3, 4, 5, 6];

// --- шапка -------------------------------------------------------------------

function syncMark(m) {
  const label = m.status === 'offline' && m.pending ? `нет сети, в очереди ${m.pending}` : C.SYNC[m.status] || '';
  return `<p class="sync" data-status="${m.status}"><span class="sync-dot" aria-hidden="true"></span>${label}</p>`;
}

function header(m) {
  if (m.screen !== 'home') {
    return `<header class="top">
      <button class="back" type="button" data-act="back" data-key="back">${chevron('left')}назад</button>
      ${syncMark(m)}
    </header>`;
  }
  const tab = (act, view, name, label) =>
    `<button class="tab" type="button" data-act="${act}" ${view ? `data-view="${view}"` : ''} data-key="tab-${name}">${navIcon(name)}<span>${label}</span></button>`;
  return `<header class="top">
    ${syncMark(m)}
    <nav class="tabs" aria-label="разделы">
      ${tab('go', 'stats', 'stats', 'итоги')}
      ${tab('go', 'food', 'food', 'питание')}
      ${tab('go', 'rules', 'rules', 'правила')}
      ${tab('menu', '', 'menu', 'меню')}
    </nav>
  </header>`;
}

function actions(cls) {
  return `<div class="actions ${cls}">
    <button class="btn btn-main" type="button" data-act="log-open" data-key="log-open-${cls}">отметить</button>
  </div>`;
}

function banner(m) {
  if (m.stray) {
    return `<p class="banner">На этом устройстве был другой дневник, код <b>${esc(m.stray)}</b>. Перенести его отметки в общий?
      <span class="banner-acts"><button class="btn btn-sm" type="button" data-act="stray-merge" data-key="stray-merge">перенести</button>
      <button class="link" type="button" data-act="stray-skip" data-key="stray-skip">не нужно</button></span></p>`;
  }
  if (m.kind === 'demo') {
    return `<p class="banner">Пример с выдуманным журналом, записи не сохраняются. <a href="./">открыть свой дневник</a></p>`;
  }
  if (m.kind === 'local') {
    return `<p class="banner">Синхронизация не подключена: дневник живет только в этом браузере.</p>`;
  }
  return '';
}

// --- бриллианты --------------------------------------------------------------

/** Три места под бриллианты, цветных столько, сколько получено. */
function gemRow(n, small = false) {
  return [0, 1, 2].map((i) => gem(i < n, { scale: small ? 1 : 2 })).join('');
}

/** Бриллианты месяца. */
function monthGems(m, ms, who) {
  const n = ms.gems[who];
  const name = esc(m.players[who].name);
  return `<span class="gems${ms.closed ? '' : ' is-open'}" role="img"
    aria-label="${name}, месяц: ${C.nGems(n)} из ${GEMS}${ms.closed ? '' : ' пока'}, ${C.monthWhy(ms, who)}">${gemRow(n)}</span>`;
}

const pending = (closed) => (closed ? '' : '<span class="gems-note">пока</span>');

// --- главная: общая комната и доска под ней ---------------------------------------

/** Персонаж в комнате: касание открывает лист «одежда». Неля рисуется чуть ниже ростом, подошвы на одном полу. */
function roomHero(m, who) {
  const name = esc(m.players[who].name);
  const mood = m.moods[who];
  return `<button class="room-hero room-hero-${who}${mood === 'sleep' ? '' : ' bob'}" type="button" data-act="look-open" data-who="${who}" data-key="look-open-${who}"
    aria-label="${name}: ${C.MOOD[mood]}. сменить образ">${hero(who, m.looks[who], mood, { size: 160 })}</button>`;
}

/** Строка доски: значок, слово и «сколько из скольких». */
function stat(kind, done, goal) {
  const met = done >= goal;
  return `<div class="stat${met ? ' is-met' : ''}"><dt>${icon(kind)}<span>${C.KIND[kind].name}</span></dt><dd><b>${done}</b> из ${goal}</dd></div>`;
}

/** Переключатель под комнатой: трекер или еда. */
function boardSwitch(m) {
  const btn = (v, label) =>
    `<button class="seg-btn" type="button" aria-pressed="${m.board === v}" data-act="board" data-board="${v}" data-key="board-${v}">${label}</button>`;
  return `<div class="seg seg-wide board-switch" role="group" aria-label="что показать под комнатой">${btn('tracker', 'трекер')}${btn('food', 'еда')}</div>`;
}

/** Трекер: неделя (спорт, чтение) и месяц (готовка), у каждого свой столбец. */
function trackerBoard(m) {
  const wk = m.cur;
  const ms = m.thisMonth;
  const col = (who, body) => `<div class="col${who === m.me ? ' is-me' : ''}">${body}</div>`;
  const names = [0, 1]
    .map((who) => col(who, `<p class="who"><span class="who-name">${esc(m.players[who].name)}</span></p>`))
    .join('');
  const week = [0, 1]
    .map((who) =>
      col(
        who,
        `<dl class="stats">${WEEKLY.map((k) => stat(k, wk.counts[k][who], m.s.goals[k][who])).join('')}</dl>`,
      ),
    )
    .join('');
  const month = [0, 1]
    .map((who) =>
      col(
        who,
        `<dl class="stats">${stat('cook', ms.cook[who].done, ms.cook[who].goal)}</dl>
        <p class="gems-line">${monthGems(m, ms, who)}${pending(ms.closed)}</p>`,
      ),
    )
    .join('');
  return `<div class="cols cols-names">${names}</div>
    <section class="group" aria-labelledby="g-week">
      <h2 class="group-title" id="g-week">неделя<span class="group-sub">${C.weekRange(m.curStart)}</span></h2>
      <div class="cols">${week}</div>
    </section>
    <section class="group" aria-labelledby="g-month">
      <h2 class="group-title" id="g-month">месяц<span class="group-sub">${C.monthName(m.today.slice(0, 7))}</span></h2>
      <div class="cols">${month}</div>
    </section>`;
}

/**
 * Строки таблицы еды: значок и название продукта, у каждого «съедено / лимит».
 * Сверх лимита красным с крестиком, «не считаем» прочерком. В текущем месяце касание открывает отметку этого продукта.
 */
function foodRows(m, ms, current) {
  const cell = (who, id) => {
    const name = esc(m.players[who].name);
    const limit = m.s.limits[id][who];
    if (limit == null) return `<td><span class="nil" role="img" aria-label="${name}: не считаем"></span></td>`;
    const used = ms.used[id][who];
    const over = used > limit;
    const text = `<span class="fc${over ? ' is-over' : used === limit ? ' is-full' : ''}">${used} / ${limit}</span>`;
    const label = `${name}, ${C.KIND[id].name}: ${used} из ${limit}${over ? ', перебор' : used === limit ? ', лимит выбран' : ''}`;
    if (!current) return `<td><span role="img" aria-label="${label}">${text}</span></td>`;
    return `<td><button class="fcell" type="button" data-act="log-open" data-who="${who}" data-step="${id}" data-key="food-${who}-${id}" aria-label="${label}. отметить">${text}</button></td>`;
  };
  return FOOD.filter((id) => m.s.limits[id].some((l) => l != null))
    .map((id) => `<tr><th scope="row"><span class="rh">${icon(id)}<span>${C.KIND[id].name}</span></span></th>${cell(0, id)}${cell(1, id)}</tr>`)
    .join('');
}

/** Еда под комнатой: таблица текущего месяца, строка на продукт. */
function foodBoard(m) {
  const names = [0, 1].map((who) => `<th scope="col"${who === m.me ? ' class="is-me"' : ''}><span class="who-name">${esc(m.players[who].name)}</span></th>`).join('');
  return `<section class="group group-food" aria-labelledby="g-food">
      <h2 class="sr" id="g-food">еда за ${C.monthName(m.today.slice(0, 7))}: съедено и лимит</h2>
      <table class="food food-board">
        <thead><tr><th scope="col">${C.monthName(m.today.slice(0, 7))}</th>${names}</tr></thead>
        <tbody>${foodRows(m, m.thisMonth, true)}</tbody>
      </table>
    </section>`;
}

function board(m) {
  return `<div class="board">
    ${boardSwitch(m)}
    ${m.board === 'food' ? foodBoard(m) : trackerBoard(m)}
  </div>`;
}

function scene(m) {
  return `<section class="scene" aria-label="комната">
    <div class="room" style="--stature: ${STATURE[1]}">${roomHero(m, 0)}${roomHero(m, 1)}</div>
    ${board(m)}
  </section>`;
}

// --- отметки дня: общие для дневника и календаря ---------------------------------

function chip(kind, cls, label, n = 1) {
  const count = n > 1 ? `<b class="chip-n">×${n}</b>` : '';
  return `<span class="chip ${cls}"${label ? ` title="${label}"` : ''}>${icon(kind)}${count}</span>`;
}

function cellParts(m, day, who) {
  const facts = m.events.filter((e) => e.day === day && e.who === who);
  const names = [];
  let html = '';
  // один значок на вид отметки: две булочки за день это «булочки ×2»
  const groups = new Map();
  for (const e of facts) {
    const g = groups.get(e.kind) || { n: 0, over: false };
    g.n += qty(e);
    g.over = g.over || m.overIds.has(e.id);
    groups.set(e.kind, g);
  }
  for (const [kind, g] of groups) {
    const what = `${C.KIND[kind].name}${g.n > 1 ? ` ×${g.n}` : ''}`;
    names.push(g.over ? `${what}, перебор` : what);
    html += chip(kind, g.over ? 'is-over' : isFood(kind) ? 'is-food' : 'is-good', what, g.n);
  }
  return { html, names };
}

// --- дневник недели и месяца -----------------------------------------------------

function diaryCell(m, day, who) {
  const { html, names } = cellParts(m, day, who);
  const name = esc(m.players[who].name);
  const what = names.length ? names.join(', ') : 'пусто';
  if (day > m.today) return `<td><div class="cell"></div></td>`;
  return `<td><button class="cell" type="button" data-act="log-open" data-day="${day}" data-who="${who}" data-key="cell-${day}-${who}"
    aria-label="${name}, ${C.dayShort(day)}: ${what}. отметить">${html}</button></td>`;
}

/** Итог недели у человека: спорт и чтение против цели, набранная цель зеленым. */
function weekGoals(m, wk, who) {
  return `<span class="wk-goals">${WEEKLY.map((k) => {
    const done = wk.counts[k][who];
    const goal = m.s.goals[k][who];
    return `<span class="${done >= goal ? 'is-met' : ''}">${C.KIND[k].name} <b>${done}</b> из ${goal}</span>`;
  }).join('')}</span>`;
}

/** Неделя трекером: строка на день, у каждого свой столбец. */
function weekBlock(m) {
  const wk = m.view;
  const title = wk.pre ? 'до первой недели' : `неделя ${wk.index}`;
  const head = `<thead><tr><th scope="col"><span class="sr">день</span></th>${[0, 1]
    .map((who) => `<th scope="col">${esc(m.players[who].name)}</th>`)
    .join('')}</tr></thead>`;
  const rows = weekDays(wk.start)
    .map(
      (day) => `<tr class="${day === m.today ? 'is-today' : ''}">
      <th scope="row"><span class="dow">${C.DOW_SHORT[dow(day)]}</span><span class="dnum">${C.dayNum(day)}</span></th>
      ${[0, 1].map((who) => diaryCell(m, day, who)).join('')}
    </tr>`,
    )
    .join('');
  const total = wk.pre
    ? ''
    : `<tfoot><tr><th scope="row">итог</th>${[0, 1].map((who) => `<td>${weekGoals(m, wk, who)}</td>`).join('')}</tr></tfoot>`;
  return `<div class="week-head">
      <h2 id="week-title">${title}</h2>
      <p class="week-range">${C.weekRange(wk.start)}</p>
    </div>
    <table class="diary">
      ${head}
      <tbody>${rows}</tbody>
      ${total}
    </table>`;
}

/** Сетка месяца, как календарь в заметках: семь столбцов по дням недели, справа бриллианты недели. */
function calendarGrid(m, who) {
  const name = esc(m.players[who].name);
  const head = C.DOW_SHORT.map((d) => `<th scope="col">${d}</th>`).join('');
  const rows = monthWeeks(m.month)
    .map((w) => {
      const days = weekDays(w)
        .map((day) => {
          const { html, names } = cellParts(m, day, who);
          const cls = `${day.slice(0, 7) === m.month ? '' : ' is-out'}${day === m.today ? ' is-today' : ''}`;
          const what = names.length ? names.join(', ') : 'пусто';
          if (day > m.today) return `<td class="cal-day${cls}"><div class="cal-cell"><span class="cal-num">${C.dayNum(day)}</span></div></td>`;
          return `<td class="cal-day${cls}"><button class="cal-cell" type="button" data-act="log-open" data-day="${day}" data-who="${who}"
            data-key="cal-${who}-${day}" aria-label="${name}, ${C.dayShort(day)}: ${what}. отметить"><span class="cal-num">${C.dayNum(day)}</span>${html}</button></td>`;
        })
        .join('');
      return `<tr>${days}</tr>`;
    })
    .join('');
  return `<table class="cal">
      <thead><tr>${head}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function monthNav(m) {
  return `<div class="week-nav">
      <button class="icon-btn" type="button" data-act="month" data-d="-1" data-key="month-prev" aria-label="предыдущий месяц" ${m.canPrevMonth ? '' : 'disabled'}>${chevron('left')}</button>
      <button class="icon-btn" type="button" data-act="month" data-d="1" data-key="month-next" aria-label="следующий месяц" ${m.canNextMonth ? '' : 'disabled'}>${chevron('right')}</button>
    </div>`;
}

function weekNav(m) {
  return `<div class="week-nav">
      <button class="icon-btn" type="button" data-act="week-prev" data-key="week-prev" aria-label="на неделю назад" ${m.canPrev ? '' : 'disabled'}>${chevron('left')}</button>
      <button class="icon-btn" type="button" data-act="week-next" data-key="week-next" aria-label="на неделю вперед" ${m.canNext ? '' : 'disabled'}>${chevron('right')}</button>
    </div>`;
}

function monthBlock(m) {
  const grids = [0, 1].map((who) => `<h3 class="cal-who">${esc(m.players[who].name)}</h3>${calendarGrid(m, who)}`).join('');
  return `<h2 class="month-title" id="week-title">${C.monthTitle(m.month)}</h2>${grids}`;
}

/** Дневник на главной: неделя строками или весь месяц сеткой. Стрелки листают то, что выбрано. */
function diary(m) {
  const modeBtn = (mode, label) =>
    `<button class="seg-btn" type="button" aria-pressed="${m.mode === mode}" data-act="diary-mode" data-mode="${mode}" data-key="mode-${mode}">${label}</button>`;
  const month = m.mode === 'month';
  return `<section class="week" aria-label="дневник">
    <div class="diary-top">
      <div class="seg diary-modes" role="group" aria-label="вид дневника">${modeBtn('week', 'неделя')}${modeBtn('month', 'месяц')}</div>
      ${month ? monthNav(m) : weekNav(m)}
    </div>
    ${month ? monthBlock(m) : weekBlock(m)}
    <span class="leaves" aria-hidden="true">${prop('leaf-orange', 40)}${prop('leaf-yellow', 32)}</span>
  </section>`;
}

function home(m) {
  return `<main id="main">
    <h1 class="sr">дневник на двоих</h1>
    ${banner(m)}
    ${scene(m)}
    ${actions('actions-inline')}
    ${diary(m)}
    ${m.build ? `<p class="build">${C.buildText(m.build)}</p>` : ''}
  </main>
  <nav class="bar" aria-label="действия">${actions('actions-bar')}</nav>`;
}

// --- итоги -----------------------------------------------------------------------

function goalHave(st) {
  return `${st.have} из ${st.need}`;
}

function person(m, who) {
  const name = esc(m.players[who].name);
  const slots = m.stickers
    .filter((st) => st.who === who)
    .map((st) => {
      const meta = C.STICKER[st.id];
      const have = goalHave(st);
      return `<li class="${st.got ? 'is-got' : ''}"><button class="slot" type="button" data-act="goal-open" data-id="${st.id}" data-key="goal-${who}-${st.id}"
        aria-label="${name}, ${meta.name}: ${have}${st.got ? ', получено' : ''}. открыть">
        <span class="plate">${sticker(st.id)}</span>
        <span class="slot-name">${meta.name}</span>
        <span class="slot-have">${have}</span>
      </button></li>`;
    })
    .join('');
  return `<section class="person" aria-label="${name}">
    <div class="person-head">
      ${hero(who, m.looks[who], 'idle', { size: 64 })}
      <div>
        <h2>${name}</h2>
        <p class="person-sub">сейчас ${C.MOOD[m.moods[who]]}</p>
      </div>
    </div>
    ${calendarGrid(m, who)}
    <h3 class="slots-title">достижения</h3>
    <ul class="slots">${slots}</ul>
  </section>`;
}

/** Месяц на двоих: у каждого свой столбец, без «кто лучше». */
function monthForTwo(m) {
  const ms = m.shownMonth;
  const row = (pic, label, cells) => `<tr><th scope="row"><span class="rh">${pic}<span>${label}</span></span></th>${cells.map((v) => `<td>${v}</td>`).join('')}</tr>`;
  const count = (kind) => [0, 1].map((who) => m.events.filter((e) => e.kind === kind && e.who === who && e.day.slice(0, 7) === m.month).length);
  const overs = [0, 1].map((who) => ms.over[who].length);
  const head = [0, 1].map((who) => `<th scope="col">${heroTogether(who, m.looks[who], 'idle', { size: 48 })}<span>${esc(m.players[who].name)}</span></th>`).join('');
  const gemsCells = [0, 1].map((who) => `<span class="gems${ms.closed ? '' : ' is-open'}" role="img" aria-label="${C.nGems(ms.gems[who])}${ms.closed ? '' : ' пока'}">${gemRow(ms.gems[who], true)}</span>`);
  return `<table class="duo">
    <thead><tr><th scope="col"><span class="sr">что за месяц</span></th>${head}</tr></thead>
    <tbody>
      ${row(icon('sport'), 'спорт', count('sport'))}
      ${row(icon('read'), 'чтение', count('read'))}
      ${row(icon('cook'), 'готовка', ms.cook.map((c) => `${c.done} из ${c.goal}`))}
      ${row(chip('chocolate', 'is-over', ''), 'продуктов сверх лимита', overs)}
      ${row(gem(true), `бриллианты месяца${ms.closed ? '' : ', пока'}`, gemsCells)}
    </tbody>
  </table>
  <p class="together-line"><b>вместе: ${C.nTimes(m.together.month)}</b> за месяц, ${C.nTimes(m.together.all)} за все время. Это дни, когда оба отметили одно и то же полезное.</p>`;
}

function stats(m) {
  return `<main id="main" class="page">
    <h1 class="sr">итоги</h1>
    <section class="month-panel" aria-labelledby="month-title">
    <div class="week-head month-head">
      <h2 class="page-title" id="month-title">${prop('candle', 40)}${C.monthTitle(m.month)}</h2>
      ${monthNav(m)}
    </div>
    ${monthForTwo(m)}
    </section>
    ${person(m, 0)}
    ${person(m, 1)}
  </main>`;
}

// --- питание: таблица месяца -------------------------------------------------------

function foodPage(m) {
  const ms = m.shownMonth;
  const current = m.month === m.today.slice(0, 7);
  const head = [0, 1].map((who) => `<th scope="col">${heroTogether(who, m.looks[who], 'idle', { size: 48 })}<span>${esc(m.players[who].name)}</span></th>`).join('');
  const rows = foodRows(m, ms, current);
  const cook = [0, 1].map((who) => `<td><span class="fc${ms.cook[who].met ? ' is-met' : ''}">${ms.cook[who].done} из ${ms.cook[who].goal}</span></td>`).join('');
  const gems = [0, 1].map((who) => `<td>${monthGems(m, ms, who)}</td>`).join('');
  return `<main id="main" class="page">
    <h1 class="sr">питание</h1>
    <section class="food-panel" aria-labelledby="food-title">
      <div class="week-head month-head">
        <h2 class="page-title" id="food-title">${C.monthTitle(m.month)}</h2>
        ${monthNav(m)}
      </div>
      <p class="hint food-hint">Съедено за месяц и лимит. Сверх лимита красным, каждый такой продукт снимает бриллиант месяца. Прочерк: этот продукт человек не считает.</p>
      <table class="food">
        <thead><tr><th scope="col"><span class="sr">продукт</span></th>${head}</tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><th scope="row"><span class="rh">${icon('cook')}<span>готовка</span></span></th>${cook}</tr>
          <tr><th scope="row"><span class="rh">${gem(true)}<span>бриллианты${ms.closed ? '' : ', пока'}</span></span></th>${gems}</tr>
        </tfoot>
      </table>
      ${ms.carry ? `<p class="hint">В этом месяце учтено и то, что было до приложения.</p>` : ''}
    </section>
  </main>`;
}

// --- правила -------------------------------------------------------------------

function rules(m) {
  const s = m.s;
  const [a, b] = m.players.map((p) => esc(p.name));
  const item = (pic, title, body) => `<li class="rule"><span class="rule-pic">${pic}</span><div><h2>${title}</h2><p>${body}</p></div></li>`;
  const goals = (k) => (s.goals[k][0] === s.goals[k][1] ? `по ${s.goals[k][0]}` : `${a} ${s.goals[k][0]}, ${b} ${s.goals[k][1]}`);
  return `<main id="main" class="page">
    <section class="rules-panel">
    <div class="rules-head"><h1 class="page-title">правила</h1>${prop('lantern', 76)}</div>
    <ul class="rule-list">
      ${item(`${icon('sport', { scale: 3 })}${icon('read', { scale: 3 })}`, 'неделя', `Спорт и чтение считаются с понедельника по воскресенье. Цель на неделю: спорт ${goals('sport')}, чтение ${goals('read')}. Набрал цель: «цель недели!», число становится зеленым.`)}
      ${item(icon('cook', { scale: 3 }), 'месяц', `Готовка дома считается за месяц, цель ${goals('cook')}. Питание тоже по месяцам: у каждого свой лимит на каждый продукт и свой список того, что считаем.`)}
      ${item(chip('chocolate', 'is-over', ''), 'перебор', `Продукт сверх лимита красный, с крестиком. ${s.overCost ? `Каждый такой продукт снимает ${s.overCost > 1 ? `${s.overCost} бриллианта` : 'бриллиант'} месяца` : 'Бриллианты месяца он не снимает'}. Штрафов и отработок нет.`)}
      ${item(`${heroTogether(0, m.looks[0], 'idle', { size: 40 })}${heroTogether(1, m.looks[1], 'idle', { size: 40 })}`, 'вместе', 'Оба отметили одно и то же полезное в один день: всплывает «вместе!», в итогах растет счетчик.')}
    </ul>
    <section class="gem-key" aria-labelledby="gem-month-title">
      <h2 id="gem-month-title">бриллианты месяца</h2>
      <p class="key-note">Месяц начинается с трех. Минус ${s.overCost} за каждый продукт сверх лимита, минус ${s.cookCost}, если готовки меньше цели. Не меньше нуля. Пока месяц идет, бриллианты считаются так, будто он кончился сегодня.</p>
    </section>
    <section class="gem-key" aria-labelledby="pose-title">
      <h2 id="pose-title">персонажи</h2>
      <ul class="poses">
        <li>${hero(m.me, m.looks[m.me], 'sleep', { size: 72 })}<span>Каждое утро спит, пока не сделаешь первую отметку за день.</span></li>
        <li>${hero(m.me, m.looks[m.me], 'cough', { size: 72 })}<span>Кашляет, если спорта не было ${C.nDays(s.coughDays)} и больше. Проходит после тренировки.</span></li>
        <li>${hero(m.me, m.looks[m.me], 'fit', { size: 72 })}<span>В форме, если на этой неделе спорта ${s.fitSport} или больше.</span></li>
      </ul>
      <p class="key-note">Касание по персонажу в комнате открывает одежду. Образ видят оба.</p>
    </section>
    </section>
  </main>`;
}

export function page(m) {
  const body = m.screen === 'stats' ? stats(m) : m.screen === 'rules' ? rules(m) : m.screen === 'food' ? foodPage(m) : home(m);
  return `${header(m)}${body}`;
}

// --- листы --------------------------------------------------------------------

const sheetHead = (title) =>
  `<header class="sheet-head"><h2>${title}</h2><button class="link" type="button" data-act="close" data-key="close">закрыть</button></header>`;

/** Подсказка под вариантом: что будет после отметки. */
function noteFor(m, kind, day, who, n = 1) {
  const p = preview(m.state, m.today, { who, kind, day, n });
  if (p.scope === 'week') return { text: `будет ${p.will} из ${p.goal} за неделю` };
  if (kind === 'cook') return { text: `будет ${p.will} из ${p.goal} за месяц` };
  if (p.limit == null) return { text: 'не считаем', off: true };
  return { text: `будет ${p.will} / ${p.limit}${p.over ? ', перебор' : ''}`, over: p.over };
}

/** Выбор дня в листе: сетка месяца, доступны дни по сегодня. Точка под числом: в этот день уже есть отметки. */
function dayPicker(m, sel, targets) {
  const month = sel.day.slice(0, 7);
  const head = C.DOW_SHORT.map((d) => `<span class="daypick-dow" aria-hidden="true">${d}</span>`).join('');
  const cells = monthWeeks(month)
    .flatMap(weekDays)
    .map((d) => {
      const has = m.events.some((e) => e.day === d && targets.includes(e.who));
      const cls = `${d.slice(0, 7) === month ? '' : ' is-out'}${d === m.today ? ' is-today' : ''}${has ? ' has-marks' : ''}`;
      return `<button class="daypick-day${cls}" type="button" aria-pressed="${d === sel.day}" data-act="log-day" data-day="${d}" data-key="pick-day-${d}"
        aria-label="${C.dayShort(d)}${has ? ', есть отметки' : ''}" ${d > m.today ? 'disabled' : ''}>${C.dayNum(d)}</button>`;
    })
    .join('');
  return `<div class="daypick" role="group" aria-label="${C.monthTitle(month)}">
      <p class="daypick-title">${C.monthTitle(month)}</p>
      <div class="daypick-grid">${head}${cells}</div>
    </div>`;
}

export function logSheet(m, sel) {
  const yesterday = addDays(m.today, -1);
  // сегодня и вчера одним касанием, любой другой день выбирается в сетке месяца
  const other = sel.day !== m.today && sel.day !== yesterday;
  const dayBtns = `${[m.today, yesterday]
    .map(
      (d) =>
        `<button class="seg-btn" type="button" aria-pressed="${d === sel.day}" data-act="log-day" data-day="${d}" data-key="log-day-${d}">${d === m.today ? 'сегодня' : 'вчера'}</button>`,
    )
    .join('')}<button class="seg-btn" type="button" aria-pressed="${other}" aria-expanded="${Boolean(sel.pick)}" data-act="log-pick" data-key="log-pick">${other ? C.dayShort(sel.day) : 'другой день'}</button>`;
  const whoOpts = [
    [m.me, 'мне'],
    [m.other, esc(m.players[m.other].name)],
    ['both', 'обоим'],
  ];
  const whoBtns = whoOpts
    .map(
      ([v, label]) =>
        `<button class="seg-btn" type="button" aria-pressed="${String(v) === String(sel.who)}" data-act="log-who" data-who="${v}" data-key="log-who-${v}">${label}</button>`,
    )
    .join('');
  const targets = sel.who === 'both' ? [0, 1] : [Number(sel.who)];
  // подсказка у варианта: у каждого своя, одинаковые сливаются в одну
  const noteText = (kind, list, n = 1) => {
    const notes = list.map((who) => ({ who, ...noteFor(m, kind, sel.day, who, n) })).filter((x) => !x.off);
    if (!notes.length) return { text: 'не считаем', over: false };
    const same = notes.every((x) => x.text === notes[0].text);
    return { text: same && list.length === notes.length ? notes[0].text : notes.map((x) => `${esc(m.players[x.who].name)}: ${x.text}`).join('; '), over: notes.some((x) => x.over) };
  };
  const goodRow = (kind) => {
    const { text } = noteText(kind, targets);
    return `<button class="opt" type="button" data-act="log" data-kind="${kind}" data-key="log-${kind}">
      <span class="opt-icon">${icon(kind, { scale: 3 })}</span>
      <span class="opt-name">${C.KIND[kind].name}</span>
      <span class="opt-note">${text}</span>
    </button>`;
  };
  // еда в два шага: касание по продукту раскрывает выбор ×1..×6 прямо под ним
  const foods = FOOD.filter((id) => targets.some((who) => m.s.limits[id][who] != null));
  const step = (id) => {
    const btns = QTY.map(
      (n) =>
        `<button class="seg-btn" type="button" data-act="log" data-kind="${id}" data-n="${n}" data-key="log-${id}-${n}" aria-label="${C.KIND[id].name}: ${n}">×${n}</button>`,
    ).join('');
    return `<div class="opt-step" role="group" aria-label="${C.KIND[id].name}: сколько">
      <p class="opt-step-q">сколько?</p>
      <div class="seg seg-qty">${btns}</div>
    </div>`;
  };
  const foodRow = (id) => {
    const { text, over } = noteText(id, targets);
    const open = sel.step === id;
    return `<button class="opt opt-food${over ? ' is-over' : ''}" type="button" data-act="log" data-kind="${id}" data-key="log-${id}" aria-expanded="${open}">
      <span class="opt-icon">${icon(id, { scale: 3 })}</span>
      <span class="opt-name">${C.KIND[id].name}</span>
      <span class="opt-note">${text}</span>
    </button>${open ? step(id) : ''}`;
  };
  // полезное или еда: одна группа за раз, чтобы лист был коротким
  const group = sel.group === 'food' || (sel.group == null && sel.step) ? 'food' : 'good';
  const groupBtn = (v, label) =>
    `<button class="seg-btn" type="button" aria-pressed="${group === v}" data-act="log-group" data-group="${v}" data-key="log-group-${v}">${label}</button>`;
  const options =
    group === 'food'
      ? foods.length
        ? `<div class="opts opts-food">${foods.map(foodRow).join('')}</div>`
        : '<p class="hint opts-empty">Еду этому человеку не считаем.</p>'
      : `<div class="opts">${GOOD.map(goodRow).join('')}</div>`;
  const logged = m.events.filter((e) => e.day === sel.day && targets.includes(e.who));
  const loggedList = logged.length
    ? `<section class="logged"><h3>уже отмечено</h3><ul>${logged
        .map((e) => {
          const n = qty(e);
          const over = m.overIds.has(e.id);
          // у еды число правится прямо у записи: отметили одну булочку, а было три
          const fix = isFood(e.kind)
            ? `<div class="seg seg-qty" role="group" aria-label="сколько было">${QTY.map(
                (k) =>
                  `<button class="seg-btn" type="button" aria-pressed="${k === n}" data-act="set-qty" data-id="${e.id}" data-n="${k}" data-key="set-qty-${e.id}-${k}" aria-label="${C.KIND[e.kind].name}, было: ${k}">×${k}</button>`,
              ).join('')}</div>`
            : '';
          return `<li><div class="logged-row"><span class="logged-what">${chip(e.kind, over ? 'is-over' : 'is-plain', '')} ${C.KIND[e.kind].name}${n > 1 ? ` ×${n}` : ''}, ${esc(m.players[e.who].name)}${over ? ' <span class="logged-over">перебор</span>' : ''}</span>
              <button class="link" type="button" data-act="unlog" data-id="${e.id}" data-key="unlog-${e.id}">убрать</button></div>${fix}</li>`;
        })
        .join('')}</ul></section>`
    : '';
  return `${sheetHead('отметить')}
    <div class="seg" role="group" aria-label="день">${dayBtns}</div>
    ${sel.pick ? dayPicker(m, sel, targets) : ''}
    <div class="seg" role="group" aria-label="кому">${whoBtns}</div>
    <div class="seg seg-wide log-groups" role="group" aria-label="что отмечаем">${groupBtn('good', 'полезное')}${groupBtn('food', 'еда')}</div>
    ${loggedList}
    ${options}`;
}

/** Лист «одежда»: образы человека, выбранный нажат. */
export function lookSheet(m, sel) {
  const who = Number(sel.who) === 1 ? 1 : 0;
  const cur = m.looks[who];
  const items = LOOKS[who]
    .map(
      (look) => `<button class="look${look === cur ? ' is-on' : ''}" type="button" aria-pressed="${look === cur}" data-act="look" data-who="${who}" data-look="${look}" data-key="look-${who}-${look}">
        ${hero(who, look, 'idle', { size: 96 })}
        <span class="look-name">${C.LOOK[who][look]}</span>
      </button>`,
    )
    .join('');
  return `${sheetHead('одежда')}
    <p class="sheet-sub">${esc(m.players[who].name)}: образ видят оба</p>
    <div class="looks">${items}</div>`;
}

/** Строка настройки с числом: подпись слева, «меньше, значение, больше» справа. null это «не считаем». */
function numRow(label, path, value, { min, max, nullable = false, off = false, text = '' }) {
  const key = `num-${path.replaceAll('/', '-')}`;
  const attrs = `type="button" data-act="num" data-path="${path}" data-v="${value == null ? '' : value}" data-min="${min}" data-max="${max}"${nullable ? ' data-none="1"' : ''}`;
  const shown = text || (value == null ? 'не считаем' : String(value));
  const downOff = off || (value == null ? true : value <= min && !nullable);
  return `<div class="set-row">
    <span class="set-label">${label}</span>
    <div class="num" role="group" aria-label="${label}">
      <button class="icon-btn" ${attrs} data-d="-1" data-key="${key}-down" aria-label="${label}: меньше" ${downOff ? 'disabled' : ''}>${minus}</button>
      <span class="num-value${value == null ? ' is-off' : ''}">${shown}</span>
      <button class="icon-btn" ${attrs} data-d="1" data-key="${key}-up" aria-label="${label}: больше" ${off || (value != null && value >= max) ? 'disabled' : ''}>${plus}</button>
    </div>
  </div>`;
}

export function menuSheet(m) {
  const off = m.kind === 'demo';
  const readOnly = off ? 'disabled' : '';
  const s = m.s;
  const R = RANGE;
  const perPerson = (fn) =>
    [0, 1]
      .map((who) => `<div class="set-person"><p class="set-name">${esc(m.players[who].name)}</p>${fn(who)}</div>`)
      .join('');
  const goals = perPerson(
    (who) =>
      `${WEEKLY.map((k) => numRow(C.KIND[k].name, `weekly/${k}/goal/p${who}`, s.goals[k][who], { min: R.weekGoal[0], max: R.weekGoal[1], off })).join('')}
      ${numRow('готовка за месяц', `monthly/cook/goal/p${who}`, s.goals.cook[who], { min: R.cookGoal[0], max: R.cookGoal[1], off })}`,
  );
  const limits = perPerson((who) => FOOD.map((id) => numRow(C.KIND[id].name, `food/${id}/p${who}`, s.limits[id][who], { min: R.limit[0], max: R.limit[1], nullable: true, off })).join(''));
  const one = (label, name) => numRow(label, name, s[name], { min: R[name][0], max: R[name][1], off });
  return `${sheetHead('меню')}
    <section class="set">
      <h3>сейчас отмечает ${esc(m.players[m.me].name)}</h3>
      <button class="btn" type="button" data-act="switch" data-key="switch">сменить персонажа</button>
    </section>
    <section class="set">
      <h3>цели</h3>
      <p class="hint">Спорт и чтение на неделю, готовка на месяц.</p>
      ${goals}
    </section>
    <section class="set">
      <h3>лимиты на месяц</h3>
      <p class="hint">Ниже нуля стоит «не считаем»: продукт пропадает из таблицы еды и из листа «отметить».</p>
      ${limits}
    </section>
    <section class="set">
      <h3>бриллианты месяца</h3>
      <p class="hint">Месяц начинается с трех бриллиантов. Сколько снимает:</p>
      ${one('продукт сверх лимита', 'overCost')}
      ${one('готовка меньше цели', 'cookCost')}
    </section>
    <section class="set">
      <h3>персонаж</h3>
      ${one('кашляет после дней без спорта', 'coughDays')}
      ${one('в форме от тренировок за неделю', 'fitSport')}
    </section>
    <section class="set">
      <h3>первая неделя</h3>
      <label class="field"><span>любой день этой недели</span><input type="date" value="${s.start}" data-set="start" data-key="start" ${readOnly}></label>
      <p class="hint">Счет недель идет с понедельника выбранной недели.</p>
    </section>
    <section class="set">
      <h3>имена</h3>
      <div class="fields">
        <label class="field"><span>первый</span><input type="text" maxlength="20" autocomplete="off" value="${esc(m.players[0].name)}" data-set="name" data-who="0" data-key="name-0" ${readOnly}></label>
        <label class="field"><span>вторая</span><input type="text" maxlength="20" autocomplete="off" value="${esc(m.players[1].name)}" data-set="name" data-who="1" data-key="name-1" ${readOnly}></label>
      </div>
    </section>
    <section class="set">
      <h3>ссылка на дневник</h3>
      ${m.fixed ? '<p class="hint">Дневник у вас один на двоих: любой телефон открывает его по адресу сайта.</p>' : '<p class="hint">Кто знает ссылку, тот может читать и писать.</p>'}
      ${m.roomCode && !m.fixed ? `<p class="hint">Код дневника: <b>${esc(m.roomCode)}</b>. У второго в меню должен быть такой же.</p>` : ''}
      ${m.kind === 'local' ? '<p class="hint">Синхронизация не подключена, поэтому ссылка откроет дневник только в этом же браузере.</p>' : ''}
      <button class="btn" type="button" data-act="copy-link" data-key="copy-link-menu" ${readOnly}>скопировать ссылку</button>
    </section>
    <section class="set">
      <h3>приложение</h3>
      <p class="hint">Новая версия подтягивается сама при открытии. Если что-то выглядит по-старому, обнови вручную. В приложении с домашнего экрана то же делает свайп вниз.</p>
      ${m.build ? `<p class="hint">Сейчас стоит ${C.buildText(m.build)}.</p>` : ''}
      <button class="btn" type="button" data-act="reload" data-key="reload">обновить приложение</button>
    </section>
    <section class="set">
      <h3>журнал</h3>
      <div class="row">
        <button class="btn btn-sm" type="button" data-act="export" data-key="export">скачать журнал (JSON)</button>
        ${off || m.fixed ? '' : `<button class="link" type="button" data-act="leave" data-key="leave">забыть дневник на этом устройстве</button>`}
      </div>
    </section>`;
}

/** Лист достижения: что считается, сколько у каждого и сколько нужно. Число меняется здесь же. */
export function goalSheet(m, sel) {
  const id = C.STICKER[sel.id] ? sel.id : 'sport';
  const meta = C.STICKER[id];
  const key = GOAL_KEYS[id];
  const rows = [0, 1]
    .map((who) => {
      const st = m.stickers.find((x) => x.id === id && x.who === who);
      return `<li class="goal-who${st.got ? ' is-got' : ''}">${hero(who, m.looks[who], 'idle', { size: 44 })}<span>${esc(m.players[who].name)}</span><b>${goalHave(st)}</b></li>`;
    })
    .join('');
  return `${sheetHead(meta.name)}
    <section class="set goal">
      <div class="goal-top"><span class="plate plate-show">${sticker(id)}</span><p>${meta.how}</p></div>
      <ul class="goal-list">${rows}</ul>
      ${numRow('сколько нужно', key, m.s[key], { min: 1, max: GOAL_MAX, off: m.kind === 'demo' })}
    </section>`;
}

// --- первый запуск и выбор персонажа ---------------------------------------------

export function welcome({ startDay, local, missing, fixed = false }) {
  const card = (who, name) => `<div class="pick">
      ${hero(who, 'base', 'idle', { size: 96 })}
      <label class="field"><span>имя</span><input type="text" name="n${who}" maxlength="20" autocomplete="off" value="${name}" required></label>
    </div>`;
  return `<main class="welcome" id="main">
    <h1 class="line">дневник на двоих</h1>
    ${missing ? `<p class="banner">${fixed ? 'Общий дневник еще пустой. Создайте его один раз здесь, второй увидит его сам.' : 'По этой ссылке дневника нет. Проверь ссылку или создай новый дневник.'}</p>` : ''}
    <form id="create" class="create" novalidate>
      <div class="picks">${card(0, 'Елисей')}${card(1, 'Неля')}</div>
      <p class="hint">Первая неделя начнется ${C.onDay(startDay)}, ${C.dayMonth(startDay)}. Цели и лимиты потом меняются в меню.</p>
      ${local ? `<p class="hint">Синхронизация еще не подключена: дневник будет жить только в этом браузере.</p>` : ''}
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-main" type="submit">создать дневник</button>
    </form>
    ${fixed ? '' : `<form id="join" class="create join" novalidate>
      <label class="field"><span>уже есть дневник? вставь ссылку на него</span>
        <input type="text" name="link" autocomplete="off" autocapitalize="off" spellcheck="false" inputmode="url" placeholder="https://…#room=…" required></label>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn" type="submit">открыть дневник</button>
    </form>`}
  </main>`;
}

export function whoAreYou(players, { demo = false, looks = ['base', 'base'] } = {}) {
  const btn = (who) => `<button class="pick pick-btn" type="button" data-act="i-am" data-who="${who}">
      ${heroTogether(who, looks[who], 'idle', { size: 136 })}
      <span class="pick-name">${esc(players[who].name)}</span>
    </button>`;
  return `<main class="welcome" id="main">
    <h1 class="line">кто заходит</h1>
    ${demo ? `<p class="lead">Это пример с выдуманным журналом.</p>` : ''}
    <div class="picks">${btn(0)}${btn(1)}</div>
  </main>`;
}

export function loading(status) {
  const text = status === 'offline' ? 'Нет сети. Дневник загрузится, когда появится связь.' : 'Загружаю дневник.';
  return `<main class="welcome" id="main"><p class="lead">${text}</p></main>`;
}
